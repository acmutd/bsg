package lib

import (
	"bytes"
	"errors"
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"
)

func Submit(LEETCODE_SESSION string, CSRF_Token string, problemSlug string, problemID int, lang string, code string) (string, string, error) {
	// Define the URL, request method, and payload
	url := strings.Replace(Uris_US.Submit, "$slug", problemSlug, -1)
	method := "POST"
	payload := []byte(`{"lang": "` + lang + `", "question_id": "` + strconv.Itoa(problemID) + `", "typed_code": "` + code + `"}`)

	// Create an HTTP client
	client := &http.Client{}

	// Create an HTTP request
	req, err := http.NewRequest(method, url, bytes.NewBuffer(payload))
	if err != nil {
		return "", "Submit Failed", errors.New("Error creating request: " + err.Error())
	}

	// Set the request headers
	req.Header.Add("authority", "leetcode.com")
	req.Header.Add("method", "POST")
	req.Header.Add("path", "/problems/"+problemSlug+"/submit/")
	req.Header.Add("scheme", "https")
	req.Header.Add("Accept", "*/*")
	req.Header.Add("Accept-Encoding", "gzip, deflate, br")
	req.Header.Add("Content-Length", fmt.Sprintf("%d", len(payload)))
	req.Header.Add("Content-Type", "application/json")
	req.Header.Add("Cookie", "csrftoken="+CSRF_Token+";LEETCODE_SESSION="+LEETCODE_SESSION+";")
	req.Header.Add("Origin", "https://leetcode.com")
	req.Header.Add("Referer", "https://leetcode.com/problems/"+problemSlug+"/")
	req.Header.Add("X-Csrftoken", CSRF_Token)

	// Perform the HTTP request
	resp, err := client.Do(req)
	if err != nil {
		return "", "Submit Failed", errors.New("Error sending request: " + err.Error())
	}
	defer resp.Body.Close()

	// Retrieve submission ID from the response body
	body, err := io.ReadAll(resp.Body)
	submissionID, err := parseSubmissionID(string(body))
	if err != nil {
		return submissionID, "Submit Failed", errors.New("Error parsing submission ID: " + err.Error())
	}

	// Poll the submission status
	for pollingCount := 0; pollingCount < 20; pollingCount++ {
		url := "https://leetcode.com/submissions/detail/" + submissionID + "/check/"
		method := "GET"
		req, err := http.NewRequest(method, url, nil)
		if err != nil {
			return submissionID, "Submit Failed", errors.New("Error creating request: " + err.Error())
		}
		req.Header.Add("Content-Length", fmt.Sprintf("%d", len(payload)))
		req.Header.Add("Content-Type", "application/json")
		req.Header.Add("Cookie", "csrftoken="+CSRF_Token+";LEETCODE_SESSION="+LEETCODE_SESSION+";")

		// Perform the HTTP request
		resp, err := client.Do(req)
		if err != nil {
			return submissionID, "Submit Failed", errors.New("Error sending request: " + err.Error())
		}
		defer resp.Body.Close()

		// Stop polling when the submission status is available
		body, err := io.ReadAll(resp.Body)
		if strings.Contains(string(body), "status_code") == true {
			return submissionID, string(body), nil
		}

		time.Sleep(500 * time.Millisecond)
	}
	return submissionID, "Submit Failed", errors.New("Submit not sucess")
}

func parseSubmissionID(input string) (string, error) {
	// Define a regular expression pattern to match the submission_id
	pattern := `{"submission_id":\s*(\d+)}`

	// Compile the regular expression
	regex, err := regexp.Compile(pattern)
	if err != nil {
		return "", err
	}

	// Find the match in the input string
	match := regex.FindStringSubmatch(input)
	if match == nil || len(match) < 2 {
		return "", fmt.Errorf("Submission ID not found in the input string")
	}

	// Extract and return the submission ID
	submissionID := match[1]
	return submissionID, nil
}
