package services

import (
	"math"
	"strings"

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
	TotalScore float64 `json:"score"`
}

func (service *Statistics) CalculateScore(runtime int, difficulty string) (UserStatistics, error) {
	difficultString := strings.ToLower(difficulty)

	var score float64

	if difficultString == "easy" {
		score = 100 * math.Exp(-0.001*float64(runtime))

	} else if difficultString == "medium" {
		score = 200 * math.Exp(-0.001*float64(runtime))

	} else if difficultString == "hard" {
		score = 300 * math.Exp(-0.001*float64(runtime))

	} else {
		return UserStatistics{}, BSGError{422, "Invalid difficulty string"}
	}

	finalScore := math.Round(score)

	return UserStatistics{finalScore}, nil
}

// Update the user score in the db by adding newScore to the existing score
func (service *Statistics) UpdateUserScore(currentUser string, roomName string, newScore float64) error {
	existing, err := service.GetUserScore(currentUser, roomName)
	if err != nil {
		return BSGError{404, "Could not find statistics data for this user"}
	}

	userStats := models.Statistics{
		UserID:     currentUser,
		RoomID:     roomName,
		TotalScore: existing.TotalScore + newScore,
	}

	result := service.db.Save(&userStats)
	if result.Error != nil {
		return result.Error
	}
	return nil
}

// function to find the UserScore from the db
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
