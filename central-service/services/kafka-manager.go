package services

import (
	"context"
	"log"
	"os"

	"github.com/confluentinc/confluent-kafka-go/kafka"
)

type KafkaManagerService struct {
	adminClient *kafka.AdminClient
}

func NewKafkaManagerService() KafkaManagerService {
	adminClient, err := kafka.NewAdminClient(&kafka.ConfigMap{
		"bootstrap.servers": os.Getenv("KAFKA_BROKER"),
	})
	if err != nil {
		log.Fatalf("Error initializing Kafka Manager admin client: %v\n", err)
	}
	return KafkaManagerService{
		adminClient,
	}
}

func (service *KafkaManagerService) CreateKafkaTopicIfNotExists(topicName string) (error) {
	metadata, err := service.adminClient.GetMetadata(&topicName, true, 1000)
	if err != nil {
		return err
	}
	_, alreadyExisted := metadata.Topics[topicName]
	if alreadyExisted {
		return nil
	}
	ctx := context.Background()
	results, err := service.adminClient.CreateTopics(
		ctx, 
		[]kafka.TopicSpecification{
			{
				Topic: topicName,
				NumPartitions: 1,
				ReplicationFactor: 1,
			},
		},
		kafka.SetAdminOperationTimeout(5000),
	)
	if err != nil {
		return err		
	}
	for _, result := range results {
		if result.Error.Code().String() != "ErrNoError" {
			return result.Error
		}
	}
	return nil
}

func (service *KafkaManagerService) Cleanup() {
	service.adminClient.Close()
}