package services

import (
	"database/sql/driver"
	"fmt"
	"strconv"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/acmutd/bsg/central-service/constants"
	"github.com/acmutd/bsg/central-service/models"
	"github.com/go-redis/redismock/v9"
	"github.com/google/uuid"
	"github.com/madflojo/tasks"
	"github.com/redis/go-redis/v9"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

const MAX_ROUND_PER_ROOM = 20

func createMockRoom(db *gorm.DB, roomUUID uuid.UUID) (*models.Room, error) {
	newRoom := models.Room{
		Name:  "Hello World",
		ID:    roomUUID,
		Admin: "abc12345",
	}
	result := db.Create(&newRoom)
	if result.Error != nil {
		return nil, result.Error
	}
	return &newRoom, nil
}

func createMockProblems(db *gorm.DB, mock *sqlmock.Sqlmock) error {
	diffculties := []string{constants.DIFFICULTY_EASY, constants.DIFFICULTY_MEDIUM, constants.DIFFICULTY_HARD}
	for j, diff := range diffculties {
		for i := 0; i < 10; i++ {
			problemIndex := j*10 + i + 1
			(*mock).ExpectBegin()
			(*mock).ExpectQuery("INSERT(.*)").
				WithArgs(fmt.Sprintf("problem%d", problemIndex), "", "", diff).
				WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(fmt.Sprintf("%d", problemIndex)))
			(*mock).ExpectCommit()
			result := db.Create(&models.Problem{
				Name:        fmt.Sprintf("problem%d", problemIndex),
				Description: "",
				Hints:       "",
				Difficulty:  diff,
			})
			if result.Error != nil {
				return result.Error
			}
		}
	}
	return nil
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
	if err := createMockProblems(db, &mock); err != nil {
		t.Fatalf("Error generating mock problems: %v\n", err)
	}
	roomUUID := uuid.New()
	mock.ExpectBegin()
	mock.ExpectExec("INSERT INTO \"rooms\" (.+) VALUES (.+)").
		WithArgs(roomUUID.String(), "abc12345", "Hello World").
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
	mock.ExpectBegin()
	easyRows := sqlmock.NewRows([]string{"id", "name", "description", "hints", "difficulty"})
	mediumRows := sqlmock.NewRows([]string{"id", "name", "description", "hints", "difficulty"})
	hardRows := sqlmock.NewRows([]string{"id", "name", "description", "hints", "difficulty"})
	mock.ExpectQuery("SELECT(.*) ORDER BY RAND()").
		WithArgs(constants.DIFFICULTY_EASY).
		WillReturnRows(easyRows)
	mock.ExpectQuery("SELECT(.*) ORDER BY RAND()").
		WithArgs(constants.DIFFICULTY_MEDIUM).
		WillReturnRows(mediumRows)
	mock.ExpectQuery("SELECT(.*) ORDER BY RAND()").
		WithArgs(constants.DIFFICULTY_HARD).
		WillReturnRows(hardRows)
	mock.ExpectCommit()
	mock.ExpectBegin()
	mock.ExpectCommit()
	mockRedis.ExpectSet(fmt.Sprintf("%s_mostRecentRound", mockRoom.ID.String()), "1", 0).SetVal("OK")
	problemService := InitializeProblemService(db)
	problemAccessor := NewProblemAccessor(&problemService)
	roundScheduler := tasks.New()
	roundService := InitializeRoundService(db, rdb, roundScheduler, &problemAccessor)
	newRound, err := roundService.CreateRound(&RoundCreationParameters{
		Duration:          20,
		NumEasyProblems:   1,
		NumMediumProblems: 2,
		NumHardProblems:   1,
	}, &mockRoom.ID)
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
		WithArgs(roomUUID.String(), "abc12345", "Hello World").
		WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()
	mockRoom, err := createMockRoom(db, roomUUID)
	if err != nil {
		t.Fatalf("error creating mock room: %v\n", err)
	}
	mock.ExpectQuery("SELECT(.*)").
		WithArgs(roomUUID).
		WillReturnRows(sqlmock.NewRows([]string{"id", "duration", "room_id"}))
	problemService := InitializeProblemService(db)
	problemAccessor := NewProblemAccessor(&problemService)
	roundScheduler := tasks.New()
	roundService := InitializeRoundService(db, rdb, roundScheduler, &problemAccessor)
	roomService := InitializeRoomService(db, rdb, &roundService, 0)
	roundLimitExceeded, err := roomService.CheckRoundLimitExceeded(mockRoom)
	if err != nil {
		t.Fatalf("Error checking round limit exceeded: %v\n", err)
	}
	if !roundLimitExceeded {
		t.Fatalf("Round limit not exceeded")
	}
}

