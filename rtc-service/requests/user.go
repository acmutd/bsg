package requests

import "github.com/gorilla/websocket"

// Actual rooms/users themselves
type User struct {
  UserID string
  RoomID string
  Conn *websocket.Conn 
}
