package requests

import "github.com/acmutd/bsg/rtc-service/response"

// Struct for the leave-room request.
// Request for a user to leave a room.
type LeaveRoomRequest struct {
	UserHandle string `json:"userHandle"`
	RoomID     string `json:"roomID"`
}

// Returns the type of the request.
func (r *LeaveRoomRequest) Type() string {
	return string(LEAVE_ROOM_REQUEST)
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
func (r *LeaveRoomRequest) Handle(m *Message) (response.ResponseType, string, error) {
	// This method will be completed in the future PR.
	return r.responseType(), "Leave Room Request", nil
}
