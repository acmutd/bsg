package main

import (
	"encoding/json"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/confluentinc/confluent-kafka-go/kafka"
)

type KafkaIngressDTO struct {
	ProblemSlug  string `json:"problemSlug"`
	ProblemId    uint   `json:"problemID"`
	Lang         string `json:"lang"`
	Code         string `json:"code"`
	Verdict      string `json:"verdict"`
	SubmissionId uint   `json:"submissionID"`
}

type KafkaEgressDTO struct {
	SubmissionId uint   `json:"submissionID"`
	Verdict      string `json:"verdict"`
	Data         []byte `json:"data"`
}

func main() {
	logger := NewWorkerLogger("worker-service")
	validator := NewInputValidator(logger)

	logger.Info("Starting Worker Service", nil)

	broker := os.Getenv("KAFKA_BROKER")
	ingressTopic := os.Getenv("KAFKA_INGRESS_TOPIC")
	egressTopic := os.Getenv("KAFKA_EGRESS_TOPIC")
	groupID := os.Getenv("KAFKA_WORKER_GROUP_ID")

	// retry connection logic for broker connection
	for broker == "" {
		logger.Warn("Waiting for KAFKA_BROKER env var", nil)
		time.Sleep(2 * time.Second)
		broker = os.Getenv("KAFKA_BROKER")
	}

	if ingressTopic == "" || egressTopic == "" || groupID == "" {
		logger.Fatal("Kafka environment variables (TOPICS/GROUP_ID) not set", nil, nil)
	}

	// Create consumer with retries
	var c *kafka.Consumer
	var err error
	for i := 0; i < 10; i++ {
		c, err = kafka.NewConsumer(&kafka.ConfigMap{
			"bootstrap.servers": broker,
			"group.id":          groupID,
			"auto.offset.reset": "earliest",
		})
		if err == nil {
			break
		}
		logger.Warn("Failed to create consumer", map[string]interface{}{
			"attempt": i + 1,
			"error":   err.Error(),
		})
		time.Sleep(5 * time.Second)
	}
	if err != nil {
		logger.Fatal("Failed to create consumer after retries", err, nil)
	}

	err = c.SubscribeTopics([]string{ingressTopic}, nil)
	if err != nil {
		logger.Fatal("Failed to subscribe to topic", err, map[string]interface{}{
			"topic": ingressTopic,
		})
	}

	// Create producer with retries
	var p *kafka.Producer
	for i := 0; i < 10; i++ {
		p, err = kafka.NewProducer(&kafka.ConfigMap{"bootstrap.servers": broker})
		if err == nil {
			break
		}
		logger.Warn("Failed to create producer", map[string]interface{}{
			"attempt": i + 1,
			"error":   err.Error(),
		})
		time.Sleep(5 * time.Second)
	}
	if err != nil {
		logger.Fatal("Failed to create producer after retries", err, nil)
	}

	logger.LogKafkaEvent("startup", ingressTopic, map[string]interface{}{
		"ingress_topic": ingressTopic,
		"egress_topic":  egressTopic,
		"group_id":      groupID,
	})

	sigchan := make(chan os.Signal, 1)
	signal.Notify(sigchan, syscall.SIGINT, syscall.SIGTERM)

	run := true
	for run {
		select {
		case sig := <-sigchan:
			logger.Info("Caught signal", map[string]interface{}{
				"signal": sig.String(),
			})
			run = false
		default:
			ev := c.Poll(100)
			if ev == nil {
				continue
			}

			switch e := ev.(type) {
			case *kafka.Message:
				// Process incoming submission message
				var ingressMsg KafkaIngressDTO
				if err := json.Unmarshal(e.Value, &ingressMsg); err != nil {
					logger.Error("Error unmarshalling message", err, map[string]interface{}{
						"value": string(e.Value),
					})
					continue
				}

				// Validate message
				err := validator.ValidateIngressMessage(&ingressMsg)
				if err != nil {
					logger.Error("Message validation failed", err, map[string]interface{}{
						"submission_id": ingressMsg.SubmissionId,
						"problem_id":    ingressMsg.ProblemId,
						"problem_slug":  ingressMsg.ProblemSlug,
					})
					continue
				}

				logger.LogSubmission("processing", ingressMsg.ProblemSlug, ingressMsg.Verdict, 0, map[string]interface{}{
					"submission_id": ingressMsg.SubmissionId,
					"language":      ingressMsg.Lang,
					"code_length":   len(ingressMsg.Code),
				})

				// Create egress message
				egressMsg := KafkaEgressDTO{
					SubmissionId: ingressMsg.SubmissionId,
					Verdict:      ingressMsg.Verdict,
					Data:         []byte{},
				}

				payload, err := json.Marshal(egressMsg)
				if err != nil {
					logger.Error("Error marshalling egress message", err, map[string]interface{}{
						"submission_id": ingressMsg.SubmissionId,
					})
					continue
				}

				// Produce to egress topic
				err = p.Produce(&kafka.Message{
					TopicPartition: kafka.TopicPartition{Topic: &egressTopic, Partition: kafka.PartitionAny},
					Value:          payload,
				}, nil)

				if err != nil {
					logger.LogSubmissionError(string(rune(ingressMsg.SubmissionId)), ingressMsg.ProblemSlug, err, map[string]interface{}{
						"verdict": ingressMsg.Verdict,
					})
				} else {
					logger.LogSubmission("submitted_to_egress", ingressMsg.ProblemSlug, ingressMsg.Verdict, 0, map[string]interface{}{
						"submission_id": ingressMsg.SubmissionId,
					})
				}

			case kafka.Error:
				logger.LogKafkaError("error", ingressTopic, e, map[string]interface{}{
					"code":     e.Code().String(),
					"is_fatal": e.IsFatal(),
				})
			}
		}
	}

	c.Close()
	p.Close()
	logger.Info("Worker service shutdown complete", nil)
}
