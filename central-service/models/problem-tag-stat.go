package models

type ProblemTagStat struct {
	ID          uint   `json:"id"`
	Tag         string `gorm:"uniqueIndex;size:128" json:"tag"`
	TotalCount  int    `json:"totalCount"`
	EasyCount   int    `json:"easyCount"`
	MediumCount int    `json:"mediumCount"`
	HardCount   int    `json:"hardCount"`
}
