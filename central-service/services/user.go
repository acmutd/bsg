package services

import (
	"context"
	"log"
	"net/http"
	"os"

	firebase "firebase.google.com/go"
	"firebase.google.com/go/auth"
	"github.com/acmutd/bsg/central-service/models"
	"google.golang.org/api/option"
	"gorm.io/gorm"
)

type UserService struct {
	db *gorm.DB
}

type UserModifiableData struct {
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
	Handle    string `json:"handle"`
	Email     string `json:"email"`
}

func InitializeUserService(db *gorm.DB) UserService {
	return UserService{db}
}

func (service *UserService) GenerateAuthToken(request *http.Request) (*auth.Token, error) {
	firebaseApp, err := firebase.NewApp(context.Background(), nil, option.WithCredentialsFile(os.Getenv("FIREBASE_CREDENTIALS_FILEPATH")))
	if err != nil {
		log.Fatalf("error initializing app: %v\n", err)
		return nil, err
	}
	authToken := request.Header.Get("Authorization")
	authClient, err := firebaseApp.Auth(context.Background())
	if err != nil {
		log.Printf("something is wrong with auth client: %v\n", err)
		return nil, err
	}
	return authClient.VerifyIDToken(context.Background(), authToken)
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

func (service *UserService) FindUserByUserID(userID string) (*models.User, error) {
	var user models.User
	result := service.db.Where("ID = ?", userID).First(&user)
	if result.Error != nil {
		return nil, result.Error
	}
	if result.RowsAffected == 0 {
		return nil, nil
	}
	return &user, nil
}
