package requests

import (
	"encoding/json"

	"github.com/acmutd/bsg/rtc-service/chatmanager"
	"github.com/acmutd/bsg/rtc-service/response"
	"github.com/go-playground/validator/v10"
)

// Request for a user to join a room.
type JoinRoomRequest struct {
	UserHandle string `json:"userHandle" validate:"required"`
	RoomID     string `json:"roomID" validate:"required"`
	// Human readable name shown in "X joined the room" announcements.
	UserName string `json:"userName"`
	// When true, registers the user in the room without broadcasting an
	// announcement (used by central-service and the background script).
	SuppressAnnouncement bool `json:"suppressAnnouncement"`
}

func init() {
	register("join-room", &JoinRoomRequest{})
}

// Creates a new request.
func (r *JoinRoomRequest) New() Request {
	return &JoinRoomRequest{}
}

// Validates the request.
func (r *JoinRoomRequest) validate() error {
	validate := validator.New()
	err := validate.Struct(r)
	if err != nil {
		return err
	}
	return nil
}

// Returns the response type for the request.
func (r *JoinRoomRequest) responseType() response.ResponseType {
	return response.USER_JOINED
}

// Handles the request and returns a response
//
//	Example request
//	{
//	  "request-type": "join-room",
//	  "data": "{ \"userID\": \"1234\", \"roomID\": \"4321\" }"
//	}
func (r *JoinRoomRequest) Handle(m *Message) (response.ResponseType, string, string, error) {
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
		room = &chatmanager.Room{
			RoomID: r.RoomID,
			Users:  make(chatmanager.UserList),
		}
		chatmanager.RTCChatManager.CreateRoom(room)
	}

	// A user already in the room is reconnecting (a reload, or a second tab).
	// Their socket still needs registering and a history replay, but announcing
	// again would append a duplicate "joined the room" to every client.
	rejoin := room.GetUser(r.UserHandle) != nil

	user := &chatmanager.User{
		Handle: r.UserHandle,
		Room:   room,
	}
	room.AddUser(user)

	if rejoin {
		return r.responseType(), "", r.RoomID, nil
	}

	if r.SuppressAnnouncement {
		// Silent join: the user is registered but no announcement is broadcast.
		return r.responseType(), "", r.RoomID, nil
	}

	name := r.UserName
	if name == "" {
		name = r.UserHandle
	}
	if name == "" {
		name = "A user"
	}
	return r.responseType(), name+" joined the room", r.RoomID, nil
}
