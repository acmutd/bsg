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
	RoomCode   string `json:"roomCode"`
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
	return response.SYSTEM_ANNOUNCEMENT
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
		// New Logic: If not found by ID (UUID), try finding by Code
		if r.RoomCode != "" {
			room = chatmanager.RTCChatManager.GetRoom(r.RoomCode)
		}

		if room == nil {
			// If still nil, create new
			room = &chatmanager.Room{
				RoomID:   r.RoomID,
				RoomCode: r.RoomCode,
				Users:    make(chatmanager.UserList),
			}
		} else {
			// If found by code, we might need to update/ensure RoomID is set if it was missing?
			// But usually r.RoomID from backend is the UUID.
			// If the existing room was created by extension, its RoomID might be the Code.
			// We should probably update the RoomID to the UUID if we have one?
			// Let's just ensure we register the new ID.
			if room.RoomID != r.RoomID && r.RoomID != "" {
				// The room was keyed by Code, now we have a UUID.
				// We should probably update the RoomID field to the UUID?
				// Or jus register the UUID as an alias.
				// Let's assume we want the UUID to be the primary ID if available.
				if len(r.RoomID) > len(room.RoomID) { // Heuristic: UUID is longer than Code
					room.RoomID = r.RoomID
				}
			}
		}
		chatmanager.RTCChatManager.CreateRoom(room)
	} else if room.RoomCode == "" && r.RoomCode != "" {
		// Link the code if it wasn't set yet
		room.RoomCode = r.RoomCode
		chatmanager.RTCChatManager.CreateRoom(room) // Re-register to add Code index
	}

	user := &chatmanager.User{
		Handle: r.UserHandle,
		Room:   room,
	}
	room.AddUser(user)

	return r.responseType(), "Join Room Request", r.RoomID, nil
}
