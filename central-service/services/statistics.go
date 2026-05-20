package services

import (
	"gorm.io/gorm"
)

type StatisticsService struct {
	db *gorm.DB
}

func InitializeStatisticService(db *gorm.DB) StatisticsService {
	return StatisticsService{db}
}
