package models

import (
	"time"

	"github.com/google/uuid"
)

type Round struct {
	ID       uint `gorm:"primaryKey" json:"id"`
	LastUpdatedTime time.Time
	Duration int
	RoomID   uuid.UUID
	Status	 string
}
