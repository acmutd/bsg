package services

import (
	"context"
	"log"
	"net/http"
	"time"

	"github.com/acmutd/bsg/central-service/constants"
	"github.com/acmutd/bsg/central-service/models"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

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
	newRoom := models.Room{
		ID:     uuid.New(),
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
	joinRoom := map[string]string{
		"userHandle": userID,
		"roomID":     roomID,
	}
	_, err = service.rtcClient.SendMessage("join-room", joinRoom)
	if err != nil {
		log.Fatal("Error sending join-room message:", err)
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
	// TODO: notify RTC user left room
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
	if result < 1 {
		return BSGError{
			StatusCode: 400,
			Message:    "Are you in this room?",
		}
	}
	log.Printf("User left room. Users in room %s:\n %v\n", roomID, service.rdb.ZRange(context.Background(), joinKey, 0, -1))
	return nil
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

func (service *RoomService) StartRoundByRoomID(roomID string, userID string) (*time.Time, error) {
	room, err := service.FindRoomByID(roomID)
	if err != nil {
		log.Printf("Error finding room by ID: %v\n", err)
		return nil, err
	}
	if room.Admin != userID { // check if user is room admin
		return nil, BSGError{http.StatusUnauthorized, "User is not room admin. This functionality is reserved for room admin..."}
	}
	if len(room.Rounds) <= 0 {
		log.Printf("Error initiating round start: Round has not been created")
		return nil, BSGError{http.StatusNotFound, "Round not found. Has not been created?"}
	}
	round := room.Rounds[len(room.Rounds)-1]
	activeUsers, err := service.FindActiveUsers(roomID)
	if err != nil {
		log.Printf("Error initiating round start: %v\n", err)
		return nil, err
	}
	roundStartTime, err := service.roundService.InitiateRoundStart(&round, activeUsers)
	if err != nil {
		log.Printf("Error initiating round start: %v\n", err)
		return nil, err
	}
	return roundStartTime, nil
}

func (service *RoomService) GetLeaderboard(roomID string) ([]redis.Z, error) {
	return service.roundService.GetLeaderboardByRoomID(roomID)
}
