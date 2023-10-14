package lib

import (
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"github.com/acmutd/bsg/worker-service/utils"
)

type Leetcode struct {
	Session    string
	CsrfToken  string
}

var LeetcodeUris utils.Uris

func setUris(uris utils.Uris) {
	LeetcodeUris = uris
}

func NewLeetcode(username string, password string) (*Leetcode, error) {
	setUris(Uris_US)
	utils.SetUris(Uris_US)

	// Perform login
	credit, err := login(username, password)
	if err != nil {
		return nil, err
	}

	utils.SetCredit(*credit)

	// Initialize the Leetcode struct
	leetcode := &Leetcode{}
	leetcode.Session = credit.Session
	leetcode.CsrfToken = credit.CsrfToken

	return leetcode, nil
}

func GenerateHttpRequestOptions(method string, url string, resolveWithFullResponse bool, form interface{}, body interface{}) utils.HttpRequestOptions {
	var options utils.HttpRequestOptions
	options.Method = method
	options.URL = url
	options.ResolveWithFullResponse = resolveWithFullResponse
	options.Form = form
	options.Body = body
	return options
}

func login(username string, password string) (*utils.Credit, error) {
	// Perform the login request to get the CSRF token
	var options utils.HttpRequestOptions = GenerateHttpRequestOptions("GET", LeetcodeUris.Login, true, nil, nil)
	resp, err := utils.HttpRequest(options)
	fmt.Println(resp)
	fmt.Println()
	if err != nil {
		return nil, err
	}
	token := utils.ParseCookie(resp.Header.Values("set-cookie"), "csrftoken")

	// Initialize the credit struct with the CSRF token
	credit := &utils.Credit{
		CsrfToken: token,
	}
	utils.SetCredit(*credit)

	// Prepare and send the login request
	var form = make(map[string]string)
	form["csrfmiddlewaretoken"] = token
	form["login"] = username
	form["password"] = password
	options = GenerateHttpRequestOptions("POST", LeetcodeUris.Login, true, form, nil)

	resp, err = utils.HttpRequest(options)
	fmt.Println(resp)
	fmt.Println()
	if err != nil {
		if strings.Contains(err.Error(), "StatusCodeError") {
			return nil, errors.New("Login Fail")
		}
		return nil, err
	}

	// Parse the session and CSRF token from the response
	session := utils.ParseCookie(resp.Header.Values("set-cookie"), "LEETCODE_SESSION")
	csrfToken := utils.ParseCookie(resp.Header.Values("set-cookie"), "csrftoken")

	// Update the credit struct
	credit.Session = session
	credit.CsrfToken = csrfToken
	fmt.Println("Login success")

	return credit, nil
}

func SubmitSolution(lang string, code string) {
	data := map[string]interface{}{
		"lang":        "python",
		"question_id": "1",
		"typed_code":  "class Solution: def twoSum(self, nums: List[int], target: int) -> List[int]: hashmap = {} for i in range(len(nums)): complement = target - nums[i] if complement in hashmap: return [i, hashmap[complement]] hashmap[nums[i]] = i",
	}

	requestBody, err := json.Marshal(data)
	if (err != nil) {
		fmt.Println("Submit fail")
	}
	var options utils.HttpRequestOptions = GenerateHttpRequestOptions("POST", strings.Replace(Uris_US.Submit, "$slug", "two-sum", -1), false, nil, requestBody)
	resp, err := utils.HttpRequest(options) // http.NewRequest("POST", submissionURL, bytes.NewBuffer(jsonData))
	fmt.Println(resp)
}

