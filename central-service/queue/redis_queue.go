package queue

import (
	"context"
	"errors"
	"time"

	"github.com/redis/go-redis/v9"
)

// RedisQueue is a FIFO queue backed by a Redis list, using the reliable-queue
// pattern: Consume atomically moves each message to a processing list so it
// survives a consumer crash. Callers must Ack after handling a message (or
// Requeue it on transient failure), and should call Recover at startup to
// return messages orphaned by a previous crash.
//
// The processing list is shared per queue, so Recover assumes a single
// consumer instance per queue.
type RedisQueue struct {
	client     *redis.Client
	queueName  string
	processing string
	ctx        context.Context
}

func NewRedisQueue(client *redis.Client, queueName string) *RedisQueue {
	return &RedisQueue{
		client:     client,
		queueName:  queueName,
		processing: queueName + ":processing",
		ctx:        context.Background(),
	}
}

func (q *RedisQueue) Publish(payload []byte) error {
	_, err := q.client.RPush(q.ctx, q.queueName, payload).Result()
	return err
}

// Consume blocks up to timeout for the next message, moving it to the
// processing list. Returns (nil, nil) when the queue is empty. Timeouts below
// one second are raised to one second, the minimum BLMOVE supports.
func (q *RedisQueue) Consume(timeout time.Duration) ([]byte, error) {
	if timeout < time.Second {
		timeout = time.Second
	}
	res, err := q.client.BLMove(q.ctx, q.queueName, q.processing, "LEFT", "RIGHT", timeout).Result()
	if err != nil {
		if errors.Is(err, redis.Nil) {
			return nil, nil
		}
		return nil, err
	}
	return []byte(res), nil
}

// Ack removes a consumed message from the processing list once it has been
// handled (successfully or as a poison message being dropped).
func (q *RedisQueue) Ack(payload []byte) error {
	return q.client.LRem(q.ctx, q.processing, 1, payload).Err()
}

// Requeue moves a consumed message from the processing list back onto the
// main queue so it is retried, e.g. after a transient downstream failure.
func (q *RedisQueue) Requeue(payload []byte) error {
	pipe := q.client.TxPipeline()
	pipe.LRem(q.ctx, q.processing, 1, payload)
	pipe.RPush(q.ctx, q.queueName, payload)
	_, err := pipe.Exec(q.ctx)
	return err
}

// Recover moves messages left in the processing list by a previous run back
// onto the main queue, returning how many were recovered.
func (q *RedisQueue) Recover() (int, error) {
	recovered := 0
	for {
		_, err := q.client.LMove(q.ctx, q.processing, q.queueName, "LEFT", "RIGHT").Result()
		if err != nil {
			if errors.Is(err, redis.Nil) {
				return recovered, nil
			}
			return recovered, err
		}
		recovered++
	}
}
