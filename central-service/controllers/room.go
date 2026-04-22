package controllers

import (
	"net/http"
	"strconv"

	"github.com/acmutd/bsg/central-service/models"
	"github.com/acmutd/bsg/central-service/services"
	"github.com/acmutd/bsg/central-service/utils"
	"github.com/labstack/echo/v4"
)

type RoomController struct {
	roomService *services.RoomService
	logger      *utils.StructuredLogger
}

func InitializeRoomController(service *services.RoomService, logger *utils.StructuredLogger) RoomController {
	return RoomController{service, logger}
}

// Endpoint for creating a new room given an admin and a roomName
func (controller *RoomController) CreateNewRoomEndpoint(c echo.Context) error {
	var roomDTO services.RoomDTO
	if err := c.Bind(&roomDTO); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid data. Please try again")
	}
	userAuthID := c.Get("userAuthID").(string)
	newRoom, err := controller.roomService.CreateRoom(&roomDTO, userAuthID)
	if err != nil {
		controller.logger.Error("Failed to create room", err, map[string]interface{}{
			"user_id":   userAuthID,
			"room_name": roomDTO.Name,
		})
		if err, ok := err.(services.BSGError); ok {
			return echo.NewHTTPError(err.StatusCode, "Failed to create room. "+err.Error())
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to create room. Please try again later")
	}
	return c.JSON(http.StatusCreated, map[string]models.Room{
		"data": *newRoom,
	})
}

