package controllers

import (
	"log"
	"net/http"

	"github.com/acmutd/bsg/central-service/models"
	"github.com/acmutd/bsg/central-service/services"
	"github.com/labstack/echo/v4"
)

type RoundController struct {
	roundService *services.RoundService
}

func InitializeRoundController(service *services.RoundService) RoundController {
	return RoundController{service}
}

func (controller *RoundController) CreateNewRoundEndpoint(c echo.Context) error {
	var roundCreationParams services.RoundCreationParameters
	if err := c.Bind(&roundCreationParams); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid data. Please try again")
	}
	newRound, err := controller.roundService.CreateRound(&roundCreationParams)
	if err != nil {
		serviceErr, isValidServiceErr := err.(*services.RoundServiceError)
		if !isValidServiceErr {
			log.Printf("Failed to create new round: %v\n", serviceErr)
			return echo.NewHTTPError(http.StatusInternalServerError, "Failed to create round. Please try again later")
		}
		return echo.NewHTTPError(serviceErr.StatusCode, serviceErr.Message)
	}
	return c.JSON(http.StatusCreated, map[string]models.Round{
		"data": *newRound,
	})
}

func (controller *RoundController) InitializeRoutes(g *echo.Group) {
	g.POST("/create", controller.CreateNewRoundEndpoint)
}
