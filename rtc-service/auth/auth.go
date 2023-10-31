package auth

import (
	"context"
	"net/http"

	"github.com/google/uuid"
)

type contextKey string

const UserContextKey = contextKey("user")

type AnonUser struct {
	Id   string `json:"id"`
	Name string `json:"name"`
}

func (user *AnonUser) GetId() string {
	return user.Id
}

func (user *AnonUser) GetName() string {
	return user.Name
}

func AuthMiddleware(f http.HandlerFunc) http.HandlerFunc {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		name, _ := r.URL.Query()["name"]

		user := AnonUser{Id: uuid.New().String(), Name: name[0]}
		ctx := context.WithValue(r.Context(), UserContextKey, &user)
		f(w, r.WithContext(ctx))

	})
}
