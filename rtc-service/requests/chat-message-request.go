package requests

// Request for a user to send a message to a room.
type ChatMessageRequest struct {
	UserHandle string `json:"userHandle"`
	RoomID     string `json:"roomID"`
	Message    string `json:"message"`
}

// Returns the type of the request.
func (r *ChatMessageRequest) Type() string {
	return string(SEND_MESSAGE_REQUEST)
}

// Validates the request.
func (r *ChatMessageRequest) validate() error {
	// This method will be completed in the future PR.
	return nil
}

// Handles the request and returns a response.
func (r *ChatMessageRequest) Handle(m *Message) (string, error) {
	// This method will be completed in the future PR.
	return "Chat Message Request", nil
}
