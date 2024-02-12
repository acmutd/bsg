package services

import (
	"context"
	"fmt"
	"log"
	"strconv"
	"time"

	"github.com/acmutd/bsg/central-service/constants"
	"github.com/acmutd/bsg/central-service/models"
	"github.com/google/uuid"
	"github.com/madflojo/tasks"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

type RoundService struct {
	db              *gorm.DB
	rdb             *redis.Client
	roundScheduler  *tasks.Scheduler
	problemAccessor *ProblemAccessor
}

type RoundCreationParameters struct {
	Duration          int `json:"duration"` // Duration in minutes
	NumEasyProblems   int `json:"numEasyProblems"`
	NumMediumProblems int `json:"numMediumProblems"`
	NumHardProblems   int `json:"numHardProblems"`
}

func InitializeRoundService(db *gorm.DB, rdb *redis.Client, roundScheduler *tasks.Scheduler, problemAccessor *ProblemAccessor) RoundService {
	return RoundService{
		db:              db,
		rdb:             rdb,
		roundScheduler:  roundScheduler,
		problemAccessor: problemAccessor,
	}
}

func (service *RoundService) SetDBConnection(db *gorm.DB) {
	service.db = db
}

func (service *RoundService) CreateRound(params *RoundCreationParameters, roomID *uuid.UUID) (*models.Round, error) {
	newRound := models.Round{
		Duration:        params.Duration,
		RoomID:          *roomID,
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
		NumEasyProblems:   params.NumEasyProblems,
		NumMediumProblems: params.NumMediumProblems,
		NumHardProblems:   params.NumHardProblems,
	})
	if err != nil {
		return nil, err
	}
	err = service.db.Model(&newRound).Association("ProblemSet").Append(problemSet)
	if err != nil {
		return nil, err
	}
	redisKey := fmt.Sprintf("%s_mostRecentRound", roomID)
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

func (service *RoundService) InitiateRoundStart(round *models.Round, activeRoomParticipants []string) (*time.Time, error) {
	if round == nil {
		return nil, &BSGError{
			Message:    "Round not found",
			StatusCode: 404,
		}
	}
	roundStartTime := time.Now().Add(time.Second * 10)
	result := service.db.Model(round).Updates(models.Round{
		LastUpdatedTime: roundStartTime,
		Status:          constants.ROUND_STARTED,
	})
	if result.Error != nil {
		return nil, result.Error
	}
	ctx := context.Background()
	ctx = context.WithValue(ctx, constants.ROUND_SERVICE, service)
	_, err := service.roundScheduler.Add(&tasks.Task{
		Interval:    time.Duration(10 * time.Second),
		RunOnce:     true,
		TaskContext: tasks.TaskContext{Context: ctx},
		FuncWithTaskContext: func(ctx tasks.TaskContext) error {
			roundService, isValidType := ctx.Context.Value(constants.ROUND_SERVICE).(*RoundService)
			if !isValidType {
				return &BSGError{
					Message:    "Error get round service from context",
					StatusCode: 500,
				}
			}
			if roundService == nil {
				return &BSGError{
					Message:    "Round service is nil",
					StatusCode: 500,
				}
			}
			err := roundService.db.Transaction(func(tx *gorm.DB) error {
				oldDBConnection := roundService.db
				roundService.SetDBConnection(tx)
				for _, participantAuthID := range activeRoomParticipants {
					if err := roundService.CreateRoundParticipant(participantAuthID, round.ID); err != nil {
						roundService.SetDBConnection(oldDBConnection)
						return err
					}
					if err := roundService.addLeaderboardMember(round.ID, participantAuthID); err != nil {
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
				Interval:    time.Duration(time.Minute*time.Duration(round.Duration)) + time.Duration(time.Duration(constants.ROUND_DURATION_BUFFER)*time.Second),
				RunOnce:     true,
				TaskContext: ctx,
				FuncWithTaskContext: func(tc tasks.TaskContext) error {
					roundService, isValidType := ctx.Context.Value(constants.ROUND_SERVICE).(*RoundService)
					if !isValidType {
						return &BSGError{
							Message:    "Error get round service from context",
							StatusCode: 500,
						}
					}
					if roundService == nil {
						return &BSGError{
							Message:    "Round service is nil",
							StatusCode: 500,
						}
					}
					result := roundService.db.Model(round).Updates(models.Round{
						Status: constants.ROUND_END,
					})
					if result.Error != nil {
						return &BSGError{
							Message:    "Error ending round",
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
			log.Printf("Error while attempting to scheduling round with id %d - %s", round.ID, e)
		},
	})
	if err != nil {
		return nil, err
	}
	return &roundStartTime, nil
}

// Adds a user to a round leaderboard
// Member values are a compression of the user's score and last submission timestamp
// User's initial score will be 0 with the current timestamp
func (service *RoundService) addLeaderboardMember(roundID uint, userID string) error {
	leaderboardKey := fmt.Sprintf("%d_leaderboard", roundID)
	score := compressScoreAndTimeStamp(0, time.Now())
	leaderboardMember := redis.Z{
		Score:  score,
		Member: userID,
	}
	if err := service.rdb.ZAdd(context.Background(), leaderboardKey, leaderboardMember).Err(); err != nil {
		log.Printf("Error adding user leaderboard score in redis instance: %v\n", err)
		return err
	}
	// TODO: remove
	if leaderboard, err := service.GetLeaderboard(roundID); err == nil {
		log.Printf("Leaderboard in round %d::\n%v\n", roundID, leaderboard)
	}
	return nil
}

// Removes the given round's leaderboard from the Redis cache
func (service *RoundService) deleteLeaderboard(roundID uint) error {
	leaderboardKey := fmt.Sprintf("%d_leaderboard", roundID)
	if resultCmd := service.rdb.Del(context.Background(), leaderboardKey); resultCmd.Err() != nil {
		log.Printf("Error deleting key %s: %v\n", leaderboardKey, resultCmd.Err())
		return resultCmd.Err()
	}
	return nil
}

// Get leaderboard of a round
func (service *RoundService) GetLeaderboard(roundID uint) ([]redis.Z, error) {
	key := fmt.Sprintf("%d_leaderboard", roundID)
	result, err := service.rdb.ZRevRangeWithScores(context.Background(), key, 0, -1).Result()
	if err != nil {
		return nil, err
	}
	return result, nil
}

// First 10 bits will represent the user score and the remaining 24 bits represent the user's submission timestamp
func compressScoreAndTimeStamp(score uint64, timestamp time.Time) float64 {
	const scoreBits = 10
	score <<= (64 - scoreBits)
	time := timestamp.Unix()
	time &= (1 << (64 - scoreBits)) - 1
	return float64(score | uint64(^time))
}
