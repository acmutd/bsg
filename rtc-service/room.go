package main

// Represents a single chat room with a list of users.
type Room struct {
	// The room id
	Id string `json:"id"`

	// The room name
	Name string `json:"name"`

	// List of users in the room
	Users map[string]*User `json:"users"`
}
