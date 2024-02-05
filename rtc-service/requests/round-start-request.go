package requests

import "github.com/acmutd/bsg/rtc-service/response"

// Struct for the round-start request.
type RoundStartRequest struct {
	RoomID string `json:"roomID"`
}

// Returns the type of the request.
func (r *RoundStartRequest) Type() string {
	return string(ROUND_START_REQUEST)
}

// Validates the request.
func (r *RoundStartRequest) validate() error {
	return nil
}

// Returns the response type for the request.
func (r *RoundStartRequest) responseType() response.ResponseType {
	return response.SYSTEM_ANNOUNCEMENT
}

// Handles the request and returns a response.
func (r *RoundStartRequest) Handle(m *Message) (response.ResponseType, string, error) {
	// This method will be completed in the future PR.
	return r.responseType(), "Round Start Request", nil
}
