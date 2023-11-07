package requests

// Request for a user to join a room.
type JoinRoomRequest struct {
	UserID string `json:"userID"`
	RoomID string `json:"roomID"`
}

// Returns the type of the request.
func (r *JoinRoomRequest) Type() string {
	return string(JOIN_ROOM_REQUEST)
}

// Validates the request.
func (r *JoinRoomRequest) validate() error {
	// This method will be completed in the future PR.
	return nil
}

// Handles the request and returns a response.
func (r *JoinRoomRequest) Handle(m *Message) (string, error) {
	// This method will be completed in the future PR.
	return "Join Room Request", nil
}
