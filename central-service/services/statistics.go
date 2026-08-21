package services

import (
	"math"
	"strings"

	"github.com/acmutd/bsg/central-service/constants"
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

// scoreForSubmission is the source of truth for "actual points" awarded for an
// accepted submission. It is shared by the statistics endpoint (CalculateScore)
// and the live round leaderboard so both report identical values.
// Speed only influences the last 10% of the difficulty's base points, so judge
// runtime variance cannot swing scores meaningfully:
//
//	score = base * (0.9 + 0.1 * e^(-0.001 * runtime))
func scoreForSubmission(runtime uint, difficulty string) (uint, error) {
	var base float64

	switch strings.ToLower(difficulty) {
	case constants.DIFFICULTY_EASY:
		base = 100
	case constants.DIFFICULTY_MEDIUM:
		base = 200
	case constants.DIFFICULTY_HARD:
		base = 300
	default:
		return 0, BSGError{422, "Invalid difficulty string"}
	}

	speedFactor := 0.9 + 0.1*math.Exp(-0.001*float64(runtime))
	return uint(math.Round(base * speedFactor)), nil
}

func (service *Statistics) CalculateScore(runtime int, difficulty string) (UserStatistics, error) {
	score, err := scoreForSubmission(uint(runtime), difficulty)
	if err != nil {
		return UserStatistics{}, err
	}
	return UserStatistics{float64(score)}, nil
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
