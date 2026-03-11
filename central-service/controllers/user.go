package controllers

import (
	"net/http"
	"os"

	"github.com/acmutd/bsg/central-service/models"
	"github.com/acmutd/bsg/central-service/services"
	"github.com/acmutd/bsg/central-service/utils"
	"github.com/labstack/echo/v4"
)

type UserController struct {
	userService *services.UserService
	logger      *utils.StructuredLogger
}

func InitializeUserController(service *services.UserService, logger *utils.StructuredLogger) UserController {
	return UserController{service, logger}
}

// Milddleware used to validate whether user request contains authorization token
func (controller *UserController) ValidateUserRequest(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		// check for server secret bypass
		serverSecret := c.Request().Header.Get("X-Server-Secret")
		if serverSecret != "" && serverSecret == os.Getenv("SERVER_SECRET") {
			userAuthID := c.Request().Header.Get("X-User-Auth-ID")
			if userAuthID == "" {
				return echo.NewHTTPError(http.StatusBadRequest, "Missing X-User-Auth-ID header for trusted call")
			}
			c.Set("userAuthID", userAuthID)
			return next(c)
		}

		authToken, err := controller.userService.GenerateAuthToken(c.Request())
		if err != nil {
			controller.logger.Warn("Failed to generate auth token", map[string]interface{}{
				"error": err.Error(),
			})
			return echo.NewHTTPError(http.StatusUnauthorized, "Invalid credentials")
		}
		c.Set("userAuthID", authToken.UID)
		return next(c)
	}
}

// An endpoint containing logic used to create a new user based on provided parameters
func (controller *UserController) CreateNewUserEndpoint(c echo.Context) error {
	var userData services.UserModifiableData
	if err := c.Bind(&userData); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid data. Please try again")
	}
	userAuthID := c.Get("userAuthID").(string)
	newUser, err := controller.userService.CreateUser(userAuthID, &userData)
	if err != nil {
		controller.logger.Error("Failed to create user", err, map[string]interface{}{
			"user_auth_id": userAuthID,
		})
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to create user. Please try again later")
	}
	return c.JSON(http.StatusCreated, map[string]models.User{
		"data": *newUser,
	})
}

// An endpoint containing logic used to update a user data with provided parameters
func (controller *UserController) UpdateUserDataEndpoint(c echo.Context) error {
	var userData services.UserModifiableData
	if err := c.Bind(&userData); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid data. Please try again")
	}
	userAuthID := c.Get("userAuthID").(string)
	updatedUser, err := controller.userService.UpdateUserData(userAuthID, &userData)
	if err != nil {
		controller.logger.Error("Failed to update user data", err, map[string]interface{}{
			"user_auth_id": userAuthID,
		})
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to update user data. Please try again later")
	}
	return c.JSON(http.StatusCreated, map[string]models.User{
		"data": *updatedUser,
	})
}

// An endpoint containing logic used to find user by auth id
func (controller *UserController) FindUserByAuthIDEndpoint(c echo.Context) error {
	userAuthID := c.Get("userAuthID").(string)
	searchedUser, err := controller.userService.FindUserByAuthID(userAuthID)
	if err != nil {
		controller.logger.Error("Failed to find user data", err, map[string]interface{}{
			"user_auth_id": userAuthID,
		})
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to find user data. Please try again later")
	}
	return c.JSON(http.StatusCreated, map[string]models.User{
		"data": *searchedUser,
	})
}

// An endpoint containing logic used to find user based on their user id
func (controller *UserController) FindUserByUserIDEndpoint(c echo.Context) error {
	targetUserID := c.QueryParam("userId")
	if targetUserID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "Target user ID required")
	}
	searchedUser, err := controller.userService.FindUserByUserID(targetUserID)
	if err != nil {
		controller.logger.Error("Failed to search for user", err, map[string]interface{}{
			"user_id": targetUserID,
		})
		return echo.NewHTTPError(http.StatusInternalServerError)
	}
	if searchedUser == nil {
		return echo.NewHTTPError(http.StatusBadRequest, "User not found")
	}
	return c.JSON(http.StatusOK, map[string]models.User{
		"data": *searchedUser,
	})
}

func (controller *UserController) InitializeRoutes(g *echo.Group) {
	g.GET("/", controller.FindUserByUserIDEndpoint)
	g.GET("/me", controller.FindUserByAuthIDEndpoint)
	g.POST("/", controller.CreateNewUserEndpoint)
	g.PUT("/", controller.UpdateUserDataEndpoint)
}
