package chatmanager

import "testing"

func TestChatManager_RoomManagement(t *testing.T) {
	manager := NewChatManager()
	roomID := "lobby"
	room := &Room{RoomID: roomID, Users: make(UserList)}

	// Test Create
	manager.CreateRoom(room)
	if manager.GetRoom(roomID) == nil {
		t.Fatal("Failed to create and retrieve room")
	}

	// Edge Case: Don't remove non-empty rooms
	user := &User{Handle: "staying"}
	room.AddUser(user)
	manager.RemoveRoom(room)
	
	if manager.GetRoom(roomID) == nil {
		t.Error("Manager removed a room that was not empty!")
	}

	// Remove user then room
	room.RemoveUser(user)
	manager.RemoveRoom(room)
	if manager.GetRoom(roomID) != nil {
		t.Error("Manager failed to remove empty room")
	}
}