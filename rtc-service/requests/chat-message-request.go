package requests

import (
	"encoding/json"
	"errors"
	
	"github.com/acmutd/bsg/rtc-service/chatmanager"
	"github.com/acmutd/bsg/rtc-service/response"
	"github.com/go-playground/validator/v10"
)

// Request for a user to send a message to a room.
type ChatMessageRequest struct {
	UserHandle string `json:"userHandle" validate:"required"`
	RoomID     string `json:"roomID" validate:"required"`
	Message    string `json:"message" validate:"required"`
}

func init() {
	register("chat-message", &ChatMessageRequest{})
}

// Creates a new request.
func (r *ChatMessageRequest) New() Request {
	return &ChatMessageRequest{}
}

// Validates the request.
func (r *ChatMessageRequest) validate() error {
	validate := validator.New()
	err := validate.Struct(r)
	if err != nil {
		return err
	}
	return nil
}

// Returns the response type for the request.
func (r *ChatMessageRequest) responseType() response.ResponseType {
	return response.CHAT_MESSAGE
}

// Handles the request and returns a response.
func (r *ChatMessageRequest) Handle(m *Message) (response.ResponseType, string, string, error) {
	err := json.Unmarshal([]byte(m.Data), r)

	if err != nil {
		return r.responseType(), "", r.RoomID, err
	}

	// Validate the request.
	err = r.validate()
	if err != nil {
		return r.responseType(), "", r.RoomID, err
	}

	// Check the room exists
	room := chatmanager.RTCChatManager.GetRoom(r.RoomID)
	if room == nil {
		return r.responseType(), "", "", errors.New("room doesn't exist")
	}

	// Check user is in the room
	user := room.GetUser(r.UserHandle)
	if user == nil {
		return r.responseType(), "", r.RoomID, errors.New("user doesn't exist in the room")
	}

	// Return data as JSON so response handler can parse it easily
	responseData := map[string]string{
		"userHandle": r.UserHandle,
		"message":    r.Message,
	}
	jsonBytes, _ := json.Marshal(responseData)

	return r.responseType(), string(jsonBytes), r.RoomID, nil
}