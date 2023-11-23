package models

type RoundParticipant struct {
	ID                 uint `gorm:"primaryKey" json:"id"`
	ParticipantAuthID      string
	RoundID            uint
	SolvedProblemCount uint
	Score              uint
}
