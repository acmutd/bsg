package services

//"context"
//"log"
//"os"

//"github.com/confluentinc/confluent-kafka-go/kafka"

// KafkaManagerService is disabled due to Kafka dependency removal.
type KafkaManagerService struct {
	// adminClient *kafka.AdminClient
}

func NewKafkaManagerService() KafkaManagerService {
	// Kafka admin client initialization commented out
	/*
		adminClient, err := kafka.NewAdminClient(&kafka.ConfigMap{
			"bootstrap.servers": os.Getenv("KAFKA_BROKER"),
		})
		if err != nil {
			log.Fatalf("Error initializing Kafka Manager admin client: %v\n", err)
		}
		return KafkaManagerService{
			adminClient,
		}
	*/
	return KafkaManagerService{}
}

func (service *KafkaManagerService) CreateKafkaTopicIfNotExists(topicName string) error {
	// Kafka topic creation disabled - always return nil
	return nil

	/*
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
					Topic:             topicName,
					NumPartitions:     1,
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
	*/
}

func (service *KafkaManagerService) Cleanup() {
	// service.adminClient.Close()
}
