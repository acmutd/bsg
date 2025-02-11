package services

import (
	"context"
	"fmt"
	"log"
	"strconv"
	"time"

	"github.com/acmutd/bsg/central-service/constants"
	"github.com/acmutd/bsg/central-service/models"
	"github.com/acmutd/bsg/rtc-service/requests"
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
	submissionQueue *SubmissionIngressQueueService
	rtcClient       *RTCClient
}

type RoundCreationParameters struct {
	Duration          int `json:"duration"` // Duration in minutes
	NumEasyProblems   int `json:"numEasyProblems"`
	NumMediumProblems int `json:"numMediumProblems"`
	NumHardProblems   int `json:"numHardProblems"`
}

type RoundSubmissionParameters struct {
	RoundID		   uint `json:"roundID"`
	ProblemID	   uint `json:"problemID"`
	// Code      string `json:"code"`
	// Language  string `json:"language"`
	// Maybe the score could be related to proportion of test cases passed
	// TotalCorrect   uint `json:"totalCorrect"`
	// TotalTestcases uint `json:"totalTestcases"`
}

func InitializeRoundService(db *gorm.DB, rdb *redis.Client, roundScheduler *tasks.Scheduler, problemAccessor *ProblemAccessor, submissionQueue *SubmissionIngressQueueService, rtcClient *RTCClient) RoundService {
	return RoundService{
		db:              db,
		rdb:             rdb,
		roundScheduler:  roundScheduler,
		problemAccessor: problemAccessor,
		submissionQueue: submissionQueue,
		rtcClient:       rtcClient,
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
	if round.Status != constants.ROUND_CREATED {
		return nil, &BSGError{
			Message:    "Round is either started or ended",
			StatusCode: 400,
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
	// RTCClient is nil in test cases
	if service.rtcClient != nil {
		var problemList []string
		for _, problem := range round.ProblemSet {
			problemList = append(problemList, fmt.Sprint(problem.ID))
		}
		var roundStart = requests.RoundStartRequest{
			RoomID:      round.RoomID.String(),
			ProblemList: problemList,
		}
		if _, err := service.rtcClient.SendMessage("round-start", roundStart); err != nil {
			log.Printf("Error sending round-start message: %v", err)
			return nil, BSGError{
				StatusCode: 500,
				Message: "Internal Server Error",
			}
		}
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
					// RTCClient is nil in test cases
					if service.rtcClient != nil {
						var roundEnd = requests.RoundEndRequest{
							RoomID: round.RoomID.String(),
						}
						if _, err := service.rtcClient.SendMessage("round-end", roundEnd); err != nil {
							log.Printf("Error sending round-end message: %v", err)
							return BSGError{
								StatusCode: 500,
								Message: "Internal Server Error",
							}
						}
					}
					return nil
				},
			})
			if err != nil {
				return err
			}
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
	score := float64(compressScoreAndTimeStamp(0, time.Now()))
	leaderboardMember := redis.Z{
		Score:  score,
		Member: userID,
	}
	if err := service.rdb.ZAdd(context.Background(), leaderboardKey, leaderboardMember).Err(); err != nil {
		log.Printf("Error adding user leaderboard score in redis instance: %v\n", err)
		return err
	}
	// TODO: remove
	if leaderboard, err := service.getLeaderboardByRoundID(roundID); err == nil {
		log.Printf("Leaderboard in round %d::\n%v\n", roundID, leaderboard)
	}
	return nil
}

// Removes the given round's leaderboard from the Redis cache
func (service *RoundService) DeleteLeaderboard(roundID uint) error {
	leaderboardKey := fmt.Sprintf("%d_leaderboard", roundID)
	if resultCmd := service.rdb.Del(context.Background(), leaderboardKey); resultCmd.Err() != nil {
		log.Printf("Error deleting key %s: %v\n", leaderboardKey, resultCmd.Err())
		return resultCmd.Err()
	}
	return nil
}

// Get leaderboard of a round
func (service *RoundService) getLeaderboardByRoundID(roundID uint) ([]redis.Z, error) {
	key := fmt.Sprintf("%d_leaderboard", roundID)
	result, err := service.rdb.ZRevRangeWithScores(context.Background(), key, 0, -1).Result()
	if err != nil {
		return nil, err
	}
	return result, nil
}

// Get leaderboard of a round
func (service *RoundService) GetLeaderboardByRoomID(roomID string) ([]redis.Z, error) {
	key := fmt.Sprintf("%s_mostRecentRound", roomID)
	roundIDStr, err := service.rdb.Get(context.Background(), key).Result()
	if err != nil {
		if err, ok := err.(redis.Error); ok && err.Error() == "redis: nil" {
			return nil, BSGError{StatusCode: 404, Message: "No recent round"}
		}
		return nil, err
	}
	roundID, err := strconv.ParseUint(roundIDStr, 10, 64)
	if err != nil {
		return nil, err
	}
	return service.getLeaderboardByRoundID(uint(roundID))
}

// First 10 bits will represent the user score and the remaining 24 bits represent the user's submission timestamp
func compressScoreAndTimeStamp(score uint64, timestamp time.Time) uint64 {
	const scoreBits = 10
	score <<= (64 - scoreBits)
	time := timestamp.Unix()
	time &= (1 << (64 - scoreBits)) - 1
	return score | uint64(^time)
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

func (service *RoundService) DetermineScoreDeltaForUserBySubmission(
	problem *models.Problem,
	participant *models.RoundParticipant,
	round *models.Round,
) (uint, error) {
	var numACSubmissions uint
	result := service.db.Raw(`
		SELECT 
			count(*)
		FROM 
			submissions 
		INNER JOIN round_submissions 
			ON submissions.submission_owner_id = round_submissions.id
		WHERE 
			submissions.verdict = ?
			AND submission.problem_id = ?
			AND round_submissions.round_id = ?
			AND round_submissions.round_participant_id = ?
			AND submissions.submission_owner_type = "round_submissions"
	`, constants.SUBMISSION_STATUS_ACCEPTED, problem.ID, round.ID, participant.ID).Scan(&numACSubmissions)
	if result.Error != nil {
		return 0, result.Error
	}
	// If user already AC this problem, then no score delta for that user
	if numACSubmissions > 0 {
		return 0, nil
	}
	return service.problemAccessor.GetProblemAccessor().DetermineScoreForProblem(problem), nil
}

func (service *RoundService) CreateRoundSubmission(
	submissionParams RoundSubmissionParameters,
	submissionAuthor string,
) (*models.RoundSubmission, error) {
	// get round object
	round, err := service.FindRoundByID(submissionParams.RoundID)
	if err != nil {
		return nil, err
	}

	if round.Status == constants.ROUND_CREATED {
		return nil, &BSGError{
			Message:    "Round haven't started yet",
			StatusCode: 400,
		}
	}

	if round.Status == constants.ROUND_END {
		return nil, &BSGError{
			Message:    "Round already ended",
			StatusCode: 400,
		}
	}

	// get problem object
	problem, err := service.problemAccessor.GetProblemAccessor().FindProblemByProblemID(submissionParams.ProblemID)
	if err != nil {
		return nil, err
	}

	// check if problem is in round's problemset
	problemInRoundProblemset, err := service.CheckIfRoundContainsProblem(round, problem)
	if err != nil {
		return nil, err
	}
	if !problemInRoundProblemset {
		return nil, &BSGError{
			Message:    "Invalid problem.",
			StatusCode: 400,
		}
	}

	// find participant object with matching round id and user auth id
	participant, err := service.FindParticipantByRoundAndUserID(submissionParams.RoundID, submissionAuthor)
	if err != nil {
		return nil, err
	}

	// check if user joined round
	if participant == nil {
		return nil, &BSGError{
			Message:    "User haven't joined round...",
			StatusCode: 400,
		}
	}

	// determine score
	problemScore, err := service.DetermineScoreDeltaForUserBySubmission(problem, participant, round)
	if err != nil {
		return nil, err
	}

	// create submission object
	newSubmission := models.RoundSubmission{
		Submission: models.Submission{
			// Code:                submissionParams.Code,
			// Language:            submissionParams.Language,
			ProblemID:           problem.ID,
			ExecutionTime:       0,
			Verdict:             constants.SUBMISSION_STATUS_SUBMITTED,
			SubmissionTimestamp: time.Now(),
		},
		Score: problemScore,
	}
	if err := service.db.Create(&newSubmission).Error; err != nil {
		return nil, err
	}

	// establish relationship with round
	if err := service.db.Model(round).Association("RoundSubmissions").Append(&newSubmission); err != nil {
		return nil, err
	}

	// establish relationship with round participant
	if err := service.db.Model(participant).Association("RoundSubmissions").Append(&newSubmission); err != nil {
		return nil, err
	}

	// service.submissionQueue is nil in unit tests
	if service.submissionQueue != nil {
		service.submissionQueue.AddSubmissionToQueue(problem, &newSubmission)
	}

	return &newSubmission, nil
}
