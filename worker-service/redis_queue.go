package main

import (
	"context"
	"errors"
	"time"

	"github.com/redis/go-redis/v9"
)

// redisQueue is a FIFO queue backed by a Redis list, using the reliable-queue
// pattern: consume atomically moves each message to a processing list so it
// survives a consumer crash. Callers must ack after handling a message (or
// requeue it on transient failure), and should call recover at startup to
// return messages orphaned by a previous crash. Mirrors
// central-service/queue.RedisQueue; keep the two in sync.
type redisQueue struct {
	client     *redis.Client
	queueName  string
	processing string
	ctx        context.Context
}

func newRedisQueue(client *redis.Client, queueName string) *redisQueue {
	return &redisQueue{
		client:     client,
		queueName:  queueName,
		processing: queueName + ":processing",
		ctx:        context.Background(),
	}
}

func (q *redisQueue) publish(payload []byte) error {
	_, err := q.client.RPush(q.ctx, q.queueName, payload).Result()
	return err
}

// consume blocks up to timeout for the next message, moving it to the
// processing list. Returns (nil, nil) when the queue is empty. Timeouts below
// one second are raised to one second, the minimum BLMOVE supports.
func (q *redisQueue) consume(timeout time.Duration) ([]byte, error) {
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

// ack removes a consumed message from the processing list once it has been
// handled (successfully or as a poison message being dropped).
func (q *redisQueue) ack(payload []byte) error {
	return q.client.LRem(q.ctx, q.processing, 1, payload).Err()
}

// requeue moves a consumed message from the processing list back onto the
// main queue so it is retried, e.g. after a transient downstream failure.
func (q *redisQueue) requeue(payload []byte) error {
	pipe := q.client.TxPipeline()
	pipe.LRem(q.ctx, q.processing, 1, payload)
	pipe.RPush(q.ctx, q.queueName, payload)
	_, err := pipe.Exec(q.ctx)
	return err
}

// recover moves messages left in the processing list by a previous run back
// onto the main queue, returning how many were recovered.
func (q *redisQueue) recover() (int, error) {
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
