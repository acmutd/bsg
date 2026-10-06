package models

type User struct {
	ID        uint   `json:"id"`
	AuthID    string `gorm:"primaryKey" json:"authID"`
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
	Handle    string `json:"handle"`
	Email     string `json:"email"`
	PhotoURL  string `json:"photoURL"`
}
