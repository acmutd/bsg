package main

import "errors"

type CreateRoomRequest struct {
	// The room name
	Name string `json:"name"`
}

// Validates if the correct parameters are passed to the request.
func (request *CreateRoomRequest) Validate() (isValid bool, err error) {
	if request.Name == "" {
		return false, errors.New("Room name cannot be empty")
	}

	return true, nil
}
