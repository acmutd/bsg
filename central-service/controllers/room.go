package controllers

import (
	"log"
	"net/http"
	"strconv"

	"github.com/acmutd/bsg/central-service/models"
	"github.com/acmutd/bsg/central-service/services"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

type RoomController struct {
	roomService *services.RoomService
}

// Typed response wrappers for JSON encoding
type RoomResponse struct {
	Data *models.Room `json:"data"`
}

type RoundResponse struct {
	Data *models.Round `json:"data"`
}

type RoomSubmissionResponse struct {
	Submission *models.RoundSubmission `json:"submission"`
}

func InitializeRoomController(service *services.RoomService) RoomController {
	return RoomController{service}
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
		log.Printf("User id: %s failed to create room object: %v\n", userAuthID, err)
		if err, ok := err.(services.BSGError); ok {
			return echo.NewHTTPError(err.StatusCode, "Failed to create room. "+err.Error())
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to create room. Please try again later")
	}
	return c.JSON(http.StatusCreated, RoomResponse{Data: newRoom})
}

// Endpoint for finding a room by id or code
func (controller *RoomController) FindRoomEndpoint(c echo.Context) error {
	targetRoomID := c.Param("roomID")
	// Try finding by code first (more likely in UX)
	room, err := controller.roomService.FindRoomByCode(targetRoomID)
	if err != nil {
		// Fallback to finding by ID (UUID)
		room, err = controller.roomService.FindRoomByID(targetRoomID)
	}

	if err != nil {
		log.Printf("Failed to search for room with id/code %s: %v\n", targetRoomID, err)
		if err, ok := err.(services.BSGError); ok {
			return echo.NewHTTPError(err.StatusCode, "Room not found")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to find room. Please try again later")
	}
	return c.JSON(http.StatusOK, RoomResponse{Data: room})
}

// Endpoint for joining a room
func (controller *RoomController) JoinRoomEndpoint(c echo.Context) error {
	userAuthID := c.Get("userAuthID").(string)
	roomID := c.Param("roomID")
	room, err := controller.roomService.JoinRoom(roomID, userAuthID)
	if err != nil {
		log.Printf("User id: %s failed to join room with id %s: %v\n", userAuthID, roomID, err)
		if err, ok := err.(services.BSGError); ok {
			return echo.NewHTTPError(err.StatusCode, "Failed to join room. "+err.Error())
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to join room. Please try again later")
	}
	return c.JSON(http.StatusOK, RoomResponse{Data: room})
}

// Endpoint for leaving a room
func (controller *RoomController) LeaveRoomEndpoint(c echo.Context) error {
	userAuthID := c.Get("userAuthID").(string)
	roomID := c.Param("roomID")
	err := controller.roomService.LeaveRoom(roomID, userAuthID)
	if err != nil {
		log.Printf("User id: %s failed to leave room with id %s: %v\n", userAuthID, roomID, err)
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
	parsedRoomID, err := uuid.Parse(roomID)
	if err != nil {
		// If it's not a UUID, try to find the room by code first to get the UUID
		room, err := controller.roomService.FindRoomByCode(roomID)
		if err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, "Invalid room ID or code")
		}
		parsedRoomID = room.ID
	}
	newRound, err := controller.roomService.CreateRound(&roundCreationParams, parsedRoomID)
	if err != nil {
		log.Printf("Failed to create new round: %v\n", err)
		if err, ok := err.(*services.BSGError); ok {
			return echo.NewHTTPError(err.StatusCode, "Failed to create round. "+err.Message)
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to create round. Please try again later")
	}
	return c.JSON(http.StatusCreated, RoundResponse{Data: newRound})
}

func (controller *RoomController) StartRoundEndpoint(c echo.Context) error {
	targetRoomID := c.Param("roomID")
	userAuthID := c.Get("userAuthID").(string)
	roundStartTime, err := controller.roomService.StartRoundByRoomID(targetRoomID, userAuthID)
	if err != nil {
		log.Printf("Failed to start round for room with id %s: %v\n", targetRoomID, err)
		if err, ok := err.(*services.BSGError); ok {
			return echo.NewHTTPError(err.StatusCode, "Failed to start round. "+err.Message)
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to start round. Please try again later")
	}
	return c.JSON(http.StatusOK, map[string]interface{}{
		"startTime": roundStartTime.Unix(),
	})
}

func (controller *RoomController) GetLeaderboardEndpoint(c echo.Context) error {
	roomID := c.Param("roomID")
	leaderboard, err := controller.roomService.GetLeaderboard(roomID)
	if err != nil {
		log.Printf("Failed to get leaderboard for room with id %s: %v\n", roomID, err)
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
	// var roundSubmissionParameters services.RoundSubmissionParameters
	// if err := c.Bind(&roundSubmissionParameters); err != nil {
	// 	return echo.NewHTTPError(http.StatusBadRequest, "Invalid data. Please try again")
	// }
	result, err := controller.roomService.CreateRoomSubmission(roomID, uint(parsedProblemID), userAuthID)
	if err != nil {
		log.Printf("User id: %s failed to create submission: %v\n", userAuthID, err)
		if err, ok := err.(services.BSGError); ok {
			return echo.NewHTTPError(err.StatusCode, "Failed to create submission. "+err.Error())
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to create submission. Please try again later")
	}
	return c.JSON(http.StatusOK, RoomSubmissionResponse{Submission: result})
}

func (controller *RoomController) InitializeRoutes(g *echo.Group) {
	g.POST("/", controller.CreateNewRoomEndpoint)
	g.POST("/:roomID/join", controller.JoinRoomEndpoint)
	g.POST("/:roomID/leave", controller.LeaveRoomEndpoint)
	g.POST("/:roomID/rounds/create", controller.CreateNewRoundEndpoint)
	g.POST("/:roomID/start", controller.StartRoundEndpoint)
	g.POST("/:roomID/:problemID", controller.CreateSubmissionEndpoint)
	g.GET("/:roomID", controller.FindRoomEndpoint)
	g.GET("/:roomID/leaderboard", controller.GetLeaderboardEndpoint)
}
