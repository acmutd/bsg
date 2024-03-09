package requests

import (
	"fmt"

	"github.com/acmutd/bsg/rtc-service/response"
)

// Struct for the different request types.
// All request types must implement these methods to be valid.
type Request interface {
	// Creates a new request.
	New() Request

	// Validates the request.
	validate() error

	// Returns the response type for the request.
	responseType() response.ResponseType

	// Handles the request and returns a response.
	Handle(*Message) (response.ResponseType, string, error)
}

var RequestTypes = make(map[string]Request)

// Registers a new request type.
func register(r string, req Request) {
	_, exists := RequestTypes[r]
	if exists {
		errorMessage := fmt.Sprintf("a resource with the name %s already exists", r)
		panic(errorMessage) // Panic because this is a critical error that can lead to conflicts if two requests have the same name.
	}

	RequestTypes[r] = req
}
