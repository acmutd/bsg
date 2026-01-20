package models

type Leaderboard struct {
	ID          uint `gorm:"primaryKey" json:"id"`
	UserID      uint `gorm:"uniqueIndex;not null" json:"userId"`
	User        User `gorm:"foreignKey:UserID" json:"-"`
	EasySolved  uint `gorm:"default:0" json:"easySolved"`
	MediumSolved uint `gorm:"default:0" json:"mediumSolved"`
	HardSolved  uint `gorm:"default:0" json:"hardSolved"`
	TotalScore  uint `gorm:"default:0" json:"totalScore"` // can perform some kind of calculation based on problems solved
}