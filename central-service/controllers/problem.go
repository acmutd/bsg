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

// An endpoint containing logic used to create a new problem based on provided parameters
func (controller *ProblemController) CreateNewProblemEndpoint(c echo.Context) error {
	var problemData models.Problem // ID field is ignored
	if err := c.Bind(&problemData); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid problem data specified. Please try again")
	}
	newProblem, err := controller.problemService.CreateProblem(&problemData)
	if err != nil {
		log.Printf("Failed to create problem object: %v\n", err)
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to create object. Please try again later")
	}
	return c.JSON(http.StatusCreated, map[string]models.Problem{
		"data": *newProblem,
	})
}

// An endpoint containing logic used to update a problem data with provided parameters
func (controller *ProblemController) UpdateProblemDataEndpoint(c echo.Context) error {
	var problemData models.Problem
	if err := c.Bind(&problemData); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid problem data specified. Please try again")
	}
	problemID := c.QueryParam("problemId")
	uintProblemID, err := stringToUint(problemID)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid problem ID specified")
	}
	updatedProblem, err := controller.problemService.UpdateProblemData(uintProblemID, &problemData)
	if err != nil {
		log.Printf("Failed to update problem data: %v\n", err)
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to update problem data. Please try again later")
	}
	return c.JSON(http.StatusCreated, map[string]models.Problem{
		"data": *updatedProblem,
	})
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
	g.POST("/", controller.CreateNewProblemEndpoint)
	g.GET("/", controller.FindProblemByProblemIDEndpoint)
	g.PUT("/", controller.UpdateProblemDataEndpoint)
}

func stringToUint(s string) (uint, error) {
	i, err := strconv.Atoi(s)
	if err != nil {
		return 0, err
	}
	return uint(i), nil
}
