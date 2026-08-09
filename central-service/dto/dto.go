package dto

import "github.com/acmutd/bsg/central-service/models"

type SubmissionIngressDTO struct {
	ProblemSlug  string `json:"problemSlug"`
	ProblemId    uint   `json:"problemID"`
	Lang         string `json:"lang"`
	Code         string `json:"code"`
	Verdict      string `json:"verdict"`
	SubmissionId uint   `json:"submissionID"`
}

type SubmissionEgressDTO struct {
	SubmissionId uint   `json:"submissionID"`
	Verdict      string `json:"verdict"`

	// this will store info such as which test case got wrong answer verdict, expected answer, etc..
	Data []byte `json:"data"`
}

func NewSubmissionIngressDTO(problem *models.Problem, submission *models.RoundSubmission) SubmissionIngressDTO {
	return SubmissionIngressDTO{
		ProblemSlug:  problem.Slug,
		ProblemId:    problem.ID,
		Lang:         submission.Submission.Language,
		Code:         submission.Submission.Code,
		Verdict:      submission.Submission.Verdict,
		SubmissionId: submission.ID,
	}
}
