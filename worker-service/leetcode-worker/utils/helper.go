package utils

import (
	"github.com/tebeka/selenium"
)

func ParseCookie(cookies []selenium.Cookie, key string) string {
	if cookies == nil {
		return ""
	}

	for _, cookie := range cookies {
		if cookie.Name == key {
			return cookie.Value
		}
	}
	return ""
}
