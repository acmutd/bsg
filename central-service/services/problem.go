package services

import (
	"github.com/acmutd/bsg/central-service/models"
	"gorm.io/gorm"
)

type ProblemService struct {
	db *gorm.DB
}

func InitializeProblemService(db *gorm.DB) ProblemService {
	return ProblemService{db}
}

func (service *ProblemService) CreateProblem(problemData *models.Problem) (*models.Problem, error) {
	newProblem := models.Problem{
		Name:        problemData.Name,
		Description: problemData.Description,
		Hints:       problemData.Hints,
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
	if searchResult == nil {
		return nil, gorm.ErrRecordNotFound
	}
	if err != nil {
		return nil, err
	}
	updateResult := service.db.Model(searchResult).Updates(problemData)
	if updateResult.Error != nil {
		return nil, updateResult.Error
	}
	return searchResult, nil
}
