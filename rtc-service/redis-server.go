package main

import (
	"context"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

var (

	// Context for Redis operations
	ctx = context.Background()

	// Redis Host
	redisHost = "localhost"

	// Redis Port
	redisPort = 6379

	// Redis Database to connect to (0-15)
	redisDB = 0

	// Redis Password, would be pulled from a secret store in production
	redisPassword = ""

	// Set a maximum number of tries for the connection to the Redis server to complete.
	redisMaxRetries = 3

	// Maxiumum time to read a single Redis operation (e.g. READ) before timing out.
	//
	// This ensures that if there is an issue with the Redis server, the connection will be closed,
	// instead of waiting indefinitely for a response.
	redisReadTimeout = time.Duration(5 * time.Second)

	// Maximum amount of time to write a single Redis operation (e.g. WRITE) before timing out.
	//
	// This ensures that if there is an issue with the Redis server, the connection will be closed,
	// instead of waiting indefinitely for a response.
	redisWriteTimeout = time.Duration(5 * time.Second)
)

// This function will create a new Redis client and return it.
// This function should not be exported since there shoudln't
// be other packages that need to create a new Redis client.
//
// The client is only called when a specific action is required,
// such as when a new channel is created, or when a message is
// published to a channel.
func newRedisClient() *redis.Client {
	redisClient := redis.NewClient(&redis.Options{
		Addr:         fmt.Sprintf("%s:%d", redisHost, redisPort),
		Password:     redisPassword,
		DB:           redisDB,
		MaxRetries:   redisMaxRetries,
		ReadTimeout:  redisReadTimeout,
		WriteTimeout: redisWriteTimeout,
	})

	// Ping the Redis server and check if any errors occured
	err := redisClient.Ping(context.Background()).Err()
	if err != nil {
		// Sleep for 3 seconds and wait for Redis to initialize
		time.Sleep(3 * time.Second)
		err := redisClient.Ping(context.Background()).Err()
		if err != nil {
			ErrorLogger.Println("Error connecting to Redis server", err)
			return nil
		}
	}

	return redisClient
}

// Send a message to a Redis Channel
func SendMessage(channelId string, message interface{}) {
	redisClient := newRedisClient()

	redisClient.Publish(ctx, channelId, message)

	redisClient.Close()
}

// Subscribe to Redis Channel
func Subscribe(channelId string) {
	redisClient := newRedisClient()

	redisClient.Subscribe(ctx, channelId)

	redisClient.Close()
}

// Delete Redis Channel
//
// In order to delete a Redis channel, we need to do the following:
// 1. Get list of users in channel
// 2. Delete all the users in the channel
func DeleteChannel(channelId string) {
	redisClient := newRedisClient()

	// Get list of users in channel
	connections := getUserList(redisClient, channelId)

	// Delete all the users in the channel
	deleteUsers(redisClient, connections)

	redisClient.Close()
	InfoLogger.Println("Deleted channel", channelId)
}

// Delete all users in a channel
func deleteUsers(redisClient *redis.Client, connections []string) {
	for _, connection := range connections {
		redisClient.Del(ctx, connection)
	}
}

// Listen for Redis Messages
func Listen(channelId string) {
	redisClient := newRedisClient()

	// TODO: Complete the code to listen for Redis messages

	redisClient.Close()
}

// Get list of users in a channel
func getUserList(redisClient *redis.Client, channelId string) []string {
	connection := []string{}

	// TODO: Complete the code to get a list of users in a channel

	return connection
}
