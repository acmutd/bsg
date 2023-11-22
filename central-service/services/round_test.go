package services

import (
	"database/sql/driver"
	"fmt"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/acmutd/bsg/central-service/models"
	"github.com/go-redis/redismock/v9"
	"github.com/google/uuid"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

const MAX_ROUND_PER_ROOM = 20

func createMockRoom(db *gorm.DB, roomUUID uuid.UUID) (*models.Room, error) {
	newRoom := models.Room{
		Name: "Hello World",
		ID: roomUUID,
		Admin: "1",
	}
	result := db.Create(&newRoom)
	if result.Error != nil {
		return nil, result.Error
	}
	return &newRoom, nil
}

type AnyTime struct{}

// Match satisfies sqlmock.Argument interface
func (a AnyTime) Match(v driver.Value) bool {
	_, ok := v.(time.Time)
	return ok
}

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
	roomUUID := uuid.New()
	mock.ExpectBegin()
	mock.ExpectExec("INSERT INTO \"rooms\" (.+) VALUES (.+)").
		WithArgs(roomUUID.String(), "1", "Hello World").
		WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()
	mockRoom, err := createMockRoom(db, roomUUID)
	if err != nil {
		t.Fatalf("error creating mock room: %v\n", err)
	}
	mock.ExpectQuery("SELECT(.*)").
		WithArgs(roomUUID).
		WillReturnRows(sqlmock.NewRows([]string{"id", "room_name", "admin"}).AddRow(roomUUID.String(), "Hello World", "1"))
	mock.ExpectQuery("SELECT(.*)").
		WithArgs(roomUUID).
		WillReturnRows(sqlmock.NewRows([]string{"id", "duration", "room_id"}))
	mock.ExpectBegin()
	mock.ExpectQuery("INSERT(.*)").
		WithArgs(AnyTime{}, int64(20), mockRoom.ID.String(), "created").
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow("1"))
		// WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()
	mockRedis.ExpectSet(fmt.Sprintf("%s_mostRecentRound", mockRoom.ID.String()), "1", 0).SetVal("OK")
	roomService := InitializeRoomService(db, rdb, MAX_ROUND_PER_ROOM)
	roomAccessor := NewRoomAccessor(&roomService)
	roundService := InitializeRoundService(db, rdb, &roomAccessor)
	newRound, err := roundService.CreateRound(&RoundCreationParameters{
		RoomID:   mockRoom.ID.String(),
		Duration: 20,
	})
	if err != nil {
		t.Fatalf("Error at create round: %v\n", err)
	}
	if newRound == nil {
		t.Fatal("No round found")
	}
	var roundList []models.Round
	mock.ExpectQuery("SELECT(.*)").WithArgs(mockRoom.ID.String()).WillReturnRows(sqlmock.NewRows([]string{"id", "duration", "room_id"}).AddRow(newRound.ID, "20", mockRoom.ID.String()))
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
	rdb, _ := redismock.NewClientMock()	
	if err != nil {
		t.Fatalf("an error '%s' was not expected when opening a stub database connection", err)
	}
	defer mockDb.Close()
	dialector := postgres.New(postgres.Config{
		Conn:       mockDb,
		DriverName: "postgres",
	})
	roomUUID := uuid.New()
	db, _ := gorm.Open(dialector, &gorm.Config{})
	mock.ExpectBegin()
	mock.ExpectExec("INSERT INTO \"rooms\" (.+) VALUES (.+)").
		WithArgs(roomUUID.String(), "1", "Hello World").
		WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()
	mockRoom, err := createMockRoom(db, roomUUID)
	if err != nil {
		t.Fatalf("error creating mock room: %v\n", err)
	}
	mock.ExpectQuery("SELECT(.*)").
		WithArgs(roomUUID).
		WillReturnRows(sqlmock.NewRows([]string{"id", "duration", "room_id"}))
	roomService := InitializeRoomService(db, rdb, 0)
	roomAccessor := NewRoomAccessor(&roomService)
	roundLimitExceeded, err := roomAccessor.CheckRoundLimitExceeded(mockRoom)
	if err != nil {
		t.Fatalf("Error checking round limit exceeded: %v\n", err)
	}
	if !roundLimitExceeded {
		t.Fatalf("Round limit not exceeded")
	}
}

// TODO: add unit test for FindRoundByID
// TODO: add unit test for InitiateRoundStart