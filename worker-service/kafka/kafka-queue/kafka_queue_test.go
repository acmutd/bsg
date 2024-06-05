package kafka_queue

import (
	"encoding/json"
	"fmt"
	"reflect"
	"sync"
	"testing"
	"time"

	kafka_dto "github.com/acmutd/bsg/worker-service/kafka/kafka-dto"
	"github.com/confluentinc/confluent-kafka-go/kafka"
)

// Generate submission result struct
func GenSubmissionResult(submissionID uint, StatusMessage string, CodeOutput string, StdOutput string, 
	ExpectedOutput string, LastTestcase string, ExecutionTime string) kafka_dto.KafkaEgressDTO {
	return kafka_dto.KafkaEgressDTO{
		SubmissionId: submissionID,
		Verdict: kafka_dto.SubmissionVerdict{
			StatusMessage:  StatusMessage,
			CodeOutput:     CodeOutput,
			StdOutput:      StdOutput,
			ExpectedOutput: ExpectedOutput,
			LastTestcase:   LastTestcase,
			ExecutionTime:  ExecutionTime,
		},
	}
}

// Test create new kafka consumer successfully
func TestNewKafkaConsumer(t *testing.T) {
	kafkaServer := "localhost:9092"
	kafkaTopic := "KAFKA_TOPIC"
	// Create new kafka consumer
	consumer := NewKafkaConsumer(kafkaServer, kafkaTopic, "worker1")
	if consumer == nil {
		t.Error("Failed to create kafka consumer")
	}
	consumer.Close()
}

// Test create new kafka producer successfully
func TestNewKafkaProducer(t *testing.T) {
	kafkaServer := "localhost:9092"
	// Create new kafka producer
	producer := NewKafkaProducer(kafkaServer)
	if producer == nil {
		t.Error("Failed to create kafka producer")
	}
	producer.Close()
}

// Test send a submission result to kafka topic successfully
func TestSendSubmissionResult(t *testing.T) {
	kafkaServer := "localhost:9092"
	kafkaTopic := "SUBMISSION_RESULT"
	// Create new kafka producer
	producer := NewKafkaProducer(kafkaServer)
	if producer == nil {
		t.Error("Failed to create kafka producer")
	}
	// Send submission result
	submissionResult := GenSubmissionResult(1, "Accepted", "", "", "", "", "1 ms")
	submissionResultBytes, err := json.Marshal(submissionResult)
	if err != nil {
		t.Error("Failed to marshal submission result: " + err.Error())
	}
	err = SendEvent(producer, kafkaServer, kafkaTopic, submissionResultBytes)
	if err != nil {
		t.Error("Failed to send submission result due to error - ", err.Error())
	}
}

// Test receive an event from kafka topic successfully
func TestReceiveEvent(t *testing.T) {
	kafkaServer := "localhost:9092"
	kafkaTopic := "KAFKA_TOPIC"
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
	submissionResult := GenSubmissionResult(1, "Accepted", "", "", "", "", "1 ms")
	submissionResultBytes, err := json.Marshal(submissionResult)
	if err != nil {
		t.Error("Failed to marshal submission result: " + err.Error())
	}
	err = SendEvent(producer, kafkaServer, kafkaTopic, submissionResultBytes)
	if err != nil {
		t.Error("Failed to send submission result due to error - ", err.Error())
	}
	// Receive request from producer
	var wg sync.WaitGroup
	request := make(chan []byte)
	receiveRequestErr := make(chan error)
	wg.Add(1)
	go func(request chan []byte, receiveRequestErr chan error, consumer *kafka.Consumer) {
		defer wg.Done()
		req, err := ReceiveEvent(consumer)
		request <- req
		receiveRequestErr <- err
	}(request, receiveRequestErr, consumer)
	receivedRequestBytes := <-request
	receivedRequestErr := <-receiveRequestErr
	wg.Wait()
	// Check the received request outputs
	var receivedRequest kafka_dto.KafkaEgressDTO
	unmarshalErr := json.Unmarshal(receivedRequestBytes, &receivedRequest)
	if receivedRequestErr != nil {
		t.Error("Failed to receive request due to error - ", err.Error())
	}
	if (unmarshalErr != nil) {
		t.Error("Failed to unmarshal received request due to error - ", unmarshalErr.Error())
	}
	if reflect.DeepEqual(receivedRequest, submissionResult) == false{
		t.Error("Received request is not equal to sent request")
	}
	producer.Close()
	consumer.Close()
}


// Test multiple workers receive multiple requests successfully
func TestMultipleWorkerReceiveMultipleRequest(t *testing.T) {
	kafkaServer := "localhost:9092"
	kafkaTopic := "SUBMISSION_REQUEST"
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
	// Send submission requests
	var wg sync.WaitGroup
	for i := 0; i < 2; i++ {
		wg.Add(1)
		go func(partition int) {
			wg.Done()
			submissionRequest := kafka_dto.KafkaIngressDTO{ProblemId: uint(partition)}
			submissionRequestBytes, err := json.Marshal(submissionRequest)
			if err != nil {
				t.Error("Failed to marshal submission result: " + err.Error())
			}
			err = SendEvent(producer, kafkaServer, kafkaTopic, submissionRequestBytes, partition)
			if err != nil {
				t.Error("Failed to send submission result due to error - ", err.Error())
			}
		}(i)
	}
	// Receive multiple requests using multiple consumers
	request := make(chan []byte)
	receiveRequestErr := make(chan error)
	consumers := []*kafka.Consumer{consumer1, consumer2}
	for _, consumer := range consumers {
		wg.Add(1)
		go func(request chan []byte, receiveRequestErr chan error, consumer *kafka.Consumer) {
			defer wg.Done()
			req, err := ReceiveEvent(consumer)
			request <- req
			receiveRequestErr <- err
			time.Sleep(3 * time.Second)
		}(request, receiveRequestErr, consumer)
	}
	// Process received requests
	var receivedRequests []kafka_dto.KafkaIngressDTO
	var receivedRequest kafka_dto.KafkaIngressDTO
	for i := 0; i < 2; i++ {
		unmarshalErr := json.Unmarshal(<-request, &receivedRequest)
		if (unmarshalErr != nil) {
			t.Error("Failed to unmarshal received request due to error - ", unmarshalErr.Error())
		}
		receivedRequests = append(receivedRequests, receivedRequest)
		fmt.Printf("Received request - %+v\n", receivedRequest)

		err := <-receiveRequestErr
		if err != nil {
			t.Error("Failed to receive request due to error - ", err.Error())
		}
	}
	wg.Wait()
	// Check the received request outputs
	for i := 0; i < 2; i++ {
		if reflect.DeepEqual(receivedRequests[0], kafka_dto.KafkaIngressDTO{ProblemId: uint(i)}) == false &&
			reflect.DeepEqual(receivedRequests[1], kafka_dto.KafkaIngressDTO{ProblemId: uint(i)}) == false {
			t.Error("Received request is not equal to sent request")
		}
	}
	producer.Close()
	consumer1.Close()
	consumer2.Close()
}
