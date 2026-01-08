package main

import (
	"net/http"

	"log"

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
	path = "/ws"
)

// Upgrader for upgrading HTTP connections to websocket connections.
var upgrader = websocket.Upgrader{
	ReadBufferSize:  readBufferSize,
	WriteBufferSize: writeBufferSize,
	// IMPORTANT: Allow all origins. Chrome extensions send "chrome-extension://..." 
	// which differs from "localhost", causing the default check to fail.
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

var serviceManager = servicesmanager.NewServiceManager()

func main() {
	logging.Info("Starting RTC Service on " + port)

	http.HandleFunc(path, wsHandler)
	log.Fatal(http.ListenAndServe(port, nil))
}

// Handles websocket connections.
// This is the main entry point for the service.
func wsHandler(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		logging.Error("Failed to upgrade connection: ", err)
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