// Endpoint for finding a room by id
func (controller *RoomController) FindRoomEndpoint(c echo.Context) error {
	targetRoomID := c.Param("roomID")
	room, err := controller.roomService.FindRoomByID(targetRoomID)
	if err != nil {
		controller.logger.Error("Failed to find room", err, map[string]interface{}{
			"room_id": targetRoomID,
		})
		if err, ok := err.(services.BSGError); ok {
			return echo.NewHTTPError(err.StatusCode, "Room not found")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to find room. Please try again later")
	}
	return c.JSON(http.StatusOK, map[string]models.Room{
		"data": *room,
	})
}

// i don't know when this changed but my room codes were long ash so i made an additional short code field
func (controller *RoomController) JoinRoomEndpoint(c echo.Context) error {
	userAuthID := c.Get("userAuthID").(string)
	roomParam := c.Param("roomID")

	var room *models.Room
	var err error
	if len(roomParam) == 6 {
		room, err = controller.roomService.FindRoomByShortCode(roomParam)
		if err == nil {
			roomParam = room.ID.String()
		}
	}

	room, err = controller.roomService.JoinRoom(roomParam, userAuthID)
	if err != nil {
		controller.logger.Error("Failed to join room", err, map[string]interface{}{
			"user_id": userAuthID,
			"room_id": roomParam,
		})
		if err, ok := err.(services.BSGError); ok {
			return echo.NewHTTPError(err.StatusCode, "Failed to join room. "+err.Error())
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to join room. Please try again later")
	}
	return c.JSON(http.StatusOK, map[string]models.Room{
		"data": *room,
	})
}

// Endpoint for leaving a room
func (controller *RoomController) LeaveRoomEndpoint(c echo.Context) error {
	userAuthID := c.Get("userAuthID").(string)
	roomID := c.Param("roomID")
	err := controller.roomService.LeaveRoom(roomID, userAuthID)
	if err != nil {
		controller.logger.Error("Failed to leave room", err, map[string]interface{}{
			"user_id": userAuthID,
			"room_id": roomID,
		})
		if err, ok := err.(services.BSGError); ok {
			return echo.NewHTTPError(err.StatusCode, "Failed to leave room. "+err.Error())
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to leave room. Please try again later")
	}
	return c.JSON(http.StatusOK, map[string]string{
		"message": "Successfully Left Room",
	})
}

func (controller *RoomController) CreateNewRoundEndpoint(c echo.Context) error {
	var roundCreationParams services.RoundCreationParameters
	if err := c.Bind(&roundCreationParams); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid data. Please try again")
	}
	roomID := c.Param("roomID")
	newRound, fallbackUsed, err := controller.roomService.CreateRound(&roundCreationParams, roomID)
	if err != nil {
		controller.logger.Error("Failed to create round", err, map[string]interface{}{
			"room_id": roomID,
		})
		if bsgErr, ok := err.(services.BSGError); ok {
			return echo.NewHTTPError(bsgErr.StatusCode, "Failed to create round. "+bsgErr.Message)
		}
		if bsgErr, ok := err.(*services.BSGError); ok {
			return echo.NewHTTPError(bsgErr.StatusCode, "Failed to create round. "+bsgErr.Message)
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to create round. Please try again later")
	}

	warningMessage := ""
	if fallbackUsed {
		warningMessage = "Could not satisfy exact difficulty distribution for your filters. A fallback mix was used to fill the round."
	}

	return c.JSON(http.StatusCreated, map[string]interface{}{
		"data":           *newRound,
		"usedFallback":   fallbackUsed,
		"warningMessage": warningMessage,
	})
}

func (controller *RoomController) StartRoundEndpoint(c echo.Context) error {
	targetRoomID := c.Param("roomID")
	userAuthID := c.Get("userAuthID").(string)
	roundStartTime, problems, err := controller.roomService.StartRoundByRoomID(targetRoomID, userAuthID)
	if err != nil {
		controller.logger.Error("Failed to start round", err, map[string]interface{}{
			"room_id": targetRoomID,
			"user_id": userAuthID,
		})
		if bsgErr, ok := err.(services.BSGError); ok {
			return echo.NewHTTPError(bsgErr.StatusCode, "Failed to start round. "+bsgErr.Message)
		}
		if bsgErr, ok := err.(*services.BSGError); ok {
			return echo.NewHTTPError(bsgErr.StatusCode, "Failed to start round. "+bsgErr.Message)
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to start round. Please try again later")
	}
	return c.JSON(http.StatusOK, map[string]interface{}{
		"startTime": roundStartTime.Unix(),
		"problems":  problems,
	})
}

func (controller *RoomController) GetLeaderboardEndpoint(c echo.Context) error {
	roomID := c.Param("roomID")
	leaderboard, err := controller.roomService.GetLeaderboard(roomID)
	if err != nil {
		controller.logger.Error("Failed to get leaderboard", err, map[string]interface{}{
			"room_id": roomID,
		})
		if err, ok := err.(services.BSGError); ok {
			return echo.NewHTTPError(err.StatusCode, "Failed to get leaderboard. "+err.Message)
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to get leaderboard. Please try again later")
	}
	return c.JSON(http.StatusOK, map[string]interface{}{
		"leaderboard": leaderboard,
	})
}

func (controller *RoomController) CreateSubmissionEndpoint(c echo.Context) error {
	roomID := c.Param("roomID")
	problemID := c.Param("problemID")
	userAuthID := c.Get("userAuthID").(string)
	parsedProblemID, err := strconv.Atoi(problemID)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid problemID. Please try again")
	}
	var roundSubmissionParameters services.RoundSubmissionParameters
	if err := c.Bind(&roundSubmissionParameters); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid data. Please try again")
	}
	roundSubmissionParameters.ProblemID = uint(parsedProblemID)
	result, err := controller.roomService.CreateRoomSubmission(roomID, roundSubmissionParameters, userAuthID)
	if err != nil {
		controller.logger.Error("Failed to create submission", err, map[string]interface{}{
			"user_id":    userAuthID,
			"room_id":    roomID,
			"problem_id": parsedProblemID,
		})
		if err, ok := err.(services.BSGError); ok {
			return echo.NewHTTPError(err.StatusCode, "Failed to create submission. "+err.Error())
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to create submission. Please try again later")
	}
	return c.JSON(http.StatusOK, map[string]models.RoundSubmission{
		"submission": *result,
	})
}

func (controller *RoomController) GetActiveRoomEndpoint(c echo.Context) error {
	userAuthID := c.Get("userAuthID").(string)
	roomID, err := controller.roomService.GetActiveRoomForUser(userAuthID)
	if err != nil {
		controller.logger.Error("Failed to get active room", err, map[string]interface{}{
			"user_id": userAuthID,
		})
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to get active room")
	}
	if roomID == "" {
		return c.JSON(http.StatusOK, map[string]interface{}{
			"roomID": nil,
		})
	}
	return c.JSON(http.StatusOK, map[string]string{
		"roomID": roomID,
	})
}

func (controller *RoomController) EndRoundEndpoint(c echo.Context) error {
	targetRoomID := c.Param("roomID")
	userAuthID := c.Get("userAuthID").(string)
	if err := controller.roomService.EndRoundByRoomID(targetRoomID, userAuthID); err != nil {
		controller.logger.Error("Failed to end round", err, map[string]interface{}{
			"room_id": targetRoomID,
			"user_id": userAuthID,
		})
		if err, ok := err.(services.BSGError); ok {
			return echo.NewHTTPError(err.StatusCode, "Failed to end round. "+err.Error())
		}
		if err, ok := err.(*services.BSGError); ok {
			return echo.NewHTTPError(err.StatusCode, "Failed to end round. "+err.Error())
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to end round. Please try again later")
	}
	return c.JSON(http.StatusOK, map[string]string{"message": "Round ended"})
}

func (controller *RoomController) InitializeRoutes(g *echo.Group) {
	g.POST("/", controller.CreateNewRoomEndpoint)
	g.GET("/active", controller.GetActiveRoomEndpoint)
	g.POST("/:roomID/join", controller.JoinRoomEndpoint)
	g.POST("/:roomID/leave", controller.LeaveRoomEndpoint)
	g.POST("/:roomID/rounds/create", controller.CreateNewRoundEndpoint)
	g.POST("/:roomID/start", controller.StartRoundEndpoint)
	g.POST("/:roomID/end", controller.EndRoundEndpoint)
	g.POST("/:roomID/:problemID", controller.CreateSubmissionEndpoint)
	g.GET("/:roomID", controller.FindRoomEndpoint)
	g.GET("/:roomID/leaderboard", controller.GetLeaderboardEndpoint)
}
