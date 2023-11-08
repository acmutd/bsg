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
	newRoom, err := controller.roomService.CreateRoom(userAuthID, &roomDTO)
	if err != nil {
		log.Printf("Failed to create room object: %v\n", err)
		if _, ok := err.(services.RoomServiceError); ok {
			return echo.NewHTTPError(http.StatusBadRequest, "Failed to create room. " + err.Error())
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to create room. Please try again later")
	}
	return c.JSON(http.StatusCreated, map[string]models.Room{
		"data": *newRoom,
	})
}

// Endpoint for finding a room by id
func (controller *RoomController) FindRoomEndpoint(c echo.Context) error {
	targetRoomID := c.QueryParam("roomId")
	room, err := controller.roomService.FindRoomByID(targetRoomID)
	if err != nil {
		log.Printf("Failed to search for room with id %s: %v\n", targetRoomID, err)
		return echo.NewHTTPError(http.StatusInternalServerError)
	}
	if room == nil {
		return echo.NewHTTPError(http.StatusNotFound, "Room not found")
	}
	return c.JSON(http.StatusOK, map[string]models.Room{
		"data": *room,
	})
}

// Endpoint for joining a room
func (controller *RoomController) JoinRoomEndpoint(c echo.Context) error {
	userAuthID := c.Get("authToken").(*auth.Token).UID
	roomID := c.Param("roomID")
	room, err := controller.roomService.JoinRoom(userAuthID, roomID)
	if err != nil {
		log.Printf("Failed to join room with id %s: %v\n", roomID, err)
		if _, ok := err.(services.RoomServiceError); ok {
			return echo.NewHTTPError(http.StatusBadRequest, "Failed to join room. " + err.Error())
		}
		return echo.NewHTTPError(http.StatusInternalServerError)
	}
	return c.JSON(http.StatusOK, map[string]models.Room{
		"data": *room,
	})
}

// Endpoint for leaving a room
func (controller *RoomController) LeaveRoomEndpoint(c echo.Context) error {
	userAuthID := c.Get("authToken").(*auth.Token).UID
	roomID := c.Param("roomID")
	room, err := controller.roomService.LeaveRoom(userAuthID, roomID)
	if err != nil {
		log.Printf("Failed to leave room with id %s: %v\n", roomID, err)
		if _, ok := err.(services.RoomServiceError); ok {
			return echo.NewHTTPError(http.StatusBadRequest, "Failed to leave room. " + err.Error())
		}
		return echo.NewHTTPError(http.StatusInternalServerError)
	}
	return c.JSON(http.StatusOK, map[string]models.Room{
		"data": *room,
	})
}

func (controller *RoomController) InitializeRoutes(g *echo.Group) {
	g.POST("/", controller.CreateNewRoomEndpoint)
	g.GET("/", controller.FindRoomEndpoint)
	g.POST("/:roomID/join", controller.JoinRoomEndpoint)
	g.POST("/:roomID/leave", controller.LeaveRoomEndpoint)
}