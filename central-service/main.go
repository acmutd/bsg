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
	if err := db.AutoMigrate(&models.User{}); err != nil {
		fmt.Printf("Error migrating User schema: %v\n", err)
	}
	e := echo.New()

	userService := services.InitializeUserService(db)
	userController := controllers.InitializeUserController(&userService)

	e.Use(middleware.CORS())
	e.Use(userController.ValidateUserRequest)

	userController.InitializeRoutes(e.Group("/api/users"))

	e.Logger.Fatal(e.Start(":5000"))
}
