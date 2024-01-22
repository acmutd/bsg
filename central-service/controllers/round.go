package controllers

import (
	"log"
	"net/http"
	"strconv"

	"firebase.google.com/go/auth"
	"github.com/acmutd/bsg/central-service/models"
	"github.com/acmutd/bsg/central-service/services"
	"github.com/labstack/echo/v4"
)

type RoundController struct {
	roundService *services.RoundService
	userService *services.UserService
	roomService *services.RoomService
	submissionService *services.RoundSubmissionService
}

func InitializeRoundController(roundService *services.RoundService, userService *services.UserService, roomService *services.RoomService, submissionService *services.RoundSubmissionService) RoundController {
	return RoundController{roundService, userService, roomService, submissionService}
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

func (controller *RoundController) ProcessRoundStartRequest(c echo.Context) error {
	roundID, err := strconv.ParseUint(c.QueryParam("roundId"), 10, 32)
	if err != nil {
		log.Printf("Error parsing roundID: %v\n", err)
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid round ID. Please try again...")
	}
	targetRound, err := controller.roundService.FindRoundByID(uint(roundID))
	if err != nil {
		log.Printf("Error finding round: %v\n", err)
		return echo.NewHTTPError(http.StatusInternalServerError, "Internal Server error")
	}
	if targetRound == nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid round ID. Please try again...")
	}
	requestInitiatorAuthID := c.Get("authToken").(*auth.Token).UID
	requestInitiator, err := controller.userService.FindUserByAuthID(requestInitiatorAuthID)
	if err != nil {
		log.Printf("Error finding user with provided auth id: %v\n", err)
		return echo.NewHTTPError(http.StatusUnauthorized, "Unidentified request initiator. Please login and try again...")
	}
	roomAdminAuthID, err := controller.roomService.FindRightfulRoomAdmin(targetRound.RoomID.String())
	if err != nil {
		log.Printf("Error querying room admin: %v\n", err)
		return echo.NewHTTPError(http.StatusInternalServerError, "Internal Server Error")
	}
	if roomAdminAuthID != requestInitiator.AuthID {
		return echo.NewHTTPError(http.StatusUnauthorized, "User is not room admin. This functionality is reserved for room admin...")
	}
	roundStartTime, err := controller.roundService.InitiateRoundStart(uint(roundID))
	if err != nil {
		log.Printf("Error initiating round start: %v\n", err)
		return echo.NewHTTPError(http.StatusInternalServerError, "Internal Server Error")
	}
	return c.JSON(http.StatusOK, map[string]interface{}{
		"startTime": roundStartTime.Unix(),
	})
}

func (controller *RoundController) SubmissionToRoundEndpoint(c echo.Context) error {
	var roundSubmissionParams services.RoundSubmissionParameters
	if err := c.Bind(&roundSubmissionParams); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid data. Please try again")
	}

	requestInitiatorAuthID := c.Get("authToken").(*auth.Token).UID
	requestInitiator, err := controller.userService.FindUserByAuthID(requestInitiatorAuthID)
	if err != nil {
		log.Printf("Error finding user with provided auth id: %v\n", err)
		return echo.NewHTTPError(http.StatusUnauthorized, "Unidentified request initiator. Please login and try again...")
	}
	
	roundSubmission, err := controller.submissionService.CreateRoundSubmission(roundSubmissionParams, requestInitiator)
	if err != nil {
		log.Printf("Error creating submission for round: %v\n", err)
		serviceErr, isServiceErr := err.(*services.RoundSubmissionServiceError)
		if isServiceErr {
			return echo.NewHTTPError(http.StatusBadRequest, serviceErr.Message)
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "Internal Server Error")
	}

  // TODO: Send submission to Kafka Queue

	return c.JSON(http.StatusOK, map[string]interface{}{
		"submissionID": roundSubmission.Submission.ID,
	})
}

func (controller *RoundController) InitializeRoutes(g *echo.Group) {
	g.POST("/create", controller.CreateNewRoundEndpoint)
	g.POST("/start", controller.ProcessRoundStartRequest)
	g.POST("/submit", controller.SubmissionToRoundEndpoint)
}
