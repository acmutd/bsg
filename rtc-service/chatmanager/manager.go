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

	// This is to prevent duplicate rooms from being added.
	if _, ok := sm.Rooms[room]; ok {
		logging.Error("Room already exists: ", room.RoomID)
		return
	}

	sm.Rooms[room] = true

	logging.Info("Room added: ", room.RoomID)
}

func (sm *ChatManager) GetRoom(roomID string) *Room {
	sm.RLock()
	defer sm.RUnlock()

	for room := range sm.Rooms {
		if room.RoomID == roomID {
			return room
		}
	}

	return nil
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
	if _, ok := sm.Rooms[room]; ok {
		delete(sm.Rooms, room)
		logging.Info("Service removed: ", room.RoomID)
		return
	}

	logging.Info("Service not found: ", room.RoomID)
}
