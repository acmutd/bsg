package models

import "github.com/google/uuid"

type Room struct {
	ID           uuid.UUID   `gorm:"primaryKey" json:"id"`
	Name         string      `json:"roomName"`
	Admin        string      `gorm:"not null" json:"adminId"`
	Participants []User      `gorm:"foreignKey:ID" json:"participants"`
}
