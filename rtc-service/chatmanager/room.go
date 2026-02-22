package chatmanager

import (
	"sync"

	"github.com/acmutd/bsg/rtc-service/logging"
	"github.com/acmutd/bsg/rtc-service/response"
)

// defines the maximum number of messages stored in room history
const MaxHistorySize = 100

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
	r.RLock()
	defer r.RUnlock()

	for user := range r.Users {
		if user.Handle == userHandle {
			return user
		}
	}
	return nil
}

func (r *Room) IsEmpty() bool {
	r.RLock()
	defer r.RUnlock()

	return len(r.Users) == 0
}

// AddMessage adds a message to the room's history and trims the slice to MaxHistorySize.
func (r *Room) AddMessage(message response.Response) {
	r.Lock()
	defer r.Unlock()

	r.Messages = append(r.Messages, message)

	// trim history to prevent memory issues
	if len(r.Messages) > MaxHistorySize {
		r.Messages = r.Messages[len(r.Messages)-MaxHistorySize:]
	}
}

// returns a thread-safe shallow copy of the message history
func (r *Room) GetHistory() []response.Response {
	r.RLock()
	defer r.RUnlock()

	historyCopy := make([]response.Response, len(r.Messages))
	copy(historyCopy, r.Messages)
	return historyCopy
}