func TestFindRoundByID(t *testing.T) {
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
	if err := createMockProblems(db, &mock); err != nil {
		t.Fatalf("Error generating mock problems: %v\n", err)
	}
	roomUUID := uuid.New()
	mock.ExpectBegin()
	mock.ExpectExec("INSERT INTO \"rooms\" (.+) VALUES (.+)").
		WithArgs(roomUUID.String(), "abc12345", "Hello World").
		WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()
	mockRoom, err := createMockRoom(db, roomUUID)
	if err != nil {
		t.Fatalf("error creating mock room: %v\n", err)
	}
	mock.ExpectQuery("SELECT(.*)").
		WithArgs(roomUUID).
		WillReturnRows(sqlmock.NewRows([]string{"id", "room_name", "admin"}).AddRow(roomUUID.String(), "Hello World", "abc12345"))
	mock.ExpectQuery("SELECT(.*)").
		WithArgs(roomUUID).
		WillReturnRows(sqlmock.NewRows([]string{"id", "duration", "room_id"}))
	mock.ExpectBegin()
	mock.ExpectQuery("INSERT(.*)").
		WithArgs(AnyTime{}, int64(20), mockRoom.ID.String(), "created").
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow("1"))
	mock.ExpectCommit()
	mock.ExpectBegin()
	easyRows := sqlmock.NewRows([]string{"id", "name", "description", "hints", "difficulty"})
	mediumRows := sqlmock.NewRows([]string{"id", "name", "description", "hints", "difficulty"})
	hardRows := sqlmock.NewRows([]string{"id", "name", "description", "hints", "difficulty"})
	mock.ExpectQuery("SELECT(.*) ORDER BY RAND()").
		WithArgs(constants.DIFFICULTY_EASY).
		WillReturnRows(easyRows)
	mock.ExpectQuery("SELECT(.*) ORDER BY RAND()").
		WithArgs(constants.DIFFICULTY_MEDIUM).
		WillReturnRows(mediumRows)
	mock.ExpectQuery("SELECT(.*) ORDER BY RAND()").
		WithArgs(constants.DIFFICULTY_HARD).
		WillReturnRows(hardRows)
	mock.ExpectCommit()

	mock.ExpectBegin()
	mock.ExpectCommit()
	mockRedis.ExpectSet(fmt.Sprintf("%s_mostRecentRound", mockRoom.ID.String()), "1", 0).SetVal("OK")
	roundScheduler := tasks.New()
	problemService := InitializeProblemService(db)
	problemAccessor := NewProblemAccessor(&problemService)
	defer roundScheduler.Stop()
	roundService := InitializeRoundService(db, rdb, roundScheduler, &problemAccessor)
	newRound, err := roundService.CreateRound(&RoundCreationParameters{
		Duration: 20,
	}, &mockRoom.ID)
	if err != nil {
		t.Fatalf("Error at create round: %v\n", err)
	}
	mock.ExpectQuery("SELECT(.*)").
		WithArgs(newRound.ID).
		WillReturnRows(sqlmock.NewRows([]string{"id", "duration", "room_id"}).AddRow("1", 20, roomUUID.String()))
	searchedRound, err := roundService.FindRoundByID(newRound.ID)
	if err != nil {
		t.Fatalf("Error at finding round by id: %v\n", err)
	}
	if searchedRound == nil {
		t.Fatalf("Round with id %d not found", newRound.ID)
	}
	if searchedRound.ID != newRound.ID {
		t.Fatalf("Invalid round returned. Expected %d, but %d found", newRound.ID, searchedRound.ID)
	}
}

