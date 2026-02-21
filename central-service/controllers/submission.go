package controllers

import (
	"fmt"
	"log"
	"net/http"

	"github.com/acmutd/bsg/central-service/services"
	"github.com/labstack/echo/v4"
)

type SubmissionController struct {
	roomService *services.RoomService
}

func InitializeSubmissionController(roomService *services.RoomService) SubmissionController {
	return SubmissionController{roomService: roomService}
}

func (controller *SubmissionController) HandleSubmissionEndpoint(c echo.Context) error {
	fmt.Println("Submission endpoint called!")
	var submissionRequest services.SubmissionRequest
	if err := c.Bind(&submissionRequest); err != nil {
		log.Printf("Failed to bind submission request: %v\n", err)
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid data. Please try again")
	}

	userAuthID := c.Get("userAuthID").(string)

	log.Printf("Processing submission: %s %s\n", submissionRequest.ProblemSlug, submissionRequest.Verdict)

	result, err := controller.roomService.ProcessSubmissionSuccess(submissionRequest.RoomID, userAuthID, submissionRequest.ProblemSlug, submissionRequest.Verdict)
	if err != nil {
		log.Printf("Failed to process submission: %v\n", err)
		if err, ok := err.(services.BSGError); ok {
			return echo.NewHTTPError(err.StatusCode, "Failed to process submission. "+err.Error())
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to process submission. Please try again later")
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"nextProblem": result.NextProblem,
		"isComplete":  result.IsComplete,
		"message":     "Submission processed successfully",
	})
}

func (controller *SubmissionController) InitializeRoutes(g *echo.Group) {
	g.POST("/", controller.HandleSubmissionEndpoint)
}
