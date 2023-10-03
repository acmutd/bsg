package models

import "gorm.io/gorm"

type User struct {
	gorm.Model
	FirstName string
	LastName  string
	Handle    string
	Email     string
	AuthID    string
}
