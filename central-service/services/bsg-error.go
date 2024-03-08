package services

type BSGError struct {
	StatusCode int
	Message    string
}

func (e BSGError) Error() string {
	return e.Message
}
