package services

import (
	"encoding/json"
	"fmt"
	"log"
	"os"

	"github.com/acmutd/bsg/central-service/constants"
	kafka_utils "github.com/acmutd/bsg/central-service/kafka"
	"github.com/acmutd/bsg/central-service/models"
	"github.com/confluentinc/confluent-kafka-go/kafka"
	"gorm.io/gorm"
)

const MIN_COMMIT_COUNT = 100
const DELIVERY_CHANNEL_SIZE = 10000

type SubmissionIngressQueueService struct {
	managerService     *KafkaManagerService
	producer           *kafka.Producer
	ingressChannelName string
	deliveryChannel    chan kafka.Event
}

func NewSubmissionIngressQueueService(kafkaManagerService *KafkaManagerService) SubmissionIngressQueueService {
	producer, err := kafka.NewProducer(&kafka.ConfigMap{
		"bootstrap.servers": os.Getenv("KAFKA_BROKER"),
		"acks":              "all",
	})
	if err != nil {
		log.Fatalf("Failed to create ingress service producer: %v\n", err)
	}
	return SubmissionIngressQueueService{
		producer:           producer,
		managerService:     kafkaManagerService,
		ingressChannelName: os.Getenv("KAFKA_INGRESS_TOPIC"),
		deliveryChannel:    make(chan kafka.Event, DELIVERY_CHANNEL_SIZE),
	}
}

func (ingressQueueService *SubmissionIngressQueueService) AddSubmissionToQueue(problem *models.Problem, submission *models.RoundSubmission) error {
	kafkaPayload := kafka_utils.NewKafkaIngressDTO(problem, submission)
	marshalledData, err := json.Marshal(kafkaPayload)
	if err != nil {
		return err
	}
	err = ingressQueueService.producer.Produce(
		&kafka.Message{
			TopicPartition: kafka.TopicPartition{
				Topic:     &ingressQueueService.ingressChannelName,
				Partition: int32(0), // 1 partition should be enough for now
			},
			Value: marshalledData,
		},
		ingressQueueService.deliveryChannel,
	)
	if err != nil {
		return fmt.Errorf("Error adding submission to Kafka Queue: %v", err)
	}
	return nil
}

func (ingressQueueService *SubmissionIngressQueueService) MessageDeliveryHandler() {
	for e := range ingressQueueService.producer.Events() {
		switch ev := e.(type) {
		case *kafka.Message:
			if ev.TopicPartition.Error != nil {
				fmt.Printf("Failed to deliver message: %v\n", ev.TopicPartition)
			} else {
				fmt.Printf("Successfully produced message to topic %s partition [%d] @ offset %v\n",
					*ev.TopicPartition.Topic,
					ev.TopicPartition.Partition,
					ev.TopicPartition.Offset,
				)
			}
		}
	}
}

type SubmissionEgressQueueService struct {
	consumer     *kafka.Consumer
	db           *gorm.DB
	roundService *RoundService
}

func NewSubmissionEgressQueueService(db *gorm.DB, roundService *RoundService) SubmissionEgressQueueService {
	consumer, err := kafka.NewConsumer(&kafka.ConfigMap{
		"bootstrap.servers": os.Getenv("KAFKA_BROKER"),
		"group.id":          os.Getenv("KAFKA_CENTRAL_SERVICE_GID"),
		"auto.offset.reset": "smallest",
	})
	if err != nil {
		log.Fatalf("Error creating egress queue consumer: %v\n", err)
	}
	err = consumer.Subscribe(os.Getenv("KAFKA_EGRESS_TOPIC"), nil)
	if err != nil {
		log.Fatalf("Error subscribing to egress topic: %v\n", err)
	}
	return SubmissionEgressQueueService{
		consumer:     consumer,
		db:           db,
		roundService: roundService,
	}
}

func (egressQueueService *SubmissionEgressQueueService) ProcessSubmissionData(rawSubmissionData []byte) error {
	var payload kafka_utils.KafkaEgressDTO
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
	run := true
	msg_count := 0
	for run {
		ev := egressQueueService.consumer.Poll(100)
		switch e := ev.(type) {
		case *kafka.Message:
			msg_count += 1
			if msg_count%MIN_COMMIT_COUNT == 0 {
				egressQueueService.consumer.Commit()
			}
			err := egressQueueService.ProcessSubmissionData(e.Value)
			if err != nil {
				fmt.Printf("Error processing message at Kafka Egress Queue: %v\n", err)
			}
		case kafka.Error:
			fmt.Printf("Error detected at Kafka Egress Consumer: %v\n", e)
			run = false
		default:
			if e != nil {
				fmt.Printf("Unexpected message at Kafka Egress Consumer: %v\n", e)
			}
		}
	}
	egressQueueService.consumer.Close()
}
