package chatmanager

import (
	"sync"

	"github.com/acmutd/bsg/rtc-service/logging"
)

type ChatManager struct {
	// List of all services connected to RTC service.
	Rooms RoomsList

	// Used to avoid concurrent writes to the services list.
	sync.RWMutex
}

func NewChatManager() *ChatManager {
	return &ChatManager{
		Rooms: make(RoomsList),
	}
}

func (sm *ChatManager) CreateRoom(room *Room) {
	sm.Lock()
	defer sm.Unlock()

	// 1. Handle UUID indexing
	if existing, ok := sm.Rooms[room.RoomID]; ok {
		if existing != room {
			logging.Error("DUPLICATE ROOM ID DETECTED: ", room.RoomID)
			return
		}
		// It's the same object, continue
	} else {
		sm.Rooms[room.RoomID] = room
		logging.Info("Room indexed by ID: ", room.RoomID)
	}

	// 2. Handle Code indexing
	if room.RoomCode != "" {
		if existing, ok := sm.Rooms[room.RoomCode]; ok {
			if existing != room {
				logging.Error("DUPLICATE ROOM CODE DETECTED: ", room.RoomCode)
				return
			}
			// It's the same object, continue
		} else {
			sm.Rooms[room.RoomCode] = room
			logging.Info("Room indexed by Code: ", room.RoomCode)
		}
	}
}

func (sm *ChatManager) GetRoom(roomID string) *Room {
	sm.RLock()
	defer sm.RUnlock()

	return sm.Rooms[roomID]
}

// Remove a room from the list of rooms.
// Only remove a room if it is empty.
func (sm *ChatManager) RemoveRoom(room *Room) {
	sm.Lock()
	defer sm.Unlock()

	if len(room.Users) > 0 {
		logging.Error("Room not empty: ", room.RoomID)
		return
	}

	// Only remove a room if they exist.
	if _, ok := sm.Rooms[room.RoomID]; ok {
		delete(sm.Rooms, room.RoomID)
		if room.RoomCode != "" {
			delete(sm.Rooms, room.RoomCode)
		}
		logging.Info("Room removed: ", room.RoomID)
		return
	}

	logging.Error("Room not found: ", room.RoomID)
}
