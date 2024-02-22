package requests

import "github.com/gorilla/websocket"

// Map of request types to their respective structs.
//
// Used to quickly determine the type of a request and
// to unmarshal the request into the correct struct.
var RequestTypes = map[RequestType]Request{
	LEAVE_ROOM_REQUEST:     &LeaveRoomRequest{},
	JOIN_ROOM_REQUEST:      &JoinRoomRequest{},
	SEND_MESSAGE_REQUEST:   &ChatMessageRequest{},
	ROUND_END_REQUEST:      &RoundEndRequest{},
	NEW_SUBMISSION_REQUEST: &NewSubmissionRequest{},
}

// Struct for the different request types.
// All request types must implement these methods to be valid.
type Request interface {
	// Returns the type of the request.
	Type() string

	// Validates the request.
	validate(string) error

	// Returns the response type for the request.
	responseType() response.ResponseType

	// Handles the request and returns a response.
	Handle(*Message, *websocket.Conn) (string, error)
}
