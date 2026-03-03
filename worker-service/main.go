package main

import (
	"encoding/json"
	"log"
	"os"
	"os/signal"
	"syscall"
    "time"

	"github.com/confluentinc/confluent-kafka-go/kafka"
)

type KafkaIngressDTO struct {
	ProblemSlug string `json:"problemSlug"`
	ProblemId uint `json:"problemID"`
	Lang string `json:"lang"`
	Code string `json:"code"`
	Verdict string `json:"verdict"`
	SubmissionId uint `json:"submissionID"`
}

type KafkaEgressDTO struct {
	SubmissionId uint `json:"submissionID"`
	Verdict string `json:"verdict"`
	Data []byte `json:"data"` 
}

func main() {
    log.Println("Starting Worker Service...")

    broker := os.Getenv("KAFKA_BROKER")
    ingressTopic := os.Getenv("KAFKA_INGRESS_TOPIC")
    egressTopic := os.Getenv("KAFKA_EGRESS_TOPIC")
    groupID := os.Getenv("KAFKA_WORKER_GROUP_ID")

    // retry connection logic
    for broker == "" {
         log.Println("Waiting for KAFKA_BROKER env var...")
         time.Sleep(2 * time.Second)
         broker = os.Getenv("KAFKA_BROKER")
    }

    if ingressTopic == "" || egressTopic == "" || groupID == "" {
        log.Fatal("Kafka environment variables (TOPICS/GROUP_ID) not set")
    }

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
        log.Printf("Failed to create consumer (attempt %d): %s", i, err)
        time.Sleep(5 * time.Second)
    }
    if err != nil {
         log.Fatalf("Failed to create consumer after retries: %s", err)
    }

    err = c.SubscribeTopics([]string{ingressTopic}, nil)
    if err != nil {
        log.Fatalf("Failed to subscribe to topic: %s", err)
    }

    var p *kafka.Producer
    for i := 0; i < 10; i++ {
        p, err = kafka.NewProducer(&kafka.ConfigMap{"bootstrap.servers": broker})
        if err == nil {
             break
        }
        log.Printf("Failed to create producer (attempt %d): %s", i, err)
        time.Sleep(5 * time.Second)
    }
    if err != nil {
        log.Fatalf("Failed to create producer after retries: %s", err)
    }

    log.Printf("Listening on topic %s, producing to %s", ingressTopic, egressTopic)

    sigchan := make(chan os.Signal, 1)
    signal.Notify(sigchan, syscall.SIGINT, syscall.SIGTERM)

    run := true
    for run {
        select {
        case sig := <-sigchan:
            log.Printf("Caught signal %v: terminating", sig)
            run = false
        default:
            ev := c.Poll(100)
            if ev == nil {
                continue
            }

            switch e := ev.(type) {
            case *kafka.Message:
                // process message
                var ingressMsg KafkaIngressDTO
                if err := json.Unmarshal(e.Value, &ingressMsg); err != nil {
                    log.Printf("Error unmarshalling message: %v. Value: %s", err, string(e.Value))
                    continue
                }

                log.Printf("Processing submission %d for problem %s with verdict %s", ingressMsg.SubmissionId, ingressMsg.ProblemSlug, ingressMsg.Verdict)

                egressMsg := KafkaEgressDTO{
                    SubmissionId: ingressMsg.SubmissionId,
                    Verdict:      ingressMsg.Verdict,
                    Data:         []byte{},
                }

                payload, err := json.Marshal(egressMsg)
                if err != nil {
                    log.Printf("Error marshalling egress message: %v", err)
                    continue
                }

                err = p.Produce(&kafka.Message{
                    TopicPartition: kafka.TopicPartition{Topic: &egressTopic, Partition: kafka.PartitionAny},
                    Value:          payload,
                }, nil)

                if err != nil {
                    log.Printf("Failed to produce message: %v", err)
                } else {
                    log.Printf("Forwarded submission %d to egress", ingressMsg.SubmissionId)
                }

            case kafka.Error:
                if e.Code() == kafka.ErrAllBrokersDown {
                     log.Printf("Kafka error: %v", e)
                }
            }
        }
    }

    c.Close()
    p.Close()
}
