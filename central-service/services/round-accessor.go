package services

type RoundAccessor struct {
	roundService *RoundService
}

func (accessor *RoundAccessor) GetRoundAccessor() *RoundService {
	return accessor.roundService
}

func NewRoundAccessor(roundService *RoundService) RoundAccessor {
	return RoundAccessor{
		roundService,
	}
}