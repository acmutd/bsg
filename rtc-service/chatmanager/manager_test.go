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

func TestChatManager_RemoveUserFromAllRooms(t *testing.T) {
	manager := NewChatManager()

	roomA := &Room{RoomID: "room-a", Users: make(UserList)}
	roomB := &Room{RoomID: "room-b", Users: make(UserList)}
	manager.CreateRoom(roomA)
	manager.CreateRoom(roomB)

	roomA.AddUser(&User{Handle: "user1"})
	roomA.AddUser(&User{Handle: "user2"})
	roomB.AddUser(&User{Handle: "user1"})

	manager.RemoveUserFromAllRooms("user1")

	if roomA.GetUser("user1") != nil {
		t.Error("user1 should have been removed from room-a")
	}
	if roomB.GetUser("user1") != nil {
		t.Error("user1 should have been removed from room-b")
	}
	if roomA.GetUser("user2") == nil {
		t.Error("user2 should still be in room-a")
	}

	// Removing the last user from room-b should clean up the room itself
	if manager.GetRoom("room-b") != nil {
		t.Error("room-b should have been removed after its last user left")
	}

	// Removing a handle that isn't in any room should be a no-op
	manager.RemoveUserFromAllRooms("ghost")
	if manager.GetRoom("room-a") == nil {
		t.Error("room-a should still exist")
	}
}