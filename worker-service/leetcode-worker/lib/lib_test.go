package lib

import (
	"os"
	"strings"
	"testing"

	"github.com/joho/godotenv"
)

func TestLoginSuccess(t *testing.T) {
	// Get the username and password environment variables
	err := godotenv.Load("../../../.env")
	if err != nil {
		t.Error("Error loading .env file")
	}
	username := os.Getenv("LEETCODE_USERNAME")
	password := os.Getenv("LEETCODE_PASSWORD")
	// Login into LeetCode
	LEETCODE_SESSION, CSRF_Token := Login(username, password, "../drivers/chromedriver")
	if LEETCODE_SESSION == "" || CSRF_Token == "" {
		t.Error("Failed to login")
	}
}

func TestLoginFail(t *testing.T) {
	// Get the username and password environment variables
	err := godotenv.Load("../../../.env")
	if err != nil {
		t.Error("Error loading .env file")
	}
	username := os.Getenv("LEETCODE_USERNAME")
	password := "abcd1234"
	// Login into LeetCode
	LEETCODE_SESSION, CSRF_Token := Login(username, password, "../drivers/chromedriver")
	if LEETCODE_SESSION != "" && CSRF_Token != "" {
		t.Fail()
	}
}

func TestSubmitSuccess(t *testing.T) {
	// Get the username and password environment variables
	err := godotenv.Load("../../../.env")
	if err != nil {
		t.Error("Error loading .env file")
	}
	username := os.Getenv("LEETCODE_USERNAME")
	password := os.Getenv("LEETCODE_PASSWORD")
	// Login into LeetCode
	LEETCODE_SESSION, CSRF_Token := Login(username, password, "../drivers/chromedriver")
	// Submit a solution
	code := `class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        int n = nums.size();\n        for (int i = 0; i < n - 1; i++) {\n            for (int j = i + 1; j < n; j++) {\n                if (nums[i] + nums[j] == target) {\n                    return {i, j};\n                }\n            }\n        }\n        return {}; // No solution found\n    }\n};`
	result, err := Submit(LEETCODE_SESSION, CSRF_Token, "two-sum", 1, "cpp", code)
	if err != nil || strings.Contains(result, "status_code") != true {
		t.Error(err)
	}
}

func TestSubmitFail(t *testing.T) {
	// Get the username and password environment variables
	err := godotenv.Load("../../../.env")
	if err != nil {
		t.Error("Error loading .env file")
	}
	username := os.Getenv("LEETCODE_USERNAME")
	password := "abcd1234"
	// Login into LeetCode
	LEETCODE_SESSION, CSRF_Token := Login(username, password, "../drivers/chromedriver")
	// Submit a solution
	code := `class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        int n = nums.size();\n        for (int i = 0; i < n - 1; i++) {\n            for (int j = i + 1; j < n; j++) {\n                if (nums[i] + nums[j] == target) {\n                    return {i, j};\n                }\n            }\n        }\n        return {}; // No solution found\n    }\n};`
	result, err := Submit(LEETCODE_SESSION, CSRF_Token, "two-sum", 1, "cpp", code)
	if err == nil || strings.Contains(result, "status_code") == true {
		t.Fail()
	}
}
