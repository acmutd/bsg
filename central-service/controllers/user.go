package controllers

import (
	"log"
	"net/http"

	"firebase.google.com/go/auth"
	"github.com/acmutd/bsg/central-service/models"
	"github.com/acmutd/bsg/central-service/services"
	"github.com/labstack/echo/v4"
)

type UserController struct {
	userService *services.UserService
}

func InitializeUserController() UserController {
	return UserController{nil}
}

// Setter used to update user service for controller
func (controller *UserController) SetUserService(service *services.UserService) {
	controller.userService = service
}

// Milddleware used to validate whether user request contains authorization token
func (controller *UserController) ValidateUserRequest(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		authToken, err := controller.userService.GenerateAuthToken(c.Request())
		if err != nil {
			log.Printf("Error generating auth token: %v\n", err)
			return c.JSON(http.StatusUnauthorized, map[string]string{
				"msg": "Invalid credentials",
			})
		}
		c.Set("authToken", authToken)
		return next(c)
	}
}

// An endpoint containing logic used to create a new user based on provided parameters
func (controller *UserController) CreateNewUserEndpoint(c echo.Context) error {
	var userData services.UserModifiableData
	if err := c.Bind(&userData); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid data. Please try again")
	}
	userAuthID := c.Get("authToken").(*auth.Token).UID
	newUser, err := controller.userService.CreateUser(userAuthID, &userData)
	if err != nil {
		log.Printf("Failed to create user object: %v\n", err)
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to create user. Please try again later")
	}
	return c.JSON(http.StatusCreated, map[string]models.User{
		"data": *newUser,
	})
}

// An endpoint containing logic used to update a user data with provided parameters
func (controller *UserController) UpdateUserDataEnpoint(c echo.Context) error {
	var userData services.UserModifiableData
	if err := c.Bind(&userData); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid data. Please try again")
	}
	userAuthID := c.Get("authToken").(*auth.Token).UID
	updatedUser, err := controller.userService.UpdateUserData(userAuthID, &userData)
	if err != nil {
		log.Printf("Failed to update user data: %v\n", err)
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to update user data. Please try again later")
	}
	return c.JSON(http.StatusCreated, map[string]models.User{
		"data": *updatedUser,
	})
}

// An endpoint containing logic used to find user by auth id
func (controller *UserController) FindUserByAuthIDEndpoint(c echo.Context) error {
	userAuthID := c.Get("authToken").(*auth.Token).UID
	searchedUser, err := controller.userService.FindUserByAuthID(userAuthID)
	if err != nil {
		log.Printf("Failed to find user data: %v\n", err)
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
		log.Printf("Failed to search for user with id %s: %v\n", targetUserID, err)
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
	g.PUT("/", controller.UpdateUserDataEnpoint)
}
