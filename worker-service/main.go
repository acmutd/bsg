package main

import (
	"encoding/json"
	"fmt"
	"os"
	"strconv"
	"strings"

	kafka_dto "github.com/acmutd/bsg/worker-service/kafka/kafka-dto"
	kafka_queue "github.com/acmutd/bsg/worker-service/kafka/kafka-queue"
	"github.com/acmutd/bsg/worker-service/leetcode-worker/lib"
	"github.com/confluentinc/confluent-kafka-go/kafka"
)

var (
	leetcode_username        string = os.Getenv("LEETCODE_USERNAME")
	leetcode_password        string = os.Getenv("LEETCODE_PASSWORD")
	drivers_path             string = "./leetcode-worker/drivers/chromedriver"
	kafka_server             string = os.Getenv("KAFKA_BROKER")
	submission_request_topic string = os.Getenv("KAFKA_INGRESS_TOPIC")
	submission_verdict_topic string = os.Getenv("KAFKA_EGRESS_TOPIC")
)

func main() {
	// Login into LeetCode
	LEETCODE_SESSION, CSRF_Token := lib.Login(leetcode_username, leetcode_password, drivers_path)

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
			problem_slug, problem_id, lang, code := parseSubmissionRequest(request)
			submission_id, verdict, err := processSubmissionRequest(LEETCODE_SESSION, CSRF_Token, problem_slug, problem_id, lang, code)
			if err != nil {
				fmt.Println("Failed to process request due to error - ", err.Error())
				return
			}

			// Process submission id
			submissionID, err := strconv.ParseUint(submission_id, 10, 32)
			if err != nil {
				fmt.Println("Failed to parse submission id due to error - ", err.Error())
				return
			}

			// Serialize submission id and verdict into a KafkaEgressDTO struct
			egressDTO := kafka_dto.KafkaEgressDTO{
				SubmissionId: uint(submissionID),
				Verdict:      verdict,
			}

			// JSON Marshal the submission result
			marshalData, marshalErr := json.Marshal(egressDTO)
			if marshalErr != nil {
				fmt.Println("Unable to marshal submission result due to " + marshalErr.Error())
				return
			}

			// Send submission verdict
			partitionAny := int(kafka.PartitionAny)
			err = kafka_queue.SendSubmissionResult(producer, kafka_server, submission_verdict_topic, string(marshalData), partitionAny)
			if err != nil {
				fmt.Println("Failed to send submission verdict due to error - ", err.Error())
				return
			}
		}()
	}
}

// TODO(minhhuy24072002): Implement the parseSubmissionRequest function
func parseSubmissionRequest(request string) (string, int, string, string) {
	return "", -1, "", ""
}

func receiveSubmissionRequest(consumer *kafka.Consumer) (string, error) {
	// Create a channel for receiving submission request
	request := make(chan string)
	receiveRequestErr := make(chan error)
	go func(request chan string, receiveRequestErr chan error, consumer *kafka.Consumer) {
		req, err := kafka_queue.ReceiveRequest(consumer)
		request <- req
		receiveRequestErr <- err
	}(request, receiveRequestErr, consumer)
	// Check the received request outputs
	receivedRequest := <-request
	receivedRequestErr := <-receiveRequestErr
	if receivedRequestErr != nil {
		return "", receivedRequestErr
	}
	return receivedRequest, nil
}

func processSubmissionRequest(LEETCODE_SESSION string, CSRF_Token string, problem_slug string, problem_id int, lang string, code string) (string, string, error) {
	for try := 0; try < 2; try++ {
		submission_id, result, err := lib.Submit(LEETCODE_SESSION, CSRF_Token, problem_slug, problem_id, lang, code)
		if err == nil && strings.Contains(result, "status_code") {
			return submission_id, result, nil
		}
		if try == 0 {
			lib.Login(leetcode_username, leetcode_password, "./leetcode-worker/drivers/chromedriver")
		}
	}
	return "", "", fmt.Errorf("Failed to submit the solution")
}
