package main

import (
	"context"
	"fmt"
	"log"

	firebase "firebase.google.com/go"
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

	app, err := firebase.NewApp(context.Background(), nil)
	if err != nil {
		log.Fatalf("error initializing app: %v\n", err)
	}

	userService := services.InitializeUserService(db, app)
	userController := controllers.InitializeUserController()
	userController.SetUserService(&userService)

	e.Use(middleware.CORS())
	e.Use(userController.ValidateUserRequest)

	// e.GET("/", func(c echo.Context) error {
	// 	return c.JSON(http.StatusOK, map[string]string{
	// 		"msg": fmt.Sprintf("Welcome, user with id %s", c.Get("authToken").(*auth.Token).UID),
	// 	})
	// })
	// e.POST("/", func(c echo.Context) error {
	// 	var user models.User
	// 	if err := c.Bind(&user); err != nil {
	// 		return c.String(http.StatusBadRequest, "bad request")
	// 	}
	// 	return c.String(http.StatusOK, "good request")
	// })

	e.Logger.Fatal(e.Start(":5000"))
}
