package models

import (
	"time"

	"github.com/google/uuid"
)

type Room struct {
	ID              uuid.UUID  `gorm:"primaryKey" json:"id"`
	Admin           string     `gorm:"not null" json:"adminId"`
	Name            string     `json:"roomName"`
	Rounds      2    []Round    `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"rounds"`
	LastActivityAt  time.Time  `json:"lastActivityAt"`
	ExpiresAt       *time.Time `json:"expiresAt"`
}
