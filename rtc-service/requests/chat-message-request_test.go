package requests

import (
	"encoding/json"
	"testing"

	"github.com/acmutd/bsg/rtc-service/chatmanager"
)

func newTestRoom(t *testing.T, roomID string, filter bool) *chatmanager.Room {
	t.Helper()
	room := &chatmanager.Room{
		RoomID:          roomID,
		Users:           make(chatmanager.UserList),
		ProfanityFilter: filter,
	}
	room.AddUser(&chatmanager.User{Handle: "user-1", Room: room})
	chatmanager.RTCChatManager.CreateRoom(room)
	t.Cleanup(func() {
		room.RemoveAllUsers()
		chatmanager.RTCChatManager.RemoveRoom(room)
	})
	return room
}

func chatMessage(t *testing.T, roomID, text string) *Message {
	t.Helper()
	data, err := json.Marshal(ChatMessageRequest{UserHandle: "user-1", RoomID: roomID, Message: text})
	if err != nil {
		t.Fatal(err)
	}
	return &Message{ServiceName: "user-1", Type: "chat-message", Data: string(data)}
}

func TestChatMessageProfanityFilter(t *testing.T) {
	tests := []struct {
		name    string
		filter  bool
		text    string
		wantErr bool
	}{
		{name: "filter on, profane", filter: true, text: "what the hell", wantErr: true},
		{name: "filter off, profane", filter: false, text: "what the hell", wantErr: false},
		{name: "filter on, clean", filter: true, text: "have a lovely day", wantErr: false},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			roomID := "room-" + test.name
			newTestRoom(t, roomID, test.filter)

			_, resp, _, err := (&ChatMessageRequest{}).Handle(chatMessage(t, roomID, test.text))
			if (err != nil) != test.wantErr {
				t.Fatalf("Handle() error = %v, wantErr %t", err, test.wantErr)
			}
			if test.wantErr && resp != "" {
				t.Errorf("rejected message should not produce a broadcast, got %q", resp)
			}
		})
	}
}

func TestJoinRoomProfanityFilterOnlyFromCentralService(t *testing.T) {
	room := newTestRoom(t, "room-join-filter", true)

	join := func(serviceName string, filter bool) {
		data, _ := json.Marshal(JoinRoomRequest{UserHandle: "user-2", RoomID: room.RoomID, ProfanityFilter: &filter})
		if _, _, _, err := (&JoinRoomRequest{}).Handle(&Message{ServiceName: serviceName, Type: "join-room", Data: string(data)}); err != nil {
			t.Fatal(err)
		}
	}

	join("user-2", false)
	if !room.ProfanityFilterEnabled() {
		t.Error("a room member was able to disable the profanity filter")
	}

	join(centralServiceName, false)
	if room.ProfanityFilterEnabled() {
		t.Error("central-service was unable to set the profanity filter")
	}
}
