package requests

import (
	"encoding/json"

	"github.com/acmutd/bsg/rtc-service/response"
	"github.com/go-playground/validator/v10"
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
func (r *RoundEndRequest) validate() error {
	validate := validator.New()
	err := validate.Struct(r)
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
func (r *RoundEndRequest) Handle(m *Message) (response.ResponseType, string, error) {
	json.Unmarshal([]byte(m.Data), r)

	// Validate the request.
	err := r.validate()
	if err != nil {
		return r.responseType(), "", err
	}
	return r.responseType(), "Round has ended!", nil
}
