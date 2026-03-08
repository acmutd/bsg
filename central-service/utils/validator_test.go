package utils

import (
	"testing"
)

// TestValidateStringRequired tests required string validation
func TestValidateStringRequired(t *testing.T) {
	validator := NewValidator()

	tests := []struct {
		name      string
		value     string
		opts      *StringValidationOpts
		wantValid bool
	}{
		{
			name:      "empty string with required",
			value:     "",
			opts:      &StringValidationOpts{Required: true},
			wantValid: false,
		},
		{
			name:      "valid string",
			value:     "test",
			opts:      &StringValidationOpts{Required: true},
			wantValid: true,
		},
		{
			name:      "whitespace only",
			value:     "   ",
			opts:      &StringValidationOpts{Required: true},
			wantValid: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := validator.ValidateString(tt.value, "testField", tt.opts)
			if result.Valid != tt.wantValid {
				t.Errorf("ValidateString() valid = %v, want %v", result.Valid, tt.wantValid)
			}
		})
	}
}

// TestValidateStringLength tests string length validation
func TestValidateStringLength(t *testing.T) {
	validator := NewValidator()

	tests := []struct {
		name      string
		value     string
		opts      *StringValidationOpts
		wantValid bool
	}{
		{
			name:      "too short",
			value:     "ab",
			opts:      &StringValidationOpts{MinLength: 3},
			wantValid: false,
		},
		{
			name:      "min length met",
			value:     "abc",
			opts:      &StringValidationOpts{MinLength: 3},
			wantValid: true,
		},
		{
			name:      "too long",
			value:     "abcdefghijk",
			opts:      &StringValidationOpts{MaxLength: 10},
			wantValid: false,
		},
		{
			name:      "max length met",
			value:     "abcdefghij",
			opts:      &StringValidationOpts{MaxLength: 10},
			wantValid: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := validator.ValidateString(tt.value, "testField", tt.opts)
			if result.Valid != tt.wantValid {
				t.Errorf("ValidateString() valid = %v, want %v", result.Valid, tt.wantValid)
			}
		})
	}
}

// TestValidateEmail tests email validation
func TestValidateEmail(t *testing.T) {
	validator := NewValidator()

	tests := []struct {
		name      string
		email     string
		wantValid bool
	}{
		{
			name:      "valid email",
			email:     "user@example.com",
			wantValid: true,
		},
		{
			name:      "empty email",
			email:     "",
			wantValid: false,
		},
		{
			name:      "invalid format",
			email:     "not-an-email",
			wantValid: false,
		},
		{
			name:      "missing domain",
			email:     "user@",
			wantValid: false,
		},
		{
			name:      "missing local part",
			email:     "@example.com",
			wantValid: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := validator.ValidateEmail(tt.email, "email")
			if result.Valid != tt.wantValid {
				t.Errorf("ValidateEmail() valid = %v, want %v", result.Valid, tt.wantValid)
			}
		})
	}
}

// TestValidateHandle tests handle validation
func TestValidateHandle(t *testing.T) {
	validator := NewValidator()

	tests := []struct {
		name      string
		handle    string
		wantValid bool
	}{
		{
			name:      "valid handle",
			handle:    "user_123",
			wantValid: true,
		},
		{
			name:      "too short",
			handle:    "ab",
			wantValid: false,
		},
		{
			name:      "with spaces",
			handle:    "user name",
			wantValid: false,
		},
		{
			name:      "with special chars",
			handle:    "user@name",
			wantValid: false,
		},
		{
			name:      "with dashes",
			handle:    "user-name",
			wantValid: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := validator.ValidateHandle(tt.handle, "handle")
			if result.Valid != tt.wantValid {
				t.Errorf("ValidateHandle() valid = %v, want %v", result.Valid, tt.wantValid)
			}
		})
	}
}

