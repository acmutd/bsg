package models

// ProblemCompanyStat mirrors ProblemTagStat but aggregates by company
// instead of tag, so the client can populate a company filter dropdown
// with per-difficulty counts.
type ProblemCompanyStat struct {
	ID          uint   `json:"id"`
	Company     string `gorm:"uniqueIndex;size:128" json:"company"`
	TotalCount  int    `json:"totalCount"`
	EasyCount   int    `json:"easyCount"`
	MediumCount int    `json:"mediumCount"`
	HardCount   int    `json:"hardCount"`
}
