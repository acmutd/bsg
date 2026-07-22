package queue

import (
	"testing"
	"time"

	"github.com/alicebob/miniredis/v2"
	"github.com/redis/go-redis/v9"
)

func newTestQueue(t *testing.T) (*RedisQueue, *miniredis.Miniredis) {
	t.Helper()
	mini, err := miniredis.Run()
	if err != nil {
		t.Fatalf("miniredis: %v", err)
	}
	t.Cleanup(mini.Close)

	client := redis.NewClient(&redis.Options{Addr: mini.Addr(), DB: 0})
	t.Cleanup(func() { client.Close() })

	return NewRedisQueue(client, "submission-ingress"), mini
}

func TestRedisQueuePublishConsumeAck(t *testing.T) {
	queue, mini := newTestQueue(t)
	payload := []byte(`{"submissionID":42}`)

	if err := queue.Publish(payload); err != nil {
		t.Fatalf("publish: %v", err)
	}

	message, err := queue.Consume(250 * time.Millisecond)
	if err != nil {
		t.Fatalf("consume: %v", err)
	}
	if string(message) != string(payload) {
		t.Fatalf("payload mismatch: got %s", string(message))
	}

	// consumed message must be parked in the processing list until acked
	if inFlight, _ := mini.List("submission-ingress:processing"); len(inFlight) != 1 {
		t.Fatalf("expected 1 in-flight message, got %d", len(inFlight))
	}

	if err := queue.Ack(message); err != nil {
		t.Fatalf("ack: %v", err)
	}
	if inFlight, _ := mini.List("submission-ingress:processing"); len(inFlight) != 0 {
		t.Fatalf("expected empty processing list after ack, got %d entries", len(inFlight))
	}
}

func TestRedisQueueConsumeEmpty(t *testing.T) {
	queue, _ := newTestQueue(t)

	message, err := queue.Consume(50 * time.Millisecond)
	if err != nil {
		t.Fatalf("consume: %v", err)
	}
	if message != nil {
		t.Fatalf("expected nil message from empty queue, got %s", string(message))
	}
}

func TestRedisQueueRequeue(t *testing.T) {
	queue, mini := newTestQueue(t)
	payload := []byte(`{"submissionID":42}`)

	if err := queue.Publish(payload); err != nil {
		t.Fatalf("publish: %v", err)
	}
	message, err := queue.Consume(250 * time.Millisecond)
	if err != nil {
		t.Fatalf("consume: %v", err)
	}

	if err := queue.Requeue(message); err != nil {
		t.Fatalf("requeue: %v", err)
	}
	if inFlight, _ := mini.List("submission-ingress:processing"); len(inFlight) != 0 {
		t.Fatalf("expected empty processing list after requeue, got %d entries", len(inFlight))
	}

	// message must be consumable again
	message, err = queue.Consume(250 * time.Millisecond)
	if err != nil {
		t.Fatalf("re-consume: %v", err)
	}
	if string(message) != string(payload) {
		t.Fatalf("payload mismatch after requeue: got %s", string(message))
	}
}

func TestRedisQueueRecover(t *testing.T) {
	queue, _ := newTestQueue(t)
	first := []byte(`{"submissionID":1}`)
	second := []byte(`{"submissionID":2}`)

	if err := queue.Publish(first); err != nil {
		t.Fatalf("publish: %v", err)
	}
	if err := queue.Publish(second); err != nil {
		t.Fatalf("publish: %v", err)
	}

	// consume both without acking, simulating a crash mid-processing
	for i := 0; i < 2; i++ {
		if _, err := queue.Consume(250 * time.Millisecond); err != nil {
			t.Fatalf("consume: %v", err)
		}
	}

	recovered, err := queue.Recover()
	if err != nil {
		t.Fatalf("recover: %v", err)
	}
	if recovered != 2 {
		t.Fatalf("expected 2 recovered messages, got %d", recovered)
	}

	// both messages must be consumable again
	for i := 0; i < 2; i++ {
		message, err := queue.Consume(250 * time.Millisecond)
		if err != nil {
			t.Fatalf("consume after recover: %v", err)
		}
		if message == nil {
			t.Fatalf("expected recovered message %d, got nil", i)
		}
	}
}
