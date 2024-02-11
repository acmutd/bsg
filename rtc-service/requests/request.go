package requests

import (
	"github.com/acmutd/bsg/rtc-service/response"
)

type RequestType string

// List of request types.
var (
	// Request for a user to leave a room.
	LEAVE_ROOM_REQUEST RequestType = "leave-room"

	// Request for a user to join a room.
	JOIN_ROOM_REQUEST RequestType = "join-room"

	// Request for a user to send a message to a room.
	SEND_MESSAGE_REQUEST RequestType = "chat-message"

	// Request to signify the round has ended.
	ROUND_END_REQUEST RequestType = "round-end"

	// Request when a user made a new submission.
	NEW_SUBMISSION_REQUEST RequestType = "new-submission"
)

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
	Handle(*Message) (response.ResponseType, string, error)
}
