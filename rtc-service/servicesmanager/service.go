package servicesmanager

import (
	"encoding/json"
	"time"

	"github.com/acmutd/bsg/rtc-service/chatmanager"
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
	PING_INTERVAL = (PONG_WAIT * 9) / 10

	// Name of the front-end service
	FRONT_END_SERVICE = "front-end"
)

// List of all services connected to RTC service.
type ServicesList map[*Service]bool

// Service represents a connected service.
type Service struct {
	Name           string
	Connection     *websocket.Conn
	Egress         chan response.Response
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
func (s *Service) ReadMessages() {
	defer func() {
		s.ServiceManager.RemoveService(s)
	}()

	if err := s.Connection.SetReadDeadline(time.Now().Add(PONG_WAIT)); err != nil {
		logging.Error(err)
		return
	}
	s.Connection.SetPongHandler(s.pongHandler)

	for {
		_, message, err := s.Connection.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				logging.Error("Error reading message: ", err)
			}
			break
		}

		var messageStruct requests.Message
		err = json.Unmarshal(message, &messageStruct)
		if err != nil {
			logging.Error("Failed to unmarshal message: ", err)
			s.Egress <- *response.NewErrorResponse(response.GENERAL, err.Error(), "")
		} else {
			s.Name = messageStruct.ServiceName

			err = messageStruct.Validate(string(message))
			if err != nil {
				logging.Error("Failed to validate message: ", err)
				s.Egress <- *response.NewErrorResponse(response.GENERAL, err.Error(), "")
			} else {
				respType, resp, roomID, err := requests.RequestTypes[messageStruct.Type].New().Handle(&messageStruct)
				if err != nil {
					logging.Error("Failed to handle message: ", err)
					s.Egress <- *response.NewErrorResponse(respType, err.Error(), roomID)
				} else {
					respObj := *response.NewOkResponse(respType, resp, roomID)

					// Broadcast and Persistence Logic
					if respType == response.CHAT_MESSAGE || respType == response.SYSTEM_ANNOUNCEMENT {
						room := chatmanager.RTCChatManager.GetRoom(roomID)
						if room == nil {
							// Create the room if it doesn't exist (Lazy creation for round-start/background messages)
							logging.Info("Creating room on broadcast: ", roomID)
							room = &chatmanager.Room{
								RoomID: roomID,
								Users:  make(chatmanager.UserList),
							}
							chatmanager.RTCChatManager.CreateRoom(room)
						}

						// Re-verify room exists after potential creation
						if room != nil {
							// 1. If this is a join-room request, replay history to the joining user.
							if messageStruct.Type == "join-room" {
								room.RLock()
								for _, prevMsg := range room.Messages {
									s.Egress <- prevMsg
								}
								room.RUnlock()
							}

							// 2. Save the current message to history.
							room.AddMessage(respObj)

							// 3. Send to all users in the room.
							for handle := range room.Users {
								userService := s.ServiceManager.FindService(handle)
								if userService != nil {
									userService.Egress <- respObj
								}
							}
						}
					} else {
						s.Egress <- respObj
					}

					frontEnd := s.ServiceManager.FindService(FRONT_END_SERVICE)
					if frontEnd != nil {
						frontEnd.Egress <- respObj
					}
				}
			}
		}
		logging.Info("Received message: ", string(message))
	}
}

func (s *Service) WriteMessages() {
	ticker := time.NewTicker(PING_INTERVAL)
	defer func() {
		ticker.Stop()
		s.ServiceManager.RemoveService(s)
	}()

	for {
		select {
		case message, ok := <-s.Egress:
			if !ok {
				if err := s.Connection.WriteMessage(websocket.CloseMessage, nil); err != nil {
					logging.Info("Connection closed: ", err)
				}
				return
			}

			if err := s.Connection.WriteMessage(websocket.TextMessage, []byte(message.Message())); err != nil {
				logging.Error(err)
			}
			logging.Info("Sent message to: ", s.Name)

		case <-ticker.C:
			logging.Info("Ping: ", s.Name)
			if err := s.Connection.WriteMessage(websocket.PingMessage, []byte{}); err != nil {
				logging.Info(err)
				return
			}
		}
	}
}

func (s *Service) pongHandler(pongMsg string) error {
	logging.Info("Pong: ", s.Name)
	return s.Connection.SetReadDeadline(time.Now().Add(PONG_WAIT))
}
