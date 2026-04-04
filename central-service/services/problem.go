package services

import (
	"fmt"
	"strings"

	"github.com/acmutd/bsg/central-service/constants"
	"github.com/acmutd/bsg/central-service/models"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type ProblemService struct {
	db *gorm.DB
}

type DifficultyParameter struct {
	NumEasyProblems   int
	NumMediumProblems int
	NumHardProblems   int
	Tags              []string
}

func InitializeProblemService(db *gorm.DB) ProblemService {
	return ProblemService{db}
}

func (service *ProblemService) CreateProblem(problemData *models.Problem) (*models.Problem, error) {
	newProblem := models.Problem{
		Name:       problemData.Name,
		Slug:       problemData.Slug,
		Tags:       problemData.Tags,
		Difficulty: problemData.Difficulty,
		IsPaid:     problemData.IsPaid,
	}
	result := service.db.Create(&newProblem)
	if result.Error != nil {
		return nil, result.Error
	}
	return &newProblem, nil
}

// Function to find problem by id
func (service *ProblemService) FindProblemByProblemID(problemId uint) (*models.Problem, error) {
	var problem models.Problem
	searchResult := service.db.Where("ID = ?", problemId).Limit(1).Find(&problem)
	if searchResult.Error != nil {
		return nil, searchResult.Error
	}
	if searchResult.RowsAffected == 0 {
		return nil, nil
	}
	return &problem, nil
}

// Function to update problem with specified id
func (service *ProblemService) UpdateProblemData(problemId uint, problemData *models.Problem) (*models.Problem, error) {
	searchResult, err := service.FindProblemByProblemID(problemId)
	if err != nil {
		return nil, err
	}
	if searchResult == nil {
		return nil, gorm.ErrRecordNotFound
	}
	updateResult := service.db.Model(searchResult).Updates(problemData)
	if updateResult.Error != nil {
		return nil, updateResult.Error
	}
	return searchResult, nil
}

func (service *ProblemService) FindProblems(count uint, offset uint, tags []string) ([]models.Problem, error) {
	var problems []models.Problem
	count = min(count, 100) // count should not exceed 100
	query := service.db.Limit(int(count)).Offset(int(offset))

	normalizedTags := normalizeTags(tags)
	for _, tag := range normalizedTags {
		query = query.Where("LOWER(tags) LIKE ?", "%\""+strings.ToLower(escapeLikePattern(tag))+"\"%")
	}

	searchResult := query.Find(&problems)
	if searchResult.Error != nil {
		return nil, searchResult.Error
	}
	return problems, nil
}

func normalizeTags(tags []string) []string {
	normalizedTags := make([]string, 0, len(tags))
	for _, tag := range tags {
		trimmedTag := strings.TrimSpace(tag)
		if trimmedTag == "" {
			continue
		}
		normalizedTags = append(normalizedTags, trimmedTag)
	}
	return normalizedTags
}

func escapeLikePattern(pattern string) string {
	replacer := strings.NewReplacer(`\\`, `\\\\`, `%`, `\\%`, `_`, `\\_`)
	return replacer.Replace(pattern)
}

func (service *ProblemService) GenerateProblemsetByDifficultyParameters(params DifficultyParameter) ([]models.Problem, error) {
	var problems, easyProblems, mediumProblems, hardProblems []models.Problem
	normalizedTags := normalizeTags(params.Tags)
	requestedTotal := params.NumEasyProblems + params.NumMediumProblems + params.NumHardProblems
	err := service.db.Transaction(func(tx *gorm.DB) error {
		easyQuery := tx.Clauses(clause.OrderBy{
			Expression: clause.Expr{
				SQL: "RANDOM()",
			},
		}).Where("difficulty = ? AND is_paid = ?", constants.DIFFICULTY_EASY, false)
		easyQuery = applyTagFilters(easyQuery, normalizedTags)
		if err := easyQuery.Limit(params.NumEasyProblems).Find(&easyProblems).Error; err != nil {
			return err
		}

		mediumQuery := tx.Clauses(clause.OrderBy{
			Expression: clause.Expr{
				SQL: "RANDOM()",
			},
		}).Where("difficulty = ? AND is_paid = ?", constants.DIFFICULTY_MEDIUM, false)
		mediumQuery = applyTagFilters(mediumQuery, normalizedTags)
		if err := mediumQuery.Limit(params.NumMediumProblems).Find(&mediumProblems).Error; err != nil {
			return err
		}

		hardQuery := tx.Clauses(clause.OrderBy{
			Expression: clause.Expr{
				SQL: "RANDOM()",
			},
		}).Where("difficulty = ? AND is_paid = ?", constants.DIFFICULTY_HARD, false)
		hardQuery = applyTagFilters(hardQuery, normalizedTags)
		if err := hardQuery.Limit(params.NumHardProblems).Order(clause.Expr{
			SQL: "RANDOM()",
		}).Find(&hardProblems).Error; err != nil {
			return err
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	problems = append(easyProblems, mediumProblems...)
	problems = append(problems, hardProblems...)

	// If exact per-difficulty selection is not possible, keep tag filter and fill remaining slots from any difficulty.
	if len(problems) < requestedTotal {
		missing := requestedTotal - len(problems)
		selectedIDs := make([]uint, 0, len(problems))
		for _, problem := range problems {
			selectedIDs = append(selectedIDs, problem.ID)
		}

		var fallbackProblems []models.Problem
		fallbackQuery := service.db.Clauses(clause.OrderBy{
			Expression: clause.Expr{SQL: "RANDOM()"},
		}).Where("is_paid = ?", false)
		fallbackQuery = applyTagFilters(fallbackQuery, normalizedTags)
		if len(selectedIDs) > 0 {
			fallbackQuery = fallbackQuery.Where("id NOT IN ?", selectedIDs)
		}
		if err := fallbackQuery.Limit(missing).Find(&fallbackProblems).Error; err != nil {
			return nil, err
		}
		problems = append(problems, fallbackProblems...)
	}

	if len(problems) < requestedTotal {
		return nil, BSGError{
			StatusCode: 400,
			Message: fmt.Sprintf(
				"Not enough tagged problems found. requested_total=%d found_total=%d requested={easy:%d,medium:%d,hard:%d} found={easy:%d,medium:%d,hard:%d} tags=%v",
				requestedTotal,
				len(problems),
				params.NumEasyProblems,
				params.NumMediumProblems,
				params.NumHardProblems,
				len(easyProblems),
				len(mediumProblems),
				len(hardProblems),
				normalizedTags,
			),
		}
	}

	return problems, nil
}

func applyTagFilters(query *gorm.DB, tags []string) *gorm.DB {
	for _, tag := range tags {
		query = query.Where("LOWER(tags) LIKE ?", "%\""+strings.ToLower(escapeLikePattern(tag))+"\"%")
	}
	return query
}

func (service *ProblemService) DetermineScoreForProblem(problem *models.Problem) uint {
	if problem.Difficulty == constants.DIFFICULTY_EASY {
		return 3
	}

	if problem.Difficulty == constants.DIFFICULTY_MEDIUM {
		return 4
	}

	return 5
}

func (service *ProblemService) FindProblemBySlug(slug string) (*models.Problem, error) {
	var problem models.Problem
	result := service.db.Where("slug = ?", slug).Limit(1).Find(&problem)
	if result.Error != nil {
		return nil, result.Error
	}
	if result.RowsAffected == 0 {
		return nil, nil // Not found
	}
	return &problem, nil
}

func (service *ProblemService) FindProblemTagStats() ([]models.ProblemTagStat, error) {
	var stats []models.ProblemTagStat
	result := service.db.Order("total_count DESC").Order("tag ASC").Find(&stats)
	if result.Error != nil {
		return nil, result.Error
	}
	return stats, nil
}
