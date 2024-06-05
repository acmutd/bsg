package main

import (
	"encoding/json"
	"fmt"
	"os"

	kafka_dto "github.com/acmutd/bsg/worker-service/kafka/kafka-dto"
	kafka_queue "github.com/acmutd/bsg/worker-service/kafka/kafka-queue"
	"github.com/confluentinc/confluent-kafka-go/kafka"
)

var (
	kafka_server             string = os.Getenv("KAFKA_BROKER")
	submission_request_topic string = os.Getenv("KAFKA_INGRESS_TOPIC")
	submission_verdict_topic string = os.Getenv("KAFKA_EGRESS_TOPIC")
)

func main() {
	// Create new kafka consumer
	consumer := kafka_queue.NewKafkaConsumer(kafka_server, submission_request_topic, "worker")
	if consumer == nil {
		fmt.Println("Failed to create kafka consumer")
	}
	defer consumer.Close()
	// Create new kafka producer
	producer := kafka_queue.NewKafkaProducer(kafka_server)
	if producer == nil {
		fmt.Println("Failed to create kafka producer")
	}
	defer producer.Close()
	// Listen for submission request
	for {
		// Receive submission request
		request, err := receiveSubmissionRequest(consumer)
		if err != nil {
			fmt.Println("Failed to receive request due to error - ", err.Error())
			continue
		}
		go func() {
			// Process submission request
			submissionResult, err := processSubmissionRequest(request)
			if err != nil {
				fmt.Println("Failed to process request due to error - ", err.Error())
				return
			}
			// JSON Marshal the submission result
			submissionResultBytes, marshalErr := json.Marshal(submissionResult)
			if marshalErr != nil {
				fmt.Println("Unable to marshal submission result due to " + marshalErr.Error())
				return
			}
			// Send submission verdict
			err = kafka_queue.SendEvent(producer, kafka_server, submission_verdict_topic, submissionResultBytes)
			if err != nil {
				fmt.Println("Failed to send submission verdict due to error - ", err.Error())
				return
			}
		}()
	}
}

func receiveSubmissionRequest(consumer *kafka.Consumer) (kafka_dto.KafkaIngressDTO, error) {
	// Create a channel for receiving submission request
	request := make(chan []byte)
	receiveRequestErr := make(chan error)
	go func(request chan []byte, receiveRequestErr chan error, consumer *kafka.Consumer) {
		req, err := kafka_queue.ReceiveEvent(consumer)
		request <- req
		receiveRequestErr <- err
	}(request, receiveRequestErr, consumer)
	// Check the received request outputs
	receivedRequestBytes := <-request
	receivedRequestErr := <-receiveRequestErr
	if receivedRequestErr != nil {
		return kafka_dto.KafkaIngressDTO{}, receivedRequestErr
	}
	var receivedRequest kafka_dto.KafkaIngressDTO
	unmarshalErr := json.Unmarshal(receivedRequestBytes, &receivedRequest)
	if unmarshalErr != nil {
		return kafka_dto.KafkaIngressDTO{}, unmarshalErr

	}
	return receivedRequest, nil
}

// TODO(minhhuy24072002): Integrate with raspbarry-pi workers
func processSubmissionRequest(kafka_dto.KafkaIngressDTO) (kafka_dto.KafkaEgressDTO, error) {
	return kafka_dto.KafkaEgressDTO{}, nil
}
