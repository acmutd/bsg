package kafka_queue

import (
	"fmt"
	"os"
	"slices"
	"strconv"
	"sync"
	"testing"
	"time"

	"github.com/confluentinc/confluent-kafka-go/kafka"
	"github.com/joho/godotenv"
)

func TestNewKafkaConsumer(t *testing.T) {
	// Get the username and password environment variables
	err := godotenv.Load("../.env")
	if err != nil {
		t.Error("Error loading .env file")
	}
	kafkaServer := os.Getenv("KAFKA_BROKER")
	kafkaTopic := os.Getenv("KAFKA_TOPIC")
	// Create new kafka consumer
	consumer := NewKafkaConsumer(kafkaServer, kafkaTopic, "worker1")
	if consumer == nil {
		t.Error("Failed to create kafka consumer")
	}
	consumer.Close()
}

func TestNewKafkaProducer(t *testing.T) {
	// Get the username and password environment variables
	err := godotenv.Load("../.env")
	if err != nil {
		t.Error("Error loading .env file")
	}
	kafkaServer := os.Getenv("KAFKA_BROKER")
	// Create new kafka producer
	producer := NewKafkaProducer(kafkaServer)
	if producer == nil {
		t.Error("Failed to create kafka producer")
	}
	producer.Close()
}

func TestSendSubmissionResult(t *testing.T) {
	// Get the username and password environment variables
	err := godotenv.Load("../.env")
	if err != nil {
		t.Error("Error loading .env file")
	}
	kafkaServer := os.Getenv("KAFKA_BROKER")
	kafkaTopic := os.Getenv("KAFKA_TOPIC")
	// Create new kafka producer
	producer := NewKafkaProducer(kafkaServer)
	if producer == nil {
		t.Error("Failed to create kafka producer")
	}
	// Send submission result
	err = SendSubmissionResult(producer, kafkaServer, kafkaTopic, "test", 0)
	if err != nil {
		t.Error("Failed to send submission result due to error - ", err.Error())
	}
}

func TestReceiveRequest(t *testing.T) {
	var wg sync.WaitGroup
	request := make(chan string)
	receiveRequestErr := make(chan error)
	// Get the username and password environment variables
	err := godotenv.Load("../.env")
	if err != nil {
		t.Error("Error loading .env file")
	}
	kafkaServer := os.Getenv("KAFKA_BROKER")
	kafkaTopic := "submission_requests_for_test_receive_request"
	// Create new kafka consumer
	consumer := NewKafkaConsumer(kafkaServer, kafkaTopic, "worker")
	if consumer == nil {
		t.Error("Failed to create kafka consumer")
	}
	// Create new kafka producer
	producer := NewKafkaProducer(kafkaServer)
	if producer == nil {
		t.Error("Failed to create kafka producer")
	}
	// Send submission result
	err = SendSubmissionResult(producer, kafkaServer, kafkaTopic, "test", 0)
	if err != nil {
		t.Error("Failed to send submission result due to error - ", err.Error())
	}
	// Receive request from producer
	wg.Add(1)
	go func(request chan string, receiveRequestErr chan error, consumer *kafka.Consumer) {
		defer wg.Done()
		req, err := ReceiveRequest(consumer)
		request <- req
		receiveRequestErr <- err
	}(request, receiveRequestErr, consumer)
	// Check the received request outputs
	receivedRequest := <-request
	if receivedRequest != "test" {
		t.Error("Received request is not equal to sent request")
	}
	receivedRequestErr := <-receiveRequestErr
	if receivedRequestErr != nil {
		t.Error("Failed to receive request due to error - ", err.Error())
	}
	wg.Wait()
	producer.Close()
	consumer.Close()
}

func TestMultipleWorkerReceiveMultipleRequest(t *testing.T) {
	var wg sync.WaitGroup
	request := make(chan string)
	receiveRequestErr := make(chan error)
	// Get the username and password environment variables
	err := godotenv.Load("../.env")
	if err != nil {
		t.Error("Error loading .env file")
	}
	kafkaServer := os.Getenv("KAFKA_BROKER")
	kafkaTopic := "submission_requests_for_test_multiple_worker_receive_multiple_request"
	// Create new topic
	CreateTopic(kafkaServer, kafkaTopic, 2, 1)
	// Create new kafka consumers
	consumer1 := NewKafkaConsumer(kafkaServer, kafkaTopic, "worker")
	if consumer1 == nil {
		t.Error("Failed to create kafka consumer")
	}
	consumer2 := NewKafkaConsumer(kafkaServer, kafkaTopic, "worker")
	if consumer2 == nil {
		t.Error("Failed to create kafka consumer")
	}
	// Create new kafka producer
	producer := NewKafkaProducer(kafkaServer)
	if producer == nil {
		t.Error("Failed to create kafka producer")
	}
	// Send submission results
	for i := 1; i <= 2; i++ {
		wg.Add(1)
		go func(testNum int) {
			wg.Done()
			err = SendSubmissionResult(producer, kafkaServer, kafkaTopic, "test"+strconv.Itoa(testNum), testNum-1)
			if err != nil {
				t.Error("Failed to send submission result due to error - ", err.Error())
			}
		}(i)
	}
	// Simulate receive multiple requests behaviour of multiple consumers
	wg.Add(2)
	go func(request chan string, receiveRequestErr chan error, consumer *kafka.Consumer) {
		defer wg.Done()
		req, err := ReceiveRequest(consumer)
		request <- req
		receiveRequestErr <- err
		time.Sleep(3 * time.Second)
	}(request, receiveRequestErr, consumer1)
	go func(request chan string, receiveRequestErr chan error, consumer *kafka.Consumer) {
		defer wg.Done()
		req, err := ReceiveRequest(consumer)
		request <- req
		receiveRequestErr <- err
		time.Sleep(3 * time.Second)
	}(request, receiveRequestErr, consumer2)
	// Check the received request outputs
	var receivedRequest []string
	for i := 1; i <= 2; i++ {
		receivedRequest = append(receivedRequest, <-request)
		fmt.Println("Received request - ", receivedRequest)

		err := <-receiveRequestErr
		if err != nil {
			t.Error("Failed to receive request due to error - ", err.Error())
		}
	}
	if slices.Contains(receivedRequest, "test1") == false || slices.Contains(receivedRequest, "test2") == false {
		t.Error("Received request is not equal to sent request")
	}
	wg.Wait()
	producer.Close()
	consumer1.Close()
	consumer2.Close()
}
