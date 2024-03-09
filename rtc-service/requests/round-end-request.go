package requests

import (
	"encoding/json"

	"github.com/acmutd/bsg/rtc-service/response"
	"github.com/go-playground/validator/v10"
	"github.com/gorilla/websocket"
)

// Struct for the leave-room request.
// Request for a user to leave a room.
type RoundEndRequest struct {
	RoomID string `json:"roomID" validate:"required"`
}

func init() {
	register("round-end", &RoundEndRequest{})
}

// Creates a new request.
func (r *RoundEndRequest) New() Request {
	return &RoundEndRequest{}
}

// Validates the request.
func (r *RoundEndRequest) validate(message string) error {
	// Unmarshal the message into the struct.
	var req RoundEndRequest
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
func (r *RoundEndRequest) responseType() response.ResponseType {
	return response.SYSTEM_ANNOUNCEMENT
}

// Handles the request and returns a response.
func (r *RoundEndRequest) Handle(m *Message, c *websocket.Conn) (string, error) {
	// Validate the request.
	err := r.validate(m.Data)
	if err != nil {
		return "", err
	}
	var req RoundEndRequest
	json.Unmarshal([]byte(m.Data), &req)
	return "Round has ended!", nil
}
