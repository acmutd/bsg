package models

// ProblemCompanyTag records that a Problem was asked by a given Company,
// sourced from https://github.com/liquidslr/leetcode-company-wise-problems.
// Windows holds the subset of that repo's time windows (e.g. "ThirtyDays",
// "SixMonths", "All") the pairing appeared in, so recency filtering can be
// added later without re-seeding.
type ProblemCompanyTag struct {
	ID        uint `json:"id"`
	ProblemID uint `gorm:"uniqueIndex:idx_problem_company;not null" json:"problemId"`
	// The composite unique index above leads with problem_id, so it can't serve
	// lookups by company alone. Filters query LOWER(company), which needs a
	// matching expression index to be used at all.
	Company   string   `gorm:"uniqueIndex:idx_problem_company;index:idx_company_lower,expression:lower(company);size:128;not null" json:"company"`
	Frequency float64  `json:"frequency"`
	Windows   []string `gorm:"serializer:json" json:"windows"`
}
