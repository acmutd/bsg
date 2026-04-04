package models

type Problem struct {
	ID         uint     `json:"id"`
	Name       string   `gorm:"unique" json:"name"`
	Slug       string   `gorm:"unique" json:"slug"`
	Tags       []string `gorm:"serializer:json" json:"tags"`
	Difficulty string   `json:"difficulty"`
	IsPaid     bool     `json:"isPaid"`
}
