package lib

import "testing"

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
