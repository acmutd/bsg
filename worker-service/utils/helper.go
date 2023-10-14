package utils

import (
	"bytes"
	"fmt"
	"net/http"
	"regexp"
)

var utilCredit Credit
var utilUris Uris

func SetCredit(credit Credit) {
	utilCredit.Session = credit.Session
	utilCredit.CsrfToken = credit.CsrfToken
}

func SetUris(uris Uris) {
	utilUris = uris
}

func ParseCookie(cookies []string, key string) string {
	if cookies == nil {
		return ""
	}
	cookieRegex := regexp.MustCompile(key + `=(.+?);`)
	for _, cookie := range cookies {
		matches := cookieRegex.FindStringSubmatch(cookie)
		if len(matches) >= 2 {
			return matches[1]
		} else {
			return ""
		}
	}
	return ""
}

func submissionStatusMap(submission string) SubmissionStatus {
	switch submission {
	case "Accepted":
		return Accepted
	case "Compile Error":
		return CompileError
	case "Time Limit Exceeded":
		return TimeLimitExceeded
	case "Wrong Answer":
		return WrongAnswer
	case "10":
		return Accepted
	case "11":
		return WrongAnswer
	case "14":
		return TimeLimitExceeded
	case "20":
		return CompileError
	default:
		return WrongAnswer
	}
}

func GenerateHeader() map[string]string {
	var header = make(map[string]string)
	if (utilCredit != Credit{}) {
		// fmt.Println(utilCredit.Session)
		header["Cookie"] = "LEETCODE_SESSION=" + utilCredit.Session + ";csrftoken=" + utilCredit.CsrfToken
	} else {
		header["Cookie"] = ""
	}
	header["X-Requested-With"] = "XMLHttpRequest"
	if (utilCredit != Credit{}) {
		header["X-CSRFToken"] = utilCredit.CsrfToken
	} else {
		header["X-CSRFToken"] = ""
	}
	header["Referer"] = utilUris.Base

	fmt.Print("Header ")
	fmt.Println(header)
	fmt.Println()
	return header
}

func HttpRequest(options HttpRequestOptions) (*http.Response, error) {
	// Create an HTTP client
	client := &http.Client{}

	// Create an HTTP request
	str, ok := options.Body.(string)
	if (!ok) {
		str = ""
	}
	
	req, err := http.NewRequest(options.Method, options.URL, bytes.NewBuffer([]byte(str)))
	if err != nil {
		return nil, err
	}

	// Set headers
	for key, value := range GenerateHeader() {
		req.Header.Set(key, value)
	}

	// Disable or enable redirects
	client.CheckRedirect = func(req *http.Request, via []*http.Request) error {
		if options.ResolveWithFullResponse {
			return nil
		}
		return http.ErrUseLastResponse
	}

	// Send the request
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}

	return resp, nil
}