package controllers

import (
	"log"
	"net/http"

	"firebase.google.com/go/auth"
	"github.com/acmutd/bsg/central-service/models"
	"github.com/acmutd/bsg/central-service/services"
	"github.com/labstack/echo/v4"
)

type RoomController struct {
	roomService *services.RoomService
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
	userAuthID := c.Get("authToken").(*auth.Token).UID
	newRoom, err := controller.roomService.CreateRoom(&roomDTO, userAuthID)
	if err != nil {
		log.Printf("User id: %s failed to create room object: %v\n", userAuthID, err)
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
		log.Printf("Failed to search for room with id %s: %v\n", targetRoomID, err)
		if err, ok := err.(services.BSGError); ok {
			return echo.NewHTTPError(err.StatusCode, "Room not found")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to find room. Please try again later")
	}
	return c.JSON(http.StatusOK, map[string]models.Room{
		"data": *room,
	})
}

// Endpoint for joining a room
func (controller *RoomController) JoinRoomEndpoint(c echo.Context) error {
	userAuthID := c.Get("authToken").(*auth.Token).UID
	roomID := c.Param("roomID")
	room, err := controller.roomService.JoinRoom(roomID, userAuthID)
	if err != nil {
		log.Printf("User id: %s failed to join room with id %s: %v\n", userAuthID, roomID, err)
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
	userAuthID := c.Get("authToken").(*auth.Token).UID
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
	newRound, err := controller.roomService.CreateRound(&roundCreationParams, roomID)
	if err != nil {
		log.Printf("Failed to create new round: %v\n", err)
		if err, ok := err.(*services.BSGError); ok {
			return echo.NewHTTPError(err.StatusCode, "Failed to create round. "+err.Message)
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to create round. Please try again later")
	}
	return c.JSON(http.StatusCreated, map[string]models.Round{
		"data": *newRound,
	})
}

func (controller *RoomController) StartRoundEndpoint(c echo.Context) error {
	targetRoomID := c.Param("roomID")
	userAuthID := c.Get("authToken").(*auth.Token).UID
	roundStartTime, err := controller.roomService.StartRoundByRoomID(targetRoomID, userAuthID)
	if err != nil {
		log.Printf("Failed to start round for room with id %s: %v\n", targetRoomID, err)
		if err, ok := err.(services.BSGError); ok {
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

func (controller *RoomController) InitializeRoutes(g *echo.Group) {
	g.POST("/", controller.CreateNewRoomEndpoint)
	g.POST("/:roomID/join", controller.JoinRoomEndpoint)
	g.POST("/:roomID/leave", controller.LeaveRoomEndpoint)
	g.POST("/:roomID/new-round", controller.CreateNewRoundEndpoint)
	g.POST("/:roomID/start", controller.StartRoundEndpoint)
	g.GET("/:roomID", controller.FindRoomEndpoint)
	g.GET("/:roomID/leaderboard", controller.GetLeaderboardEndpoint)
}
