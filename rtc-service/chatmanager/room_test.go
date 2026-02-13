package chatmanager

import (
	"fmt"
	"sync"
	"testing"

	"github.com/acmutd/bsg/rtc-service/response"
)

// TestCoreRoomFunctionality verifies basic user entry and exit.
func TestCoreRoomFunctionality(t *testing.T) {
	room := &Room{
		RoomID: "test-room",
		Users:  make(UserList),
	}
	user := &User{Handle: "tester"}

	// Test AddUser
	room.AddUser(user)
	if len(room.Users) != 1 {
		t.Errorf("Expected 1 user, got %d", len(room.Users))
	}

	// Test GetUser
	found := room.GetUser("tester")
	if found == nil || found.Handle != "tester" {
		t.Error("Failed to find user by handle")
	}

	// Test RemoveUser
	room.RemoveUser(user)
	if !room.IsEmpty() {
		t.Error("Expected room to be empty after removing user")
	}
}

// TestMessageHistoryCapping verifies the memory-safety edge case.
func TestMessageHistoryCapping(t *testing.T) {
	room := &Room{Messages: make([]response.Response, 0)}

	// Push more messages than the cap (MaxMessageHistory = 100)
	totalMessages := MaxHistorySize + 50
	for i := 0; i < totalMessages; i++ {
		msg := response.Response{
			RespMessage: response.ResponseMessage{
				RoomID:     "",
				Data:       fmt.Sprintf("msg-%d", i),
				UserHandle: "",
			},
		}
		room.AddMessage(msg)
	}

	// Assert the cap is maintained
	if len(room.Messages) != MaxHistorySize {
		t.Errorf("Expected length %d, got %d", MaxHistorySize, len(room.Messages))
	}

	// Assert that the OLDEST messages were removed (the first should now be msg-50)
	if room.Messages[0].RespMessage.Data != "msg-50" {
		t.Errorf("Expected oldest remaining message to be msg-50, got %s", room.Messages[0].RespMessage.Data)
	}
}

// TestHistoryLockingConcurrency verifies that GetHistory doesn't block AddMessage.
func TestHistoryLockingConcurrency(t *testing.T) {
	room := &Room{
		Messages: make([]response.Response, 0),
		Users:    make(UserList),
	}

	// Pre-fill history
	for i := 0; i < 50; i++ {
		room.AddMessage(response.Response{})
	}

	var wg sync.WaitGroup
	wg.Add(2)

	// Simulate a slow reader getting history
	go func() {
		defer wg.Done()
		history := room.GetHistory()
		if len(history) < 50 {
			t.Error("History retrieval failed during concurrency")
		}
	}()

	// Simultaneously add a new message
	go func() {
		defer wg.Done()
		room.AddMessage(response.Response{})
	}()

	wg.Wait()
}
