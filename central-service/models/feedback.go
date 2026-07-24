package models

import "time"

type Feedback struct {
    ID           uint      `gorm:"primaryKey" json:"id"`
    UserAuthID   string    `json:"userAuthID"`
    FeedbackText string    `json:"feedbackText"`
    CreatedAt    time.Time `json:"createdAt"`
    UpdatedAt    time.Time `json:"updatedAt"`
}