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

func (controller *StatisticsController) InitializeRoutes(g *echo.Group) {
	g.GET("/:roomID", controller.GetStatistics)

}