func TestInitiateRoundStart(t *testing.T) {
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
	// Create mock problems
	if err := createMockProblems(db, &mock); err != nil {
		t.Fatalf("Error generating mock problems: %v\n", err)
	}
	// Create a mock user
	mock.ExpectBegin()
	mock.ExpectQuery("INSERT(.*)").
		WithArgs("hello", "world", "helloworld", "helloworld@gmail.com", "abc12345").
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow("1"))
	mock.ExpectCommit()
	userService := InitializeUserService(db)
	newUser, err := userService.CreateUser("abc12345", &UserModifiableData{
		FirstName: "hello",
		LastName:  "world",
		Handle:    "helloworld",
		Email:     "helloworld@gmail.com",
	})
	if err != nil {
		t.Fatalf("Error creating new user: %v\n", err)
	}
	// Create mock room
	mockRoomUUID := uuid.New()
	mock.ExpectBegin()
	mock.ExpectExec("INSERT INTO \"rooms\" (.+) VALUES (.+)").
		WithArgs(mockRoomUUID.String(), "abc12345", "Hello World").
		WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()
	roundScheduler := tasks.New()
	problemService := InitializeProblemService(db)
	problemAccessor := NewProblemAccessor(&problemService)
	roundService := InitializeRoundService(db, rdb, roundScheduler, &problemAccessor)
	roomService := InitializeRoomService(db, rdb, &roundService, MAX_ROUND_PER_ROOM)
	_, err = createMockRoom(db, mockRoomUUID)
	if err != nil {
		t.Fatalf("Error creating mock room: %v\n", err)
	}
	// Join room
	mockRedisZKey := mockRoomUUID.String() + "_joinTimestamp"
	mock.ExpectQuery("SELECT(.*)").
		WithArgs(mockRoomUUID.String()).
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(mockRoomUUID.String()))
	mockRedis.ExpectZAdd(
		mockRedisZKey,
		redis.Z{
			Score:  float64(time.Now().Unix()),
			Member: newUser.AuthID,
		},
	).SetVal(1)
	mockRedis.ExpectZRange(mockRedisZKey, 0, -1).SetVal([]string{"abc12345"})
	_, err = roomService.JoinRoom(mockRoomUUID.String(), newUser.AuthID)
	if err != nil {
		t.Fatalf("Error joining room ; %v\n", err)
	}
	// Create a mock round
	mock.ExpectQuery("SELECT(.*)").
		WithArgs(mockRoomUUID).
		WillReturnRows(sqlmock.NewRows([]string{"id", "room_name", "admin"}).AddRow(mockRoomUUID.String(), "Hello World", "abc12345"))
	mock.ExpectQuery("SELECT(.*)").
		WithArgs(mockRoomUUID).
		WillReturnRows(sqlmock.NewRows([]string{"id", "duration", "room_id"}))
	mock.ExpectBegin()
	mock.ExpectQuery("INSERT(.*)").
		WithArgs(AnyTime{}, int64(20), mockRoomUUID.String(), "created").
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow("1"))
	mock.ExpectCommit()
	testParams := []driver.Value{}
	relationRows := sqlmock.NewRows([]string{"id"})
	joinTableRows := sqlmock.NewRows([]string{"round_id", "problem_id"})
	easyRows := sqlmock.NewRows([]string{"id", "name", "description", "hints", "difficulty"})
	for i := 1; i <= 1; i++ {
		easyRows = easyRows.AddRow(strconv.Itoa(i), fmt.Sprintf("problem%d", i), "", "", constants.DIFFICULTY_EASY)
		testParams = append(testParams, fmt.Sprintf("problem%d", i), "", "", constants.DIFFICULTY_EASY, i)
		relationRows = relationRows.AddRow(strconv.Itoa(i))
		joinTableRows = joinTableRows.AddRow(1, i)
	}
	mediumRows := sqlmock.NewRows([]string{"id", "name", "description", "hints", "difficulty"})
	for i := 11; i <= 12; i++ {
		mediumRows = mediumRows.AddRow(strconv.Itoa(i), fmt.Sprintf("problem%d", i), "", "", constants.DIFFICULTY_MEDIUM)
		testParams = append(testParams, fmt.Sprintf("problem%d", i), "", "", constants.DIFFICULTY_MEDIUM, i)
		relationRows = relationRows.AddRow(strconv.Itoa(i))
		joinTableRows = joinTableRows.AddRow(1, i)
	}
	hardRows := sqlmock.NewRows([]string{"id", "name", "description", "hints", "difficulty"})
	for i := 21; i <= 21; i++ {
		hardRows = hardRows.AddRow(strconv.Itoa(i), fmt.Sprintf("problem%d", i), "", "", constants.DIFFICULTY_HARD)
		testParams = append(testParams, fmt.Sprintf("problem%d", i), "", "", constants.DIFFICULTY_HARD, i)
		relationRows = relationRows.AddRow(strconv.Itoa(i))
		joinTableRows = joinTableRows.AddRow(1, i)
	}
	mock.ExpectBegin()
	mock.ExpectQuery("SELECT(.*) ORDER BY RAND()").
		WithArgs(constants.DIFFICULTY_EASY).
		WillReturnRows(easyRows)
	mock.ExpectQuery("SELECT(.*) ORDER BY RAND()").
		WithArgs(constants.DIFFICULTY_MEDIUM).
		WillReturnRows(mediumRows)
	mock.ExpectQuery("SELECT(.*) ORDER BY RAND()").
		WithArgs(constants.DIFFICULTY_HARD).
		WillReturnRows(hardRows)
	mock.ExpectCommit()
	mock.ExpectBegin()
	mock.ExpectQuery("INSERT(.*)").WithArgs(testParams...).WillReturnRows(
		relationRows,
	)
	mock.ExpectExec("INSERT(.*)").WithArgs(1, 1, 1, 11, 1, 12, 1, 21).WillReturnResult(sqlmock.NewResult(8, 8))
	mock.ExpectCommit()
	mockRedis.ExpectSet(fmt.Sprintf("%s_mostRecentRound", mockRoomUUID.String()), "1", 0).SetVal("OK")
	newRound, err := roundService.CreateRound(&RoundCreationParameters{
		Duration:          20,
		NumEasyProblems:   1,
		NumMediumProblems: 2,
		NumHardProblems:   1,
	}, &mockRoomUUID)
	if err != nil {
		t.Fatalf("Error creating new round: %v\n", err)
	}
	// Initiate round start
	mock.ExpectQuery("SELECT(.*)").
		WithArgs(newRound.ID).
		WillReturnRows(sqlmock.NewRows([]string{"id", "duration", "room_id"}).AddRow("1", 20, mockRoomUUID.String()))
	mock.ExpectBegin()
	mock.ExpectExec("UPDATE(.*)").
		WithArgs(AnyTime{}, "started", newRound.ID).
		WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()
	// Check participant object in DB
	mock.ExpectBegin()
	mock.ExpectQuery("INSERT INTO \"round_participants\" (.+) VALUES (.+)").
		WithArgs("abc12345", 1, 0, 0).
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow("1"))
	mock.ExpectCommit()
	mock.ExpectQuery("SELECT(.*)").WillReturnRows(
		sqlmock.NewRows([]string{"id", "name", "description", "hints", "difficulty"}).
			AddRow(1, "problem1", "", "", constants.DIFFICULTY_EASY).
			AddRow(11, "problem11", "", "", constants.DIFFICULTY_MEDIUM).
			AddRow(12, "problem12", "", "", constants.DIFFICULTY_MEDIUM).
			AddRow(21, "problem21", "", "", constants.DIFFICULTY_HARD),
	)
	mockRedis.ExpectZRange(mockRedisZKey, 0, -1).SetVal([]string{"abc12345"})
	roundStartTime, err := roundService.InitiateRoundStart(newRound, []string{newUser.AuthID})
	if err != nil {
		t.Fatalf("Error starting new round: %v\n", err)
	}
	if roundStartTime == nil {
		t.Fatalf("Start time is nil")
	}
	// Add mock expect for round scheduling
	if len(roundScheduler.Tasks()) != 1 {
		t.Fatalf("Invalid number of rounds are being scheduled. Expected 1, but %d found", len(roundScheduler.Tasks()))
	}
	// Wait for task to be scheduled
	time.Sleep(time.Second * 12)
	// Check participant object in redis cache
	mockRedis.ExpectZRange(mockRedisZKey, 0, -1).SetVal([]string{"abc12345"})
	_, err = roomService.FindActiveUsers(mockRoomUUID.String())
	if err != nil {
		t.Fatalf("Error finding active users %d\n", err)
	}
	if err = mockRedis.ExpectationsWereMet(); err != nil {
		t.Error(err)
	}
	var problemSet []models.Problem
	err = db.Model(newRound).Association("ProblemSet").Find(&problemSet)
	if err != nil {
		t.Fatalf("Error fetching problemset: %v\n", err)
	}
	if len(problemSet) != 4 {
		t.Fatalf("Expected 4 problems, but %d found", len(problemSet))
	}
}

