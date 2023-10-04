package main

import (
	"fmt"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"github.com/acmutd/bsg/central-service/controllers"
	"github.com/acmutd/bsg/central-service/models"
	"github.com/acmutd/bsg/central-service/services"
)

func main() {
	dsn := "host=db user=bsgdev password=bsgdev dbname=bsg port=5432 sslmode=disable Timezone=America/Chicago"
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		fmt.Println("Error connecting to the database")
	}
	if err := db.AutoMigrate(&models.User{}); err != nil {
		fmt.Println("Error migrating User schema")
	}
	e := echo.New()

	userService := services.InitializeUserService(db)
	userController := controllers.InitializeUserController()
	userController.SetUserService(&userService)

	e.Use(middleware.CORS())
	e.Use(userController.ValidateUserRequest)

	userController.InitializeRoutes(e.Group("/api/users"))

	e.Logger.Fatal(e.Start(":5000"))
}
