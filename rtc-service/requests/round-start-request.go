package requests

import (
	"encoding/json"

	"github.com/acmutd/bsg/rtc-service/response"
	"github.com/go-playground/validator/v10"
)

// Struct for the round-start request.
type RoundStartRequest struct {
	RoomID      string   `json:"roomID" validate:"required"`
	ProblemList []string `json:"problemList" validate:"required"`
}

func init() {
	register("round-start", &RoundStartRequest{})
}

// Creates a new request.
func (r *RoundStartRequest) New() Request {
	return &RoundStartRequest{}
}

// Validates the request.
func (r *RoundStartRequest) validate() error {
	validate := validator.New()
	err := validate.Struct(r)
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
func (r *RoundStartRequest) Handle(m *Message) (response.ResponseType, string, error) {
	json.Unmarshal([]byte(m.Data), r)

	// Validate the request.
	err := r.validate()
	if err != nil {
		return r.responseType(), "", err
	}

	// Sending the problem list to the room will be determined in a later implementation.
	return r.responseType(), "New Round has started!", nil
}
