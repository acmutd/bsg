package models

type RoundSubmission struct {
	ID                 uint `gorm:"primaryKey"`
	RoundID            uint
	RoundParticipantID uint
	Score              uint       `json:"score"`
	Submission         Submission `gorm:"polymorphic:SubmissionOwner;"`
}
