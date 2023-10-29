package models

import "github.com/google/uuid"

type Room struct {
	ID     uuid.UUID `gorm:"primaryKey" json:"id"`
	Admin  string    `gorm:"not null" json:"adminId"`
	Name   string    `json:"roomName"`
	Rounds []Round   `gorm:"foreignKey:RoomID"`
}
