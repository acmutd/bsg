package requests

import (
	"encoding/json"

	"github.com/acmutd/bsg/rtc-service/response"
)

// Struct for the leave-room request.
// Request for a user to leave a room.
type LeaveRoomRequest struct {
	UserID string `json:"userID"` // validate:"required"`
	RoomID string `json:"roomID"` // validate:"required"`
}

func init() {
	register("leave-room", &LeaveRoomRequest{})
}

// Creates a new request.
func (r *LeaveRoomRequest) New() Request {
	return &LeaveRoomRequest{}
}

// Validates the request.
func (r *LeaveRoomRequest) validate() error {
	return nil
}

// Returns the response type for the request.
func (r *LeaveRoomRequest) responseType() response.ResponseType {
	return response.SYSTEM_ANNOUNCEMENT
}

// Handles the request and returns a response.
func (r *LeaveRoomRequest) Handle(m *Message) (response.ResponseType, string, string, error) {
	err := json.Unmarshal([]byte(m.Data), &r)

	if err != nil {
		return r.responseType(), "", r.RoomID, err
	}

	// if rooms[r.RoomID] == nil {
	// 	return r.responseType(), "Leave Room Request - Room Does Not Exist", nil
	// }

	// if len(rooms[r.RoomID].Users) == 0 {
	// 	return r.responseType(), "Leave Room Request - Room Empty", nil
	// }

	// // Remove user and delete room if necessary
	// rooms[r.RoomID].RemoveUser(r.UserID)

	// // Check if room is empty and if so delete
	// if len(rooms[r.RoomID].Users) == 0 {
	// 	delete(rooms, r.RoomID)
	// 	return r.responseType(), "Leave Room Request - Room Deleted", nil
	// }

	return r.responseType(), "Leave Room Request", r.RoomID, nil
}
