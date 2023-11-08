package models

type Participant struct {
	ID           uint   `gorm:"primaryKey" json:"id"`
	UserID       uint   `json:"userId"`
	User         User   `gorm:"references:ID" json:"user"`
}