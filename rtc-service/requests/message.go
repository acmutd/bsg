package requests

import (
	"errors"

	"github.com/go-playground/validator/v10"
)

// Message struct for websocket messages.
// Contains the request type and data associated with the request.
type Message struct {
	ServiceName string `json:"name" validate:"required"`
	Type        string `json:"request-type" validate:"required"`
	Data        string `json:"data" validate:"required"`
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

	// Checks that the request type is valid.
	if _, ok := RequestTypes[RequestType(m.Type)]; !ok {
		// Request type is not valid.
		return errors.New("invalid request type: " + m.Type)
	}

	return nil
}
