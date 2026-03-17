package requests

import (
	"encoding/json"

	"github.com/acmutd/bsg/rtc-service/response"
	"github.com/go-playground/validator/v10"
)

// Struct for the room-expired request.
// Sent by central-service when a room's TTL expires and it is deleted.
type RoomExpiredRequest struct {
	RoomID string `json:"roomID" validate:"required"`
}

func init() {
	register("room-expired", &RoomExpiredRequest{})
}

func (r *RoomExpiredRequest) New() Request {
	return &RoomExpiredRequest{}
}

func (r *RoomExpiredRequest) validate() error {
	validate := validator.New()
	return validate.Struct(r)
}

func (r *RoomExpiredRequest) responseType() response.ResponseType {
	return response.ROOM_EXPIRED
}

func (r *RoomExpiredRequest) Handle(m *Message) (response.ResponseType, string, string, error) {
	err := json.Unmarshal([]byte(m.Data), r)
	if err != nil {
		return r.responseType(), "", r.RoomID, err
	}
	err = r.validate()
	if err != nil {
		return r.responseType(), "", r.RoomID, err
	}
	return r.responseType(), "Room has expired and been deleted.", r.RoomID, nil
}
