package services

import (
	"encoding/json"
	"fmt"
	"log"
	"os"

	kafka_utils "github.com/acmutd/bsg/central-service/kafka"
	"github.com/acmutd/bsg/central-service/models"
	"github.com/confluentinc/confluent-kafka-go/kafka"
	"gorm.io/gorm"
)

const MIN_COMMIT_COUNT = 100
const DELIVERY_CHANNEL_SIZE = 10000

type SubmissionIngressQueueService struct {
	managerService *KafkaManagerService
	producer *kafka.Producer
	ingressChannelName string
	deliveryChannel chan kafka.Event
}


func NewSubmissionIngressQueueService(kafkaManagerService *KafkaManagerService) SubmissionIngressQueueService {
	producer, err := kafka.NewProducer(&kafka.ConfigMap{
		"bootstrap.servers": os.Getenv("KAFKA_BROKER"),
		"acks": "all",
	})
	if err != nil {
		log.Fatalf("Failed to create ingress service producer: %v\n", err)
	}
	// Create new topic
	return SubmissionIngressQueueService{
		producer: producer,
		managerService: kafkaManagerService,
		ingressChannelName: os.Getenv("KAFKA_INGRESS_TOPIC"),
		deliveryChannel: make(chan kafka.Event, DELIVERY_CHANNEL_SIZE),
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
				Topic: &ingressQueueService.ingressChannelName,
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
	consumer *kafka.Consumer
	db *gorm.DB
}

func NewSubmissionEgressQueueService(db *gorm.DB) SubmissionEgressQueueService {
	consumer, err := kafka.NewConsumer(&kafka.ConfigMap{
		"bootstrap.servers": os.Getenv("KAFKA_BROKER"),
		"group.id": os.Getenv("KAFKA_CENTRAL_SERVICE_GID"),
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
		consumer,
		db,
	}
}

func (egressQueueService *SubmissionEgressQueueService) ProcessSubmissionData(rawSubmissionData []byte) error  {
	var payload kafka_utils.KafkaEgressDTO
	if err := json.Unmarshal(rawSubmissionData, &payload); err != nil {
		return err
	}
	// fetch submission object
	var submission models.Submission
	result := egressQueueService.db.Where("ID = ?", payload.SubmissionId).Limit(1).Find(&submission)
	if result.Error != nil {
		return &BSGError{
			StatusCode: 500,
			Message: fmt.Sprintf("Internal Server Error: %v", result.Error.Error()),
		}
	}
	if result.RowsAffected == 0 {
		return &BSGError{
			StatusCode: 404,
			Message: "Submission not found",
		}
	}
	// update verdict
	result = egressQueueService.db.Model(&submission).Update("verdict", payload.Verdict)
	if result.Error != nil {
		return &BSGError{
			StatusCode: 500,
			Message: fmt.Sprintf("Internal Server Error: %v", result.Error.Error()),
		}
	}

	if payload.Verdict == constants.SUBMISSION_STATUS_ACCEPTED {
        var problem models.Problem
        egressQueueService.db.First(&problem, submission.ProblemID)

        var lb models.Leaderboard
        egressQueueService.db.FirstOrCreate(&lb, models.Leaderboard{UserID: submission.SubmissionOwnerID})

        // updates score based on problems solved
		// scoring based on ProblemService.DetermineScoreForProblem
        scoreToAdd := uint(0)
        switch problem.Difficulty {
        case constants.DIFFICULTY_EASY:
            lb.EasySolved++
            scoreToAdd = 3
        case constants.DIFFICULTY_MEDIUM:
            lb.MediumSolved++
            scoreToAdd = 4
        case constants.DIFFICULTY_HARD:
            lb.HardSolved++
            scoreToAdd = 5
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
			if msg_count % MIN_COMMIT_COUNT == 0 {
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