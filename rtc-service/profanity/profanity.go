// Package profanity classifies English messages using the vendored
// google-profanity-words English list.
package profanity

import (
	_ "embed"
	"strings"
	"unicode"
	"unicode/utf8"
)

//go:embed english.txt
var englishWords string

var words = strings.FieldsFunc(englishWords, func(r rune) bool {
	return r == '\n' || r == '\r'
})

// Contains reports whether text includes a case-insensitive whole-word or
// whole-phrase match from english.txt. Punctuation in a listed term is matched
// literally, matching the source list's punctuation-aware behavior.
func Contains(text string) bool {
	text = strings.ToLower(text)
	for _, word := range words {
		word = strings.TrimSpace(strings.ToLower(word))
		if word == "" {
			continue
		}

		for start := 0; ; {
			match := strings.Index(text[start:], word)
			if match == -1 {
				break
			}

			matchStart := start + match
			matchEnd := matchStart + len(word)
			if hasWordBoundaries(text, matchStart, matchEnd, word) {
				return true
			}
			start = matchEnd
		}
	}
	return false
}

func hasWordBoundaries(text string, start, end int, word string) bool {
	first, _ := utf8.DecodeRuneInString(word)
	last, _ := utf8.DecodeLastRuneInString(word)

	if isWordCharacter(first) && start > 0 {
		previous, _ := utf8.DecodeLastRuneInString(text[:start])
		if isWordCharacter(previous) {
			return false
		}
	}
	if isWordCharacter(last) && end < len(text) {
		next, _ := utf8.DecodeRuneInString(text[end:])
		if isWordCharacter(next) {
			return false
		}
	}
	return true
}

func isWordCharacter(r rune) bool {
	return unicode.IsLetter(r) || unicode.IsNumber(r)
}
