package services

import (
    "github.com/acmutd/bsg/central-service/models"
    "gorm.io/gorm"
)

type FeedbackService struct {
    db *gorm.DB
}

func InitializeFeedbackService(db *gorm.DB) FeedbackService {
    return FeedbackService{db}
}

type FeedbackDTO struct {
    FeedbackText string `json:"feedbackText"`
}

func (service *FeedbackService) SubmitFeedback(feedbackDTO *FeedbackDTO, userAuthID string) (*models.Feedback, error) {
    feedback := models.Feedback{
        UserAuthID:   userAuthID,
        FeedbackText: feedbackDTO.FeedbackText,
    }

    result := service.db.Create(&feedback)
    if result.Error != nil {
        return nil, result.Error
    }

    return &feedback, nil
}