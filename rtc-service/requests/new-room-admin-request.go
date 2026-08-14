package requests

import (
	"encoding/json"
	"errors"

	"github.com/acmutd/bsg/rtc-service/chatmanager"
	"github.com/acmutd/bsg/rtc-service/response"
	"github.com/go-playground/validator/v10"
)

type NewRoomAdminRequest struct {
	RoomID     string `json:"roomID"`
	NewAdminID string `json:"newAdminID"`
}

func init() {
	register("room-admin-transfer", &NewRoomAdminRequest{})
}

func (ra *NewRoomAdminRequest) New() Request {
	return &NewRoomAdminRequest{}
}

func (ra *NewRoomAdminRequest) validate() error {
	validate := validator.New()
	err := validate.Struct(ra)
	if err != nil {
		return err
	}
	return nil
}

func (ra *NewRoomAdminRequest) responseType() response.ResponseType {
	return response.SYSTEM_ANNOUNCEMENT
}

func (ra *NewRoomAdminRequest) Handle(m *Message) (response.ResponseType, string, string, error) {
	err := json.Unmarshal([]byte(m.Data), ra)

	if err != nil {
		return ra.responseType(), "", ra.RoomID, err
	}

	err = ra.validate()
	if err != nil {
		return ra.responseType(), "", ra.RoomID, err
	}

	room := chatmanager.RTCChatManager.GetRoom(ra.RoomID)
	if room == nil {
		return ra.responseType(), "", ra.RoomID, errors.New("Room Doesnt Exist")
	}

	//check if user exist before you update the admin ID
	newAdminUserID := room.GetUser(ra.NewAdminID)
	if newAdminUserID == nil {
		return ra.responseType(), "", ra.RoomID, errors.New("User Doesnt Exist")
	}

	err = room.UpdateAdmin(ra.NewAdminID)
	if err == nil {
		return ra.responseType(), ra.NewAdminID, ra.RoomID, nil
	}
	return ra.responseType(), "", ra.RoomID, nil

}
