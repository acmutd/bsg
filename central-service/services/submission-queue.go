package services

import (
	"encoding/json"
	"fmt"
	kafka_queue "kafka-queue" // TODO: change dependency name
	"os"

	kafka_dto "github.com/acmutd/bsg/central-service/kafka"
	"github.com/acmutd/bsg/central-service/models"
	"github.com/confluentinc/confluent-kafka-go/kafka"
	"gorm.io/gorm"
)

const MIN_COMMIT_COUNT = 100
const DELIVERY_CHANNEL_SIZE = 10000

type SubmissionIngressQueueService struct {
	producer *kafka.Producer
	ingressChannelName string
	deliveryChannel chan kafka.Event
}


func NewSubmissionIngressQueueService() SubmissionIngressQueueService {
	producer := kafka_queue.NewKafkaProducer(os.Getenv("KAFKA_BROKER"))
	return SubmissionIngressQueueService{
		producer: producer,
		ingressChannelName: os.Getenv("KAFKA_INGRESS_TOPIC"),
		deliveryChannel: make(chan kafka.Event, DELIVERY_CHANNEL_SIZE),
	}
}

func (ingressQueueService *SubmissionIngressQueueService) AddSubmissionToQueue(problem *models.Problem, submission *models.RoundSubmission) error {
	kafkaPayload := kafka_dto.NewKafkaIngressDTO(problem, submission)
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
	consumer := kafka_queue.NewKafkaConsumer(
		os.Getenv("KAFKA_BROKER"), 
		os.Getenv("KAFKA_EGRESS_TOPIC"), 
		os.Getenv("KAFKA_CENTRAL_SERVICE_GID"),
	)
	return SubmissionEgressQueueService{
		consumer,
		db,
	}
}

func (egressQueueService *SubmissionEgressQueueService) ProcessSubmissionData(rawSubmissionData []byte) error  {
	var payload kafka_dto.KafkaEgressDTO
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
			fmt.Printf("Unexpected message at Kafka Egress Consumer: %v\n", e)
		} 
	}
 egressQueueService.consumer.Close()	
}