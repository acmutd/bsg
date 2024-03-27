package requests

import (
	"github.com/acmutd/bsg/rtc-service/response"
)

// Request for a user to send a message to a room.
type ChatMessageRequest struct {
	UserID  string `json:"userID"`  // validate:"required"`
	RoomID  string `json:"roomID"`  // validate:"required"`
	Message string `json:"message"` // validate:"required"`
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
	return nil
}

// Returns the response type for the request.
func (r *ChatMessageRequest) responseType() response.ResponseType {
	return response.CHAT_MESSAGE
}

// Handles the request and returns a response.
func (r *ChatMessageRequest) Handle(m *Message) (response.ResponseType, string, string, error) {
	// This method will be completed in the future PR.
	return r.responseType(), "Chat Message Request", r.RoomID, nil
}
