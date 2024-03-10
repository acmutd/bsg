package chatmanager

import (
	"github.com/go-playground/validator/v10"
)

// Message struct for websocket messages.
// Contains the request type and data associated with the request.
type Message struct {
	UserHandle string `json:"user-handle" validate:"required"`
	RoomID     string `json:"room-id" validate:"required"`
	Content    string `json:"content" validate:"required"`
}

// Validates the messages sent to the server.
//
// Ensures the proper fields are present and that the request type is valid.
func (m *Message) Validate(message string) error {
	validate := validator.New()
	err := validate.Struct(m)

	if err != nil {
		return err
	}

	// TODO: Add check for valid room id.

	return nil
}
