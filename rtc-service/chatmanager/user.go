package chatmanager

import (
	"encoding/json"
	"time"

	"github.com/acmutd/bsg/rtc-service/logging"
	"github.com/acmutd/bsg/rtc-service/response"
	"github.com/gorilla/websocket"
)

var (
	// Length of time to wait for a pong response from the service.
	PONG_WAIT = 10 * time.Second

	// This is the interval at which the RTC service will send a ping to the service.
	// To keep the connection alive.
	//
	// The value is set to 90% of the PONG_WAIT time.
	// This is to ensure that the service has enough time to respond to the ping.
	PING_INTERVAL = (PONG_WAIT * 9) / 10
)

// List of all chat users connected to RTC service.
type UserList map[*User]bool

// Actual rooms/users themselves
type User struct {
	// Unique identifier for the user.
	Handle string

	// Room the user is in.
	Room *Room

	// Connection to the service.
	Connection *websocket.Conn

	// Used to avoid concurrent writes to the websocket connection.
	Egress chan response.Response
}

// Creating a new client to communicate with.
func NewUser(handle string, conn *websocket.Conn, room *Room) *User {
	return &User{
		Handle:     handle,
		Connection: conn,
		Egress:     make(chan response.Response),
		Room:       room,
	}
}

// Read the incoming messages from the service.
//
// This function should be run as a goroutine.
func (s *User) ReadMessages() {
	// Close the connection when the function returns
	defer func() {
		s.Room.RemoveUser(s)
	}()

	// Configure Wait time for Pong response, use Current time + pongWait
	// This has to be done here to set the first initial timer.
	if err := s.Connection.SetReadDeadline(time.Now().Add(PONG_WAIT)); err != nil {
		logging.Error(err)
		return
	}
	// Configure how to handle Pong responses
	s.Connection.SetPongHandler(s.pongHandler)

	// Loop Forever
	for {
		// ReadMessage is used to read the next message in queue
		// in the connection
		_, message, err := s.Connection.ReadMessage()

		if err != nil {
			// If Connection is closed, we will get an error here
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				logging.Error("Error reading message: ", err)
			}
			break
		}

		// Unmarshal message into a message struct.
		var messageStruct Message
		err = json.Unmarshal(message, &messageStruct)
		if err != nil {
			logging.Error("Failed to unmarshal message: ", err)
			s.Egress <- *response.NewErrorResponse(response.GENERAL, err.Error())
		} else {
			// Update the service name from the websocket message.
			s.Handle = messageStruct.UserHandle

			// Validate message.
			err = messageStruct.Validate(string(message))
			if err != nil {
				logging.Error("Failed to validate message: ", err)
				s.Egress <- *response.NewErrorResponse(response.GENERAL, err.Error())
			} else {
				// TODO: Handle the chat message
			}
		}

		logging.Info("Received message: ", string(message))
	}
}

// Write the outgoing messages to the service.
//
// This function should be run as a goroutine.
func (s *User) WriteMessages() {
	// Create a ticker that triggers a ping at given interval
	ticker := time.NewTicker(PING_INTERVAL)
	defer func() {
		ticker.Stop()
		s.Room.RemoveUser(s)
	}()

	for {
		select {
		case message, ok := <-s.Egress:
			// Ok will be false Incase the egress channel is closed
			if !ok {
				// Manager has closed this connection channel.
				if err := s.Connection.WriteMessage(websocket.CloseMessage, nil); err != nil {
					// Log that the connection is closed and the reason
					logging.Info("Connection closed: ", err)
				}
				// Return to close the goroutine
				return
			}

			// Write the message to the connection
			if err := s.Connection.WriteMessage(websocket.TextMessage, []byte(message.Message())); err != nil {
				logging.Error(err)
			}
			logging.Info("Sent message to: ", s.Handle)

		case <-ticker.C:
			logging.Info("Ping User: ", s.Handle)
			// Send the Ping
			if err := s.Connection.WriteMessage(websocket.PingMessage, []byte{}); err != nil {
				logging.Info(err)
				return
			}
		}

	}
}

// pongHandler is used to handle PongMessages for the Client
func (s *User) pongHandler(pongMsg string) error {
	// Current time + Pong Wait time
	logging.Info("Pong User: ", s.Handle)
	return s.Connection.SetReadDeadline(time.Now().Add(PONG_WAIT))
}
