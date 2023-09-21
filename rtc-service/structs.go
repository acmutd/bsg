package main

import (
	"encoding/json"
	"time"
)

// Data that is required for a message to be stored into the
// Redis database.
type Message struct {
	// The ID of the channel that the message was sent to.
	channelId string

	// The text of the message.
	MessageText string

	// The time that the message was sent.
	TimeSent time.Time

	// The ID of the user that sent the message.
	SenderId string

	// Check to see if the message was read by the recipient.
	WasRead bool
}

// MarshalBinary encodes the struct into a binary format
// which can be passed to Redis for storage.
func (message *Message) MarshalBinary() ([]byte, error) {
	messageBytes, err := json.Marshal(message)
	if err != nil {
		WarningLogger.Println("Error marshalling message into JSON", err)
		return nil, err
	}
	return messageBytes, nil
}

// UnmarshalBinary decodes the struct into a Message struct
// which can be used by the application.
func (message *Message) UnmarshalBinary(data []byte) error {
	if err := json.Unmarshal(data, &message); err != nil {
		WarningLogger.Println("Error unmarshalling message from JSON", err)
		return err
	}
	return nil
}
