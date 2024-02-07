package requests

import (
  // "encoding/json"
  "github.com/gorilla/websocket"
)

// Request for a user to send a message to a room.
type ChatMessageRequest struct {
  UserID  string `json:"userID"` // validate:"required"`
	RoomID  string `json:"roomID"` // validate:"required"`
	Message string `json:"message"` // validate:"required"`
}

// Returns the type of the request.
func (r *ChatMessageRequest) Type() string {
	return string(SEND_MESSAGE_REQUEST)
}

// Validates the request.
func (r *ChatMessageRequest) validate() error {
  return nil
}

// Handles the request and returns a response.
func (r *ChatMessageRequest) Handle(m *Message, c *websocket.Conn) (string, error) { 
  // This method will be completed in the future PR.
  return "Chat Message Request", nil
}