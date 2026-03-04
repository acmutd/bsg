package services

import (
	"context"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"time"

	"github.com/acmutd/bsg/central-service/constants"
	"github.com/acmutd/bsg/central-service/models"
	"github.com/acmutd/bsg/rtc-service/requests"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

const shortCodeChars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

func generateShortCode() string {
	b := make([]byte, 6)
	for i := range b {
		b[i] = shortCodeChars[rand.Intn(len(shortCodeChars))]
	}
	return string(b)
}

type RoomService struct {
	db                  *gorm.DB
	rdb                 *redis.Client
	roundService        *RoundService
	rtcClient           *RTCClient
	MaxNumRoundsPerRoom int
}

func InitializeRoomService(db *gorm.DB, rdb *redis.Client, roundService *RoundService, rtcClient *RTCClient, maxNumRoundsPerRoom int) RoomService {
	return RoomService{db, rdb, roundService, rtcClient, maxNumRoundsPerRoom}
}

type RoomDTO struct {
	Name string `json:"roomName"`
}

// Creates a room and persist
// adminID is the the user that will be assigned room leader
func (service *RoomService) CreateRoom(room *RoomDTO, adminID string) (*models.Room, error) {
	if err := validateRoomName(room.Name); err != nil {
		return nil, err
	}
	// generate a unique short code, retry on collision
	var shortCode string
	for {
		candidate := generateShortCode()
		var count int64
		service.db.Model(&models.Room{}).Where("short_code = ?", candidate).Count(&count)
		if count == 0 {
			shortCode = candidate
			break
		}
	}
	newRoom := models.Room{
		ID:     uuid.New(),
		ShortCode: shortCode,
		Name:   room.Name,
		Admin:  adminID,
		Rounds: []models.Round{},
	}
	result := service.db.Create(&newRoom)
	if result.Error != nil {
		return nil, result.Error
	}
	return &newRoom, nil
}

// Deletes leaderboard and join time stamps from Redis
// Deletes room from Postgres
func (service *RoomService) deleteRoom(room models.Room) error {
	roomID := room.ID.String()
	// TODO: notify RTC room is empty
	if err := service.deleteJoinMembers(roomID); err != nil {
		return err
	}
	// Delete rounds from cascade delete
	for _, round := range room.Rounds { // Delete round leaderboards
		if err := service.roundService.DeleteLeaderboard(round.ID); err != nil {
			return err
		}
	}
	if err := service.db.Delete(room).Error; err != nil {
		log.Printf("Error deleting room %s: %v\n", roomID, err)
		return err
	}
	log.Printf("Deleted room %s\n", roomID)
	return nil
}

// Finds a room by id
// Returns a RoomServiceError if roomID could not be parsed or could not be found
func (service *RoomService) FindRoomByID(roomID string) (*models.Room, error) {
	var room models.Room
	uuid, err := uuid.Parse(roomID)
	if err != nil {
		return nil, BSGError{
			StatusCode: 400,
			Message:    "roomID could not be parsed",
		}
	}
	result := service.db.Preload("Rounds").Where("ID = ?", uuid).Limit(1).Find(&room)
	if result.Error != nil {
		return nil, result.Error
	}
	if result.RowsAffected == 0 {
		return nil, BSGError{
			StatusCode: 404,
			Message:    "roomID could not be found",
		}
	}
	return &room, nil
}

// finds a room by its short code (e.g. "A3K9PQ")
func (service *RoomService) FindRoomByShortCode(code string) (*models.Room, error) {
	var room models.Room
	result := service.db.Preload("Rounds").Where("short_code = ?", code).Limit(1).Find(&room)
	if result.Error != nil {
		return nil, result.Error
	}
	if result.RowsAffected == 0 {
		return nil, BSGError{StatusCode: 404, Message: "room not found"}
	}
	return &room, nil
}

// Allows a user to join a room
// Adds user join timestamp and leaderboard entries into Redis
func (service *RoomService) JoinRoom(roomID string, userID string) (*models.Room, error) {
	room, err := service.FindRoomByID(roomID)
	if err != nil {
		return nil, err
	}
	if err = service.addJoinMember(roomID, userID); err != nil {
		return nil, err
	}
	if len(room.Rounds) > 0 {
		round := room.Rounds[len(room.Rounds)-1]
		if round.Status == constants.ROUND_STARTED {
			if err := service.roundService.CreateRoundParticipant(userID, round.ID); err != nil {
				return nil, err
			}
		}
	}
	// RTCClient is nil in test cases
	if service.rtcClient != nil {
		joinRoom := requests.JoinRoomRequest{
			UserHandle: userID,
			RoomID:     roomID,
		}
		if _, err = service.rtcClient.SendMessage("join-room", joinRoom); err != nil {
			log.Printf("Error sending join-room message: %v", err)
			return nil, BSGError{
				StatusCode: 500,
				Message:    "Internal Server Error",
			}
		}
	}
	return room, nil
}

// Allows a user to leave a room
// If the departing user is the room leader, a new leader will be assigned
func (service *RoomService) LeaveRoom(roomID string, userID string) error {
	room, err := service.FindRoomByID(roomID)
	if err != nil {
		return err
	}
	if err := service.removeJoinMember(roomID, userID); err != nil {
		return err
	}
	// RTCClient is nil in test cases
	if service.rtcClient != nil {
		leaveRoom := requests.LeaveRoomRequest{
			UserHandle: userID,
			RoomID:     roomID,
		}
		if _, err = service.rtcClient.SendMessage("leave-room", leaveRoom); err != nil {
			log.Printf("Error sending leave-room message: %v", err)
			return BSGError{
				StatusCode: 500,
				Message:    "Internal Server Error",
			}
		}
	}
	if users, err := service.FindActiveUsers(roomID); err != nil {
		return err
	} else if len(users) <= 0 {
		service.deleteRoom(*room)
		return nil
	}
	if wasAdmin, err := service.IsRoomAdmin(roomID, userID); err != nil {
		return err
	} else if wasAdmin {
		if result, err := service.FindRightfulRoomAdmin(roomID); err != nil {
			return err
		} else if err := service.db.Model(&room).Update("Admin", result).Error; err != nil {
			log.Printf("Error updating room admin in the database: %v\n", err)
			return err
		}
	}
	return nil
}

// Adds a user's join timestamp to the Redis cache
// If the user's entry already exists in the room, then it will throw a RoomServiceError
func (service *RoomService) addJoinMember(roomID string, userID string) error {
	joinKey := roomID + "_joinTimestamp"
	joinMember := redis.Z{
		Score:  float64(time.Now().Unix()),
		Member: userID,
	}
	result, err := service.rdb.ZAdd(context.Background(), joinKey, joinMember).Result()
	if err != nil {
		log.Printf("Error adding user join timestamp in redis instance: %v\n", err)
		return err
	}
	activeRoomKey := fmt.Sprintf("user:%s:active_room", userID)
	if err := service.rdb.Set(context.Background(), activeRoomKey, roomID, 0).Err(); err != nil {
		log.Printf("Error setting active room for user %s: %v", userID, err)
	}

	if result < 1 {
		return BSGError{
			StatusCode: 400,
			Message:    "Are you already in this room?",
		}
	}
	log.Printf("User joined room. Users in room %s:\n %v\n", roomID, service.rdb.ZRange(context.Background(), joinKey, 0, -1))
	return nil
}

// Removes a userr's join timestamp from the Redis cache
// If a user does not have a join entry, then it will throw a RoomServiceError
func (service *RoomService) removeJoinMember(roomID string, userID string) error {
	joinKey := roomID + "_joinTimestamp"
	result, err := service.rdb.ZRem(context.Background(), joinKey, userID).Result()
	if err != nil {
		log.Printf("Error removing user join timestamp in redis instance: %v\n", err)
		return err
	}
	// remove active room mapping for user
	activeRoomKey := fmt.Sprintf("user:%s:active_room", userID)
	if err := service.rdb.Del(context.Background(), activeRoomKey).Err(); err != nil {
		log.Printf("Error deleting active room for user %s: %v", userID, err)
	}

	if result < 1 {
		return BSGError{
			StatusCode: 400,
			Message:    "Are you in this room?",
		}
	}
	log.Printf("User left room. Users in room %s:\n %v\n", roomID, service.rdb.ZRange(context.Background(), joinKey, 0, -1))
	return nil
}

func (service *RoomService) GetActiveRoomForUser(userID string) (string, error) {
	activeRoomKey := fmt.Sprintf("user:%s:active_room", userID)
	roomID, err := service.rdb.Get(context.Background(), activeRoomKey).Result()
	if err != nil {
		if err == redis.Nil {
			return "", nil
		}
		return "", err
	}
	return roomID, nil
}

// Get all users in a room
func (service *RoomService) FindActiveUsers(roomID string) ([]string, error) {
	key := roomID + "_joinTimestamp"
	result, err := service.rdb.ZRange(context.Background(), key, 0, -1).Result()
	if err != nil {
		return nil, err
	}
	return result, nil
}

// Removes all user join timestamps for a given room in the Redis cache
func (service *RoomService) deleteJoinMembers(roomID string) error {
	joinKey := roomID + "_joinTimestamp"
	if resultCmd := service.rdb.Del(context.Background(), joinKey); resultCmd.Err() != nil {
		log.Printf("Error deleting key %s: %v\n", joinKey, resultCmd.Err())
		return resultCmd.Err()
	}
	return nil
}

// Returns whether a given user is the room admin
func (service *RoomService) IsRoomAdmin(roomID string, userID string) (bool, error) {
	room, err := service.FindRoomByID(roomID)
	if err != nil {
		return false, err
	}
	return room.Admin == userID, nil
}

// Returns auth id of new room admin
// Oldest session will be returned, ties are broken lexicographically
func (service *RoomService) FindRightfulRoomAdmin(roomID string) (string, error) {
	key := roomID + "_joinTimestamp"
	result, err := service.rdb.ZRange(context.Background(), key, 0, 0).Result()
	if err != nil {
		return "", err
	}
	if len(result) == 0 {
		return "", BSGError{
			StatusCode: 500,
			Message:    "Empty room",
		}
	}
	return result[0], nil
}

// Validates a room name
func validateRoomName(name string) error {
	if len(name) <= 0 {
		return BSGError{
			StatusCode: 400,
			Message:    "roomName missing",
		}
	}
	if len(name) < 4 {
		return BSGError{
			StatusCode: 400,
			Message:    "roomName must be at least 4 characters in length",
		}
	}
	if len(name) >= 32 {
		return BSGError{
			StatusCode: 400,
			Message:    "roomName must be under 32 characters in length",
		}
	}
	return nil
}

func (service *RoomService) CreateRound(params *RoundCreationParameters, roomID string) (*models.Round, error) {
	room, err := service.FindRoomByID(roomID)
	if err != nil {
		log.Printf("Error finding room by ID: %v\n", err)
		return nil, err
	}
	roundLimitExceeded, err := service.CheckRoundLimitExceeded(room)
	if err != nil {
		return nil, err
	}
	if roundLimitExceeded {
		return nil, &BSGError{
			StatusCode: 400,
			Message:    "Round limit exceeded",
		}
	}
	round, err := service.roundService.CreateRound(params, &room.ID)
	if err != nil {
		return nil, err
	}
	if err := service.db.Model(&room).Association("Rounds").Append(round); err != nil {
		return nil, err
	}
	return round, nil
}

func (service *RoomService) CheckRoundLimitExceeded(room *models.Room) (bool, error) {
	var rounds []models.Round
	if err := service.db.Model(room).Association("Rounds").Find(&rounds); err != nil {
		log.Printf("Error checking round limit: %v\n", err)
		return true, err
	}
	return len(rounds) >= service.MaxNumRoundsPerRoom, nil
}

func (service *RoomService) StartRoundByRoomID(roomID string, userID string) (*time.Time, []models.Problem, error) {
	room, err := service.FindRoomByID(roomID)
	if err != nil {
		log.Printf("Error finding room by ID: %v\n", err)
		return nil, nil, err
	}
	if room.Admin != userID { // check if user is room admin
		return nil, nil, BSGError{http.StatusUnauthorized, "User is not room admin. This functionality is reserved for room admin..."}
	}
	if len(room.Rounds) <= 0 {
		log.Printf("Error initiating round start: Round has not been created")
		return nil, nil, BSGError{http.StatusNotFound, "Round not found. Has not been created?"}
	}
	round := room.Rounds[len(room.Rounds)-1]
	activeUsers, err := service.FindActiveUsers(roomID)
	if err != nil {
		log.Printf("Error initiating round start: %v\n", err)
		return nil, nil, err
	}
	roundStartTime, problems, err := service.roundService.InitiateRoundStart(&round, activeUsers)
	if err != nil {
		log.Printf("Error initiating round start: %v\n", err)
		return nil, nil, err
	}
	return roundStartTime, problems, nil
}

func (service *RoomService) GetLeaderboard(roomID string) ([]redis.Z, error) {
	return service.roundService.GetLeaderboardByRoomID(roomID)
}

func (service *RoomService) CreateRoomSubmission(roomID string, params RoundSubmissionParameters, userID string) (*models.RoundSubmission, error) {
	room, err := service.FindRoomByID(roomID)
	if err != nil {
		log.Printf("Error finding room by ID: %v\n", err)
		return nil, err
	}
	if len(room.Rounds) <= 0 {
		log.Printf("Error creating room submission: Round has not been created")
		return nil, BSGError{http.StatusNotFound, "Round not found. Has not been created?"}
	}
	round := room.Rounds[len(room.Rounds)-1]
	params.RoundID = round.ID

	result, err := service.roundService.CreateRoundSubmission(params, userID)
	if err != nil {
		log.Printf("Error initiating creating round submission start: %v\n", err)
		return nil, err
	}
	return result, nil
}

// EndRoundByRoomID forces the current round in the room to end.
// can be called by admin or triggered by timer expiry.
func (service *RoomService) EndRoundByRoomID(roomID string, userID string) error {
	room, err := service.FindRoomByID(roomID)
	if err != nil {
		return err
	}
	if room.Admin != userID {
		return BSGError{http.StatusUnauthorized, "only the room admin can end the round"}
	}
	if len(room.Rounds) <= 0 {
		return BSGError{http.StatusNotFound, "no round found"}
	}
	round := room.Rounds[len(room.Rounds)-1]
	if round.Status == constants.ROUND_END {
		return nil // already ended, idempotent
	}
	if err := service.db.Model(&round).Updates(models.Round{Status: constants.ROUND_END}).Error; err != nil {
		return err
	}
	// notify clients via RTC
	if service.rtcClient != nil {
		req := requests.RoundEndRequest{RoomID: roomID}
		if _, err := service.rtcClient.SendMessage("round-end", req); err != nil {
			log.Printf("Error sending round-end message: %v", err)
		}
	}
	return nil
}