func TestProblemSetVisibility(t *testing.T) {
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
	// Create mock problems
	if err := createMockProblems(db, &mock); err != nil {
		t.Fatalf("Error generating mock problems: %v\n", err)
	}
	// Create a mock user
	mock.ExpectBegin()
	mock.ExpectQuery("INSERT(.*)").
		WithArgs("hello", "world", "helloworld", "helloworld@gmail.com", "abc12345").
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow("1"))
	mock.ExpectCommit()
	userService := InitializeUserService(db)
	newUser, err := userService.CreateUser("abc12345", &UserModifiableData{
		FirstName: "hello",
		LastName:  "world",
		Handle:    "helloworld",
		Email:     "helloworld@gmail.com",
	})
	if err != nil {
		t.Fatalf("Error creating new user: %v\n", err)
	}
	// Create mock room
	mockRoomUUID := uuid.New()
	mock.ExpectBegin()
	mock.ExpectExec("INSERT INTO \"rooms\" (.+) VALUES (.+)").
		WithArgs(mockRoomUUID.String(), "abc12345", "Hello World").
		WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()
	roundScheduler := tasks.New()
	problemService := InitializeProblemService(db)
	problemAccessor := NewProblemAccessor(&problemService)
	roundService := InitializeRoundService(db, rdb, roundScheduler, &problemAccessor)
	roomService := InitializeRoomService(db, rdb, &roundService, MAX_ROUND_PER_ROOM)
	_, err = createMockRoom(db, mockRoomUUID)
	if err != nil {
		t.Fatalf("Error creating mock room: %v\n", err)
	}
	// Join room
	mockRedisZKey := mockRoomUUID.String() + "_joinTimestamp"
	mock.ExpectQuery("SELECT(.*)").
		WithArgs(mockRoomUUID.String()).
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(mockRoomUUID.String()))
	mockRedis.ExpectZAdd(
		mockRedisZKey,
		redis.Z{
			Score:  float64(time.Now().Unix()),
			Member: newUser.AuthID,
		},
	).SetVal(1)
	mockRedis.ExpectZRange(mockRedisZKey, 0, -1).SetVal([]string{"abc12345"})
	_, err = roomService.JoinRoom(mockRoomUUID.String(), newUser.AuthID)
	if err != nil {
		t.Fatalf("Error joining room ; %v\n", err)
	}
	// Create a mock round
	mock.ExpectQuery("SELECT(.*)").
		WithArgs(mockRoomUUID).
		WillReturnRows(sqlmock.NewRows([]string{"id", "room_name", "admin"}).AddRow(mockRoomUUID.String(), "Hello World", "abc12345"))
	mock.ExpectQuery("SELECT(.*)").
		WithArgs(mockRoomUUID).
		WillReturnRows(sqlmock.NewRows([]string{"id", "duration", "room_id"}))
	mock.ExpectBegin()
	mock.ExpectQuery("INSERT(.*)").
		WithArgs(AnyTime{}, int64(20), mockRoomUUID.String(), "created").
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow("1"))
	mock.ExpectCommit()
	testParams := []driver.Value{}
	relationRows := sqlmock.NewRows([]string{"id"})
	joinTableRows := sqlmock.NewRows([]string{"round_id", "problem_id"})
	easyRows := sqlmock.NewRows([]string{"id", "name", "description", "hints", "difficulty"})
	for i := 1; i <= 1; i++ {
		easyRows = easyRows.AddRow(strconv.Itoa(i), fmt.Sprintf("problem%d", i), "", "", constants.DIFFICULTY_EASY)
		testParams = append(testParams, fmt.Sprintf("problem%d", i), "", "", constants.DIFFICULTY_EASY, i)
		relationRows = relationRows.AddRow(strconv.Itoa(i))
		joinTableRows = joinTableRows.AddRow(1, i)
	}
	mediumRows := sqlmock.NewRows([]string{"id", "name", "description", "hints", "difficulty"})
	for i := 11; i <= 12; i++ {
		mediumRows = mediumRows.AddRow(strconv.Itoa(i), fmt.Sprintf("problem%d", i), "", "", constants.DIFFICULTY_MEDIUM)
		testParams = append(testParams, fmt.Sprintf("problem%d", i), "", "", constants.DIFFICULTY_MEDIUM, i)
		relationRows = relationRows.AddRow(strconv.Itoa(i))
		joinTableRows = joinTableRows.AddRow(1, i)
	}
	hardRows := sqlmock.NewRows([]string{"id", "name", "description", "hints", "difficulty"})
	for i := 21; i <= 21; i++ {
		hardRows = hardRows.AddRow(strconv.Itoa(i), fmt.Sprintf("problem%d", i), "", "", constants.DIFFICULTY_HARD)
		testParams = append(testParams, fmt.Sprintf("problem%d", i), "", "", constants.DIFFICULTY_HARD, i)
		relationRows = relationRows.AddRow(strconv.Itoa(i))
		joinTableRows = joinTableRows.AddRow(1, i)
	}
	mock.ExpectBegin()
	mock.ExpectQuery("SELECT(.*) ORDER BY RAND()").
		WithArgs(constants.DIFFICULTY_EASY).
		WillReturnRows(easyRows)
	mock.ExpectQuery("SELECT(.*) ORDER BY RAND()").
		WithArgs(constants.DIFFICULTY_MEDIUM).
		WillReturnRows(mediumRows)
	mock.ExpectQuery("SELECT(.*) ORDER BY RAND()").
		WithArgs(constants.DIFFICULTY_HARD).
		WillReturnRows(hardRows)
	mock.ExpectCommit()
	mock.ExpectBegin()
	mock.ExpectQuery("INSERT(.*)").WithArgs(testParams...).WillReturnRows(
		relationRows,
	)
	mock.ExpectExec("INSERT(.*)").WithArgs(1, 1, 1, 11, 1, 12, 1, 21).WillReturnResult(sqlmock.NewResult(8, 8))
	mock.ExpectCommit()
	mockRedis.ExpectSet(fmt.Sprintf("%s_mostRecentRound", mockRoomUUID.String()), "1", 0).SetVal("OK")
	newRound, err := roundService.CreateRound(&RoundCreationParameters{
		Duration:          20,
		NumEasyProblems:   1,
		NumMediumProblems: 2,
		NumHardProblems:   1,
	}, &mockRoomUUID)
	if err != nil {
		t.Fatalf("Error creating new round: %v\n", err)
	}
	if len(newRound.ProblemSet) != 0 {
		t.Fatalf("Problem set visible before round starts. Found %d problems in the problem set", len(newRound.ProblemSet))
	}
	mock.ExpectQuery("SELECT(.*)").WithArgs(1).WillReturnRows(sqlmock.NewRows([]string{"id", "duration", "room_id", "status"}).AddRow("1", 20, mockRoomUUID.String(), "created"))
	roundFromService, err := roundService.FindRoundByID(newRound.ID)
	if err != nil {
		t.Fatalf("Error getting round data from round service: %v\n", err)
	}
	if len(roundFromService.ProblemSet) != 0 {
		t.Fatalf("Round problemset visible before round starts. Found %d problems in the problemset", len(roundFromService.ProblemSet))
	}

	// Initiate round start
	mock.ExpectQuery("SELECT(.*)").
		WithArgs(newRound.ID).
		WillReturnRows(sqlmock.NewRows([]string{"id", "duration", "room_id", "status"}).AddRow("1", 20, mockRoomUUID.String(), "created"))
	mock.ExpectBegin()
	mock.ExpectExec("UPDATE(.*)").
		WithArgs(AnyTime{}, "started", newRound.ID).
		WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()
	// Check participant object in DB
	mock.ExpectBegin()
	mock.ExpectQuery("INSERT INTO \"round_participants\" (.+) VALUES (.+)").
		WithArgs("abc12345", 1, 0, 0).
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow("1"))
	mock.ExpectCommit()
	mock.ExpectQuery("SELECT(.*)").
		WillReturnRows(sqlmock.NewRows([]string{"id", "duration", "room_id", "status"}).AddRow(1, 20, mockRoomUUID.String(), "started"))
	mock.ExpectQuery("SELECT(.*)").WillReturnRows(
		sqlmock.NewRows([]string{"id", "name", "description", "hints", "difficulty"}).
			AddRow(1, "problem1", "", "", constants.DIFFICULTY_EASY).
			AddRow(11, "problem11", "", "", constants.DIFFICULTY_MEDIUM).
			AddRow(12, "problem12", "", "", constants.DIFFICULTY_MEDIUM).
			AddRow(21, "problem21", "", "", constants.DIFFICULTY_HARD),
	)
	mockRedis.ExpectZRange(mockRedisZKey, 0, -1).SetVal([]string{"abc12345"})
	roundStartTime, err := roundService.InitiateRoundStart(newRound, []string{newUser.AuthID})
	if err != nil {
		t.Fatalf("Error starting new round: %v\n", err)
	}
	if roundStartTime == nil {
		t.Fatalf("Start time is nil")
	}
	// Add mock expect for round scheduling
	if len(roundScheduler.Tasks()) != 1 {
		t.Fatalf("Invalid number of rounds are being scheduled. Expected 1, but %d found", len(roundScheduler.Tasks()))
	}
	// Wait for task to be scheduled
	for len(roundScheduler.Tasks()) == 1 {
	}
	anotherRoundFromService, err := roundService.FindRoundByID(roundFromService.ID)
	if err != nil {
		t.Fatalf("Error getting round data from round service: %v\n", err)
	}
	if len(anotherRoundFromService.ProblemSet) != 4 {
		t.Fatalf("Round problemset not visible after round starts. Found %d problems in the problemset", len(roundFromService.ProblemSet))
	}
	// Check participant object in redis cache
	mockRedis.ExpectZRange(mockRedisZKey, 0, -1).SetVal([]string{"abc12345"})
	_, err = roomService.FindActiveUsers(mockRoomUUID.String())
	if err != nil {
		t.Fatalf("Error finding active users %d\n", err)
	}
	if err = mockRedis.ExpectationsWereMet(); err != nil {
		t.Error(err)
	}
}

