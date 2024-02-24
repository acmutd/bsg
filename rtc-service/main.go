package main

import (
	"encoding/json"
	"net/http"

	"log"

	"github.com/acmutd/bsg/rtc-service/logging"
	"github.com/acmutd/bsg/rtc-service/requests"
	"github.com/acmutd/bsg/rtc-service/response"

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
}

func main() {
	logging.Info("Starting RTC Service")

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
	defer conn.Close()

	for {
		_, message, err := conn.ReadMessage()
		if err != nil {
			logging.Error("Failed to read message: ", err)
			sendMessage(conn, *response.NewErrorResponse(response.GENERAL, err.Error()))
		}

		// Unmarshal message into a message struct.
		var messageStruct requests.Message
		err = json.Unmarshal(message, &messageStruct)
		if err != nil {
			logging.Error("Failed to unmarshal message: ", err)
			sendMessage(conn, *response.NewErrorResponse(response.GENERAL, err.Error()))
		} else {
			// Validate message.
			err = messageStruct.Validate(string(message))
			if err != nil {
				logging.Error("Failed to validate message: ", err)
				sendMessage(conn, *response.NewErrorResponse(response.GENERAL, err.Error()))
			} else {
				// Pass the message to the appropriate request.
				respType, resp, err := requests.RequestTypes[requests.RequestType(messageStruct.Type)].Handle(&messageStruct, conn)
				if err != nil {
					logging.Error("Failed to handle message: ", err)
					sendMessage(conn, *response.NewErrorResponse(respType, err.Error()))
				} else {
					// Send the response back to the client.
					sendMessage(conn, *response.NewOkResponse(respType, resp))
				}
			}

			logging.Info("Received message: ", string(message))
		}
	}
}

// Sends a message back to the client.
func sendMessage(conn *websocket.Conn, message response.Response) {
	err := conn.WriteMessage(websocket.TextMessage, []byte(message.Message()))
	if err != nil {
		logging.Error("Failed to write error message: ", err)
		return
	}
}
