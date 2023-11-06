package services

import (
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/acmutd/bsg/central-service/models"
	"github.com/go-redis/redismock/v9"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

const MAX_ROUND_PER_ROOM = 20

func createMockRoom(db *gorm.DB) (*models.Room, error) {
	// TODO: Use RoomService
	newRoom := models.Room{
		Name: "Hello World",
	}
	result := db.Create(&newRoom)
	if result.Error != nil {
		return nil, result.Error
	}
	return &newRoom, nil
}

// TODO: fix test

func TestCreateNewRound(t *testing.T) {
	mockDb, mock, err := sqlmock.New()
	rdb, mockRedis := redismock.NewClientMock()
	if err != nil {
		t.Fatalf("an error '%s' was not expected when opening a stub database connection", err)
	}
	defer mockDb.Close()
	dialector := postgres.New(postgres.Config{
		Conn:       mockDb,
		DriverName: "postgres",
	})
	db, _ := gorm.Open(dialector, &gorm.Config{})
	mock.ExpectBegin()
	mock.ExpectQuery("INSERT INTO \"rooms\" (.+) VALUES (.+)").
		WithArgs("Hello World").
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow("1"))
	mock.ExpectCommit()
	mockRoom, err := createMockRoom(db)
	if err != nil {
		t.Fatalf("error creating mock room: %v\n", err)
	}
	mock.ExpectQuery("SELECT(.*)").
		WithArgs(1).
		WillReturnRows(sqlmock.NewRows([]string{"id", "room_name"}).AddRow("1", "Hello World"))
	mock.ExpectQuery("SELECT(.*)").
		WithArgs(1).
		WillReturnRows(sqlmock.NewRows([]string{"id", "duration", "room_id"}))
	mock.ExpectBegin()
	mock.ExpectQuery("INSERT(.*)").
		WithArgs(20, mockRoom.ID).
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow("1"))
	mock.ExpectCommit()
	mockRedis.ExpectSet("1_mostRecentRound", "1", 0)
	roomService := InitializeRoomService(db, MAX_ROUND_PER_ROOM)
	roomAccessor := NewRoomAccessor(&roomService)
	roundService := InitializeRoundService(db, rdb, &roomAccessor)
	_, err = roundService.CreateRound(&RoundCreationParameters{
		RoomID:   mockRoom.ID.String(),
		Duration: 20,
	})
	if err != nil {
		t.Fatalf("error creating new round: %v\n", err)
	}
	var roundList []models.Round
	mock.ExpectQuery("SELECT(.*)").WithArgs(1).WillReturnRows(sqlmock.NewRows([]string{"id", "duration", "room_id"}).AddRow("1", "20", "1"))
	err = db.Model(mockRoom).Association("Rounds").Find(&roundList)
	if err != nil {
		t.Fatalf("Error finding association: %v\n", err)
	}
	if len(roundList) != 1 {
		t.Fatalf("Error setting up association. Only %d rounds found\n", len(roundList))
	}
	if err = mockRedis.ExpectationsWereMet(); err != nil {
		t.Error(err)
	}
}

func TestCreateNewRoundExceededLimit(t *testing.T) {
	mockDb, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("an error '%s' was not expected when opening a stub database connection", err)
	}
	defer mockDb.Close()
	dialector := postgres.New(postgres.Config{
		Conn:       mockDb,
		DriverName: "postgres",
	})
	db, _ := gorm.Open(dialector, &gorm.Config{})
	mock.ExpectBegin()
	mock.ExpectQuery("INSERT INTO \"rooms\" (.+) VALUES (.+)").
		WithArgs("Hello World").
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow("1"))
	mock.ExpectCommit()
	mockRoom, err := createMockRoom(db)
	if err != nil {
		t.Fatalf("error creating mock room: %v\n", err)
	}
	mock.ExpectQuery("SELECT(.*)").
		WithArgs(1).
		WillReturnRows(sqlmock.NewRows([]string{"id", "duration", "room_id"}))
	roomService := InitializeRoomService(db, MAX_ROUND_PER_ROOM)
	roomAccessor := NewRoomAccessor(&roomService)
	roundLimitExceeded, err := roomAccessor.CheckRoundLimitExceeded(mockRoom)
	if err != nil {
		t.Fatalf("Error checking round limit exceeded: %v\n", err)
	}
	if !roundLimitExceeded {
		t.Fatalf("Round limit not exceeded")
	}
}
