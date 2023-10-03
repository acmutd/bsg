package services

import (
	"log"
	"net/http"

	firebase "firebase.google.com/go"
	"firebase.google.com/go/auth"
	"github.com/acmutd/bsg/central-service/models"
	"google.golang.org/appengine/v2"
	"gorm.io/gorm"
)

type UserService struct {
	db          *gorm.DB
	firebaseApp *firebase.App
}

type UserModifiableData struct {
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
	Handle    string `json:"handle"`
	Email     string `json:"email"`
}

func InitializeUserService(db *gorm.DB, firebaseApp *firebase.App) UserService {
	return UserService{db, firebaseApp}
}

func (service *UserService) GenerateAuthToken(request *http.Request) (*auth.Token, error) {
	ctx := appengine.NewContext(request)
	authToken := request.Header.Get("Authorization")
	authClient, err := service.firebaseApp.Auth(ctx)
	if err != nil {
		log.Printf("something is wrong with auth client: %v\n", err)
		return nil, err
	}
	return authClient.VerifyIDToken(ctx, authToken)
}

func (service *UserService) CreateUser(authID string, userData *UserModifiableData) (*models.User, error) {
	newUser := models.User{
		FirstName: userData.FirstName,
		LastName:  userData.LastName,
		Handle:    userData.Handle,
		AuthID:    authID,
	}
	result := service.db.Create(&newUser)
	if result.Error != nil {
		return nil, result.Error
	}
	return &newUser, nil
}

func (service *UserService) FindUserByAuthID(authID string) (*models.User, error) {
	var user models.User
	result := service.db.Where("auth_id = ?", authID).First(&user)
	if result.Error != nil {
		return nil, result.Error
	}
	if result.RowsAffected == 0 {
		return nil, nil
	}
	return &user, nil
}

func (service *UserService) UpdateUserData(authID string, userData *UserModifiableData) (*models.User, error) {
	searchedUser, err := service.FindUserByAuthID(authID)
	if err != nil {
		return nil, err
	}
	if searchedUser == nil {
		return nil, nil
	}
	result := service.db.Model(searchedUser).Updates(userData)
	if result.Error != nil {
		return nil, result.Error
	}
	return searchedUser, nil
}
