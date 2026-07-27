package models

import "time"

type Rating struct {
	Rating int `json:"rating"`
	UserID uint `json:"userID"`
	SubmissionTimestamp time.Time `json:"submissionTimestamp"`
}