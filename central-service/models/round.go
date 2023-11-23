package models

import "github.com/google/uuid"

type Round struct {
	ID       uint `gorm:"primaryKey" json:"id"`
	Duration int
	RoomID   uuid.UUID
}
