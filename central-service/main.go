package main

import (
	"context"
	"fmt"
	"log"
	"net/http"

	firebase "firebase.google.com/go"
	"firebase.google.com/go/auth"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"google.golang.org/appengine/v2"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"github.com/acmutd/bsg/central-service/models"
)

func main() {
	dsn := "host=db user=bsgdev password=bsgdev dbname=bsg port=5432 sslmode=disable Timezone=America/Chicago"
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		fmt.Println("Error connecting to the database")
	}
	if err := db.AutoMigrate(&models.ExampleModel{}); err != nil {
		fmt.Println("Error migrate ExampleModel")
	}
	e := echo.New()

	app, err := firebase.NewApp(context.Background(), nil)
	if err != nil {
		log.Fatalf("error initializing app: %v\n", err)
	}

	e.Use(middleware.CORS())
	e.Use(func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			ctx := appengine.NewContext(c.Request())
			authToken := c.Request().Header.Get("Authorization")
			authClient, err := app.Auth(ctx)
			if err != nil {
				log.Printf("something is wrong with auth client : %v\n", err)
				return err
			}
			token, err := authClient.VerifyIDToken(ctx, authToken)
			if err != nil {
				log.Printf("Error verifying token: %v\n", err)
				return echo.NewHTTPError(http.StatusUnauthorized, "Please provide valid credentials")
			}
			c.Set("authToken", token)
			return next(c)
		}
	})

	e.GET("/", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{
			"msg": fmt.Sprintf("Welcome, user with id %s", c.Get("authToken").(*auth.Token).UID),
		})
	})

	e.Logger.Fatal(e.Start(":5000"))
}
