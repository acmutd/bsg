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
		// Neither the user nor the room is removed here. A dropped socket means
		// this connection is gone, not that the user left or the round is over,
		// and the panel reconnects routinely (navigating to a problem reloads it).
		// Removing the user made the reconnect look like a fresh join, which
		// announced them twice; removing the room discarded its history and round
		// state outright. Users leave via leave-room, rooms via room-expired.
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
					silentAnnouncement := (respType == response.SYSTEM_ANNOUNCEMENT || respType == response.USER_JOINED) && resp == ""

					// 1. Replay history to a joining user. This runs even when their own
					// join is silent (a reconnect, or central-service registering them),
					// because whether their arrival is announced has nothing to do with
					// whether they need the messages they missed.
					if messageStruct.Type == "join-room" {
						if room := chatmanager.RTCChatManager.GetRoom(roomID); room != nil {
							room.RLock()
							for _, prevMsg := range room.Messages {
								// ROUND_START and NEXT_PROBLEM are control events: the frontend
								// navigates the tab when it sees one, so replaying them would
								// re-trigger navigation on every reconnect.
								if prevMsg.RespType == response.CHAT_MESSAGE || prevMsg.RespType == response.SYSTEM_ANNOUNCEMENT || prevMsg.RespType == response.ROUND_JOIN || prevMsg.RespType == response.USER_JOINED || prevMsg.RespType == response.USER_LEFT {
									s.Egress <- prevMsg
								}
							}
							room.RUnlock()
						}
					}

					// Broadcast and Persistence Logic
					if !silentAnnouncement && (respType == response.CHAT_MESSAGE || respType == response.SYSTEM_ANNOUNCEMENT || respType == response.ROUND_START || respType == response.NEXT_PROBLEM || respType == response.ROOM_EXPIRED || respType == response.ADMIN_CHANGE || respType == response.ROUND_JOIN || respType == response.USER_JOINED || respType == response.USER_LEFT) {
						room := chatmanager.RTCChatManager.GetRoom(roomID)
						if room != nil {
							// 2. Save the current message to history. Rejoins are silent, so
							// each user contributes at most one join entry rather than one
							// per reconnect. Control events are skipped: they are never
							// replayed, so storing them would only consume history slots
							// and evict real messages.
							if respType != response.ROUND_START && respType != response.NEXT_PROBLEM {
								room.AddMessage(respObj)
							}

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

					// central-service owns the room lifecycle, so room-expired is the
					// signal that a room is genuinely over. Tearing it down here rather
					// than on socket disconnect keeps history and round state alive
					// across the reconnects the panel does routinely. Done after the
					// broadcast above so everyone still in the room hears about it.
					if respType == response.ROOM_EXPIRED {
						if room := chatmanager.RTCChatManager.GetRoom(roomID); room != nil {
							room.RemoveAllUsers()
							chatmanager.RTCChatManager.RemoveRoom(room)
						}
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
