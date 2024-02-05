package requests

import "github.com/acmutd/bsg/rtc-service/response"

// Struct for the leave-room request.
// Request for a user to leave a room.
type RoundEndRequest struct {
	RoomID string `json:"roomID"`
}

// Returns the type of the request.
func (r *RoundEndRequest) Type() string {
	return string(ROUND_END_REQUEST)
}

// Validates the request.
func (r *RoundEndRequest) validate() error {
	return nil
}

// Returns the response type for the request.
func (r *RoundEndRequest) responseType() response.ResponseType {
	return response.SYSTEM_ANNOUNCEMENT
}

// Handles the request and returns a response.
func (r *RoundEndRequest) Handle(m *Message) (response.ResponseType, string, error) {
	// This method will be completed in the future PR.
	return r.responseType(), "Round End Request", nil
}
