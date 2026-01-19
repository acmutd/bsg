package services

import (
	"github.com/acmutd/bsg/central-service/models"
	"gorm.io/gorm"
)

type LeaderboardService struct {
	db *gorm.DB
}

func InitializeLeaderboardService(db *gorm.DB) LeaderboardService {
	return LeaderboardService{db}
}

func (s *LeaderboardService) GetTopUsers(limit int) ([]models.Leaderboard, error) {
	var leaderboard []models.Leaderboard
	// Preload "User" to get handle/name info for the UI
	err := s.db.Preload("User").Order("total_score DESC").Limit(limit).Find(&leaderboard).Error
	return leaderboard, err
}