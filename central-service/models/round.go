package models

import (
	"time"

	"github.com/google/uuid"
)

type Round struct {
	ID               uint `gorm:"primaryKey" json:"id"`
	LastUpdatedTime  time.Time
	Duration         int       `json:"duration"` // Duration in minutes
	RoomID           uuid.UUID `json:"roomID"`
	Status           string
	ProblemSet       []Problem `gorm:"many2many:round_problems;" json:"problems"`
	RoundSubmissions []RoundSubmission
}
