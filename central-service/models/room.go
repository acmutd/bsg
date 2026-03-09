package models

import (
	"time"

	"github.com/google/uuid"
)

type Room struct {
	ID        uuid.UUID `gorm:"primaryKey" json:"id"`
	ShortCode string    `gorm:"uniqueIndex;not null" json:"shortCode"`
	Admin     string    `gorm:"not null" json:"adminId"`
	Name      string    `json:"roomName"`
	TTL       int       `json:"ttl"`       // TTL in minutes; 0 means no expiry
	ExpiresAt time.Time `json:"expiresAt"` // Zero value means no expiry
	Rounds    []Round   `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"rounds"`
}
