package models

type RoundSubmission struct {
	ID uint `gorm:"primaryKey"`
	RoundID uint
	RoundParticipantID uint
	Score uint `json:"score"`
	Submission Submission `gorm:"polymorphic:SubmissionOwner;"`
	Round Round `gorm:"foreignKey:RoundID"`
	RoundParticipant RoundParticipant `gorm:"foreignKey:RoundParticipantID"`
}