package controllers

import (
	"net/http"

	"github.com/acmutd/bsg/central-service/services"
	"github.com/acmutd/bsg/central-service/utils"
	"github.com/labstack/echo/v4"
)

type StatisticsController struct {
	statsService *services.Statistics
	roomService  *services.RoomService
	logger       *utils.StructuredLogger
}

func InitializeStatisticsController(s *services.Statistics, r *services.RoomService, l *utils.StructuredLogger) StatisticsController {
	return StatisticsController{s, r, l}
}

func (controller *StatisticsController) GetStatistics(c echo.Context) error {

	userAuthID := c.Get("userAuthID").(string)
	roomName := c.Param("roomID")

	userStats, err := controller.statsService.GetUserScore(userAuthID, roomName)
	if err != nil {
		controller.logger.Error("Unable to get user statistics", err, map[string]interface{}{
			"user_id":   userAuthID,
			"room_name": roomName,
		})
		if err, ok := err.(services.BSGError); ok {
			return echo.NewHTTPError(err.StatusCode, "Failed to fetch user stats"+err.Error())
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to fetch statistics information. Please try again")
	}
	return c.JSON(http.StatusOK, map[string]services.UserStatistics{
		"data": userStats,
	})

}

type UpdateStatisticsRequest struct {
	Runtime    int    `json:"runtime"`
	Difficulty string `json:"difficulty"`
}

func (controller *StatisticsController) UpdateStatistics(c echo.Context) error {
	userAuthID := c.Get("userAuthID").(string)
	roomName := c.Param("roomID")

	var req UpdateStatisticsRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid request body")
	}

	scored, err := controller.statsService.CalculateScore(req.Runtime, req.Difficulty)
	if err != nil {
		if bsgErr, ok := err.(services.BSGError); ok {
			return echo.NewHTTPError(bsgErr.StatusCode, bsgErr.Error())
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to calculate score")
	}

	if err := controller.statsService.UpdateUserScore(userAuthID, roomName, scored.TotalScore); err != nil {
		controller.logger.Error("Unable to update user statistics", err, map[string]interface{}{
			"user_id":   userAuthID,
			"room_name": roomName,
		})
		if bsgErr, ok := err.(services.BSGError); ok {
			return echo.NewHTTPError(bsgErr.StatusCode, bsgErr.Error())
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to update statistics")
	}

	return c.JSON(http.StatusOK, map[string]services.UserStatistics{
		"data": scored,
	})
}

func (controller *StatisticsController) InitializeRoutes(g *echo.Group) {
	g.GET("/:roomID", controller.GetStatistics)
	g.POST("/:roomID/update", controller.UpdateStatistics)
}
