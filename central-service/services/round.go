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
	problemAccessor *ProblemAccessor
}

type RoundCreationParameters struct {
	RoomID   string `json:"roomID"`
	Duration int `json:"duration"` // Duration in minutes
	NumEasyProblems int `json:"numEasyProblems"`
	NumMediumProblems int `json:"numMediumProblems"`
	NumHardProblems int `json:"numHardProblems"`
}

type RoundServiceError struct {
	StatusCode int
	Message    string
}

func (r *RoundServiceError) Error() string {
	return r.Message
}

func InitializeRoundService(db *gorm.DB, rdb *redis.Client, roomAccessor *RoomAccessor, roundScheduler *tasks.Scheduler, problemAccessor *ProblemAccessor) RoundService {
	return RoundService{
		db:             db,
		rdb:            rdb,
		roomAccessor:   roomAccessor,
		roundScheduler: roundScheduler,
		problemAccessor: problemAccessor,
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
	problemSet, err := service.problemAccessor.GetProblemAccessor().GenerateProblemsetByDifficultyParameters(DifficultyParameter{
		NumEasyProblems: params.NumEasyProblems,
		NumMediumProblems: params.NumMediumProblems,
		NumHardProblems: params.NumHardProblems,
	})
	if err != nil {
		return nil, err
	}
	err = service.db.Model(&newRound).Association("ProblemSet").Append(problemSet)
	if err != nil {
		return nil, err
	}
	redisKey := fmt.Sprintf("%s_mostRecentRound", params.RoomID)
	_, err = service.rdb.Set(context.Background(), redisKey, strconv.FormatUint(uint64(newRound.ID), 10), 0).Result()
	if err != nil {
		log.Printf("Error setting value in redis instance: %v\n", err)
		return nil, err
	}
	newRound.ProblemSet = []models.Problem{}
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
	if (round.Status == constants.ROUND_STARTED || round.Status == constants.ROUND_END) && round.LastUpdatedTime.Before(time.Now()) {
		service.db.Model(&round).Association("ProblemSet").Find(&round.ProblemSet)
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
			// Schedule task to change round state to ended
			_, err = roundService.roundScheduler.Add(&tasks.Task{
				// Set an extra buffer time in case of submission at the end of the round
				Interval: time.Duration(time.Minute * time.Duration(targetRound.Duration)) + time.Duration(time.Duration(constants.ROUND_DURATION_BUFFER) * time.Second),
				RunOnce: true,
				TaskContext: ctx,
				FuncWithTaskContext: func(tc tasks.TaskContext) error {
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
					result := roundService.db.Model(targetRound).Updates(models.Round{
						Status: constants.ROUND_END,
					})
					if result.Error != nil {
						return &RoundServiceError{
							Message: "Error ending round",
							StatusCode: 500,
						}
					}
					return nil
				},
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

func (service *RoundService) FindParticipantByRoundAndUserID(RoundID uint, UserAuthID string) (*models.RoundParticipant, error) {
	var participant models.RoundParticipant 
	result := service.db.Limit(1).Where("participant_auth_id = ? AND round_id = ?", UserAuthID, RoundID).Find(&participant)
	if result.Error != nil {
		return nil, result.Error
	}
	if result.RowsAffected == 0 {
		return nil, nil
	}
	return &participant, nil
}

func (service *RoundService) CheckIfRoundContainsProblem(round *models.Round, problem *models.Problem) (bool, error) {
	var problemset []models.Problem
	err := service.db.Model(round).Association("ProblemSet").Find(&problemset)
	if err != nil {
		return false, err
	}
	for _, roundProblem := range problemset {
		if roundProblem.ID == problem.ID {
			return true, nil
		}
	}
	return false, nil
}