package models

import "github.com/google/uuid"

type Room struct {
	ID     uuid.UUID `gorm:"primaryKey" json:"id"`
	ShortCode string `gorm:"uniqueIndex;not null" json:"shortCode"`
	Admin  string    `gorm:"not null" json:"adminId"`
	Name   string    `json:"roomName"`
	Rounds []Round   `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"rounds"`
}
