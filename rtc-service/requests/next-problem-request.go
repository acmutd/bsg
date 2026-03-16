package requests

import (
	"encoding/json"

	"github.com/acmutd/bsg/rtc-service/response"
	"github.com/go-playground/validator/v10"
)

// Struct for the next-problem request.
type NextProblemRequest struct {
	RoomID      string `json:"roomID" validate:"required"`
	NextProblem string `json:"nextProblem" validate:"required"`
	UserHandle  string `json:"userHandle" validate:"required"`
}

func init() {
	register("next-problem", &NextProblemRequest{})
}

// Creates a new request.
func (r *NextProblemRequest) New() Request {
	return &NextProblemRequest{}
}

// Validates the request.
func (r *NextProblemRequest) validate() error {
	validate := validator.New()
	err := validate.Struct(r)
	if err != nil {
		return err
	}
	return nil
}

// Returns the response type for the request.
func (r *NextProblemRequest) responseType() response.ResponseType {
	return response.NEXT_PROBLEM
}

// Handles the request and returns a response.
func (r *NextProblemRequest) Handle(m *Message) (response.ResponseType, string, string, error) {
	err := json.Unmarshal([]byte(m.Data), r)

	if err != nil {
		return r.responseType(), "", r.RoomID, err
	}

	// Validate the request.
	err = r.validate()
	if err != nil {
		return r.responseType(), "", r.RoomID, err
	}

	// Return data as JSON string so frontend can parse userHandle
	data := map[string]string{
		"nextProblem": r.NextProblem,
		"userHandle":  r.UserHandle,
	}
	jsonData, _ := json.Marshal(data)

	return r.responseType(), string(jsonData), r.RoomID, nil
}
