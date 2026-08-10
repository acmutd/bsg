package main

import (
	"encoding/json"
	"fmt"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/redis/go-redis/v9"
)

type SubmissionIngressDTO struct {
	ProblemSlug  string `json:"problemSlug"`
	ProblemId    uint   `json:"problemID"`
	Lang         string `json:"lang"`
	Code         string `json:"code"`
	Verdict      string `json:"verdict"`
	SubmissionId uint   `json:"submissionID"`
}

type SubmissionEgressDTO struct {
	SubmissionId uint   `json:"submissionID"`
	Verdict      string `json:"verdict"`
	Data         []byte `json:"data"`
}

func main() {
	logger := NewWorkerLogger("worker-service")
	validator := NewInputValidator(logger)

	logger.Info("Starting Worker Service", nil)

	redisAddr := os.Getenv("REDIS_ADDR")
	if redisAddr == "" {
		redisAddr = "redis-cache:6379"
	}
	ingressQueueName := os.Getenv("REDIS_SUBMISSION_QUEUE")
	if ingressQueueName == "" {
		ingressQueueName = "submission-ingress"
	}
	egressQueueName := os.Getenv("REDIS_EGRESS_QUEUE")
	if egressQueueName == "" {
		egressQueueName = "submission-egress"
	}

	client := redis.NewClient(&redis.Options{
		Addr:     redisAddr,
		Password: os.Getenv("REDIS_PASSWORD"),
		DB:       0,
	})
	defer client.Close()

	ingressQueue := newRedisQueue(client, ingressQueueName)
	egressQueue := newRedisQueue(client, egressQueueName)

	if recovered, err := ingressQueue.recover(); err != nil {
		logger.LogQueueError("recover_failed", ingressQueueName, err, nil)
	} else if recovered > 0 {
		logger.LogQueueEvent("recovered", ingressQueueName, map[string]interface{}{
			"count": recovered,
		})
	}

	logger.LogQueueEvent("startup", ingressQueueName, map[string]interface{}{
		"ingress_queue": ingressQueueName,
		"egress_queue":  egressQueueName,
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
			rawMsg, err := ingressQueue.consume(time.Second)
			if err != nil {
				logger.LogQueueError("consume_failed", ingressQueueName, err, nil)
				time.Sleep(time.Second)
				continue
			}
			if len(rawMsg) == 0 {
				continue
			}

			// Process incoming submission message; drop (ack) poison messages
			// that can never succeed
			var ingressMsg SubmissionIngressDTO
			if err := json.Unmarshal(rawMsg, &ingressMsg); err != nil {
				logger.Error("Error unmarshalling message", err, map[string]interface{}{
					"value": string(rawMsg),
				})
				ackOrLog(logger, ingressQueue, ingressQueueName, rawMsg)
				continue
			}

			// Validate message
			if err := validator.ValidateIngressMessage(&ingressMsg); err != nil {
				logger.Error("Message validation failed", err, map[string]interface{}{
					"submission_id": ingressMsg.SubmissionId,
					"problem_id":    ingressMsg.ProblemId,
					"problem_slug":  ingressMsg.ProblemSlug,
				})
				ackOrLog(logger, ingressQueue, ingressQueueName, rawMsg)
				continue
			}

			logger.LogSubmission(fmt.Sprint(ingressMsg.SubmissionId), ingressMsg.ProblemSlug, ingressMsg.Verdict, 0, map[string]interface{}{
				"event":       "processing",
				"language":    ingressMsg.Lang,
				"code_length": len(ingressMsg.Code),
			})

			// Create egress message
			egressMsg := SubmissionEgressDTO{
				SubmissionId: ingressMsg.SubmissionId,
				Verdict:      ingressMsg.Verdict,
				Data:         []byte{},
			}

			payload, err := json.Marshal(egressMsg)
			if err != nil {
				logger.Error("Error marshalling egress message", err, map[string]interface{}{
					"submission_id": ingressMsg.SubmissionId,
				})
				ackOrLog(logger, ingressQueue, ingressQueueName, rawMsg)
				continue
			}

			// Publish to egress queue; on failure requeue the ingress message
			// so the submission is retried instead of lost
			if err := egressQueue.publish(payload); err != nil {
				logger.LogSubmissionError(fmt.Sprint(ingressMsg.SubmissionId), ingressMsg.ProblemSlug, err, map[string]interface{}{
					"verdict": ingressMsg.Verdict,
				})
				if err := ingressQueue.requeue(rawMsg); err != nil {
					// message stays in the processing list and is recovered on restart
					logger.LogQueueError("requeue_failed", ingressQueueName, err, nil)
				}
				time.Sleep(time.Second)
				continue
			}

			logger.LogSubmission(fmt.Sprint(ingressMsg.SubmissionId), ingressMsg.ProblemSlug, ingressMsg.Verdict, 0, map[string]interface{}{
				"event": "submitted_to_egress",
			})
			ackOrLog(logger, ingressQueue, ingressQueueName, rawMsg)
		}
	}

	logger.Info("Worker service shutdown complete", nil)
}

func ackOrLog(logger *WorkerLogger, queue *redisQueue, queueName string, payload []byte) {
	if err := queue.ack(payload); err != nil {
		logger.LogQueueError("ack_failed", queueName, err, nil)
	}
}
