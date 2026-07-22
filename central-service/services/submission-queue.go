package services

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/acmutd/bsg/central-service/constants"
	"github.com/acmutd/bsg/central-service/dto"
	"github.com/acmutd/bsg/central-service/models"
	queuepkg "github.com/acmutd/bsg/central-service/queue"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

type SubmissionIngressQueueService struct {
	redisQueue *queuepkg.RedisQueue
}

func NewSubmissionIngressQueueService(rdb *redis.Client) SubmissionIngressQueueService {
	queueName := os.Getenv("REDIS_SUBMISSION_QUEUE")
	if queueName == "" {
		queueName = "submission-ingress"
	}
	return SubmissionIngressQueueService{
		redisQueue: queuepkg.NewRedisQueue(rdb, queueName),
	}
}

func (ingressQueueService *SubmissionIngressQueueService) AddSubmissionToQueue(problem *models.Problem, submission *models.RoundSubmission) error {
	ingressPayload := dto.NewSubmissionIngressDTO(problem, submission)
	marshalledData, err := json.Marshal(ingressPayload)
	if err != nil {
		return err
	}
	if err := ingressQueueService.redisQueue.Publish(marshalledData); err != nil {
		return fmt.Errorf("Error adding submission to Redis Queue: %v", err)
	}
	return nil
}

type SubmissionEgressQueueService struct {
	redisQueue   *queuepkg.RedisQueue
	db           *gorm.DB
	roundService *RoundService
}

func NewSubmissionEgressQueueService(db *gorm.DB, roundService *RoundService, rdb *redis.Client) SubmissionEgressQueueService {
	queueName := os.Getenv("REDIS_EGRESS_QUEUE")
	if queueName == "" {
		queueName = "submission-egress"
	}
	return SubmissionEgressQueueService{
		redisQueue:   queuepkg.NewRedisQueue(rdb, queueName),
		db:           db,
		roundService: roundService,
	}
}

