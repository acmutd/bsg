package models

type Problem struct {
	ID            uint     `json:"id"`
	Name          string   `gorm:"unique" json:"name"`
	Slug          string   `gorm:"unique" json:"slug"`
	Tags          []string `gorm:"serializer:json" json:"tags"`
	Difficulty    string   `gorm:"index" json:"difficulty"`
	IsPaid        bool     `json:"isPaid"`
	IsBlind75     bool     `gorm:"column:is_blind75;index" json:"isBlind75"`
	IsNeetCode150 bool     `gorm:"column:is_neetcode150;index" json:"isNeetCode150"`
}
