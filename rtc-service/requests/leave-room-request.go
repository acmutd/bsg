package requests

import (
  "encoding/json"

  "github.com/gorilla/websocket"

  // "fmt"
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
  
  if rooms[r.RoomID] == nil {
    return "Leave Room Request - Room Does Not Exist", nil
  }

  if len(rooms[r.RoomID].Users) == 0 {
    return "Leave Room Request - Room Empty", nil
  }

  // Remove user and delete room if necessary 
  rooms[r.RoomID].RemoveUser(r.UserID)

  // Check if room is empty and if so delete
  if len(rooms[r.RoomID].Users) == 0 {
    delete(rooms, r.RoomID)
    return "Leave Room Request - Room Deleted", nil
  }

  return "Leave Room Request", nil
}
