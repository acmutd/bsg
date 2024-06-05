package kafka_queue

import (
	"context"
	"errors"
	"fmt"

	"github.com/confluentinc/confluent-kafka-go/kafka"
)

// Create a new kafka producer
func NewKafkaProducer(kafkaServer string) *kafka.Producer {
	producer, err := kafka.NewProducer(&kafka.ConfigMap{
		"bootstrap.servers": kafkaServer,
		"acks":              "all"})
	if err != nil {
		fmt.Println("Failed to create producer due to ", err)
		return nil
	}
	return producer
}

// Delete topics from the kafka
func DeleteTopics(kafkaServer string, deleteTopics []string) error {
	// Configuration for the AdminClient
	config := &kafka.ConfigMap{"bootstrap.servers": kafkaServer}
	adminClient, err := kafka.NewAdminClient(config)
	if err != nil {
		return errors.New("Error creating admin client: " + err.Error())
	}
	defer adminClient.Close()
	// Create context
	ctx := context.Background()
	// Delete the topics
	results, err := adminClient.DeleteTopics(
		ctx,
		deleteTopics,
		kafka.SetAdminOperationTimeout(5000)) // Timeout in milliseconds
	if err != nil {
		return errors.New("Error deleting topic: " + err.Error())
	}
	// Check the results
	for _, result := range results {
		if result.Error.Code().String() != "ErrNoError" {
			return errors.New("Error deleting topic: " + result.Error.Error())
		}
	}
	return nil
}

// Create a new topic in the kafka
func CreateTopic(kafkaServer string, kafkaTopic string, partitions int, replicationFactor int) error {
	// Configuration for the AdminClient
	config := &kafka.ConfigMap{"bootstrap.servers": kafkaServer}
	adminClient, err := kafka.NewAdminClient(config)
	if err != nil {
		fmt.Println("Error creating admin client:", err)
		return errors.New("Error creating admin client: " + err.Error())
	}
	defer adminClient.Close()
	// Initialize topic specification
	topicSpec := kafka.TopicSpecification{
		Topic:             kafkaTopic,
		NumPartitions:     partitions,
		ReplicationFactor: replicationFactor,
	}
	// Create context
	ctx := context.Background()
	// Create the topic
	results, err := adminClient.CreateTopics(
		ctx,
		[]kafka.TopicSpecification{topicSpec},
		kafka.SetAdminOperationTimeout(5000)) // Timeout in milliseconds
	if err != nil {
		return errors.New("Error creating topic: " + err.Error())
	}
	// Check the results
	for _, result := range results {
		if result.Error.Code().String() != "ErrNoError" {
			return errors.New("Error creating topic: " + result.Error.Error())
		}
	}
	return nil
}

// Send an event to the kafka queue
func SendEvent(producer *kafka.Producer, kafkaServer string, kafkaTopic string, data []byte, partition ...int) error {
	// Send submission result to kafka queue
	kafkaPartition := kafka.PartitionAny
	if len(partition) > 0 {
		kafkaPartition = int32(partition[0])
	}
	produceMessageErr := producer.Produce(&kafka.Message{
		TopicPartition: kafka.TopicPartition{
			Topic:     &kafkaTopic,
			Partition: kafkaPartition,
		},
		Value: data,
	}, nil)
	if produceMessageErr != nil {
		return errors.New("Unable to enqueue event " + string(data))
	}
	// Wait for message to be delivered
	event := <-producer.Events()
	switch event := event.(type) {
	case *kafka.Message:
		if event.TopicPartition.Error != nil {
			return errors.New("Failed to deliver event: %v\n" + event.TopicPartition.String())
		} else {
			fmt.Printf("Produced event to topic %s at partision %d: value = %s\n",
				*event.TopicPartition.Topic, partition, (event.Value))
			return nil
		}
	case *kafka.Error:
		return errors.New("Failed to produce event due to " + event.Error())
	}
	return errors.New("Failed to produce event due to unknown error")
}

// Create a new kafka consumer
func NewKafkaConsumer(kafkaServer string, kafkaTopic string, workerID string) *kafka.Consumer {
	consumer, initConsumerErr := kafka.NewConsumer(&kafka.ConfigMap{"bootstrap.servers": kafkaServer, "group.id": workerID, "auto.offset.reset": "smallest"})
	if initConsumerErr != nil {
		fmt.Println("Unable to create kafka consumer due to error " + initConsumerErr.Error())
		return nil
	}
	// Subscribe to kafka topic
	subscriptionErr := consumer.Subscribe(kafkaTopic, nil)
	if subscriptionErr != nil {
		panic(errors.New("Unable to subscribe to topic " + kafkaTopic + " due to error - " + subscriptionErr.Error()))
	}
	fmt.Println("subscribed to topic", kafkaTopic)
	return consumer
}

// Receive an event from the kafka queue
func ReceiveEvent(consumer *kafka.Consumer) ([]byte, error) {
	fmt.Println("waiting for event...")
	for {
		event := consumer.Poll(100)
		switch event := event.(type) {
		case *kafka.Message:
			_, err := consumer.CommitMessage(event)
			if err == nil {
				fmt.Println("Received event from kafka queue: ", string(event.Value))
				return event.Value, nil
			}
		case *kafka.Error:
			return nil, errors.New("Error while receiving event from kafka due to " + event.Error())
		default:
			continue
		}
	}
}
