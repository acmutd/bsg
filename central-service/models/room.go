package models

import (
	"github.com/google/uuid"
)

type Room struct {
	ID       uuid.UUID `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	RoomCode string    `gorm:"uniqueIndex" json:"roomCode"`
	Admin    string    `gorm:"not null" json:"adminId"`
	Name     string    `json:"roomName"`
	Rounds   []Round   `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"rounds"`
}
