package chatmanager

import (
	"sync"

	"github.com/acmutd/bsg/rtc-service/logging"
	"github.com/acmutd/bsg/rtc-service/response"
)

// List of all chat rooms connected to RTC service.
type RoomsList map[*Room]bool

// the actual room struct itself
type Room struct {
	// Unique identifier for the room.
	RoomID string

	// List of all users in the room.
	Users UserList

	// History of messages in the room for persistence.
	Messages []response.Response

	// Used to avoid concurrent writes to the users list and message history.
	sync.RWMutex
}

func (r *Room) AddUser(user *User) {
	r.Lock()
	defer r.Unlock()

	// Check user already exists
	if _, ok := r.Users[user]; ok {
		logging.Error("User already exists")
		return
	}

	r.Users[user] = true

	logging.Info("Added: ", user.Handle, " to room: ", r.RoomID)
}

func (r *Room) RemoveUser(user *User) {
	r.Lock()
	defer r.Unlock()

	// Only remove a client if they exist.
	if _, ok := r.Users[user]; ok {
		delete(r.Users, user)
		logging.Info("User removed: ", user.Handle, " from room: ", r.RoomID)
		return
	}

	logging.Info("User not found: ", user.Handle)
}

func (r *Room) GetUser(userHandle string) *User {
	r.Lock()
	defer r.Unlock()

	for user := range r.Users {
		if user.Handle == userHandle {
			return user
		}
	}
	return nil
}

func (r *Room) IsEmpty() bool {
	r.Lock()
	defer r.Unlock()

	return len(r.Users) == 0
}

// AddMessage adds a message to the room's history.
func (r *Room) AddMessage(message response.Response) {
	r.Lock()
	defer r.Unlock()

	r.Messages = append(r.Messages, message)
}