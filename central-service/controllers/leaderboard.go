package controllers

import (
	"net/http"
	"strconv"
	"github.com/acmutd/bsg/central-service/services"
	"github.com/labstack/echo/v4"
)

type LeaderboardController struct {
	service *services.LeaderboardService
}

func InitializeLeaderboardController(s *services.LeaderboardService) LeaderboardController {
	return LeaderboardController{s}
}

func (ctrl *LeaderboardController) GetLeaderboard(c echo.Context) error {
	limit, _ := strconv.Atoi(c.QueryParam("limit"))
	if limit <= 0 { limit = 10 }

	data, err := ctrl.service.GetTopUsers(limit)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to fetch leaderboard")
	}
	return c.JSON(http.StatusOK, map[string]interface{}{"data": data})
}

func (ctrl *LeaderboardController) InitializeRoutes(g *echo.Group) {
	g.GET("/", ctrl.GetLeaderboard)
}