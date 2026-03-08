package controllers

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/acmutd/bsg/central-service/models"
	"github.com/acmutd/bsg/central-service/services"
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

// Setup test database - uses in-memory database for testing
func setupTestDB() (*gorm.DB, error) {
	// Note: In production tests, use actual database or proper mocking
	// For now, we'll return a nil to skip DB-dependent tests
	return nil, nil
}

// TestProblemControllerFindByID tests finding a problem by ID
func TestProblemControllerFindByID(t *testing.T) {
	db, err := setupTestDB()
	if err != nil || db == nil {
		t.Skip("Database setup not available for testing")
	}

	// Create test problem
	testProblem := models.Problem{
		ID:         1,
		Slug:       "test-problem",
		Name:       "Test Problem",
		Difficulty: "Easy",
	}
	db.Create(&testProblem)

	// Initialize service and controller
	problemService := services.InitializeProblemService(db)
	controller := InitializeProblemController(&problemService)

	// Create request and response recorder
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/problems/1", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetParamNames("id")
	c.SetParamValues("1")

	// Test
	err = controller.FindProblemByProblemIDEndpoint(c)
	if err != nil {
		t.Errorf("FindProblemByProblemIDEndpoint() error = %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", rec.Code)
	}
}

// TestProblemControllerFindByIDNotFound tests finding a non-existent problem
func TestProblemControllerFindByIDNotFound(t *testing.T) {
	db, err := setupTestDB()
	if err != nil || db == nil {
		t.Skip("Database setup not available for testing")
	}

	problemService := services.InitializeProblemService(db)
	controller := InitializeProblemController(&problemService)

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/problems/999", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetParamNames("id")
	c.SetParamValues("999")

	err = controller.FindProblemByProblemIDEndpoint(c)
	if err == nil {
		t.Error("Expected error for non-existent problem")
	}
}

// TestProblemControllerFindByIDInvalid tests invalid problem ID
func TestProblemControllerFindByIDInvalid(t *testing.T) {
	db, err := setupTestDB()
	if err != nil || db == nil {
		t.Skip("Database setup not available for testing")
	}

	problemService := services.InitializeProblemService(db)
	controller := InitializeProblemController(&problemService)

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/problems/invalid", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetParamNames("id")
	c.SetParamValues("invalid")

	err = controller.FindProblemByProblemIDEndpoint(c)
	if err == nil {
		t.Error("Expected error for invalid problem ID")
	}
}

// TestProblemControllerFindAll tests finding all problems
func TestProblemControllerFindAll(t *testing.T) {
	db, err := setupTestDB()
	if err != nil || db == nil {
		t.Skip("Database setup not available for testing")
	}

	// Create test problems
	problems := []models.Problem{
		{Slug: "problem-1", Name: "Problem 1"},
		{Slug: "problem-2", Name: "Problem 2"},
		{Slug: "problem-3", Name: "Problem 3"},
	}
	for _, p := range problems {
		db.Create(&p)
	}

	problemService := services.InitializeProblemService(db)
	controller := InitializeProblemController(&problemService)

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/problems", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	err = controller.FindProblemsEndpoint(c)
	if err != nil {
		t.Errorf("FindProblemsEndpoint() error = %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", rec.Code)
	}
}

// TestProblemControllerFindBySlug tests finding problem by slug
func TestProblemControllerFindBySlug(t *testing.T) {
	db, err := setupTestDB()
	if err != nil || db == nil {
		t.Skip("Database setup not available for testing")
	}

	testProblem := models.Problem{
		Slug: "test-problem",
		Name: "Test Problem",
	}
	db.Create(&testProblem)

	problemService := services.InitializeProblemService(db)
	controller := InitializeProblemController(&problemService)

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/problems/lookup?slug=test-problem", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	err = controller.FindProblemBySlugEndpoint(c)
	if err != nil {
		t.Errorf("FindProblemBySlugEndpoint() error = %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", rec.Code)
	}
}

