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
func (service *RoomService) CreateRoom(adminID string, room* RoomDTO) (*models.Room, error) {
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
		return nil, nil
	}
	return &room, nil
}

// Join a room
func (service *RoomService) JoinRoom(userID string, roomID string) (*models.Room, error) {
	room, err := service.FindRoomByID(roomID)
	if err != nil {
		return nil, err
	}
	// is valid room
	// add check to make sure they're not in other rooms?
	// roomID_joinTimestamp
	key := roomID + "_joinTimestamp"
	member := redis.Z{
		Score: float64(time.Now().Unix()),
		Member: userID,
	}
	result, err := service.rdb.ZAdd(context.Background(), key, member).Result()
	if err != nil {
		log.Printf("Error adding user join timestamp in redis instance: %v\n", err)
		return nil, err
	}
	if result < 1 {
		return nil, RoomServiceError{Message: "Are you already in this room?"}
	}
	// if round is started
	// find user by userID
	// add user to room
	// notify RTC
	log.Println(service.rdb.ZRange(context.Background(), key, 0, 1))
	return room, nil
}

// Join a room
func (service *RoomService) LeaveRoom(userID string, roomID string) (*models.Room, error) {
	room, err := service.FindRoomByID(roomID)
	if err != nil {
		return nil, err
	}
	// is valid room
	key := roomID + "_joinTimestamp"
	result, err := service.rdb.ZRem(context.Background(), key, userID).Result()
	if err != nil {
		log.Printf("Error removing user join timestamp in redis instance: %v\n", err)
		return nil, err
	}
	if result < 1 {
		return nil, RoomServiceError{Message: "Are you in this room?"}
	}
	log.Println(service.rdb.ZRange(context.Background(), key, 0, 1))
	// notify RTC
	return room, nil
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