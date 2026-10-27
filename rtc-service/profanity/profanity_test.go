package profanity

import "testing"

func TestContains(t *testing.T) {
	tests := []struct {
		text string
		want bool
	}{
		{text: "Have a lovely day", want: false},
		{text: "What the hell!", want: true},
		{text: "This is hellhole land", want: false},
		{text: "Damn", want: true},
	}

	for _, test := range tests {
		if got := Contains(test.text); got != test.want {
			t.Errorf("Contains(%q) = %t, want %t", test.text, got, test.want)
		}
	}
}
