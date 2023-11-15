package response

// Response is a struct that represents a response to a request.
//
// This is used to send responses to the client since websockets
// don't have a built-in way to send success or error messages.
type Response struct {
	isError bool
	message string
}

// NewErrorResponse creates a new error response.
func NewErrorResponse(message string) *Response {
	return &Response{
		isError: true,
		message: message,
	}
}

// NewOkResponse creates a new ok response.
func NewOkResponse(message string) *Response {
	return &Response{
		isError: false,
		message: message,
	}
}

// IsError returns true if the response is an error response.
func (r *Response) IsError() bool {
	return r.isError
}

// Message returns the message of the response.
// If the response is an error response, the message will be prefixed with "error".
// Otherwise, the message will be prefixed with "ok".
//
// This is to allow the client to easily determine if the response is an error response.
func (r *Response) Message() string {
	if r.isError {
		return "error: " + r.message
	}
	return "ok: " + r.message
}
