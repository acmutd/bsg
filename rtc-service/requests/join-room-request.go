package requests 

import (
  "encoding/json"
  "github.com/gorilla/websocket"
)

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

// Handles the request and returns a response.
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

  room := rooms[r.RoomID] 

  // Join room 
  if &room != nil {
    room.AddUser(r.UserID, c) 
    return "Added " + r.UserID + " to " + r.RoomID, nil;
  } else {
    // Room doesn't exist -> create room  
    room = Room{ RoomID: r.RoomID }
    room.AddUser(r.UserID, c)
    
    return "Added Room " + r.RoomID + " with " + r.UserID + " as Owner", nil
  }
  // return "Join Room Request", nil 
}
