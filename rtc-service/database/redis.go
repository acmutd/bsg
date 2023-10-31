package database

import (
	"fmt"

	redis "github.com/go-redis/redis/v8"
)

var (
	// RedisHost is the host of the redis server.
	port = 6364

	// Redis is the redis client.
	Redis *redis.Client

	redisHost = "localhost"
)

func CreateRedisClient() {
	redisUrl := fmt.Sprintf("redis://%s:%d/0", redisHost, port)
	opt, err := redis.ParseURL(redisUrl)
	if err != nil {
		panic(err)
	}

	redis := redis.NewClient(opt)
	Redis = redis
}
