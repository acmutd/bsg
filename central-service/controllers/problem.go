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
	targetProblemID := c.Param("id")
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

// An endpoint containing logic used fetch all problems (with pagination)
func (controller *ProblemController) FindProblemsEndpoint(c echo.Context) error {
	count := OptionalQueryParamUInt(c, "count", 10)
	offset := OptionalQueryParamUInt(c, "offset", 0)
	problems, err := controller.problemService.FindProblems(count, offset)
	if err != nil {
		log.Printf("Problem service failed to search for problems: %v\n", err)
		return echo.NewHTTPError(http.StatusInternalServerError)
	}
	return c.JSON(http.StatusOK, map[string][]models.Problem{
		"data": problems,
	})
}

func (controller *ProblemController) InitializeRoutes(g *echo.Group) {
	g.GET("/:id", controller.FindProblemByProblemIDEndpoint)
	g.GET("", controller.FindProblemsEndpoint)
}

func stringToUint(s string) (uint, error) {
	i, err := strconv.Atoi(s)
	if err != nil {
		return 0, err
	}
	if i < 0 {
		return 0, fmt.Errorf("attempted to convert string representation of a negative number to uint")
	}
	return uint(i), nil
}

// Parse query parameter "name" as a uint, returning defaultValue if invalid or unspecified
func OptionalQueryParamUInt(c echo.Context, name string, defaultValue uint) uint {
	param := c.QueryParam(name)
	result, err := strconv.Atoi(param)
	if err != nil {
		return defaultValue
	}
	if result < 0 {
		return defaultValue
	}
	return uint(result)
}
