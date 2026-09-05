package services

import (
	"testing"

	"github.com/acmutd/bsg/central-service/constants"
	"github.com/acmutd/bsg/central-service/models"
	"github.com/stretchr/testify/assert"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupProblemTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Skip("Database setup not available for testing")
	}
	if err := db.AutoMigrate(&models.Problem{}, &models.ProblemCompanyTag{}); err != nil {
		t.Skip("Database setup not available for testing")
	}
	return db
}

func seedProblemWithCompanies(t *testing.T, db *gorm.DB, name, slug, difficulty string, companies ...string) models.Problem {
	problem := models.Problem{Name: name, Slug: slug, Difficulty: difficulty}
	if err := db.Create(&problem).Error; err != nil {
		t.Fatalf("failed to seed problem %s: %v", slug, err)
	}
	for _, company := range companies {
		tag := models.ProblemCompanyTag{ProblemID: problem.ID, Company: company}
		if err := db.Create(&tag).Error; err != nil {
			t.Fatalf("failed to seed company tag %s/%s: %v", slug, company, err)
		}
	}
	return problem
}

func TestFindProblemsFiltersByCompany(t *testing.T) {
	db := setupProblemTestDB(t)
	service := InitializeProblemService(db)

	seedProblemWithCompanies(t, db, "Two Sum", "two-sum", constants.DIFFICULTY_EASY, "Google", "Amazon")
	seedProblemWithCompanies(t, db, "Add Two Numbers", "add-two-numbers", constants.DIFFICULTY_MEDIUM, "Meta")
	seedProblemWithCompanies(t, db, "Median of Two Sorted Arrays", "median-of-two-sorted-arrays", constants.DIFFICULTY_HARD)

	results, err := service.FindProblems(10, 0, nil, []string{"Google"}, false, false, false)
	assert.NoError(t, err)
	assert.Len(t, results, 1)
	assert.Equal(t, "two-sum", results[0].Slug)

	// Filter is case-insensitive.
	results, err = service.FindProblems(10, 0, nil, []string{"google"}, false, false, false)
	assert.NoError(t, err)
	assert.Len(t, results, 1)

	// Multiple companies are OR'd together.
	results, err = service.FindProblems(10, 0, nil, []string{"Google", "Meta"}, false, false, false)
	assert.NoError(t, err)
	assert.Len(t, results, 2)

	// A company with no matches returns nothing.
	results, err = service.FindProblems(10, 0, nil, []string{"Netflix"}, false, false, false)
	assert.NoError(t, err)
	assert.Len(t, results, 0)

	// No company filter returns everything.
	results, err = service.FindProblems(10, 0, nil, nil, false, false, false)
	assert.NoError(t, err)
	assert.Len(t, results, 3)
}

func TestFindProblemsRecentlyAskedFilter(t *testing.T) {
	db := setupProblemTestDB(t)
	service := InitializeProblemService(db)

	thirtyDays := models.Problem{Name: "Thirty Days", Slug: "thirty-days", Difficulty: constants.DIFFICULTY_EASY}
	sixMonths := models.Problem{Name: "Six Months", Slug: "six-months", Difficulty: constants.DIFFICULTY_EASY}
	old := models.Problem{Name: "Old", Slug: "old", Difficulty: constants.DIFFICULTY_EASY}
	db.Create(&thirtyDays)
	db.Create(&sixMonths)
	db.Create(&old)

	db.Create(&models.ProblemCompanyTag{ProblemID: thirtyDays.ID, Company: "Google", Windows: []string{"ThirtyDays", "All"}})
	db.Create(&models.ProblemCompanyTag{ProblemID: sixMonths.ID, Company: "Google", Windows: []string{"SixMonths", "All"}})
	db.Create(&models.ProblemCompanyTag{ProblemID: old.ID, Company: "Google", Windows: []string{"MoreThanSixMonths", "All"}})

	// Recently asked (last 6 months) includes ThirtyDays and SixMonths, excludes the
	// MoreThanSixMonths-only problem.
	results, err := service.FindProblems(10, 0, nil, []string{"Google"}, false, false, true)
	assert.NoError(t, err)
	assert.Len(t, results, 2)
	slugs := []string{results[0].Slug, results[1].Slug}
	assert.Contains(t, slugs, "thirty-days")
	assert.Contains(t, slugs, "six-months")

	// Without recentlyAsked, all three match.
	results, err = service.FindProblems(10, 0, nil, []string{"Google"}, false, false, false)
	assert.NoError(t, err)
	assert.Len(t, results, 3)

	// recentlyAsked with no company selected is a no-op (ignored).
	results, err = service.FindProblems(10, 0, nil, nil, false, false, true)
	assert.NoError(t, err)
	assert.Len(t, results, 3)
}

