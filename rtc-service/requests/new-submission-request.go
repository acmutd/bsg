package requests

import "github.com/acmutd/bsg/rtc-service/response"

// Struct for the new-submission request.
// Request when a user made a new submission.
type NewSubmissionRequest struct {
	UserHandle string `json:"userHandle"`
	RoomID     string `json:"roomID"`
}

// Returns the type of the request.
func (r *NewSubmissionRequest) Type() string {
	return string(NEW_SUBMISSION_REQUEST)
}

// Validates the request.
func (r *NewSubmissionRequest) validate() error {
	return nil
}

// Returns the response type for the request.
func (r *NewSubmissionRequest) responseType() response.ResponseType {
	return response.SYSTEM_ANNOUNCEMENT
}

// Handles the request and returns a response.
func (r *NewSubmissionRequest) Handle(m *Message) (response.ResponseType, string, error) {
	// This method will be completed in the future PR.
	return r.responseType(), "New Submission Request", nil
}
