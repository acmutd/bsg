package response

import (
	"encoding/json"
	"strings"
)

type ResponseStatus string

var (
	// Signifies that the response is an error response.
	error_response ResponseStatus = "error"

	// Signifies that the response is an ok response.
	ok_response ResponseStatus = "ok"
)

// Response is a struct that represents a response to a request.
//
// This is used to send responses to the client since websocket
// don't have a built-in way to send success or error messages.
type Response struct {
	RespStatus  ResponseStatus  `json:"status"`
	RespMessage ResponseMessage `json:"message"`
	RespType    ResponseType    `json:"responseType"`
}

// This is allows for nested json to be sent if the
// message is a system-announcement.
//
// Since system-announcements are sent to a specific room.
type ResponseMessage struct {
	RoomID     string `json:"roomID"` // Field is empty if the response is any other type.
	Data       string `json:"data"`
	UserHandle string `json:"userHandle"` // Field is empty if response isn't chat_message
	UserName   string `json:"userName"`
	UserPhoto  string `json:"userPhoto"`
}

// NewErrorResponse creates a new error response.
func NewErrorResponse(responseType ResponseType, message string, roomID string) *Response {
	respMessage := ResponseMessage{
		Data: message,
	}

	if responseType == SYSTEM_ANNOUNCEMENT || responseType == CHAT_MESSAGE {
		respMessage.RoomID = roomID
	}
	return &Response{
		RespStatus:  error_response,
		RespMessage: respMessage,
		RespType:    responseType,
	}
}

// NewOkResponse creates a new ok response.
func NewOkResponse(responseType ResponseType, message string, roomID string) *Response {
	userHandle := ""
	userName := ""
	userPhoto := ""
	data := message

	if responseType == CHAT_MESSAGE && message != "" {
		// Try to unmarshal JSON first
		var chatData map[string]string
		err := json.Unmarshal([]byte(message), &chatData)
		if err == nil {
			userHandle = chatData["userHandle"]
			userName = chatData["userName"]
			userPhoto = chatData["userPhoto"]
			data = chatData["message"]
		} else {
			// Fallback to old format for compatibility if needed
			parts := strings.Split(message, " - ")
			if len(parts) >= 2 {
				userHandle = parts[0]
				data = parts[1]
			}
		}
	}

	respMessage := ResponseMessage{
		Data:       data,
		UserHandle: userHandle,
		UserName:   userName,
		UserPhoto:  userPhoto,
	}

	if responseType == SYSTEM_ANNOUNCEMENT || responseType == CHAT_MESSAGE {
		respMessage.RoomID = roomID
	}
	return &Response{
		RespStatus:  ok_response,
		RespMessage: respMessage,
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
