package requests

import (
	"encoding/json"

	"github.com/acmutd/bsg/rtc-service/response"
	"github.com/go-playground/validator/v10"
)

// Struct for the admin-change request.
// Sent by central-service when a room's admin leaves and a new admin is assigned.
type AdminChangeRequest struct {
	RoomID    string `json:"roomID" validate:"required"`
	AdminID   string `json:"adminId" validate:"required"`
	AdminName string `json:"adminName"`
}

func init() {
	register("admin-change", &AdminChangeRequest{})
}

// Creates a new request.
func (r *AdminChangeRequest) New() Request {
	return &AdminChangeRequest{}
}

// Validates the request.
func (r *AdminChangeRequest) validate() error {
	validate := validator.New()
	return validate.Struct(r)
}

// Returns the response type for the request.
func (r *AdminChangeRequest) responseType() response.ResponseType {
	return response.ADMIN_CHANGE
}

// adminChangeBroadcast is the data broadcast to all room members on admin transfer.
type adminChangeBroadcast struct {
	AdminID   string `json:"adminId"`
	AdminName string `json:"adminName"`
	Message   string `json:"message"`
}

// Handles the request and returns a response.
func (r *AdminChangeRequest) Handle(m *Message) (response.ResponseType, string, string, error) {
	err := json.Unmarshal([]byte(m.Data), r)
	if err != nil {
		return r.responseType(), "", r.RoomID, err
	}

	err = r.validate()
	if err != nil {
		return r.responseType(), "", r.RoomID, err
	}

	newAdminName := r.AdminName
	if newAdminName == "" {
		newAdminName = "A user"
	}

	broadcast := adminChangeBroadcast{
		AdminID:   r.AdminID,
		AdminName: r.AdminName,
		Message:   newAdminName + " is the new room admin",
	}
	broadcastJSON, err := json.Marshal(broadcast)
	if err != nil {
		return r.responseType(), "", r.RoomID, err
	}
	return r.responseType(), string(broadcastJSON), r.RoomID, nil
}
