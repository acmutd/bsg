package response

import "encoding/json"

type ResponseStatus string

var (
	// Signifies that the response is an error response.
	error_response ResponseStatus = "error"

	// Signifies that the response is an ok response.
	ok_response ResponseStatus = "ok"
)

// Response is a struct that represents a response to a request.
//
// This is used to send responses to the client since websockets
// don't have a built-in way to send success or error messages.
type Response struct {
	RespStatus  ResponseStatus `json:"status"`
	RespMessage string         `json:"message"`
	RespType    ResponseType   `json:"responseType"`
}

// NewErrorResponse creates a new error response.
func NewErrorResponse(responseType ResponseType, message string) *Response {
	return &Response{
		RespStatus:  error_response,
		RespMessage: message,
		RespType:    responseType,
	}
}

// NewOkResponse creates a new ok response.
func NewOkResponse(responseType ResponseType, message string) *Response {
	return &Response{
		RespStatus:  ok_response,
		RespMessage: message,
		RespType:    responseType,
	}
}

// IsError returns true if the response is an error response.
func (r *Response) IsError() bool {
	return r.RespStatus == error_response
}

// Message returns the message of the response.
// If the response is an error response, the message will be prefixed with "error".
// Otherwise, the message will be prefixed with "ok".
//
// This is to allow the client to easily determine if the response is an error response.
func (r *Response) Message() string {
	resp, _ := json.Marshal(r)
	return string(resp)
}
