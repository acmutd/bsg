package main

import (
	"encoding/json"
	"log"

	"github.com/acmutd/bsg/rtc-service/models"
)

const SendMessageAction = "send-message"
const UserJoinedAction = "user-join"
const UserLeftAction = "user-left"

type Message struct {
	Action  string      `json:"action"`
	Message string      `json:"message"`
	Sender  models.User `json:"sender"`
}

func (message *Message) encode() []byte {
	json, err := json.Marshal(message)
	if err != nil {
		log.Println(err)
	}

	return json
}

func (message *Message) UnmarshalJSON(data []byte) error {
	type Alias Message
	msg := &struct {
		Sender Client `json:"sender"`
		*Alias
	}{
		Alias: (*Alias)(message),
	}
	if err := json.Unmarshal(data, &msg); err != nil {
		return err
	}
	message.Sender = &msg.Sender
	return nil
}
