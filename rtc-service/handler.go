package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// Represents the handler for the different chat room operations.
type Handler struct {
	// The chat room manager
	manager *Manager
}

// Creates a new chat room handler.
func NewHandler(manager *Manager) *Handler {
	return &Handler{
		manager: manager,
	}
}

/*
Handles the request to join a chat room. The new room is stored in memory since
the rooms are only created for the duration of the contest and will waste
storage if stored in a database.
*/
func (handler *Handler) CreateRoom(ctx *gin.Context) {
	var request CreateRoomRequest

	// Generate a random room id since many rooms can have the same name.
	roomId := randomRoomId()

	// Failed to parse the request body
	if err := ctx.ShouldBindJSON(&request); err != nil {
		ErrorLogger.Println("Failed to make a room", err)
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if the request is valid
	if isValid, err := request.Validate(); !isValid {
		ErrorLogger.Println("Failed to make a room", err)
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if the room already exists
	if _, ok := handler.manager.Rooms[roomId]; ok {
		ErrorLogger.Println("Failed to make a room", "Room already exists")
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Room already exists"})
		return
	}

	handler.manager.Rooms[roomId] = &Room{
		Id:    roomId,
		Name:  request.Name,
		Users: make(map[string]*User),
	}

	InfoLogger.Println("Created a new room:", request.Name, "ID:", roomId)
	ctx.JSON(http.StatusOK, gin.H{"message": "Room created successfully"})
}

func randomRoomId() string {
	return uuid.New().String()
}
