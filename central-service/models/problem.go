package models

type Problem struct {
	ID          uint   `gorm:"primarykey" json:"id"`
	Name        string `gorm:"unique" json:"name"`
	Description string `json:"description"`
	Hints       string `json:"hints"`
}
