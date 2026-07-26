package controllers

import (
    "net/http"

    "github.com/acmutd/bsg/central-service/models"
    "github.com/acmutd/bsg/central-service/services"
    "github.com/acmutd/bsg/central-service/utils"
    "github.com/labstack/echo/v4"
)

type FeedbackController struct {
    feedbackService *services.FeedbackService
    logger          *utils.StructuredLogger
}

func InitializeFeedbackController(service *services.FeedbackService, logger *utils.StructuredLogger) FeedbackController {
    return FeedbackController{service, logger}
}

// SubmitFeedbackEndpoint handles POST requests to submit feedback
func (controller *FeedbackController) SubmitFeedbackEndpoint(c echo.Context) error {
    var feedbackDTO services.FeedbackDTO
    if err := c.Bind(&feedbackDTO); err != nil {
        return echo.NewHTTPError(http.StatusBadRequest, "Invalid data. Please try again")
    }

    userAuthID := c.Get("userAuthID").(string)

    newFeedback, err := controller.feedbackService.SubmitFeedback(&feedbackDTO, userAuthID)
    if err != nil {
        controller.logger.Error("Failed to submit feedback", err, map[string]interface{}{
            "user_id": userAuthID,
        })
        return echo.NewHTTPError(http.StatusInternalServerError, "Failed to submit feedback. Please try again later")
    }

    return c.JSON(http.StatusCreated, map[string]models.Feedback{
        "data": *newFeedback,
    })
}

// InitializeRoutes sets up the feedback routes
func (controller *FeedbackController) InitializeRoutes(g *echo.Group) {
    g.POST("/api/feedback", controller.SubmitFeedbackEndpoint)
}