func TestRoundEndTransition(t *testing.T) {
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
	// Create mock problems
	if err := createMockProblems(db, &mock); err != nil {
		t.Fatalf("Error generating mock problems: %v\n", err)
	}
	// Create a mock user
	mock.ExpectBegin()
	mock.ExpectQuery("INSERT(.*)").
		WithArgs("hello", "world", "helloworld", "helloworld@gmail.com", "abc12345").
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow("1"))
	mock.ExpectCommit()
	userService := InitializeUserService(db)
	newUser, err := userService.CreateUser("abc12345", &UserModifiableData{
		FirstName: "hello",
		LastName:  "world",
		Handle:    "helloworld",
		Email:     "helloworld@gmail.com",
	})
	if err != nil {
		t.Fatalf("Error creating new user: %v\n", err)
	}
	// Create mock room
	mockRoomUUID := uuid.New()
	mock.ExpectBegin()
	mock.ExpectExec("INSERT INTO \"rooms\" (.+) VALUES (.+)").
		WithArgs(mockRoomUUID.String(), "abc12345", "Hello World").
		WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()
	roundScheduler := tasks.New()
	problemService := InitializeProblemService(db)
	problemAccessor := NewProblemAccessor(&problemService)
	roundService := InitializeRoundService(db, rdb, roundScheduler, &problemAccessor)
	roomService := InitializeRoomService(db, rdb, &roundService, MAX_ROUND_PER_ROOM)
	_, err = createMockRoom(db, mockRoomUUID)
	if err != nil {
		t.Fatalf("Error creating mock room: %v\n", err)
	}
	// Join room
	mockRedisZKey := mockRoomUUID.String() + "_joinTimestamp"
	mock.ExpectQuery("SELECT(.*)").
		WithArgs(mockRoomUUID.String()).
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(mockRoomUUID.String()))
	mockRedis.ExpectZAdd(
		mockRedisZKey,
		redis.Z{
			Score:  float64(time.Now().Unix()),
			Member: newUser.AuthID,
		},
	).SetVal(1)
	mockRedis.ExpectZRange(mockRedisZKey, 0, -1).SetVal([]string{"abc12345"})
	_, err = roomService.JoinRoom(mockRoomUUID.String(), newUser.AuthID)
	if err != nil {
		t.Fatalf("Error joining room ; %v\n", err)
	}
	// Create a mock round
	mock.ExpectQuery("SELECT(.*)").
		WithArgs(mockRoomUUID).
		WillReturnRows(sqlmock.NewRows([]string{"id", "room_name", "admin"}).AddRow(mockRoomUUID.String(), "Hello World", "abc12345"))
	mock.ExpectQuery("SELECT(.*)").
		WithArgs(mockRoomUUID).
		WillReturnRows(sqlmock.NewRows([]string{"id", "duration", "room_id"}))
	mock.ExpectBegin()
	mock.ExpectQuery("INSERT(.*)").
		WithArgs(AnyTime{}, int64(1), mockRoomUUID.String(), "created").
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow("1"))
	mock.ExpectCommit()
	testParams := []driver.Value{}
	relationRows := sqlmock.NewRows([]string{"id"})
	joinTableRows := sqlmock.NewRows([]string{"round_id", "problem_id"})
	easyRows := sqlmock.NewRows([]string{"id", "name", "description", "hints", "difficulty"})
	for i := 1; i <= 1; i++ {
		easyRows = easyRows.AddRow(strconv.Itoa(i), fmt.Sprintf("problem%d", i), "", "", constants.DIFFICULTY_EASY)
		testParams = append(testParams, fmt.Sprintf("problem%d", i), "", "", constants.DIFFICULTY_EASY, i)
		relationRows = relationRows.AddRow(strconv.Itoa(i))
		joinTableRows = joinTableRows.AddRow(1, i)
	}
	mediumRows := sqlmock.NewRows([]string{"id", "name", "description", "hints", "difficulty"})
	for i := 11; i <= 12; i++ {
		mediumRows = mediumRows.AddRow(strconv.Itoa(i), fmt.Sprintf("problem%d", i), "", "", constants.DIFFICULTY_MEDIUM)
		testParams = append(testParams, fmt.Sprintf("problem%d", i), "", "", constants.DIFFICULTY_MEDIUM, i)
		relationRows = relationRows.AddRow(strconv.Itoa(i))
		joinTableRows = joinTableRows.AddRow(1, i)
	}
	hardRows := sqlmock.NewRows([]string{"id", "name", "description", "hints", "difficulty"})
	for i := 21; i <= 21; i++ {
		hardRows = hardRows.AddRow(strconv.Itoa(i), fmt.Sprintf("problem%d", i), "", "", constants.DIFFICULTY_HARD)
		testParams = append(testParams, fmt.Sprintf("problem%d", i), "", "", constants.DIFFICULTY_HARD, i)
		relationRows = relationRows.AddRow(strconv.Itoa(i))
		joinTableRows = joinTableRows.AddRow(1, i)
	}
	mock.ExpectBegin()
	mock.ExpectQuery("SELECT(.*) ORDER BY RAND()").
		WithArgs(constants.DIFFICULTY_EASY).
		WillReturnRows(easyRows)
	mock.ExpectQuery("SELECT(.*) ORDER BY RAND()").
		WithArgs(constants.DIFFICULTY_MEDIUM).
		WillReturnRows(mediumRows)
	mock.ExpectQuery("SELECT(.*) ORDER BY RAND()").
		WithArgs(constants.DIFFICULTY_HARD).
		WillReturnRows(hardRows)
	mock.ExpectCommit()
	mock.ExpectBegin()
	mock.ExpectQuery("INSERT(.*)").WithArgs(testParams...).WillReturnRows(
		relationRows,
	)
	mock.ExpectExec("INSERT(.*)").WithArgs(1, 1, 1, 11, 1, 12, 1, 21).WillReturnResult(sqlmock.NewResult(8, 8))
	mock.ExpectCommit()
	mockRedis.ExpectSet(fmt.Sprintf("%s_mostRecentRound", mockRoomUUID.String()), "1", 0).SetVal("OK")
	newRound, err := roundService.CreateRound(&RoundCreationParameters{
		Duration:          1,
		NumEasyProblems:   1,
		NumMediumProblems: 2,
		NumHardProblems:   1,
	}, &mockRoomUUID)
	if err != nil {
		t.Fatalf("Error creating new round: %v\n", err)
	}
	// Initiate round start
	mock.ExpectQuery("SELECT(.*)").
		WithArgs(newRound.ID).
		WillReturnRows(sqlmock.NewRows([]string{"id", "duration", "room_id"}).AddRow("1", 1, mockRoomUUID.String()))
	mock.ExpectBegin()
	mock.ExpectExec("UPDATE(.*)").
		WithArgs(AnyTime{}, "started", newRound.ID).
		WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()
	// Check participant object in DB
	mock.ExpectBegin()
	mock.ExpectQuery("INSERT INTO \"round_participants\" (.+) VALUES (.+)").
		WithArgs("abc12345", 1, 0, 0).
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow("1"))
	mock.ExpectCommit()
	mock.ExpectQuery("SELECT(.*)").WillReturnRows(
		sqlmock.NewRows([]string{"id", "name", "description", "hints", "difficulty"}).
			AddRow(1, "problem1", "", "", constants.DIFFICULTY_EASY).
			AddRow(11, "problem11", "", "", constants.DIFFICULTY_MEDIUM).
			AddRow(12, "problem12", "", "", constants.DIFFICULTY_MEDIUM).
			AddRow(21, "problem21", "", "", constants.DIFFICULTY_HARD),
	)
	mockRedis.ExpectZRange(mockRedisZKey, 0, -1).SetVal([]string{"abc12345"})
	mock.ExpectBegin()
	mock.ExpectExec("UPDATE(.*)").WithArgs(constants.ROUND_END, newRound.ID).WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()
	roundStartTime, err := roundService.InitiateRoundStart(newRound, []string{newUser.AuthID})
	if err != nil {
		t.Fatalf("Error starting new round: %v\n", err)
	}
	if roundStartTime == nil {
		t.Fatalf("Start time is nil")
	}
	// Add mock expect for round scheduling
	if len(roundScheduler.Tasks()) != 1 {
		t.Fatalf("Invalid number of rounds are being scheduled. Expected 1, but %d found", len(roundScheduler.Tasks()))
	}
	// Wait for task to be scheduled
	time.Sleep(time.Second * 12)
	// Check participant object in redis cache
	mockRedis.ExpectZRange(mockRedisZKey, 0, -1).SetVal([]string{"abc12345"})
	_, err = roomService.FindActiveUsers(mockRoomUUID.String())
	if err != nil {
		t.Fatalf("Error finding active users %d\n", err)
	}
	if err = mockRedis.ExpectationsWereMet(); err != nil {
		t.Error(err)
	}
	var problemSet []models.Problem
	err = db.Model(newRound).Association("ProblemSet").Find(&problemSet)
	if err != nil {
		t.Fatalf("Error fetching problemset: %v\n", err)
	}
	if len(problemSet) != 4 {
		t.Fatalf("Expected 4 problems, but %d found", len(problemSet))
	}
	if len(roundScheduler.Tasks()) != 1 {
		t.Fatalf("Expected 1 task in queue, but %d found", len(roundScheduler.Tasks()))
	}
	for len(roundScheduler.Tasks()) == 1 {
	}
}
