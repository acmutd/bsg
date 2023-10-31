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
		if _, ok := err.(services.RoomNameError); ok {
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
	rooms, err := controller.roomService.FindRoomByID(targetRoomID)
	if err != nil {
		log.Printf("Failed to search for room with id %s: %v\n", targetRoomID, err)
		return echo.NewHTTPError(http.StatusInternalServerError)
	}
	if rooms == nil {
		return echo.NewHTTPError(http.StatusNotFound, "Room not found")
	}
	return c.JSON(http.StatusOK, map[string]models.Room{
		"data": *rooms,
	})
}

func (controller *RoomController) InitializeRoutes(g *echo.Group) {
	g.POST("/", controller.CreateNewRoomEndpoint)
	g.GET("/", controller.FindRoomEndpoint)
}