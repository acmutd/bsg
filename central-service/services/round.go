package services

import (
	"context"
	"fmt"
	"log"
	"strconv"
	"time"

	"github.com/acmutd/bsg/central-service/models"
	"github.com/madflojo/tasks"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

type RoundService struct {
	db           *gorm.DB
	rdb          *redis.Client
	roomAccessor *RoomAccessor
	roundScheduler *tasks.Scheduler
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
		log.Printf("Error finding room by ID: %v\n", err)
		return nil, err
	}
	if targetRoom == nil {
		return nil, nil
	}
	roundLimitExceeded, err := service.roomAccessor.CheckRoundLimitExceeded(targetRoom)
	if err != nil {
		log.Printf("Error checking round limit: %v\n", err)
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
		log.Printf("Error creating new round: %v\n", result.Error)
		return nil, result.Error
	}
	// TODO: Add logic for problem generation
	redisKey := fmt.Sprintf("%s_mostRecentRound", params.RoomID)
	_, err = service.rdb.Set(context.Background(), redisKey, strconv.FormatUint(uint64(newRound.ID), 10), 0).Result()
	if err != nil {
		log.Printf("Error setting value in redis instance: %v\n", err)
		return nil, err
	}
	return &newRound, nil
}

func (service *RoundService) FindRoundByID(roundID uint) (*models.Round, error) {
	var round models.Round
	result := service.db.Where("ID = ?", roundID).Limit(1).Find(&round)
	if result.Error != nil {
		return nil, result.Error
	}
	if result.RowsAffected == 0 {
		return nil, nil
	}
	return &round, nil
}

func (service *RoundService) InitiateRoundStart(roundID uint) (*time.Time, error) {
	roundStartTime := time.Now().Add(time.Second * 10)
	result := service.db.Model(&models.Round{}).Where("ID = ?", roundID).Update("round_start_time", roundStartTime)
	if result.Error != nil {
		return nil, result.Error
	}
	_, err := service.roundScheduler.Add(&tasks.Task{
		StartAfter: roundStartTime,
		TaskFunc: func() error {
			// TODO: Query list of users in redis sorted set corresponding to room
			// TODO: Create participant object
			// TODO: Send data to rtc service	
			return nil
		},
	})
	if err != nil {
		return nil, err 
	}
	return &roundStartTime, nil
}