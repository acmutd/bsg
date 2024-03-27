package requests

import (
	"encoding/json"
	"errors"

	"github.com/acmutd/bsg/rtc-service/chatmanager"
	"github.com/acmutd/bsg/rtc-service/response"
	"github.com/go-playground/validator/v10"
)

// Struct for the leave-room request.
// Request for a user to leave a room.
type LeaveRoomRequest struct {
	UserHandle string `json:"userHandle"` // validate:"required"`
	RoomID     string `json:"roomID"`     // validate:"required"`
}

func init() {
	register("leave-room", &LeaveRoomRequest{})
}

// Creates a new request.
func (r *LeaveRoomRequest) New() Request {
	return &LeaveRoomRequest{}
}

// Validates the request.
func (r *LeaveRoomRequest) validate() error {
	validate := validator.New()
	err := validate.Struct(r)
	if err != nil {
		return err
	}
	return nil
}

// Returns the response type for the request.
func (r *LeaveRoomRequest) responseType() response.ResponseType {
	return response.SYSTEM_ANNOUNCEMENT
}

// Handles the request and returns a response.
func (r *LeaveRoomRequest) Handle(m *Message) (response.ResponseType, string, string, error) {
	err := json.Unmarshal([]byte(m.Data), r)

	if err != nil {
		return r.responseType(), "", r.RoomID, err
	}

	// Validate the request.
	err = r.validate()
	if err != nil {
		return r.responseType(), "", r.RoomID, err
	}

	room := chatmanager.RTCChatManager.GetRoom(r.RoomID)
	if room == nil {
		return r.responseType(), "", r.RoomID, errors.New("room doesn't exist")
	}

	user := room.GetUser(r.UserHandle)
	if user == nil {
		return r.responseType(), "", r.RoomID, errors.New("user doesn't exist")
	}

	room.RemoveUser(user)

	// Delete a room if there are no users
	if room.IsEmpty() {
		chatmanager.RTCChatManager.RemoveRoom(room)
	}

	return r.responseType(), "Leave Room Request", r.RoomID, nil
}
