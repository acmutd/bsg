package main

import (
	"fmt"
	"net/http"

	"github.com/labstack/echo/v4"
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
	e.GET("/", func(c echo.Context) error {
		var data []models.ExampleModel
		result := db.Find(&data)
		if result.Error != nil {
			return result.Error
		}
		return c.JSON(http.StatusOK, map[string]int{
			"count": int(result.RowsAffected),
		})
	})

	e.POST("/", func(c echo.Context) error {
		data := models.ExampleModel{
			Name:    "test",
			Message: "Hello world",
		}
		result := db.Create(&data)
		fmt.Printf("Created user with id %d\n", data.ID)
		if result.Error != nil {
			return result.Error
		}
		return c.JSON(http.StatusCreated, data)
	})

	e.Logger.Fatal(e.Start(":5000"))
}
