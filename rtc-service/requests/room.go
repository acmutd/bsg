package requests

import "github.com/gorilla/websocket"

// the rooms themselves
var rooms map[string]Room = make(map[string]Room)

// the actual room struct itself
type Room struct {
  Users []User
  RoomID string 
}

// checks if the room should be alive
func (r *Room) ShouldBeAlive() bool {
  if len(r.Users) >= 0 {
    return true
  }
  return false
}

// TODO: deconstructor for room
func (r *Room) destroy() {

}

func (r *Room) AddUser(userID string, c *websocket.Conn) {
  var user User = User{ UserID: userID, RoomID: r.RoomID}
  r.Users = append(r.Users, user)
}

func (r *Room) RemoveUser(userID string) {
  var users []User
  
  for _, e := range users {
    if e.UserID != userID {
      users = append(users, e)
    }
  }

  r.Users = users
}
