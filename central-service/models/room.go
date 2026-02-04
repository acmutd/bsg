package models

type Room struct {
	ID     string  `gorm:"primaryKey" json:"id"`
	Admin  string  `gorm:"not null" json:"adminId"`
	Name   string  `json:"roomName"`
	Rounds []Round `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"rounds"`
}
