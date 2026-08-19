package requests

import (
	"encoding/json"

	"github.com/acmutd/bsg/rtc-service/response"
	"github.com/go-playground/validator/v10"
)

type JoinRoundRequest struct {
	RoomID string `json:"roomID" validate:"required"`
	UserID string `json:"userID" validate:"required"`
}

func init() {
	register("join-round", &JoinRoundRequest{})
}

// create a new struct obj
func (j *JoinRoundRequest) New() Request {
	return &JoinRoundRequest{}
}

// validate the struct
func (j *JoinRoundRequest) validate() error {
	validate := validator.New()
	return validate.Struct(j)
}

// Returns the response type for the request.
func (j *JoinRoundRequest) responseType() response.ResponseType {
	return response.ROUND_JOIN
}

type JoinRoundBroadcast struct {
	RoomID      string `json:"roomId"`
	UserID      string `json:"userId"`
	RoundStatus string `json:"roundStatus"`
}

func (j *JoinRoundRequest) Handle(m *Message) (response.ResponseType, string, string, error) {
	err := json.Unmarshal([]byte(m.Data), j)
	if err != nil {
		return j.responseType(), "", "", err
	}
	// Validate the request.
	err = j.validate()
	if err != nil {
		return j.responseType(), "", j.RoomID, err
	}

	broadcast := JoinRoundBroadcast{
		RoomID:      j.RoomID,
		UserID:      j.UserID,
		RoundStatus: "Round is live",
	}
	broadcastJSON, err := json.Marshal(broadcast)
	if err != nil {
		return j.responseType(), "", j.RoomID, err
	}

	return j.responseType(), string(broadcastJSON), "", nil
}
