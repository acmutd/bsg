package requests

import "github.com/acmutd/bsg/rtc-service/response"

// Request for a user to join a room.
type JoinRoomRequest struct {
	UserHandle string `json:"userHandle"`
	RoomID     string `json:"roomID"`
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

// Handles the request and returns a response.
func (r *JoinRoomRequest) Handle(m *Message) (response.ResponseType, string, error) {
	// This method will be completed in the future PR.
	return r.responseType(), "Join Room Request", nil
}
