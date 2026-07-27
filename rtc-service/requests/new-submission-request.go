package requests

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/acmutd/bsg/rtc-service/response"
	"github.com/go-playground/validator/v10"
)

// Struct for the new-submission request.
// Request when a user made a new submission.
type NewSubmissionRequest struct {
	UserHandle string `json:"userHandle" validate:"required"`
	RoomID     string `json:"roomID" validate:"required"`
	ProblemID  string `json:"problemID" validate:"required"`
	Verdict    string `json:"verdict" validate:"required"`
}

func init() {
	register("new-submission", &NewSubmissionRequest{})
}

// Creates a new request.
func (r *NewSubmissionRequest) New() Request {
	return &NewSubmissionRequest{}
}

// Validates the request.
func (r *NewSubmissionRequest) validate() error {
	validate := validator.New()
	err := validate.Struct(r)
	if err != nil {
		return err
	}

	return nil
}

// Returns the response type for the request.
func (r *NewSubmissionRequest) responseType() response.ResponseType {
	return response.SYSTEM_ANNOUNCEMENT
}

// Handles the request and returns a response.
func (r *NewSubmissionRequest) Handle(m *Message) (response.ResponseType, string, string, error) {
	err := json.Unmarshal([]byte(m.Data), r)

	if err != nil {
		return r.responseType(), "", r.RoomID, err
	}

	// Validate the request.
	err = r.validate()
	if err != nil {
		return r.responseType(), "", r.RoomID, err
	}

	// Triggering a leader board update will be determined in a later implementation.

	if r.Verdict != "Accepted" {
		return r.responseType(), "", r.RoomID, nil
	}

	problemName := strings.ReplaceAll(r.ProblemID, "-", " ")
	message := fmt.Sprintf("%s solved %s", r.UserHandle, problemName)
	return r.responseType(), message, r.RoomID, nil
}
