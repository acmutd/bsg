package main

import (
	"os"

	"log"

	"github.com/gin-gonic/gin"
)

var (
	// Loggers
	InfoLogger    = log.New(os.Stdout, "RTC-SERVICE - INFO: ", log.Ldate|log.Ltime)
	WarningLogger = log.New(os.Stdout, "RTC-SERVICE - WARNING: ", log.Ldate|log.Ltime)
	ErrorLogger   = log.New(os.Stderr, "RTC-SERVICE - ERROR: ", log.Ldate|log.Ltime)

	// Router handles the requests and routes
	// them to the appropriate handler.
	router *gin.Engine

	// Websocket host
	wsHost = "localhost"

	// Websocket port
	wsPort = "8080"
)

// Initializes the server to start handlding
// websocket requests.
func initws(wsHandler *Handler) {
	// Initialize the request handler
	router = gin.Default()

	// Create a new chat room
	router.POST("/ws/createRoom", wsHandler.CreateRoom)
}

func main() {

	// Create a new chat room manager
	chatRoomManager := NewManager()

	// Create a new websocket handler
	wbHandler := NewHandler(chatRoomManager)

	// Initialize the server
	initws(wbHandler)
	InfoLogger.Println("Starting the server on port", wsPort)
	router.Run(wsHost + ":" + wsPort)
}
