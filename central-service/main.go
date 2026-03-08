package main

import (
	"context"
	"fmt"
	"os"
	"strconv"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/madflojo/tasks"
	"github.com/redis/go-redis/v9"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"github.com/acmutd/bsg/central-service/controllers"
	"github.com/acmutd/bsg/central-service/models"
	"github.com/acmutd/bsg/central-service/services"
	"github.com/acmutd/bsg/central-service/utils"
)

func main() {
	// Initialize structured logger
	logger := utils.NewStructuredLogger("central-service")

	dsn := fmt.Sprintf("host=db user=%s password=%s dbname=%s port=5432 sslmode=disable Timezone=America/Chicago", os.Getenv("DB_USER"), os.Getenv("DB_PASSWORD"), os.Getenv("DB_NAME"))
	maxNumRoundsPerRoom, err := strconv.Atoi(os.Getenv("MAX_NUM_ROUND_PER_ROOM"))
	if err != nil {
		logger.Fatal("Error parsing env var", err, map[string]interface{}{
			"var": "MAX_NUM_ROUND_PER_ROOM",
		})
	}
	// connecting to database was occasionally failing so added retry logic
	var db *gorm.DB
	for i := 0; i < 10; i++ {
		db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
		if err == nil {
			break
		}
		logger.Warn("Database connection failed, retrying", map[string]interface{}{
			"attempt": i + 1,
			"error":   err.Error(),
		})
		time.Sleep(5 * time.Second)
	}
	if err != nil {
		logger.Fatal("Could not connect to database after retries", err, nil)
	}

	logger.Info("Database connection established", nil)

	if err := db.AutoMigrate(&models.User{}, &models.Problem{}, &models.Room{}); err != nil {
		logger.Fatal("Error migrating schema", err, nil)
	}

	rdb := redis.NewClient(&redis.Options{
		Addr:     "redis-cache:6379",
		Password: os.Getenv("REDIS_PASSWORD"),
		DB:       0,
	})

	if err := db.AutoMigrate(&models.Round{}); err != nil {
		logger.Fatal("Error migrating Round schema", err, nil)
	}
	if err := db.AutoMigrate(&models.RoundParticipant{}); err != nil {
		logger.Fatal("Error migrating RoundParticipant schema", err, nil)
	}
	if err := db.AutoMigrate(&models.Submission{}); err != nil {
		logger.Fatal("Error migrating Submission schema", err, nil)
	}
	if err := db.AutoMigrate(&models.RoundSubmission{}); err != nil {
		logger.Fatal("Error migrating RoundSubmission schema", err, nil)
	}

	if err := db.AutoMigrate(&models.Leaderboard{}); err != nil {
		logger.Fatal("Error migrating Leaderboard schema", err, nil)
	}

	// Initialize Kafka-related components
	kafkaManager := services.NewKafkaManagerService()
	defer kafkaManager.Cleanup()
	// connecting to kafka was occasionally failing so added retry logic
	var kafkaErr error
	for i := 0; i < 15; i++ {
		kafkaErr = kafkaManager.CreateKafkaTopicIfNotExists(os.Getenv("KAFKA_INGRESS_TOPIC"))
		if kafkaErr == nil {
			kafkaErr = kafkaManager.CreateKafkaTopicIfNotExists(os.Getenv("KAFKA_EGRESS_TOPIC"))
			if kafkaErr == nil {
				break
			}
		}
		logger.Warn("Kafka connection failed, retrying", map[string]interface{}{
			"attempt": i + 1,
			"error":   kafkaErr.Error(),
		})
		time.Sleep(5 * time.Second)
	}
	if kafkaErr != nil {
		logger.Fatal("Error creating Kafka topics after retries", kafkaErr, nil)
	}
	ingressQueue := services.NewSubmissionIngressQueueService(&kafkaManager)

	logger.Info("Kafka connection established", nil)

	// seeding Service
	seedingService := services.InitializeSeedingService(db)
	if err := seedingService.SeedProblems("../seed-service/problems_data.csv"); err != nil {
		if err := seedingService.SeedProblems("seed-service/problems_data.csv"); err != nil {
			logger.Warn("Failed to seed problems", map[string]interface{}{
				"error": err.Error(),
			})
		}
	}

	rtcClient, err := services.InitializeRTCClient("central-service")
	if err != nil {
		logger.Fatal("Error creating RTC Client", err, nil)
	}
	defer rtcClient.Close()

	// needed for round service
	userService := services.InitializeUserService(db)
	problemService := services.InitializeProblemService(db)
	problemAccessor := services.NewProblemAccessor(&problemService)
	roundScheduler := tasks.New()
	defer roundScheduler.Stop()

	roundService := services.InitializeRoundService(db, rdb, roundScheduler, &problemAccessor, &ingressQueue, rtcClient)
	egressQueue := services.NewSubmissionEgressQueueService(db, &roundService)

	// co routine to listen for submission data
	go egressQueue.ListenForSubmissionData()
	go ingressQueue.MessageDeliveryHandler()

	e := echo.New()

	// Initialize rate limiter
	rateLimitConfig := utils.DefaultRateLimitConfig()
	rateLimiter := utils.NewDistributedRateLimiter(rdb, rateLimitConfig)

	// Add middleware for structured logging and rate limiting
	loggingMiddleware := utils.NewEchoLoggingMiddleware(logger)
	rateLimitMiddleware := utils.NewEchoRateLimitMiddleware(utils.NewRateLimiter(rdb, 100, 150))

	e.Use(loggingMiddleware.Handler())
	e.Use(rateLimitMiddleware.Handler())
	e.Use(middleware.CORS())

	userController := controllers.InitializeUserController(&userService, logger)
	problemController := controllers.InitializeProblemController(&problemService, logger)
	roomService := services.InitializeRoomService(db, rdb, &roundService, rtcClient, maxNumRoundsPerRoom)
	roomController := controllers.InitializeRoomController(&roomService, logger)
	lbService := services.InitializeLeaderboardService(db)
	lbController := controllers.InitializeLeaderboardController(&lbService)

	e.Use(userController.ValidateUserRequest)

	// Apply per-endpoint rate limiting
	apiUsers := e.Group("/api/users")
	apiUsers.Use(func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
			defer cancel()
			allowed, err := rateLimiter.AllowRequest(ctx, c.Request().URL.Path, c.RealIP())
			if err != nil {
				logger.Error("Rate limit check failed", err, map[string]interface{}{
					"ip": c.RealIP(),
				})
				return echo.NewHTTPError(500, "Rate limit check failed")
			}
			if !allowed {
				return echo.NewHTTPError(429, "Rate limit exceeded")
			}
			return next(c)
		}
	})

	userController.InitializeRoutes(apiUsers)
	problemController.InitializeRoutes(e.Group("/api/problems"))
	roomController.InitializeRoutes(e.Group("/api/rooms"))
	lbController.InitializeRoutes(e.Group("/api/leaderboard"))

	logger.Info("Central service started", map[string]interface{}{
		"port": 5000,
	})

	e.Logger.Fatal(e.Start(":5000"))
}
