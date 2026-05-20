package models

type Statistics struct {
	UserID     string `gorm:"primaryKey" json:"id"`
	User       User   `gorm:"foreignKey:UserID;references:ID"`
	RoomID     string `gorm:"primaryKey" json:"shortCode"`
	Room       Room   `gorm:"foreignKey:RoomID;references:ShortCode"`
	TotalScore uint   `json:"score"`
}
