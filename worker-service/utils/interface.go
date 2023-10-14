package utils

type HttpRequestOptions struct {
	Method                  string
	URL                     string
	ResolveWithFullResponse bool
	Form                    interface{}
	Body                    interface{}
}

type Credit struct {
	Session   string
	CsrfToken string
}

type ProblemStatus string

const (
	Accept    ProblemStatus = "Accept"
	NotAccept ProblemStatus = "Not Accept"
	NotStart  ProblemStatus = "Not Start"
)

type ProblemDifficulty string

const (
	Easy   ProblemDifficulty = "Easy"
	Medium ProblemDifficulty = "Medium"
	Hard   ProblemDifficulty = "Hard"
)

type SubmissionStatus string

const (
	Accepted          SubmissionStatus = "Accepted"
	CompileError      SubmissionStatus = "Compile Error"
	WrongAnswer       SubmissionStatus = "Wrong Answer"
	TimeLimitExceeded SubmissionStatus = "Time Limit Exceeded"
)

type EndPoint string

const (
	US EndPoint = "US"
	CN EndPoint = "CN"
)

type Uris struct {
	Base        string
	Login       string
	Graphql     string
	ProblemsAll string
	Problem     string
	Submit      string
	Submission  string
}
