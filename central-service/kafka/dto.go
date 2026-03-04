package kafka

import "github.com/acmutd/bsg/central-service/models"

type KafkaIngressDTO struct {
	ProblemSlug string `json:"problemSlug"`
	ProblemId uint `json:"problemID"`
	Lang string `json:"lang"`
	Code string `json:"code"`
	Verdict string `json:"verdict"`
	SubmissionId uint `json:"submissionID"`
}

type KafkaEgressDTO struct {
	SubmissionId uint `json:"submissionID"`
	Verdict string `json:"verdict"`
	
	// this will store info such as which test case got wrong answer verdict, expected answer, etc..
	Data []byte `json:"data"` 
}

func NewKafkaIngressDTO(problem *models.Problem, submission *models.RoundSubmission) KafkaIngressDTO {
	return KafkaIngressDTO{
		ProblemSlug: problem.Slug,
		ProblemId: problem.ID,
		Lang: submission.Submission.Language,
		Code: submission.Submission.Code,
		Verdict: submission.Submission.Verdict,
		SubmissionId: submission.ID,
	}
}



