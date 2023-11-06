package services

import "github.com/acmutd/bsg/central-service/models"

// RoomAccessor acts as a one-way communication pipeline from RoundService to RoomService.
type RoomAccessor struct {
	roomService *RoomService
}

func (accessor *RoomAccessor) GetRoomService() *RoomService {
	return accessor.roomService
}

func (accessor *RoomAccessor) GetRoomByID(roomID string) (*models.Room, error) {
	return accessor.roomService.FindRoomByID(roomID)
}

func (accessor *RoomAccessor) CheckRoundLimitExceeded(room *models.Room) (bool, error) {
	var rounds []models.Round
	err := accessor.roomService.db.Model(room).Association("Rounds").Find(&rounds)
	if err != nil {
		return true, err
	}
	return len(rounds) >= accessor.roomService.MaxNumRoundsPerRoom, nil
}

func NewRoomAccessor(roomService *RoomService) RoomAccessor {
	return RoomAccessor{
		roomService,
	}
}
