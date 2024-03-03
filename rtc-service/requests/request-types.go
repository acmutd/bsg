package requests

type RequestType string

// List of request types.
var (
	// Request for a user to leave a room.
	LEAVE_ROOM_REQUEST RequestType = "leave-room"

	// Request for a user to join a room.
	JOIN_ROOM_REQUEST RequestType = "join-room"

	// Request for a user to send a message to a room.
	SEND_MESSAGE_REQUEST RequestType = "chat-message"

	// Request to announce the start of a round.
	ROUND_START_REQUEST RequestType = "round-start"

	// Request when a user made a new submission.
	NEW_SUBMISSION_REQUEST RequestType = "new-submission"

	// Request to signify the round has ended.
	ROUND_END_REQUEST RequestType = "round-end"
)
