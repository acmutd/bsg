package models

type Submission struct {
	ID uint `gorm:"primaryKey" json:"id"`
	Code string `json:"code"`
	Language string `json:"language"`
	ProblemID uint `json:"problemID"`
	Verdict string `json:"verdict"`
	ExecutionTime uint `json:"executionTime"`
	SubmissionOwnerID uint
	SubmissionOwnerType string
}