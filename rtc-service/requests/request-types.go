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
)
