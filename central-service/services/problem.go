package services

import (
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
}

func InitializeProblemService(db *gorm.DB) ProblemService {
	return ProblemService{db}
}

func (service *ProblemService) CreateProblem(problemData *models.Problem) (*models.Problem, error) {
	newProblem := models.Problem{
		Name:        problemData.Name,
		Slug:        problemData.Slug,
		Description: problemData.Description,
		Hints:       problemData.Hints,
		Difficulty:  problemData.Difficulty,
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

func (service *ProblemService) FindProblems(count uint, offset uint) ([]models.Problem, error) {
	var problems []models.Problem
	count = min(count, 100) // count should not exceed 100
	searchResult := service.db.Limit(int(count)).Offset(int(offset)).Find(&problems)
	if searchResult.Error != nil {
		return nil, searchResult.Error
	}
	return problems, nil
}

func (service *ProblemService) GenerateProblemsetByDifficultyParameters(params DifficultyParameter) ([]models.Problem, error) {
	var problems, easyProblems, mediumProblems, hardProblems []models.Problem
	err := service.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Clauses(clause.OrderBy{
			Expression: clause.Expr{
				SQL: "RANDOM()",
			},
		}).Where("difficulty = ? AND is_paid = ?", constants.DIFFICULTY_EASY, false).Limit(params.NumEasyProblems).Find(&easyProblems).Error; err != nil {
			return err
		}
		if err := tx.Clauses(clause.OrderBy{
			Expression: clause.Expr{
				SQL: "RANDOM()",
			},
		}).Where("difficulty = ? AND is_paid = ?", constants.DIFFICULTY_MEDIUM, false).Limit(params.NumMediumProblems).Find(&mediumProblems).Error; err != nil {
			return err
		}
		if err := tx.Clauses(clause.OrderBy{
			Expression: clause.Expr{
				SQL: "RANDOM()",
			},
		}).Where("difficulty = ? AND is_paid = ?", constants.DIFFICULTY_HARD, false).Limit(params.NumHardProblems).Order(clause.Expr{
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
	return problems, nil
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
