package services

type ProblemAccessor struct {
	problemService *ProblemService
}

func (accessor *ProblemAccessor) GetProblemAccessor() *ProblemService {
	return accessor.problemService
}

func NewProblemAccessor(problemService *ProblemService) ProblemAccessor {
	return ProblemAccessor{
		problemService,
	}
}
