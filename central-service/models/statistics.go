package models

type Statistics struct {
	UserID     string  `gorm:"primaryKey;type:text" json:"user_id"`
	RoomID     string  `gorm:"primaryKey;type:text" json:"room_id"`
	TotalScore float64 `json:"score"`
}
