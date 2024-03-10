package main

import (
	"net/http"

	"log"

	"github.com/acmutd/bsg/rtc-service/chatmanager"
	"github.com/acmutd/bsg/rtc-service/logging"
	"github.com/acmutd/bsg/rtc-service/servicesmanager"
	"github.com/google/uuid"

	"github.com/gorilla/websocket"
)

var (
	// Read and write buffer sizes for the websocket connection.
	readBufferSize  = 1024
	writeBufferSize = 1024

	// Port to listen on.
	port = ":8080"

	// Path to the websocket endpoint.
	path = "/service/ws"

	// Path to the websocket endpoint for chats.
	chatPath = "/chat/ws"
)

// Upgrader for upgrading HTTP connections to websocket connections.
var upgrader = websocket.Upgrader{
	ReadBufferSize:  readBufferSize,
	WriteBufferSize: writeBufferSize,
}

var serviceManager = servicesmanager.NewServiceManager()
var chatManager = chatmanager.NewChatManager()

func main() {
	logging.Info("Starting RTC Service")

	http.HandleFunc(path, wsHandler)
	http.HandleFunc(chatPath, chatWsHandler)
	log.Fatal(http.ListenAndServe(port, nil))
}

// Handles websocket connections.
// This is the main entry point for the service.
func wsHandler(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		logging.Error("Failed to upgrade connection: ", err)
		conn.Close()
		return
	}

	// Create a new service and add it to the service manager.
	// Service name will be changed when a new message is received.
	// The random service name is to ensure that if two new services try to connect,
	// the connection would not be overridden.
	client := servicesmanager.NewClient(uuid.New().String(), conn, serviceManager)

	// Add the service to the service manager.
	serviceManager.AddService(client)

	// Start reading messages from the service.
	go client.ReadMessages()

	// Start writing messages to the service.
	go client.WriteMessages()
}

// This is the chat entry point for the service.
func chatWsHandler(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		logging.Error("Failed to upgrade connection: ", err)
		conn.Close()
		return
	}

	// Create a new service and add it to the service manager.
	// Service name will be changed when a new message is received.
	// The random service name is to ensure that if two new services try to connect,
	// the connection would not be overridden.
	user := chatmanager.NewUser(uuid.New().String(), conn, nil)

	// Add the service to the service manager.
	// TODO: Add the user to the chat manager.

	// Start reading messages from the service.
	go user.ReadMessages()

	// Start writing messages to the service.
	go user.WriteMessages()
}
