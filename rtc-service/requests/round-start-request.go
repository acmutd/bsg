package requests

import (
	"encoding/json"

	"github.com/acmutd/bsg/rtc-service/response"
	"github.com/go-playground/validator/v10"
	"github.com/gorilla/websocket"
)

// Struct for the round-start request.
type RoundStartRequest struct {
	RoomID      string   `json:"roomID" validate:"required"`
	ProblemList []string `json:"problemList" validate:"required"`
}

// Returns the type of the request.
func (r *RoundStartRequest) Type() string {
	return string(ROUND_START_REQUEST)
}

// Validates the request.
func (r *RoundStartRequest) validate(message string) error {
	// Unmarshal the message into the struct.
	var req RoundStartRequest
	err := json.Unmarshal([]byte(message), &req)
	if err != nil {
		return err
	}

	validate := validator.New()
	err = validate.Struct(req)
	if err != nil {
		return err
	}
	return nil
}

// Returns the response type for the request.
func (r *RoundStartRequest) responseType() response.ResponseType {
	return response.SYSTEM_ANNOUNCEMENT
}

// Handles the request and returns a response.
func (r *RoundStartRequest) Handle(m *Message, c *websocket.Conn) (string, error) {
	// Validate the request.
	err := r.validate(m.Data)
	if err != nil {
		return "", err
	}

	// Sending the problem list to the room will be determined in a later implementation.

	return "New Round has started!", nil
}
