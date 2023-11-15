package controllers

import (
	"fmt"
	"log"
	"net/http"
	"strconv"

	"github.com/acmutd/bsg/central-service/models"
	"github.com/acmutd/bsg/central-service/services"
	"github.com/labstack/echo/v4"
)

type ProblemController struct {
	problemService *services.ProblemService
}

func InitializeProblemController(service *services.ProblemService) ProblemController {
	return ProblemController{service}
}

// An endpoint containing logic used to find problem based on problem id
func (controller *ProblemController) FindProblemByProblemIDEndpoint(c echo.Context) error {
	targetProblemID := c.QueryParam("problemId")
	if targetProblemID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "Target problem ID required")
	}
	uintProblemID, err := stringToUint(targetProblemID)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid problem ID specified")
	}
	searchedProblem, err := controller.problemService.FindProblemByProblemID(uintProblemID)
	if searchedProblem == nil {
		msg := fmt.Sprintf("Problem with id %s not found", targetProblemID)
		return echo.NewHTTPError(http.StatusBadRequest, msg)
	}
	if err != nil {
		log.Printf("Problem service failed to search for problem %s: %v\n", targetProblemID, err)
		return echo.NewHTTPError(http.StatusInternalServerError)
	}
	return c.JSON(http.StatusOK, map[string]models.Problem{
		"data": *searchedProblem,
	})
}

func (controller *ProblemController) InitializeRoutes(g *echo.Group) {
	g.GET("/", controller.FindProblemByProblemIDEndpoint)
}

func stringToUint(s string) (uint, error) {
	i, err := strconv.Atoi(s)
	if err != nil {
		return 0, err
	}
	return uint(i), nil
}