// TestGenerateProblemsetRecentlyAskedFallsBackGracefully covers the bug fix: when the
// recently-asked pool can't satisfy the requested count on its own, the round should
// still be created by falling back to an older problem from the same company, rather
// than failing outright.
func TestGenerateProblemsetRecentlyAskedFallsBackGracefully(t *testing.T) {
	db := setupProblemTestDB(t)
	service := InitializeProblemService(db)

	recent := models.Problem{Name: "Recent", Slug: "recent", Difficulty: constants.DIFFICULTY_EASY}
	old := models.Problem{Name: "Old", Slug: "old", Difficulty: constants.DIFFICULTY_EASY}
	db.Create(&recent)
	db.Create(&old)

	db.Create(&models.ProblemCompanyTag{ProblemID: recent.ID, Company: "Google", Windows: []string{"ThirtyDays", "All"}})
	db.Create(&models.ProblemCompanyTag{ProblemID: old.ID, Company: "Google", Windows: []string{"MoreThanSixMonths", "All"}})

	// Only 1 problem is recently-asked for Google, but 2 are requested - should still
	// succeed by falling back to the older Google problem, not error out.
	problems, fallbackUsed, err := service.GenerateProblemsetByDifficultyParameters(DifficultyParameter{
		NumEasyProblems: 2,
		Companies:       []string{"Google"},
		RecentlyAsked:   true,
	})
	assert.NoError(t, err)
	assert.True(t, fallbackUsed)
	assert.Len(t, problems, 2)
	slugs := []string{problems[0].Slug, problems[1].Slug}
	assert.Contains(t, slugs, "recent")
	assert.Contains(t, slugs, "old")
}

func TestFindProblemsFiltersByCuratedList(t *testing.T) {
	db := setupProblemTestDB(t)
	service := InitializeProblemService(db)

	db.Create(&models.Problem{Name: "Two Sum", Slug: "two-sum", Difficulty: constants.DIFFICULTY_EASY, IsBlind75: true})
	db.Create(&models.Problem{Name: "Valid Anagram", Slug: "valid-anagram", Difficulty: constants.DIFFICULTY_EASY, IsNeetCode150: true})
	db.Create(&models.Problem{Name: "Both Lists", Slug: "both-lists", Difficulty: constants.DIFFICULTY_EASY, IsBlind75: true, IsNeetCode150: true})
	db.Create(&models.Problem{Name: "Neither List", Slug: "neither-list", Difficulty: constants.DIFFICULTY_EASY})

	// Blind 75 only.
	results, err := service.FindProblems(10, 0, nil, nil, true, false, false)
	assert.NoError(t, err)
	assert.Len(t, results, 2)

	// NeetCode 150 only.
	results, err = service.FindProblems(10, 0, nil, nil, false, true, false)
	assert.NoError(t, err)
	assert.Len(t, results, 2)

	// Both selected is OR, not AND - matches either list.
	results, err = service.FindProblems(10, 0, nil, nil, true, true, false)
	assert.NoError(t, err)
	assert.Len(t, results, 3)

	// Neither selected returns everything.
	results, err = service.FindProblems(10, 0, nil, nil, false, false, false)
	assert.NoError(t, err)
	assert.Len(t, results, 4)
}

func TestGenerateProblemsetByDifficultyParametersFiltersByCompany(t *testing.T) {
	db := setupProblemTestDB(t)
	service := InitializeProblemService(db)

	seedProblemWithCompanies(t, db, "Two Sum", "two-sum", constants.DIFFICULTY_EASY, "Google")
	seedProblemWithCompanies(t, db, "Valid Parentheses", "valid-parentheses", constants.DIFFICULTY_EASY, "Amazon")
	seedProblemWithCompanies(t, db, "Add Two Numbers", "add-two-numbers", constants.DIFFICULTY_MEDIUM, "Google")

	problems, fallbackUsed, err := service.GenerateProblemsetByDifficultyParameters(DifficultyParameter{
		NumEasyProblems:   1,
		NumMediumProblems: 1,
		Companies:         []string{"Google"},
	})
	assert.NoError(t, err)
	assert.False(t, fallbackUsed)
	assert.Len(t, problems, 2)
	for _, p := range problems {
		assert.Contains(t, []string{"two-sum", "add-two-numbers"}, p.Slug)
	}

	// Requesting more Amazon-tagged easy problems than exist should error rather
	// than silently pulling in the Google-tagged one.
	_, _, err = service.GenerateProblemsetByDifficultyParameters(DifficultyParameter{
		NumEasyProblems: 2,
		Companies:       []string{"Amazon"},
	})
	assert.Error(t, err)
}

func TestGenerateProblemsetAnyDifficulty(t *testing.T) {
	db := setupProblemTestDB(t)
	service := InitializeProblemService(db)

	seedProblemWithCompanies(t, db, "Two Sum", "two-sum", constants.DIFFICULTY_EASY, "Google")
	seedProblemWithCompanies(t, db, "Add Two Numbers", "add-two-numbers", constants.DIFFICULTY_MEDIUM, "Google")
	seedProblemWithCompanies(t, db, "Median of Two Sorted Arrays", "median-of-two-sorted-arrays", constants.DIFFICULTY_HARD, "Google")
	seedProblemWithCompanies(t, db, "Unrelated", "unrelated", constants.DIFFICULTY_EASY, "Meta")

	// Any-difficulty ignores difficulty entirely but still respects company.
	problems, fallbackUsed, err := service.GenerateProblemsetAnyDifficulty(3, nil, []string{"Google"}, false, false, false)
	assert.NoError(t, err)
	assert.False(t, fallbackUsed)
	assert.Len(t, problems, 3)
	for _, p := range problems {
		assert.NotEqual(t, "unrelated", p.Slug)
	}

	// Requesting more than exist for the company should error, same as the
	// per-difficulty path.
	_, _, err = service.GenerateProblemsetAnyDifficulty(4, nil, []string{"Google"}, false, false, false)
	assert.Error(t, err)
}
