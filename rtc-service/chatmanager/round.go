package chatmanager

import (
	"github.com/acmutd/bsg/rtc-service/logging"
)

// RoundStatus tells the round status
type RoundStatus string

const (
	// No round has been started in this room yet.
	RoundNotStarted RoundStatus = "not-started"

	// A round is currently running.
	RoundInProgress RoundStatus = "in-progress"

	// The round has finished.
	RoundEnded RoundStatus = "ended"
)

// Round holds the state of a single room's round.
type Round struct {
	Status    RoundStatus
	StartTime int64
	Duration  int
	Problems  []string

	// Set of user IDs taking part in the round.
	Participants map[string]bool
}

// StartRound replaces any existing round with a fresh one that is in progress.
func (r *Room) StartRound(startTime int64, duration int, problems []string) {
	r.Lock()
	defer r.Unlock()

	// Copy the caller's slice so later changes on their side cannot reach in.
	problemsCopy := make([]string, len(problems))
	copy(problemsCopy, problems)

	r.Round = &Round{
		Status:       RoundInProgress,
		StartTime:    startTime,
		Duration:     duration,
		Problems:     problemsCopy,
		Participants: make(map[string]bool),
	}

	logging.Info("Round started in room: ", r.RoomID)
}

// RoundInfo describes a round to callers outside this package. Problems is a
// copy, so it stays safe to read once the Room's lock has been released.
type RoundInfo struct {
	Status    RoundStatus
	StartTime int64
	Duration  int
	Problems  []string
}

// JoinRound registers a user as a participant and returns the round's shape, so
// a user joining midway can be set up with the same problems and timing as
// everyone who was there when it started.
//
// Joining is idempotent, so a reconnect or a second tab does not disturb a
// participant who is already registered.
func (r *Room) JoinRound(userID string) RoundInfo {
	r.Lock()
	defer r.Unlock()

	if r.Round == nil {
		return RoundInfo{Status: RoundNotStarted}
	}

	if !r.Round.Participants[userID] {
		r.Round.Participants[userID] = true
		logging.Info("User joined round: ", userID, " in room: ", r.RoomID)
	}

	problems := make([]string, len(r.Round.Problems))
	copy(problems, r.Round.Problems)

	return RoundInfo{
		Status:    r.Round.Status,
		StartTime: r.Round.StartTime,
		Duration:  r.Round.Duration,
		Problems:  problems,
	}
}

// EndRound marks the round finished. The participant list is kept so it can
// still be read after the round is over.
func (r *Room) EndRound() {
	r.Lock()
	defer r.Unlock()

	if r.Round == nil {
		return
	}

	r.Round.Status = RoundEnded
	logging.Info("Round ended in room: ", r.RoomID)
}