func (egressQueueService *SubmissionEgressQueueService) ProcessSubmissionData(rawSubmissionData []byte) error {
	var payload dto.SubmissionEgressDTO
	if err := json.Unmarshal(rawSubmissionData, &payload); err != nil {
		return err
	}

	var submission models.Submission
	result := egressQueueService.db.Where("ID = ?", payload.SubmissionId).Limit(1).Find(&submission)
	if result.Error != nil {
		return &BSGError{StatusCode: 500, Message: fmt.Sprintf("Internal Server Error: %v", result.Error.Error())}
	}
	if result.RowsAffected == 0 {
		return &BSGError{StatusCode: 404, Message: "Submission not found"}
	}

	var scoreToAdd uint = 0
	var problem models.Problem
	var lbUserID uint = 0

	if payload.Verdict == constants.SUBMISSION_STATUS_ACCEPTED {
		egressQueueService.db.First(&problem, submission.ProblemID)

		if submission.SubmissionOwnerType == "round_submissions" {
			var roundSubmission models.RoundSubmission
			err := egressQueueService.db.Preload("Round").Preload("RoundParticipant").First(&roundSubmission, submission.SubmissionOwnerID).Error
			if err == nil {
				// use the score calculated at submission time
				scoreToAdd = roundSubmission.Score

				var user models.User
				if err := egressQueueService.db.Where(models.User{AuthID: roundSubmission.RoundParticipant.ParticipantAuthID}).
					Attrs(models.User{
						Handle:    fmt.Sprintf("User-%s", roundSubmission.RoundParticipant.ParticipantAuthID[:8]),
						FirstName: "Unknown",
						LastName:  "User",
						Email:     fmt.Sprintf("no-email-%s@example.com", roundSubmission.RoundParticipant.ParticipantAuthID),
					}).
					FirstOrCreate(&user).Error; err != nil {
					log.Printf("failed to find or create user for AuthID %s: %v", roundSubmission.RoundParticipant.ParticipantAuthID, err)
					// can't update leaderboard, but still update submission verdict below
				} else {
					lbUserID = user.ID
				}
			}
		}

		if lbUserID != 0 {
			var existingAcceptedCount int64
			err := egressQueueService.db.Table("submissions").
				Select("submissions.id").
				Joins("LEFT JOIN round_submissions rs ON submissions.submission_owner_id = rs.id AND submissions.submission_owner_type = 'round_submissions'").
				Joins("LEFT JOIN round_participants rp ON rs.round_participant_id = rp.id").
				Joins("LEFT JOIN users u ON (u.id = submissions.submission_owner_id AND submissions.submission_owner_type = 'user') OR (u.auth_id = rp.participant_auth_id)").
				Where("submissions.problem_id = ? AND submissions.verdict = ? AND u.id = ? AND submissions.id <> ?",
					submission.ProblemID, constants.SUBMISSION_STATUS_ACCEPTED, lbUserID, submission.ID).
				Count(&existingAcceptedCount).Error

			if err == nil && existingAcceptedCount > 0 {
				// already solved this problem, don't award points again
				scoreToAdd = 0
			} else if err != nil {
				log.Printf("error checking existing accepted submissions: %v", err)
			}
		}
	}

	// update verdict in database
	result = egressQueueService.db.Model(&submission).Update("verdict", payload.Verdict)
	if result.Error != nil {
		return &BSGError{StatusCode: 500, Message: fmt.Sprintf("Internal Server Error: %v", result.Error.Error())}
	}

	// update leaderboard if points awarded
	if payload.Verdict == constants.SUBMISSION_STATUS_ACCEPTED && scoreToAdd > 0 {
		// update redis leaderboard
		if submission.SubmissionOwnerType == "round_submissions" {
			var roundSubmission models.RoundSubmission
			if err := egressQueueService.db.First(&roundSubmission, submission.SubmissionOwnerID).Error; err == nil {
				if err := egressQueueService.roundService.UpdateLeaderboardScore(roundSubmission.RoundID, roundSubmission.RoundParticipant.ParticipantAuthID, scoreToAdd); err != nil {
					log.Printf("failed to update Redis leaderboard: %v", err)
				}
			}
		}

		var lb models.Leaderboard
		egressQueueService.db.FirstOrCreate(&lb, models.Leaderboard{UserID: lbUserID})

		switch problem.Difficulty {
		case constants.DIFFICULTY_EASY:
			lb.EasySolved++
		case constants.DIFFICULTY_MEDIUM:
			lb.MediumSolved++
		case constants.DIFFICULTY_HARD:
			lb.HardSolved++
		}
		lb.TotalScore += scoreToAdd

		if err := egressQueueService.db.Save(&lb).Error; err != nil {
			return err
		}
	}
	return nil
}

func (egressQueueService *SubmissionEgressQueueService) ListenForSubmissionData() {
	if recovered, err := egressQueueService.redisQueue.Recover(); err != nil {
		log.Printf("Error recovering in-flight egress messages: %v", err)
	} else if recovered > 0 {
		log.Printf("Recovered %d in-flight egress messages from previous run", recovered)
	}
	for {
		rawSubmissionData, err := egressQueueService.redisQueue.Consume(time.Second)
		if err != nil {
			log.Printf("Error consuming from Redis egress queue: %v", err)
			time.Sleep(time.Second)
			continue
		}
		if len(rawSubmissionData) == 0 {
			continue
		}
		if err := egressQueueService.ProcessSubmissionData(rawSubmissionData); err != nil {
			log.Printf("Error processing message at Redis Egress Queue: %v", err)
			// retry transient (5xx) failures like a DB outage; drop everything
			// else (bad payload, missing submission) as permanent
			var bsgErr *BSGError
			if errors.As(err, &bsgErr) && bsgErr.StatusCode >= 500 {
				if err := egressQueueService.redisQueue.Requeue(rawSubmissionData); err != nil {
					log.Printf("Error requeueing egress message: %v", err)
				}
				time.Sleep(time.Second)
				continue
			}
		}
		if err := egressQueueService.redisQueue.Ack(rawSubmissionData); err != nil {
			log.Printf("Error acking egress message: %v", err)
		}
	}
}
