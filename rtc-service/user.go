package main

import "github.com/gorilla/websocket"

// Represents a single chatting user in a chat room.
type User struct {
	Conn    *websocket.Conn
	Message chan *Message

	// The client id
	Id string `json:"id"`

	// Chat room the client is in
	ChatRoomId string `json:"chatRoomId"`
}
