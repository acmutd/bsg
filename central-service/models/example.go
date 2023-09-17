package models

import "gorm.io/gorm"

type ExampleModel struct {
	gorm.Model
	Name    string
	Message string
}
