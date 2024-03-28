package chatmanager

// List of all chat users connected to RTC service.
type UserList map[*User]bool

// Actual rooms/users themselves
type User struct {
	// Unique identifier for the user.
	Handle string

	// Room the user is in.
	Room *Room
}

// Creating a new client to communicate with.
func NewUser(handle string, room *Room) *User {
	return &User{
		Handle: handle,
		Room:   room,
	}
}
