package chatmanager

import (
	"net/http"

	"github.com/acmutd/bsg/rtc-service/logging"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

var (
	// Read and write buffer sizes for the websocket connection.
	readBufferSize  = 1024
	writeBufferSize = 1024
)

// Upgrader for upgrading HTTP connections to websocket connections.
var upgrader = websocket.Upgrader{
	ReadBufferSize:  readBufferSize,
	WriteBufferSize: writeBufferSize,
}

var RTCChatManager = NewChatManager()

// This is the chat entry point for the service.
func ChatWsHandler(w http.ResponseWriter, r *http.Request) {
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
	user := NewUser(uuid.New().String(), conn, nil)

	// Add the service to the service manager.
	// TODO: Add the user to the chat manager.

	// Start reading messages from the service.
	go user.ReadMessages()

	// Start writing messages to the service.
	go user.WriteMessages()
}
