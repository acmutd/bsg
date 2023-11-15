package main

import (
	"fmt"
	"os"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"github.com/acmutd/bsg/central-service/controllers"
	"github.com/acmutd/bsg/central-service/models"
	"github.com/acmutd/bsg/central-service/services"
)

func main() {
	dsn := fmt.Sprintf("host=db user=%s password=%s dbname=%s port=5432 sslmode=disable Timezone=America/Chicago", os.Getenv("DB_USER"), os.Getenv("DB_PASSWORD"), os.Getenv("DB_NAME"))
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		fmt.Printf("Error connecting to the database: %v\n", err)
	}
	if err := db.AutoMigrate(&models.User{}, &models.Problem{}); err != nil {
		fmt.Printf("Error migrating schema: %v\n", err)
	}
	if err := db.AutoMigrate(&models.Room{}); err != nil {
		fmt.Printf("Error migrating Room schema: %v\n", err)
	}
	e := echo.New()

	userService := services.InitializeUserService(db)
	userController := controllers.InitializeUserController(&userService)

	problemService := services.InitializeProblemService(db)
	problemController := controllers.InitializeProblemController(&problemService)
	
	roomService := services.InitializeRoomService(db)
	roomController := controllers.InitializeRoomController(&roomService)

	e.Use(middleware.CORS())
	e.Use(userController.ValidateUserRequest)

	userController.InitializeRoutes(e.Group("/api/users"))
	problemController.InitializeRoutes(e.Group("/api/problems"))
	roomController.InitializeRoutes(e.Group("/api/rooms"))

	e.Logger.Fatal(e.Start(":5000"))
}
