package kafka

import models "github.com/acmutd/bsg/worker-service/central-service-models"

type SubmissionVerdict struct {
	StatusMessage  string `json:"status_message"`
	CodeOutput     string `json:"code_output"`
	StdOutput      string `json:"std_output"`
	ExpectedOutput string `json:"expected_output"`
	LastTestcase   string `json:"last_testcase"`
	ExecutionTime  string `json:"execution_time"`
}

type KafkaIngressDTO struct {
	ProblemSlug  string `json:"problemSlug"`
	ProblemId    uint   `json:"problemID"`
	Lang         string `json:"lang"`
	Code         string `json:"code"`
	SubmissionId uint   `json:"submissionID"`
}

type KafkaEgressDTO struct {
	SubmissionId uint              `json:"submissionID"`
	Verdict      SubmissionVerdict `json:"verdict"`
}

func NewKafkaIngressDTO(problem *models.Problem, submission *models.RoundSubmission) KafkaIngressDTO {
	return KafkaIngressDTO{
		ProblemSlug:  problem.Slug,
		ProblemId:    problem.ID,
		Lang:         submission.Submission.Language,
		Code:         submission.Submission.Code,
		SubmissionId: submission.ID,
	}
}
