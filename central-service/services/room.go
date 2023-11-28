package services

import (
	"context"
	"log"
	"time"

	"github.com/acmutd/bsg/central-service/models"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

type RoomService struct {
	db                  *gorm.DB
	rdb                 *redis.Client
	MaxNumRoundsPerRoom int
}

func InitializeRoomService(db *gorm.DB, rdb *redis.Client, maxNumRoundsPerRoom int) RoomService {
	return RoomService{db, rdb, maxNumRoundsPerRoom}
}

type RoomDTO struct {
	Name string `json:"roomName"`
}

// Create a room and persist
// User creating the room is the room leader
func (service *RoomService) CreateRoom(room* RoomDTO, adminID string) (*models.Room, error) {
	if err := validateRoomName(room.Name); err != nil {
		return nil, err
	}
	newRoom := models.Room{
		ID: uuid.New(),
		Name: room.Name,
		Admin: adminID,
	}
	result := service.db.Create(&newRoom)
	if result.Error != nil {
		return nil, result.Error
	}
	return &newRoom, nil
}

// Find a room by id
func (service *RoomService) FindRoomByID(roomID string) (*models.Room, error) {
	var room models.Room
	uuid, err := uuid.Parse(roomID)
	if err!= nil {
		return nil, RoomServiceError{Message: "roomID could not be parsed"}
	}
	result := service.db.Where("ID = ?", uuid).Limit(1).Find(&room)
	if result.Error != nil {
		return nil, result.Error
	}
	if result.RowsAffected == 0 {
		return nil, RoomServiceError{Message: "roomID could not be found"}
	}
	return &room, nil
}

// Join a room
func (service *RoomService) JoinRoom(roomID string, userID string) (*models.Room, error) {
	room, err := service.FindRoomByID(roomID)
	if err != nil {
		return nil, err
	}
	joinKey := roomID + "_joinTimestamp"
	joinMember := redis.Z{
		Score: float64(time.Now().Unix()),
		Member: userID,
	}
	result, err := service.rdb.ZAdd(context.Background(), joinKey, joinMember).Result()
	if err != nil {
		log.Printf("Error adding user join timestamp in redis instance: %v\n", err)
		return nil, err
	}
	if result < 1 {
		return nil, RoomServiceError{Message: "Are you already in this room?"}
	}
	leaderboardKey := roomID + "_leaderboard"
	leaderboardMember := redis.Z{
		Score: float64(0),
		Member: userID,
	}
	if err = service.rdb.ZAdd(context.Background(), leaderboardKey, leaderboardMember).Err(); err != nil {
		log.Printf("Error adding user leaderboard score in redis instance: %v\n", err)
		return nil, err
	}
	// if round is already started
	// create a participant object
	// notify RTC
	log.Printf("Users in room %s:\n %v\n", roomID, service.rdb.ZRange(context.Background(), joinKey, 0, -1))
	return room, nil
}

// Leave a room
func (service *RoomService) LeaveRoom(roomID string, userID string) (error) {
	room, err := service.FindRoomByID(roomID)
	if err != nil {
		return err
	}
	joinKey := roomID + "_joinTimestamp"
	leaderboardKey := roomID + "_leaderboard"
	result, err := service.rdb.ZRem(context.Background(), joinKey, userID).Result()
	if err != nil {
		log.Printf("Error removing user join timestamp in redis instance: %v\n", err)
		return err
	}
	if result < 1 {
		return RoomServiceError{Message: "Are you in this room?"}
	}
	log.Printf("Users in room %s:\n %v\n", roomID, service.rdb.ZRange(context.Background(), joinKey, 0, -1))
	// TODO: notify RTC user left room
	size, err := service.rdb.ZCard(context.Background(), joinKey).Result()
	if err != nil {
		return err
	}
	if size <= 0 {
		// TODO: notify RTC room is empty
		if resultCmd := service.rdb.Del(context.Background(), joinKey); resultCmd.Err() != nil {
			log.Printf("Error deleting key %s: %v\n", joinKey, resultCmd.Err())
			return resultCmd.Err()
		}
		if resultCmd := service.rdb.Del(context.Background(), leaderboardKey); resultCmd.Err() != nil {
			log.Printf("Error deleting key %s: %v\n", leaderboardKey, resultCmd.Err())
			return resultCmd.Err()
		}
		if err := service.db.Delete(room).Error; err != nil {
			log.Printf("Error deleting room %s: %v\n", roomID, err)
			return err
		}
		log.Printf("Deleted room %s\n", roomID)
		return nil
	}
	wasAdmin, err := service.IsRoomAdmin(roomID, userID)
	if err != nil {
		return err
	}
	if wasAdmin {
		result, err := service.FindRightfulRoomAdmin(roomID)
		if err != nil {
			return err
		}
		if err := service.db.Model(&room).Update("Admin", result).Error; err != nil {
			log.Printf("Error updating room admin in the database: %v\n", err)
            return err
		}
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

// returns auth id of new room admin
func (service *RoomService) FindRightfulRoomAdmin(roomID string) (string, error) {
	key := roomID + "_joinTimestamp"
	result, err := service.rdb.ZRange(context.Background(), key, 0, 0).Result()
	if err != nil {
		return "", err
	}
	if len(result) == 0 {
		return "", RoomServiceError{Message: "Empty room"}
	}
	return result[0], nil
}

func (service *RoomService) FindActiveUsers(roomID string) ([]string, error) {
	key := roomID + "_joinTimestamp"
	result, err := service.rdb.ZRange(context.Background(), key, 0, -1).Result()
	if err != nil {
		return nil, err
	}
	return result, nil
}

func (service *RoomService) GetLeaderboard(roomID string) ([]string, error) {
	key := roomID + "_leaderboard"
	result, err := service.rdb.ZRange(context.Background(), key, 0, -1).Result()
	if err != nil {
		return nil, err
	}
	return result, nil
}

type RoomServiceError struct{
	Message string
}

func (e RoomServiceError) Error() string {
	return e.Message
}

// Validates a room name
func validateRoomName(name string) error {
	if len(name) <= 0 {
		return RoomServiceError{Message: "roomName missing"}
	}
	if len(name) < 4 {
		return RoomServiceError{Message: "roomName must be at least 4 characters in length"}
	}
	if len(name) >= 32 {
		return RoomServiceError{Message: "roomName must be under 32 characters in length"}
	}
	return nil;
}