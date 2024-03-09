package requests

import (
	"github.com/acmutd/bsg/rtc-service/response"
	"github.com/gorilla/websocket"
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
func (r *ChatMessageRequest) validate(message string) error {
	return nil
}

// Returns the response type for the request.
func (r *ChatMessageRequest) responseType() response.ResponseType {
	return response.CHAT_MESSAGE
}

// Handles the request and returns a response.
func (r *ChatMessageRequest) Handle(m *Message, c *websocket.Conn) (string, error) {
	// This method will be completed in the future PR.
	return "Chat Message Request", nil
}
