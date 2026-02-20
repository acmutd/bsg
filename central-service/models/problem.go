package models

type Problem struct {
	ID          uint   `gorm:"primarykey" json:"id"`
	Name        string `gorm:"unique" json:"name"`
	Slug        string `gorm:"unique" json:"slug"`
	Description string `json:"description"`
	Hints       string `json:"hints"`
	Difficulty  string `json:"difficulty"`
	IsPaid      bool   `json:"isPaid"`
}
