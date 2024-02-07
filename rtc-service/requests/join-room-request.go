package requests 

import (
  "encoding/json"
  "github.com/gorilla/websocket"
  "reflect"
)

import "github.com/acmutd/bsg/rtc-service/response"

// Request for a user to join a room.
type JoinRoomRequest struct {
	UserID string `json:"userID"`//validate:"required"`
	RoomID string `json:"roomID"` //validate:"required"`
}

// Returns the type of the request.
func (r *JoinRoomRequest) Type() string {
	return string(JOIN_ROOM_REQUEST)
}

// Validates the request.
func (r *JoinRoomRequest) validate() error {
	// This method will be completed in the future PR.
	return nil
}

// Returns the response type for the request.
func (r *JoinRoomRequest) responseType() response.ResponseType {
	return response.SYSTEM_ANNOUNCEMENT
}

// Handles the request and returns a response
func (r *JoinRoomRequest) Handle(m *Message, c *websocket.Conn) (string, error) {

  /*
  Example request
  {
    "request-type": "join-room",
    "data": "{ \"userID\": \"1234\", \"roomID\": \"4321\" }"
  }
  */

  // Process request
  err := json.Unmarshal([]byte(m.Data), &r)

  if err != nil {
    return "Err", err
  }

  _, exists := rooms[r.RoomID] 

  // Join room 
  if exists && reflect.TypeOf(rooms[r.RoomID]) != nil {
    rooms[r.RoomID].AddUser(r.UserID, c) 
    return "Added " + r.UserID + " to " + r.RoomID, nil;
  } else {
    // Room doesn't exist -> create room
    rooms[r.RoomID] = &Room{ RoomID: r.RoomID }
    rooms[r.RoomID].AddUser(r.UserID, c)
    
    return "Added Room " + r.RoomID + " with " + r.UserID + " as Owner", nil
  }
}
