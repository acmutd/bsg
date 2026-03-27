package models

type User struct {
	ID        uint   `json:"id"`
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
	Handle    string `json:"handle"`
	Email     string `json:"email"`
	AuthID    string `json:"authID"`
	PhotoURL  string `json:"photoURL"`
}
