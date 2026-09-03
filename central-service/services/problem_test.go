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

	results, err := service.FindProblems(10, 0, nil, []string{"Google"})
	assert.NoError(t, err)
	assert.Len(t, results, 1)
	assert.Equal(t, "two-sum", results[0].Slug)

	// Filter is case-insensitive.
	results, err = service.FindProblems(10, 0, nil, []string{"google"})
	assert.NoError(t, err)
	assert.Len(t, results, 1)

	// Multiple companies are OR'd together.
	results, err = service.FindProblems(10, 0, nil, []string{"Google", "Meta"})
	assert.NoError(t, err)
	assert.Len(t, results, 2)

	// A company with no matches returns nothing.
	results, err = service.FindProblems(10, 0, nil, []string{"Netflix"})
	assert.NoError(t, err)
	assert.Len(t, results, 0)

	// No company filter returns everything.
	results, err = service.FindProblems(10, 0, nil, nil)
	assert.NoError(t, err)
	assert.Len(t, results, 3)
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
