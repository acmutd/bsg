package services

import (
	"context"
	"fmt"
	"strconv"

	"github.com/acmutd/bsg/central-service/models"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

type RoundService struct {
	db           *gorm.DB
	rdb          *redis.Client
	roomAccessor *RoomAccessor
}

type RoundCreationParameters struct {
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

func InitializeRoundService(db *gorm.DB, rdb *redis.Client, roomAccessor *RoomAccessor) RoundService {
	return RoundService{
		db:           db,
		rdb:          rdb,
		roomAccessor: roomAccessor,
	}
}

func (service *RoundService) CreateRound(params *RoundCreationParameters) (*models.Round, error) {
	targetRoom, err := service.roomAccessor.GetRoomByID(params.RoomID)
	if err != nil {
		return nil, err
	}
	if targetRoom == nil {
		return nil, nil
	}
	roundLimitExceeded, err := service.roomAccessor.CheckRoundLimitExceeded(targetRoom)
	if err != nil {
		return nil, err
	}
	if roundLimitExceeded {
		return nil, &RoundServiceError{
			StatusCode: 400,
			Message:    "Round limit exceeded",
		}
	}
	newRound := models.Round{Duration: params.Duration, RoomID: targetRoom.ID}
	result := service.db.Create(&newRound)
	if result.Error != nil {
		return nil, result.Error
	}
	// TODO: Add logic for problem generation
	redisKey := fmt.Sprintf("%s_mostRecentRound", params.RoomID)
	_, err = service.rdb.Set(context.Background(), redisKey, strconv.FormatUint(uint64(newRound.ID), 10), 0).Result()
	if err != nil {
		return nil, err
	}
	return &newRound, nil
}
