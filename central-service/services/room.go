package services

import (
	"github.com/acmutd/bsg/central-service/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type RoomService struct {
	db *gorm.DB
}

func InitializeRoomService(db *gorm.DB) RoomService {
	return RoomService{db}
}

type RoomDTO struct {
	Name string `json:"roomName"`
}

// Create a room and persist
// User creating the room is the room leader
func (service *RoomService) CreateRoom(adminID string, room* RoomDTO) (*models.Room, error) {
	if len(room.Name) < 4 {
		return nil, RoomNameError{Message: "roomName must be at least 4 characters in length"}
	}
	if len(room.Name) >= 32 {
		return nil, RoomNameError{Message: "roomName must be under 32 characters in length"}
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
		return nil, RoomNameError{Message: "roomID could not be parsed"}
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

type RoomNameError struct{
	Message string
}

func (e RoomNameError) Error() string {
	return e.Message
}