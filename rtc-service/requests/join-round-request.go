package requests

import (
	"encoding/json"

	"github.com/acmutd/bsg/rtc-service/chatmanager"
	"github.com/acmutd/bsg/rtc-service/response"
	"github.com/go-playground/validator/v10"
)

type JoinRoundRequest struct {
	RoomID   string `json:"roomID" validate:"required"`
	UserID   string `json:"userID" validate:"required"`
	UserName string `json:"userName"`
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

// joinRoundBroadcast is the payload sent to every user in the room when a user
// joins the current round.
type joinRoundBroadcast struct {
	UserID      string `json:"userID"`
	UserName    string `json:"userName"`
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

	// A missing room means no round exists to join, which JoinRound would also
	// report, so the status stays "not-started" rather than erroring.
	status := chatmanager.RoundNotStarted
	if room := chatmanager.RTCChatManager.GetRoom(j.RoomID); room != nil {
		status = room.JoinRound(j.UserID)
	}

	name := j.UserName
	if name == "" {
		name = j.UserID
	}

	broadcast := joinRoundBroadcast{
		UserID:      j.UserID,
		UserName:    name,
		RoundStatus: string(status),
	}
	broadcastJSON, err := json.Marshal(broadcast)
	if err != nil {
		return j.responseType(), "", j.RoomID, err
	}

	return j.responseType(), string(broadcastJSON), j.RoomID, nil
}
