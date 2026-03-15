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
	StartTime   int64    `json:"startTime"`  // Unix seconds when the round starts
	Duration    int      `json:"duration"`   // Duration in minutes
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
	return response.ROUND_START
}

// roundStartBroadcast is the data broadcast to all room members on round start.
type roundStartBroadcast struct {
	StartTime int64    `json:"startTime"` // Unix seconds
	Duration  int      `json:"duration"`  // Minutes
	Problems  []string `json:"problems"`
}

// Handles the request and returns a response.
func (r *RoundStartRequest) Handle(m *Message) (response.ResponseType, string, string, error) {
	err := json.Unmarshal([]byte(m.Data), r)

	if err != nil {
		return r.responseType(), "", r.RoomID, err
	}

	// Validate the request.
	err = r.validate()
	if err != nil {
		return r.responseType(), "", r.RoomID, err
	}

	broadcast := roundStartBroadcast{
		StartTime: r.StartTime,
		Duration:  r.Duration,
		Problems:  r.ProblemList,
	}
	broadcastJSON, err := json.Marshal(broadcast)
	if err != nil {
		return r.responseType(), "", r.RoomID, err
	}
	return r.responseType(), string(broadcastJSON), r.RoomID, nil
}
