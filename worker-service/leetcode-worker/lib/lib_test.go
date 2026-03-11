package lib

import (
	"os"
	"os/exec"
	"strings"
	"testing"

	"github.com/joho/godotenv"
)

// skipIfNoChromedriver skips the test if chromedriver is not available or not executable
func skipIfNoChromedriver(t *testing.T) {
	chromedriver := "../drivers/chromedriver"

	// Check if file exists
	if _, err := os.Stat(chromedriver); os.IsNotExist(err) {
		t.Skipf("Chromedriver not found at %s, skipping integration test", chromedriver)
	}

	// Check if file is actually executable
	cmd := exec.Command(chromedriver, "--version")
	if err := cmd.Run(); err != nil {
		t.Skipf("Chromedriver not executable or wrong architecture: %v, skipping integration test", err)
	}
}

func TestLoginSuccess(t *testing.T) {
	skipIfNoChromedriver(t)
	// Get the username and password environment variables
	err := godotenv.Load("../../../.env")
	if err != nil {
		t.Error("Error loading .env file")
	}
	username := os.Getenv("LEETCODE_USERNAME")
	password := os.Getenv("LEETCODE_PASSWORD")

	if username == "" || password == "" {
		t.Skip("Skipping login test: LEETCODE_USERNAME or LEETCODE_PASSWORD not set")
	}

	// Login into LeetCode
	LEETCODE_SESSION, CSRF_Token := Login(username, password, "../drivers/chromedriver")
	if LEETCODE_SESSION == "" || CSRF_Token == "" {
		t.Error("Failed to login")
	}
}

func TestLoginFail(t *testing.T) {
	skipIfNoChromedriver(t)
	// Get the username and password environment variables
	err := godotenv.Load("../../../.env")
	if err != nil {
		t.Error("Error loading .env file")
	}
	username := os.Getenv("LEETCODE_USERNAME")

	if username == "" {
		t.Skip("Skipping login fail test: LEETCODE_USERNAME not set")
	}

	password := "abcd1234"
	// Login into LeetCode
	LEETCODE_SESSION, CSRF_Token := Login(username, password, "../drivers/chromedriver")
	if LEETCODE_SESSION != "" && CSRF_Token != "" {
		t.Fail()
	}
}

func TestSubmitSuccess(t *testing.T) {
	skipIfNoChromedriver(t)
	// Get the username and password environment variables
	err := godotenv.Load("../../../.env")
	if err != nil {
		t.Error("Error loading .env file")
	}
	username := os.Getenv("LEETCODE_USERNAME")
	password := os.Getenv("LEETCODE_PASSWORD")

	if username == "" || password == "" {
		t.Skip("Skipping submit test: LEETCODE_USERNAME or LEETCODE_PASSWORD not set")
	}

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
	skipIfNoChromedriver(t)
	// Get the username and password environment variables
	err := godotenv.Load("../../../.env")
	if err != nil {
		t.Error("Error loading .env file")
	}
	username := os.Getenv("LEETCODE_USERNAME")

	if username == "" {
		t.Skip("Skipping submit fail test: LEETCODE_USERNAME not set")
	}

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
