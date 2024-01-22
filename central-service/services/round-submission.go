package services

import (
	"github.com/acmutd/bsg/central-service/constants"
	"github.com/acmutd/bsg/central-service/models"
	"gorm.io/gorm"
)

type RoundSubmissionParameters struct {
	RoundID uint `json:"roundID"`
	Code string `json:"code"`
	Language string `json:"language"`
	ProblemID uint `json:"problemID"`
}

type RoundSubmissionService struct {
	db *gorm.DB
	problemAccessor *ProblemAccessor
	roundAccessor *RoundAccessor
}

type RoundSubmissionServiceError struct {
	Message string
}

func (e RoundSubmissionServiceError) Error() string {
	return e.Message
}

func InitializeRoundSubmissionService(db *gorm.DB, problemAccessor *ProblemAccessor, roundAccessor *RoundAccessor) RoundSubmissionService {
	return RoundSubmissionService{db, problemAccessor, roundAccessor}
}

func (service *RoundSubmissionService) DetermineScoreDeltaForUserBySubmission(problem *models.Problem) uint{
	// TODO: set score delta to 0 if user already AC the problem in the round
	return service.problemAccessor.GetProblemAccessor().DetermineScoreForProblem(problem)
}


func (service *RoundSubmissionService) CreateRoundSubmission(
	submissionParams RoundSubmissionParameters,
	submissionAuthor *models.User,
) (*models.RoundSubmission, error) {
	// get round object
	round, err := service.roundAccessor.GetRoundAccessor().FindRoundByID(submissionParams.RoundID)
	if err != nil {
		return nil, err
	}
	
	// find participant object with matching round id and user auth id
	participant, err := service.roundAccessor.GetRoundAccessor().FindParticipantByRoundAndUserID(submissionParams.RoundID, submissionAuthor.AuthID)
	if err != nil {
		return nil, err
	}

	// check if user joined round
	if participant == nil {
		return nil, &RoundSubmissionServiceError{
			Message: "User haven't joined round...",
		}
	}

	// check if round allows submission
	if round.Status == constants.ROUND_CREATED {
		return nil, &RoundSubmissionServiceError{
			Message: "Round haven't started yet",
		}
	}

	if round.Status == constants.ROUND_END {
		return nil, &RoundSubmissionServiceError{
			Message: "Round already ended",
		}
	}

	// get problem object
	problem, err := service.problemAccessor.GetProblemAccessor().FindProblemByProblemID(submissionParams.ProblemID)
	if err != nil {
		return nil, err
	}

	// TODO: check if problem is in round's problemset

	// determine score
	problemScore := service.DetermineScoreDeltaForUserBySubmission(problem)
	
	// create submission object
	newSubmission := models.RoundSubmission {
		Submission: models.Submission{
			Code: submissionParams.Code,
			Language: submissionParams.Language,
			ProblemID: problem.ID,
			ExecutionTime: 0,
			Verdict: constants.SUBMISSION_STATUS_SUBMITTED,
		},
		Score: problemScore,
	}
	if err := service.db.Create(&newSubmission).Error; err != nil {
		return nil, err
	}

	// establish relationship with round
	if err := service.db.Model(round).Association("RoundSubmissions").Append(&newSubmission); err != nil {
		return nil, err
	}

	// establish relationship with round participant
	if err := service.db.Model(participant).Association("RoundSubmissions").Append(&newSubmission); err != nil {
		return nil, err
	}
	return &newSubmission, nil
}