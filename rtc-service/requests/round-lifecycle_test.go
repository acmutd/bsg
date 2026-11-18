package requests

import (
	"encoding/json"
	"testing"
	"time"

	"github.com/acmutd/bsg/rtc-service/chatmanager"
	"github.com/acmutd/bsg/rtc-service/response"
)

func TestRoundLifecyclePreservesTimingAndBroadcastsEnd(t *testing.T) {
	room := newTestRoom(t, "round-lifecycle", false)
	startTime := time.Now().Unix()
	data, _ := json.Marshal(RoundStartRequest{RoomID: room.RoomID, StartTime: startTime, Duration: 30, ProblemList: []string{"two-sum", "3sum"}})
	kind, _, _, err := (&RoundStartRequest{}).Handle(&Message{Data: string(data)})
	if err != nil || kind != response.ROUND_START {
		t.Fatalf("start: kind=%s err=%v", kind, err)
	}
	for i := 0; i < 2; i++ {
		info := room.JoinRound("user-1")
		if info.StartTime != startTime || info.Duration != 30 || info.Status != chatmanager.RoundInProgress {
			t.Fatalf("rejoin changed round timing: %+v", info)
		}
	}
	data, _ = json.Marshal(RoundEndRequest{RoomID: room.RoomID})
	kind, _, _, err = (&RoundEndRequest{}).Handle(&Message{Data: string(data)})
	if err != nil || kind != response.ROUND_END {
		t.Fatalf("end must notify clients to stop timers: kind=%s err=%v", kind, err)
	}
	if info := room.JoinRound("user-1"); info.Status != chatmanager.RoundEnded {
		t.Fatalf("rejoining restarted ended round: %+v", info)
	}
	for _, message := range room.GetHistory() {
		if message.RespType == response.ROUND_START || message.RespType == response.ROUND_END {
			t.Fatal("round control events must not replay as history")
		}
	}
}
