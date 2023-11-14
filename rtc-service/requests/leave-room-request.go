package requests

import (
  "encoding/json"

  "github.com/gorilla/websocket"
)

// Struct for the leave-room request.
// Request for a user to leave a room.
type LeaveRoomRequest struct {
	UserID string `json:"userID"` // validate:"required"`
	RoomID string `json:"roomID"` // validate:"required"`
}

// Returns the type of the request.
func (r *LeaveRoomRequest) Type() string {
	return string(LEAVE_ROOM_REQUEST)
}

// Validates the request.
func (r *LeaveRoomRequest) validate() error {
	return nil
}

// Handles the request and returns a response.
func (r *LeaveRoomRequest) Handle(m *Message, c *websocket.Conn) (string, error) {
  err := json.Unmarshal([]byte(m.Data), &r)
  
  if err != nil {
    return "Err", err;
  }
 
  room := rooms[r.RoomID]

  if &room == nil {
     return "Room Doesn't Exist", nil;
  }

  room.RemoveUser(r.UserID)
  return "Leave Room Request", nil
}
