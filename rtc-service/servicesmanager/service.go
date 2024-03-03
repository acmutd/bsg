package servicesmanager

import (
	"encoding/json"
	"strings"
	"time"

	"github.com/acmutd/bsg/rtc-service/logging"
	"github.com/acmutd/bsg/rtc-service/requests"
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

// List of all services connected to RTC service.
type ServicesList map[*Service]bool

// Service represents a connected service.
type Service struct {
	// Name of the service connected to RTC service.
	Name string

	// Connection to the service.
	Connection *websocket.Conn

	// Used to avoid concurrent writes to the websocket connection.
	Egress chan response.Response

	// Service Manager
	ServiceManager *ServiceManager
}

// Creating a new client to communicate with.
func NewClient(name string, conn *websocket.Conn, manager *ServiceManager) *Service {
	return &Service{
		Name:           name,
		Connection:     conn,
		Egress:         make(chan response.Response),
		ServiceManager: manager,
	}
}

// Read the incoming messages from the service.
//
// This function should be run as a goroutine.
func (s *Service) ReadMessages() {
	// Close the connection when the function returns
	defer func() {
		s.ServiceManager.RemoveService(s)
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
		var messageStruct requests.Message
		err = json.Unmarshal(message, &messageStruct)
		if err != nil {
			logging.Error("Failed to unmarshal message: ", err)
			s.Egress <- *response.NewErrorResponse(response.GENERAL, err.Error())
		} else {
			// Update the service name from the websocket message.
			s.Name = messageStruct.ServiceName

			// Validate message.
			err = messageStruct.Validate(string(message))
			if err != nil {
				logging.Error("Failed to validate message: ", err)
				s.Egress <- *response.NewErrorResponse(response.GENERAL, err.Error())
			} else {
				// Pass the message to the appropriate request.
				// Replace single quotes with double quotes to avoid JSON parsing issues.
				messageStruct.Data = strings.Replace(messageStruct.Data, "'", "\"", -1)

				// Dynamically handle the request type.
				// This is done by using the request type as a key to the map of request types.
				respType := response.GENERAL // Will change in future PR's
				resp, err := requests.RequestTypes[requests.RequestType(messageStruct.Type)].Handle(&messageStruct, s.Connection)
				if err != nil {
					logging.Error("Failed to handle message: ", err)
					s.Egress <- *response.NewErrorResponse(respType, err.Error())
				} else {
					// Send the response back to the client.
					s.Egress <- *response.NewOkResponse(respType, resp)
				}
			}
		}

		logging.Info("Received message: ", string(message))
	}
}

// Write the outgoing messages to the service.
//
// This function should be run as a goroutine.
func (s *Service) WriteMessages() {
	// Create a ticker that triggers a ping at given interval
	ticker := time.NewTicker(PING_INTERVAL)
	defer func() {
		ticker.Stop()
		s.ServiceManager.RemoveService(s)
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
			logging.Info("Sent message to: ", s.Name)

		case <-ticker.C:
			logging.Info("Ping: ", s.Name)
			// Send the Ping
			if err := s.Connection.WriteMessage(websocket.PingMessage, []byte{}); err != nil {
				logging.Info(err)
				return
			}
		}

	}
}

// pongHandler is used to handle PongMessages for the Client
func (s *Service) pongHandler(pongMsg string) error {
	// Current time + Pong Wait time
	logging.Info("Pong: ", s.Name)
	return s.Connection.SetReadDeadline(time.Now().Add(PONG_WAIT))
}
