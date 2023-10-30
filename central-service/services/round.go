package services

import (
	"github.com/acmutd/bsg/central-service/models"
	"gorm.io/gorm"
)

type RoundService struct {
	db                  *gorm.DB
	MaxNumRoundsPerRoom int
}

type RoundCreationParameters struct {
	// TODO: change type to string for uuid
	// TODO: add parameters for problem generation
	RoomID   string
	Duration int
}

type RoundServiceError struct {
	StatusCode int
	Message    string
}

func (r *RoundServiceError) Error() string {
	return r.Message
}

func InitializeRoundService(db *gorm.DB, maxNumRoundsPerRoom int) RoundService {
	return RoundService{
		db:                  db,
		MaxNumRoundsPerRoom: maxNumRoundsPerRoom,
	}
}

func (service *RoundService) CheckRoundLimitExceeded(room *models.Room) (bool, error) {
	var rounds []models.Round
	err := service.db.Model(room).Association("Rounds").Find(&rounds)
	if err != nil {
		return true, err
	}
	return len(rounds) >= service.MaxNumRoundsPerRoom, nil
}

func (service *RoundService) CreateRound(params *RoundCreationParameters) (*models.Round, error) {
	// TODO: Move room query logic to RoomService
	var room models.Room
	result := service.db.Where("ID = ?", params.RoomID).Limit(1).Find(&room)
	if result.Error != nil {
		return nil, result.Error
	}
	if result.RowsAffected == 0 {
		return nil, nil
	}
	roundLimitExceeded, err := service.CheckRoundLimitExceeded(&room)
	if err != nil {
		return nil, err
	}
	if roundLimitExceeded {
		return nil, &RoundServiceError{
			StatusCode: 400,
			Message:    "Round limit exceeded",
		}
	}
	newRound := models.Round{Duration: params.Duration, RoomID: room.ID}
	result = service.db.Create(&newRound)
	if result.Error != nil {
		return nil, result.Error
	}
	service.db.Model(&room).Association("Rounds").Append(&newRound)
	// TODO: Add logic for problem generation
	return &newRound, nil
}
