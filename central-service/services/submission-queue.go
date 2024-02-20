package services

import (
	"fmt"
	kafka_queue "kafka-queue" // TODO: change dependency name
	"os"

	"github.com/acmutd/bsg/central-service/models"
	"github.com/confluentinc/confluent-kafka-go/kafka"
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

func (ingressQueueService *SubmissionIngressQueueService) AddSubmissionToQueue(submission *models.RoundSubmission) error {
	err := ingressQueueService.producer.Produce(
		&kafka.Message{
			TopicPartition: kafka.TopicPartition{
				Topic: &ingressQueueService.ingressChannelName,
				Partition: int32(0), // TODO: change this to real value
			},
			Value: []byte(""), // TODO: change this to real value
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
}

func NewSubmissionEgressQueueService() SubmissionEgressQueueService {
	consumer := kafka_queue.NewKafkaConsumer(
		os.Getenv("KAFKA_BROKER"), 
		os.Getenv("KAFKA_EGRESS_TOPIC"), 
		os.Getenv("KAFKA_CENTRAL_SERVICE_GID"),
	)
	return SubmissionEgressQueueService{
		consumer,
	}
}

func (egressQueueService *SubmissionEgressQueueService) ProcessSubmissionData(rawMessage []byte) error  {
	// TODO: add implementation
	// Make sure to process duplicate message
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