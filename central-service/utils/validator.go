package utils

import (
	"fmt"
	"regexp"
	"strings"
	"unicode"
)

// ValidationError contains detailed validation errors
type ValidationError struct {
	Field   string
	Message string
}

// ValidationResult contains all validation errors
type ValidationResult struct {
	Valid  bool
	Errors []ValidationError
}

// IsValid returns true if there are no validation errors
func (vr *ValidationResult) IsValid() bool {
	return len(vr.Errors) == 0
}

// AddError adds a validation error
func (vr *ValidationResult) AddError(field, message string) {
	vr.Errors = append(vr.Errors, ValidationError{Field: field, Message: message})
	vr.Valid = false
}

// ErrorMessage returns a formatted error message
func (vr *ValidationResult) ErrorMessage() string {
	if vr.Valid {
		return ""
	}
	messages := make([]string, len(vr.Errors))
	for i, err := range vr.Errors {
		messages[i] = fmt.Sprintf("%s: %s", err.Field, err.Message)
	}
	return strings.Join(messages, "; ")
}

// Validator provides validation functions
type Validator struct{}

// NewValidator creates a new validator
func NewValidator() *Validator {
	return &Validator{}
}

// ValidateString validates a string field
func (v *Validator) ValidateString(value, fieldName string, opts *StringValidationOpts) *ValidationResult {
	result := &ValidationResult{Valid: true}

	if opts == nil {
		opts = &StringValidationOpts{}
	}

	if opts.Required && strings.TrimSpace(value) == "" {
		result.AddError(fieldName, "is required")
		return result
	}

	if len(value) < opts.MinLength {
		result.AddError(fieldName, fmt.Sprintf("must be at least %d characters long", opts.MinLength))
	}

	if opts.MaxLength > 0 && len(value) > opts.MaxLength {
		result.AddError(fieldName, fmt.Sprintf("must not exceed %d characters", opts.MaxLength))
	}

	if opts.Pattern != "" && !validatePattern(value, opts.Pattern) {
		result.AddError(fieldName, fmt.Sprintf("must match pattern %s", opts.Pattern))
	}

	if opts.Custom != nil {
		if err := opts.Custom(value); err != nil {
			result.AddError(fieldName, err.Error())
		}
	}

	return result
}

// ValidateEmail validates an email address
func (v *Validator) ValidateEmail(email, fieldName string) *ValidationResult {
	result := &ValidationResult{Valid: true}

	if strings.TrimSpace(email) == "" {
		result.AddError(fieldName, "is required")
		return result
	}

	// Basic email validation pattern
	pattern := `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`
	if !validatePattern(strings.ToLower(email), pattern) {
		result.AddError(fieldName, "must be a valid email address")
	}

	if len(email) > 254 {
		result.AddError(fieldName, "exceeds maximum length of 254 characters")
	}

	return result
}

// ValidateHandle validates a user handle
func (v *Validator) ValidateHandle(handle, fieldName string) *ValidationResult {
	result := &ValidationResult{Valid: true}

	if strings.TrimSpace(handle) == "" {
		result.AddError(fieldName, "is required")
		return result
	}

	if len(handle) < 3 {
		result.AddError(fieldName, "must be at least 3 characters long")
	}

	if len(handle) > 32 {
		result.AddError(fieldName, "must not exceed 32 characters")
	}

	// Alphanumeric, underscore, dash only
	if !validatePattern(handle, `^[a-zA-Z0-9_-]+$`) {
		result.AddError(fieldName, "must contain only letters, numbers, underscores, and dashes")
	}

	return result
}

// ValidateRoomName validates a room name
func (v *Validator) ValidateRoomName(name, fieldName string) *ValidationResult {
	result := &ValidationResult{Valid: true}

	if strings.TrimSpace(name) == "" {
		result.AddError(fieldName, "is required")
		return result
	}

	if len(name) < 1 {
		result.AddError(fieldName, "must not be empty")
	}

	if len(name) > 100 {
		result.AddError(fieldName, "must not exceed 100 characters")
	}

	return result
}

// ValidateUnsignedInt validates an unsigned integer
func (v *Validator) ValidateUnsignedInt(value uint, fieldName string, opts *IntValidationOpts) *ValidationResult {
	result := &ValidationResult{Valid: true}

	if opts == nil {
		opts = &IntValidationOpts{}
	}

	if opts.Required && value == 0 {
		result.AddError(fieldName, "is required")
		return result
	}

	if opts.Min > 0 && value < opts.Min {
		result.AddError(fieldName, fmt.Sprintf("must be at least %d", opts.Min))
	}

	if opts.Max > 0 && value > opts.Max {
		result.AddError(fieldName, fmt.Sprintf("must not exceed %d", opts.Max))
	}

	return result
}

// ValidateName validates a person's name
func (v *Validator) ValidateName(name string, fieldName string) *ValidationResult {
	result := &ValidationResult{Valid: true}

	if strings.TrimSpace(name) == "" {
		result.AddError(fieldName, "is required")
		return result
	}

	if len(name) < 1 {
		result.AddError(fieldName, "must not be empty")
	}

	if len(name) > 50 {
		result.AddError(fieldName, "must not exceed 50 characters")
	}

	// Allow letters, spaces, hyphens, apostrophes
	if !validatePattern(name, `^[a-zA-Z\s'-]+$`) {
		result.AddError(fieldName, "must contain only letters, spaces, hyphens, and apostrophes")
	}

	return result
}

// StringValidationOpts contains options for string validation
type StringValidationOpts struct {
	Required  bool
	MinLength int
	MaxLength int
	Pattern   string
	Custom    func(string) error
}

// IntValidationOpts contains options for integer validation
type IntValidationOpts struct {
	Required bool
	Min      uint
	Max      uint
}

// validatePattern checks if a string matches a regex pattern
func validatePattern(value, pattern string) bool {
	re, err := regexp.Compile(pattern)
	if err != nil {
		return false
	}
	return re.MatchString(value)
}

// SanitizeInput removes potentially harmful characters while preserving safe content
func SanitizeInput(input string) string {
	// Remove control characters and null bytes
	return strings.Map(func(r rune) rune {
		if r < 32 && r != '\n' && r != '\r' && r != '\t' {
			return -1
		}
		return r
	}, input)
}

// ContainsSQLInjection checks for common SQL injection patterns (basic heuristic)
func ContainsSQLInjection(input string) bool {
	dangerous := []string{
		"UNION", "SELECT", "INSERT", "UPDATE", "DELETE", "DROP", "EXEC", "EXECUTE",
		"--", "/*", "*/", ";", "xp_", "sp_",
	}

	upperInput := strings.ToUpper(input)
	for _, pattern := range dangerous {
		if strings.Contains(upperInput, pattern) {
			return true
		}
	}
	return false
}

// IsStrongPassword checks if a password meets minimum strength requirements
func IsStrongPassword(password string) bool {
	if len(password) < 8 {
		return false
	}

	hasUpper := false
	hasLower := false
	hasDigit := false
	hasSpecial := false

	for _, ch := range password {
		switch {
		case unicode.IsUpper(ch):
			hasUpper = true
		case unicode.IsLower(ch):
			hasLower = true
		case unicode.IsDigit(ch):
			hasDigit = true
		case strings.ContainsRune("!@#$%^&*()_+-=[]{}|;:,.<>?", ch):
			hasSpecial = true
		}
	}

	return hasUpper && hasLower && hasDigit && hasSpecial
}
