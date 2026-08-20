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
	// Room the service joined via a join-room request, so its user entry can be
	// cleaned up when the connection drops.
	JoinedRoom string
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
		// If this was the last connection for the user's handle, remove their
		// room entry so reconnects don't collide and rooms can be cleaned up.
		// Other connections sharing the handle (e.g. a second tab) keep the entry.
		if s.JoinedRoom != "" && s.ServiceManager.FindOtherService(s.Name, s) == nil {
			room := chatmanager.RTCChatManager.GetRoom(s.JoinedRoom)
			if room != nil {
				room.RemoveUser(&chatmanager.User{Handle: s.Name})
				if room.IsEmpty() {
					chatmanager.RTCChatManager.RemoveRoom(room)
				}
			}
		}
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
					if messageStruct.Type == "join-room" {
						s.JoinedRoom = roomID
					}

					respObj := *response.NewOkResponse(respType, resp, roomID)

					// Silent announcements (e.g. central-service registering a user in
					// the room) carry an empty message and are neither broadcast nor
					// stored in history. The user is already registered by Handle().
					silentAnnouncement := respType == response.SYSTEM_ANNOUNCEMENT && resp == ""

					// Broadcast and Persistence Logic
					if !silentAnnouncement && (respType == response.CHAT_MESSAGE || respType == response.SYSTEM_ANNOUNCEMENT || respType == response.ROUND_START || respType == response.NEXT_PROBLEM || respType == response.ROOM_EXPIRED || respType == response.ADMIN_CHANGE || respType == response.ROUND_JOIN) {
						room := chatmanager.RTCChatManager.GetRoom(roomID)
						if room != nil {
							// 1. If this is a join-room request, replay history to the joining user.
							if messageStruct.Type == "join-room" {
								room.RLock()
								for _, prevMsg := range room.Messages {
									// Only replay non-transient events on reconnect.
									if prevMsg.RespType == response.CHAT_MESSAGE || prevMsg.RespType == response.SYSTEM_ANNOUNCEMENT {
										s.Egress <- prevMsg
									}
								}
								room.RUnlock()
							}

							// 2. Save the current message to history.
							room.AddMessage(respObj)

							// 3. Send to all users in the room.
							senderReceived := false
							for _, user := range room.Users {
								userService := s.ServiceManager.FindService(user.Handle)
								if userService != nil {
									userService.Egress <- respObj
									if userService == s {
										senderReceived = true
									}
								}
							}

							// if sender isn't in the room (e.g. central-service), send to them directly
							if !senderReceived {
								s.Egress <- respObj
							}
						} else {
							s.Egress <- respObj
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