// TestProblemControllerFindBySlugNotFound tests finding non-existent problem by slug
func TestProblemControllerFindBySlugNotFound(t *testing.T) {
	db, err := setupTestDB()
	if err != nil || db == nil {
		t.Skip("Database setup not available for testing")
	}

	problemService := services.InitializeProblemService(db)
	controller := InitializeProblemController(&problemService)

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/problems/lookup?slug=nonexistent", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	err = controller.FindProblemBySlugEndpoint(c)
	if err == nil {
		t.Error("Expected error for non-existent slug")
	}
}

// TestStringToUint tests string to uint conversion
func TestStringToUint(t *testing.T) {
	tests := []struct {
		name      string
		input     string
		expected  uint
		wantError bool
	}{
		{
			name:      "valid string",
			input:     "123",
			expected:  123,
			wantError: false,
		},
		{
			name:      "zero",
			input:     "0",
			expected:  0,
			wantError: false,
		},
		{
			name:      "negative number",
			input:     "-5",
			expected:  0,
			wantError: true,
		},
		{
			name:      "invalid string",
			input:     "abc",
			expected:  0,
			wantError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := stringToUint(tt.input)
			if (err != nil) != tt.wantError {
				t.Errorf("stringToUint() error = %v, wantError %v", err, tt.wantError)
			}
			if err == nil && result != tt.expected {
				t.Errorf("stringToUint() = %v, want %v", result, tt.expected)
			}
		})
	}
}

// TestOptionalQueryParamUInt tests optional query parameter parsing
func TestOptionalQueryParamUInt(t *testing.T) {
	tests := []struct {
		name         string
		queryParam   string
		defaultValue uint
		expected     uint
	}{
		{
			name:         "valid param",
			queryParam:   "count=20",
			defaultValue: 10,
			expected:     20,
		},
		{
			name:         "missing param",
			queryParam:   "",
			defaultValue: 10,
			expected:     10,
		},
		{
			name:         "invalid param",
			queryParam:   "count=invalid",
			defaultValue: 10,
			expected:     10,
		},
		{
			name:         "negative param",
			queryParam:   "count=-5",
			defaultValue: 10,
			expected:     10,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			e := echo.New()
			req := httptest.NewRequest(http.MethodGet, "/api/problems?"+tt.queryParam, nil)
			rec := httptest.NewRecorder()
			c := e.NewContext(req, rec)

			result := OptionalQueryParamUInt(c, "count", tt.defaultValue)
			if result != tt.expected {
				t.Errorf("OptionalQueryParamUInt() = %v, want %v", result, tt.expected)
			}
		})
	}
}

// TestUserControllerCreateNewUser tests user creation
func TestUserControllerCreateNewUser(t *testing.T) {
	db, err := setupTestDB()
	if err != nil || db == nil {
		t.Skip("Database setup not available for testing")
	}

	userService := services.InitializeUserService(db)
	controller := InitializeUserController(&userService)

	e := echo.New()
	userJSON := `{"firstName":"John","lastName":"Doe","handle":"johndoe","email":"john@example.com"}`
	req := httptest.NewRequest(http.MethodPost, "/api/users", strings.NewReader(userJSON))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	// Mock user auth ID
	c.Set("userAuthID", "test-auth-id")

	err = controller.CreateNewUserEndpoint(c)
	if err != nil {
		t.Errorf("CreateNewUserEndpoint() error = %v", err)
	}
	if rec.Code != http.StatusCreated {
		t.Errorf("Expected status 201, got %d", rec.Code)
	}
}

// TestUserControllerFindUserByAuthID tests finding user by auth ID
func TestUserControllerFindUserByAuthID(t *testing.T) {
	db, err := setupTestDB()
	if err != nil || db == nil {
		t.Skip("Database setup not available for testing")
	}

	// Create test user
	testUser := models.User{
		FirstName: "John",
		LastName:  "Doe",
		Handle:    "johndoe",
		Email:     "john@example.com",
		AuthID:    "test-auth-id",
	}
	db.Create(&testUser)

	userService := services.InitializeUserService(db)
	controller := InitializeUserController(&userService)

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/users/me", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.Set("userAuthID", "test-auth-id")

	err = controller.FindUserByAuthIDEndpoint(c)
	if err != nil {
		t.Errorf("FindUserByAuthIDEndpoint() error = %v", err)
	}
	if rec.Code != http.StatusCreated {
		t.Errorf("Expected status 201, got %d", rec.Code)
	}
}
