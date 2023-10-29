package models

type Round struct {
	ID       uint `gorm:"primaryKey" json:"id"`
	Duration int
}
