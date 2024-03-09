package requests

import (
	"encoding/json"
	"fmt"

	"github.com/acmutd/bsg/rtc-service/response"
	"github.com/go-playground/validator/v10"
	"github.com/gorilla/websocket"
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
func (r *NewSubmissionRequest) validate(message string) error {
	// Unmarshal the message into the struct.
	var req NewSubmissionRequest
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
func (r *NewSubmissionRequest) responseType() response.ResponseType {
	return response.SYSTEM_ANNOUNCEMENT
}

// Handles the request and returns a response.
func (r *NewSubmissionRequest) Handle(m *Message, c *websocket.Conn) (string, error) {
	// Validate the request.
	err := r.validate(m.Data)
	if err != nil {
		return "", err
	}
	var req NewSubmissionRequest
	json.Unmarshal([]byte(m.Data), &req)

	// Triggering a leader board update will be determined in a later implementation.

	message := fmt.Sprint("New submission from ", req.UserHandle, "\nProblem: ", req.ProblemID, "\nVerdict: ", req.Verdict)
	return message, nil
}
