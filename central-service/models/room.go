package models

type Room struct {
	ID       uint   `gorm:"primaryKey" json:"id"`
	RoomName string `json:"roomName"`
}
