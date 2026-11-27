package requests

import (
	"encoding/json"
	"testing"
)

func TestNewSubmissionUsesProblemName(t *testing.T) {
	tests := []struct {
		name        string
		problemName string
		wantMessage string
	}{
		{
			name:        "uses provided display name",
			problemName: "Longest Substring Without Repeating Characters",
			wantMessage: "user-1 solved Longest Substring Without Repeating Characters",
		},
		{
			name:        "falls back to slug for older requests",
			problemName: "",
			wantMessage: "user-1 solved longest substring without repeating characters",
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			data, err := json.Marshal(NewSubmissionRequest{
				UserHandle:  "user-1",
				RoomID:      "room-1",
				ProblemID:   "longest-substring-without-repeating-characters",
				ProblemName: test.problemName,
				Verdict:     "Accepted",
			})
			if err != nil {
				t.Fatal(err)
			}

			_, message, roomID, err := (&NewSubmissionRequest{}).Handle(&Message{
				Type: "new-submission",
				Data: string(data),
			})
			if err != nil {
				t.Fatalf("Handle() error = %v", err)
			}
			if message != test.wantMessage {
				t.Errorf("Handle() message = %q, want %q", message, test.wantMessage)
			}
			if roomID != "room-1" {
				t.Errorf("Handle() roomID = %q, want %q", roomID, "room-1")
			}
		})
	}
}
