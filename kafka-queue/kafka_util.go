package kafka_queue

import (
	"context"
	"errors"
	"fmt"

	"github.com/confluentinc/confluent-kafka-go/kafka"
)

func NewKafkaProducer(kafkaServer string) *kafka.Producer {
	producer, err := kafka.NewProducer(&kafka.ConfigMap{
		"bootstrap.servers": kafkaServer,
		"acks":              "all"})
	if err != nil {
		fmt.Println("Failed to create producer due to ", err)
		panic(err)
	}
	return producer
}

func DeleteTopics(kafkaServer string, deleteTopics []string) (error) {
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
		if (result.Error.Code().String() != "ErrNoError") {
			return errors.New("Error deleting topic: " + result.Error.Error())
		}
	}
	return nil
}

func CreateTopic(kafkaServer string, kafkaTopic string, partitions int, replicationFactor int) (error) {
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
		if (result.Error.Code().String() != "ErrNoError") {
			return errors.New("Error creating topic: " + result.Error.Error())
		}
	}
	return nil
}

func SendSubmissionResult(producer *kafka.Producer, kafkaServer string, kafkaTopic string, submissionResult string, partition int) error {
	// Send submission result to kafka queue
	produceMessageErr := producer.Produce(&kafka.Message{
		TopicPartition: kafka.TopicPartition{Topic: &kafkaTopic, Partition: int32(partition)},
		Value:          []byte(submissionResult),
	}, nil)
	if produceMessageErr != nil {
		return errors.New("Unable to enqueue message " + submissionResult)
	}
	// Wait for message to be delivered
	event := <-producer.Events()
	switch event := event.(type) {
	case *kafka.Message:
		if event.TopicPartition.Error != nil {
			return errors.New("Failed to deliver message: %v\n" + event.TopicPartition.String())
		} else {
			fmt.Printf("Produced event to topic %s at partision %d: value = %s\n",
				*event.TopicPartition.Topic, partition, (event.Value))
			return nil
		}
	case *kafka.Error:
		return errors.New("Failed to produce message due to " + event.Error())
	}
	return errors.New("Failed to produce message due to unknown error")
}

func NewKafkaConsumer(kafkaServer string, kafkaTopic string, workerID string) *kafka.Consumer {
	consumer, initConsumerErr := kafka.NewConsumer(&kafka.ConfigMap{"bootstrap.servers": kafkaServer, "group.id": workerID, "auto.offset.reset": "smallest"})
	if initConsumerErr != nil {
		panic(errors.New("Unable to create kafka consumer due to error " + initConsumerErr.Error()))
	}
	// Subscribe to kafka topic
	subscriptionErr := consumer.Subscribe(kafkaTopic, nil)
	if subscriptionErr != nil {
		panic(errors.New("Unable to subscribe to topic " + kafkaTopic + " due to error - " + subscriptionErr.Error()))
	}
	fmt.Println("subscribed to topic", kafkaTopic)
	return consumer
}

func ReceiveRequest(consumer *kafka.Consumer) (string, error) {
	fmt.Println("waiting for event...")
	for {
		event := consumer.Poll(100)
		switch event := event.(type) {
		case *kafka.Message:
			_, err := consumer.CommitMessage(event)
			if err == nil {
				fmt.Println("Received message from kafka queue: ", string(event.Value))
				return string(event.Value), nil
			}
		case *kafka.Error:
			return "", errors.New("Error while receiving message from kafka due to " + event.Error())
		default:
			continue
		}
	}
}
