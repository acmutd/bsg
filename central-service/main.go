package main

import (
	"fmt"
	"log"
	"os"
	"strconv"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
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

	rdb := redis.NewClient(&redis.Options{
		Addr:     "redis-cache:6379",
		Password: os.Getenv("REDIS_PASSWORD"),
		DB:       0,
	})

	if err := db.AutoMigrate(&models.User{}); err != nil {
		fmt.Printf("Error migrating User schema: %v\n", err)
	}
	if err := db.AutoMigrate(&models.Room{}); err != nil {
		fmt.Printf("Error migrating Room schema: %v\n", err)
	}
	e := echo.New()

	userService := services.InitializeUserService(db)
	userController := controllers.InitializeUserController(&userService)

	roomService := services.InitializeRoomService(db)
	roomController := controllers.InitializeRoomController(&roomService)

	roundService := services.InitializeRoundService(db, rdb, maxNumRoundsPerRoom)
	roundController := controllers.InitializeRoundController(&roundService)

	e.Use(middleware.CORS())
	e.Use(userController.ValidateUserRequest)

	userController.InitializeRoutes(e.Group("/api/users"))
	roomController.InitializeRoutes(e.Group("/api/rooms"))

	roundController.InitializeRoutes(e.Group("/api/rounds"))

	e.Logger.Fatal(e.Start(":5000"))
}
