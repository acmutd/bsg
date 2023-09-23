package main

// Represents a chat room manager that
// manages all the chat rooms.
type Manager struct {
	// List of all the available chat rooms.
	Rooms map[string]*Room
}

// Creates a new chat room manager.
func NewManager() *Manager {
	return &Manager{
		Rooms: make(map[string]*Room),
	}
}
