package chatmanager

import (
	"sync"

	"github.com/acmutd/bsg/rtc-service/logging"
)

// List of all chat rooms connected to RTC service.
type RoomsList map[*Room]bool

// the actual room struct itself
type Room struct {
	// Unique identifier for the room.
	RoomID string

	// List of all users in the room.
	Users UserList

	// Used to avoid concurrent writes to the users list.
	sync.RWMutex
}

func (r *Room) AddUser(user *User) {
	r.Lock()
	defer r.Unlock()

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
