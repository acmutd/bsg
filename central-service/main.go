package main

import (
	"fmt"
	"log"
	"os"
	"strconv"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/madflojo/tasks"
	"github.com/redis/go-redis/v9"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"github.com/acmutd/bsg/central-service/controllers"
	"github.com/acmutd/bsg/central-service/models"
	"github.com/acmutd/bsg/central-service/services"
)

func main() {
	dsn := fmt.Sprintf("host=db user=%s password=%s dbname=%s port=5432 sslmode=disable Timezone=America/Chicago", os.Getenv("DB_USER"), os.Getenv("DB_PASSWORD"), os.Getenv("DB_NAME"))
	maxNumRoundsPerRoom, err := strconv.Atoi(os.Getenv("MAX_NUM_ROUND_PER_ROOM"))
	if err != nil {
		log.Fatalf("Error parsing env var MAX_NUM_ROUND_PER_ROOM: %v\n", err)
	}
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		fmt.Printf("Error connecting to the database: %v\n", err)
	}

	if err := db.AutoMigrate(&models.User{}, &models.Problem{}, &models.Room{}); err != nil {
		fmt.Printf("Error migrating schema: %v\n", err)
	}

	rdb := redis.NewClient(&redis.Options{
		Addr:     "redis-cache:6379",
		Password: os.Getenv("REDIS_PASSWORD"),
		DB:       0,
	})

	if err := db.AutoMigrate(&models.Round{}); err != nil {
		fmt.Printf("Error migrating Round schema: %v\n", err)
	}
	if err := db.AutoMigrate(&models.RoundParticipant{}); err != nil {
		fmt.Printf("Error migrating RoundParticipant schema: %v\n", err)
	}
	if err := db.AutoMigrate(&models.Submission{}); err != nil {
		fmt.Printf("Error migrating Submission schema: %v\n", err)
	}
	if err := db.AutoMigrate(&models.RoundSubmission{}); err != nil {
		fmt.Printf("Error migrating RoundSubmission schema: %v\n", err)
	}

	if err := db.AutoMigrate(&models.Leaderboard{}); err != nil {
    	fmt.Printf("Error migrating Leaderboard schema: %v\n", err)
	}

	// Initialize Kafka-related components
	// kafkaManager := services.NewKafkaManagerService()
	// defer kafkaManager.Cleanup()
	// if err := kafkaManager.CreateKafkaTopicIfNotExists(os.Getenv("KAFKA_INGRESS_TOPIC")); err != nil {
	// 	log.Fatalf("Error creating Kafka Ingress topic: %v\n", err)
	// }
	// if err := kafkaManager.CreateKafkaTopicIfNotExists(os.Getenv("KAFKA_EGRESS_TOPIC")); err != nil {
	// 	log.Fatalf("Error creating Kafka Egress topic: %v\n", err)
	// }
	// ingressQueue := services.NewSubmissionIngressQueueService(&kafkaManager)

	rtcClient, err := services.InitializeRTCClient("central-service")
	if err != nil {
		log.Fatalf("Error creating RTC Client: %v\n", err)
	}
	defer rtcClient.Close()

	// needed for round service
	userService := services.InitializeUserService(db)
	problemService := services.InitializeProblemService(db)
	problemAccessor := services.NewProblemAccessor(&problemService)
	roundScheduler := tasks.New()
	defer roundScheduler.Stop()

	roundService := services.InitializeRoundService(db, rdb, roundScheduler, &problemAccessor, nil, rtcClient)
	// egressQueue := services.NewSubmissionEgressQueueService(db, &roundService)

	// co routine to listen for submission data
	// go egressQueue.ListenForSubmissionData()
	// go ingressQueue.MessageDeliveryHandler()

	e := echo.New()

	userController := controllers.InitializeUserController(&userService)
	problemController := controllers.InitializeProblemController(&problemService)
	roomService := services.InitializeRoomService(db, rdb, &roundService, rtcClient, maxNumRoundsPerRoom)
	roomController := controllers.InitializeRoomController(&roomService)
	lbService := services.InitializeLeaderboardService(db)
	lbController := controllers.InitializeLeaderboardController(&lbService)

	e.Use(middleware.CORS())
	e.Use(userController.ValidateUserRequest)

	userController.InitializeRoutes(e.Group("/api/users"))
	problemController.InitializeRoutes(e.Group("/api/problems"))
	roomController.InitializeRoutes(e.Group("/api/rooms"))
	lbController.InitializeRoutes(e.Group("/api/leaderboard"))

	e.Logger.Fatal(e.Start(":5000"))
}