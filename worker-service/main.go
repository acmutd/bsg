package main

import (
	"fmt"
	"os"
	"strings"

	kafka_queue "github.com/acmutd/bsg/kafka-queue"
	"github.com/acmutd/bsg/worker-service/leetcode-worker/lib"
	"github.com/confluentinc/confluent-kafka-go/kafka"
)

var leetcode_username string
var leetcode_password string

func main() {
	leetcode_username = os.Getenv("LEETCODE_USERNAME")
	leetcode_password = os.Getenv("LEETCODE_PASSWORD")

	LEETCODE_SESSION, CSRF_Token := lib.Login(leetcode_username, leetcode_password, "./leetcode-worker/drivers/chromedriver")

	kafkaServer := os.Getenv("KAFKA_BROKER")
	kafkaTopic := os.Getenv("KAFKA_TOPIC")
	// Create new kafka consumer
	consumer := kafka_queue.NewKafkaConsumer(kafkaServer, kafkaTopic, "worker")
	if consumer == nil {
		fmt.Println("Failed to create kafka consumer")
	}
	defer consumer.Close()
	request := make(chan string)
	receiveRequestErr := make(chan error)

	for {
		// Receive submission request
		go func(request chan string, receiveRequestErr chan error, consumer *kafka.Consumer) {
			req, err := kafka_queue.ReceiveRequest(consumer)
			request <- req
			receiveRequestErr <- err
		}(request, receiveRequestErr, consumer)
		// Check the received request outputs
		receivedRequest := <-request
		receivedRequestErr := <-receiveRequestErr
		if receivedRequestErr != nil {
			fmt.Println("Failed to receive request due to error - ", receivedRequestErr.Error())
			continue
		}
		
		problem_slug, problem_id, lang, code := parseSubmissionRequest(receivedRequest)
		processSubmissionRequest(LEETCODE_SESSION, CSRF_Token, problem_slug, problem_id, lang, code)
	}
}

// TODO(minhhuy24072002): Implement the parseSubmissionRequest function
func parseSubmissionRequest(request string) (string, int, string, string) {
	return "", -1, "", ""
}

func processSubmissionRequest(LEETCODE_SESSION string, CSRF_Token string, problem_slug string, problem_id int, lang string, code string) (string, error) {
	for try:=0; try<2; try++ {
		result, err := lib.Submit(LEETCODE_SESSION, CSRF_Token, problem_slug, problem_id, lang, code)
		if err == nil && strings.Contains(result, "status_code") {
			return result, nil
		}
		if (try == 0) {
			lib.Login(leetcode_username, leetcode_password, "./leetcode-worker/drivers/chromedriver")
		}
	}
	return "", fmt.Errorf("Failed to submit the solution")
}