// TestValidateRoomName tests room name validation
func TestValidateRoomName(t *testing.T) {
	validator := NewValidator()

	tests := []struct {
		name      string
		roomName  string
		wantValid bool
	}{
		{
			name:      "valid room name",
			roomName:  "Development Team",
			wantValid: true,
		},
		{
			name:      "empty room name",
			roomName:  "",
			wantValid: false,
		},
		{
			name:      "too long",
			roomName:  string(make([]byte, 101)),
			wantValid: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := validator.ValidateRoomName(tt.roomName, "roomName")
			if result.Valid != tt.wantValid {
				t.Errorf("ValidateRoomName() valid = %v, want %v", result.Valid, tt.wantValid)
			}
		})
	}
}

// TestValidateName tests person name validation
func TestValidateName(t *testing.T) {
	validator := NewValidator()

	tests := []struct {
		name      string
		fullName  string
		wantValid bool
	}{
		{
			name:      "valid name",
			fullName:  "John Smith",
			wantValid: true,
		},
		{
			name:      "single name",
			fullName:  "Madonna",
			wantValid: true,
		},
		{
			name:      "name with apostrophe",
			fullName:  "O'Brien",
			wantValid: true,
		},
		{
			name:      "with numbers",
			fullName:  "John123",
			wantValid: false,
		},
		{
			name:      "empty",
			fullName:  "",
			wantValid: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := validator.ValidateName(tt.fullName, "name")
			if result.Valid != tt.wantValid {
				t.Errorf("ValidateName() valid = %v, want %v", result.Valid, tt.wantValid)
			}
		})
	}
}

// TestContainsSQLInjection tests SQL injection detection
func TestContainsSQLInjection(t *testing.T) {
	tests := []struct {
		name    string
		input   string
		wantBad bool
	}{
		{
			name:    "safe input",
			input:   "normal user input",
			wantBad: false,
		},
		{
			name:    "SQL UNION injection",
			input:   "test' UNION SELECT * FROM users",
			wantBad: true,
		},
		{
			name:    "SQL comment injection",
			input:   "test'; DROP TABLE users; --",
			wantBad: true,
		},
		{
			name:    "case insensitive",
			input:   "test' union select * from users",
			wantBad: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := ContainsSQLInjection(tt.input); got != tt.wantBad {
				t.Errorf("ContainsSQLInjection() = %v, want %v", got, tt.wantBad)
			}
		})
	}
}

// TestIsStrongPassword tests password strength validation
func TestIsStrongPassword(t *testing.T) {
	tests := []struct {
		name       string
		password   string
		wantStrong bool
	}{
		{
			name:       "strong password",
			password:   "SecurePass123!",
			wantStrong: true,
		},
		{
			name:       "too short",
			password:   "Short1!",
			wantStrong: false,
		},
		{
			name:       "no uppercase",
			password:   "securepass123!",
			wantStrong: false,
		},
		{
			name:       "no lowercase",
			password:   "SECUREPASS123!",
			wantStrong: false,
		},
		{
			name:       "no digits",
			password:   "SecurePass!",
			wantStrong: false,
		},
		{
			name:       "no special chars",
			password:   "SecurePass123",
			wantStrong: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := IsStrongPassword(tt.password); got != tt.wantStrong {
				t.Errorf("IsStrongPassword() = %v, want %v", got, tt.wantStrong)
			}
		})
	}
}

// TestSanitizeInput tests input sanitization
func TestSanitizeInput(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "normal input",
			input:    "hello world",
			expected: "hello world",
		},
		{
			name:     "control char removal",
			input:    "hello\x00\x01world",
			expected: "helloworld",
		},
		{
			name:     "newline preservation",
			input:    "hello\nworld",
			expected: "hello\nworld",
		},
		{
			name:     "tab preservation",
			input:    "hello\tworld",
			expected: "hello\tworld",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := SanitizeInput(tt.input)
			if got != tt.expected {
				t.Errorf("SanitizeInput() = %q, want %q", got, tt.expected)
			}
		})
	}
}

// TestValidationResultErrorMessage tests error message formatting
func TestValidationResultErrorMessage(t *testing.T) {
	result := &ValidationResult{Valid: true}
	result.AddError("email", "invalid format")
	result.AddError("password", "too short")

	msg := result.ErrorMessage()
	if msg != "email: invalid format; password: too short" {
		t.Errorf("ErrorMessage() = %q, expected formatted message", msg)
	}
}
