package main

type Message struct {
	// The message content
	Content string `json:"content"`

	// The message sender id
	UserId string `json:"userId"`

	// Id of the the chat room
	ChatRoomId string `json:"chatRoomId"`

	// The message timestamp
	Timestamp int64 `json:"timestamp"`
}
