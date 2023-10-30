package lib

import (
	"strings"
	"testing"
)

func TestLoginSuccess(t *testing.T) {
	LEETCODE_SESSION, CSRF_Token := Login("bsgvippro", "bsgisdabest123")
	if LEETCODE_SESSION == "" || CSRF_Token == "" {
		t.Error("Failed to login")
	}
}

func TestLoginFail(t *testing.T) {
	LEETCODE_SESSION, CSRF_Token := Login("bsgvippro", "bsgisdabest12")
	if LEETCODE_SESSION != "" && CSRF_Token != "" {
		t.Fail()
	}
}

func TestSubmitSuccess(t *testing.T) {
	LEETCODE_SESSION, CSRF_Token := Login("bsgvippro", "bsgisdabest123")
	code := `class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        int n = nums.size();\n        for (int i = 0; i < n - 1; i++) {\n            for (int j = i + 1; j < n; j++) {\n                if (nums[i] + nums[j] == target) {\n                    return {i, j};\n                }\n            }\n        }\n        return {}; // No solution found\n    }\n};`
	result, err := Submit(LEETCODE_SESSION, CSRF_Token, "two-sum", 1, "cpp", code)
	if err != nil || strings.Contains(result, "status_code") != true {
		t.Error(err)
	}
}