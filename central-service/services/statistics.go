package services

import (
	"github.com/acmutd/bsg/central-service/models"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

type Statistics struct {
	db        *gorm.DB
	rdb       *redis.Client
	rtcClient *RTCClient
}

func InitializeStatisticService(db *gorm.DB, rdb *redis.Client, rtcClient *RTCClient) Statistics {
	return Statistics{db, rdb, rtcClient}
}

type UserStatistics struct {
	TotalScore uint `json:"score"`
}

func (service *Statistics) UpdateUserScore(currentUser string, roomName string, score uint) error {

	userStats := models.Statistics{
		UserID:     currentUser,
		RoomID:     roomName,
		TotalScore: score,
	}

	result := service.db.Save(&userStats)
	if result.Error != nil {
		return result.Error
	}
	return nil
}

// function to find the UserScore
func (service *Statistics) GetUserScore(currentUser string, roomName string) (UserStatistics, error) {

	var user models.Statistics
	//first validate if user exist and is inside of room
	result := service.db.Where("user_id = ?", currentUser).Where("room_id = ?", roomName).Find(&user)
	if result.Error != nil {
		return UserStatistics{}, result.Error
	}

	//user exist lets find their score
	return UserStatistics{user.TotalScore}, nil

}
