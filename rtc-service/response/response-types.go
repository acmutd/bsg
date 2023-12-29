package response

type ResponseType string

var (
	// Response type that is meant to be broadcasted to all users in a room.
	SYSTEM_ANNOUNCEMENT ResponseType = "system-announcement"

	// Response type that is signifies that a user has sent a message to a room.
	CHAT_MESSAGE ResponseType = "chat-message"

	// Response type that doesn't require any special handling.
	GENERAL ResponseType = "general"
)
