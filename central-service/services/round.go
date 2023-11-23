package services

import (
	"context"
	"fmt"
	"log"
	"strconv"
	"time"

	"github.com/acmutd/bsg/central-service/constants"
	"github.com/acmutd/bsg/central-service/models"
	"github.com/madflojo/tasks"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

type RoundService struct {
	db             *gorm.DB
	rdb            *redis.Client
	roomAccessor   *RoomAccessor
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

func InitializeRoundService(db *gorm.DB, rdb *redis.Client, roomAccessor *RoomAccessor, roundScheduler *tasks.Scheduler) RoundService {
	return RoundService{
		db:             db,
		rdb:            rdb,
		roomAccessor:   roomAccessor,
		roundScheduler: roundScheduler,
	}
}

func (service *RoundService) SetDBConnection(db *gorm.DB) {
	service.db = db
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
	newRound := models.Round{
		Duration:        params.Duration,
		RoomID:          targetRoom.ID,
		LastUpdatedTime: time.Now(),
		Status:          constants.ROUND_CREATED,
	}
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

func (service *RoundService) CreateRoundParticipant(participantAuthID string, roundID uint) error {
	newParticipantEntry := models.RoundParticipant{
		ParticipantAuthID:  participantAuthID,
		RoundID:            roundID,
		SolvedProblemCount: 0,
		Score:              0,
	}
	result := service.db.Create(&newParticipantEntry)
	return result.Error
}

func (service *RoundService) InitiateRoundStart(roundID uint) (*time.Time, error) {
	targetRound, err := service.FindRoundByID(roundID)
	if err != nil {
		return nil, err
	}
	roundStartTime := time.Now().Add(time.Second * 10)
	result := service.db.Model(targetRound).Updates(models.Round{
		LastUpdatedTime: roundStartTime,
		Status:          constants.ROUND_STARTED,
	})
	if result.Error != nil {
		return nil, result.Error
	}
	ctx := context.Background()
	ctx = context.WithValue(ctx, constants.ROUND_SERVICE, service)
	_, err = service.roundScheduler.Add(&tasks.Task{
		Interval:    time.Duration(10 * time.Second),
		RunOnce:     true,
		TaskContext: tasks.TaskContext{Context: ctx},
		FuncWithTaskContext: func(ctx tasks.TaskContext) error {
			roundService, isValidType := ctx.Context.Value(constants.ROUND_SERVICE).(*RoundService)
			if !isValidType {
				return &RoundServiceError{
					Message:    "Error get round service from context",
					StatusCode: 500,
				}
			}
			if roundService == nil {
				return &RoundServiceError{
					Message:    "Round service is nil",
					StatusCode: 500,
				}
			}
			activeRoomParticipants, err := roundService.roomAccessor.GetRoomService().FindActiveUsers(targetRound.RoomID.String())
			if err != nil {
				return err
			}
			err = roundService.db.Transaction(func(tx *gorm.DB) error {
				oldDBConnection := roundService.db
				roundService.SetDBConnection(tx)
				for _, participantAuthID := range activeRoomParticipants {
					if err = roundService.CreateRoundParticipant(participantAuthID, roundID); err != nil {
						roundService.SetDBConnection(oldDBConnection)
						return err
					}
				}
				roundService.SetDBConnection(oldDBConnection)
				return nil
			})
			if err != nil {
				return err
			}
			// TODO: Send data to rtc service
			return nil
		},
		ErrFunc: func(e error) {
			log.Printf("Error while attempting to scheduling round with id %d - %s", targetRound.ID, e)
		},
	})
	if err != nil {
		return nil, err
	}
	return &roundStartTime, nil
}
