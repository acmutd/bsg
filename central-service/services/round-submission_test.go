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
	"gorm.io/gorm/logger"
)

func TestSubmitToRound(t *testing.T) {
	// setup infrastructure
	mockDb, mock, err := sqlmock.New()
	rdb, mockRedis := redismock.NewClientMock()
	if err != nil {
		t.Fatalf("an error %s was not expected when opening a stub database connection", err)
	}
	defer mockDb.Close()
	dialector := postgres.New(postgres.Config{
		Conn: mockDb,
		DriverName: "postgres",
	})
	db, _ := gorm.Open(dialector, &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err := createMockProblems(db, &mock); err != nil {
		t.Fatalf("Error generating mock problems: %v\n", err)
	}
	mockRoomUUID := uuid.New()
	mock.ExpectBegin()
	mock.ExpectExec("INSERT INTO \"rooms\" (.+) VALUES (.+)").
		WithArgs(mockRoomUUID.String(), "abc12345", "Hello World").
		WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()
	mockRoom, err := createMockRoom(db, mockRoomUUID)
	if err != nil {
		t.Fatalf("error creating mock room: %v\n", err)
	}
	// create new round
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
	roomService := InitializeRoomService(db, rdb, MAX_ROUND_PER_ROOM)
	userService := InitializeUserService(db)
	roomAccessor := NewRoomAccessor(&roomService)
	roundScheduler := tasks.New()
	problemService := InitializeProblemService(db)
	problemAccessor := NewProblemAccessor(&problemService)
	roundService := InitializeRoundService(db, rdb, &roomAccessor, roundScheduler, &problemAccessor)
	roundAccessor := NewRoundAccessor(&roundService)
	roundSubmissionService := InitializeRoundSubmissionService(db, &problemAccessor, &roundAccessor)
	newRound, err := roundService.CreateRound(&RoundCreationParameters{
		RoomID:            mockRoomUUID.String(),
		Duration:          1,
		NumEasyProblems:   1,
		NumMediumProblems: 2,
		NumHardProblems:   1,
	})
	if err != nil {
		t.Fatalf("Error creating new round: %v\n", err)
	}
	if newRound == nil {
		t.Fatal("No round found")
	}
	var roundList []models.Round
	mock.ExpectQuery("SELECT(.*)").WithArgs(mockRoom.ID.String()).WillReturnRows(sqlmock.NewRows([]string{"id", "duration", "room_id"}).AddRow(newRound.ID, "1", mockRoom.ID.String()))
	err = db.Model(mockRoom).Association("Rounds").Find(&roundList)
	if err != nil {
		t.Fatalf("Error finding association: %v\n", err)
	}
	if len(roundList) != 1 {
		t.Fatalf("Error setting up association. Only %d rounds found\n", len(roundList))
	}
	// create new user
	mock.ExpectBegin()
	mock.ExpectQuery("INSERT(.*)").WithArgs("hello", "world", "helloworld", "helloworld@gmail.com", "abc12345").WillReturnRows(
		sqlmock.NewRows([]string{"id", "first_name", "last_name", "handle", "email", "auth_id"}).AddRow(
			1,
			"hello",
			"world",
			"helloworld",
			"helloworld@gmail.com",
			"abc12345",
		),
	)
	mock.ExpectCommit()
	newUser, err := userService.CreateUser("abc12345", &UserModifiableData{
		FirstName: "hello",
		LastName: "world",
		Handle: "helloworld",
		Email: "helloworld@gmail.com",
	})
	if err != nil {
		t.Fatalf("Error creating new user: %v\n", err)
	}
	// user join room
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
	_, err = roomService.JoinRoom(mockRoom.ID.String(), newUser.AuthID)
	if err != nil {
		t.Fatalf("Error joining room: %v\n", err)
	}
	// waits until round starts
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
	mockRedis.ExpectZRange(mockRedisZKey, 0, -1).SetVal([]string{"abc12345"})
	roundStartTime, err := roundService.InitiateRoundStart(newRound.ID)
	if err != nil {
		t.Fatalf("Error starting round: %v\n", err)
	}
	if roundStartTime == nil {
		t.Fatalf("Start time is nil")
	}
	time.Sleep(time.Second * 12)
	// Check participant object in redis cache
	mockRedis.ExpectZRange(mockRedisZKey, 0, -1).SetVal([]string{"abc12345"})
	_, err = roomService.FindActiveUsers(mockRoomUUID.String())
	if err != nil {
		t.Fatalf("Error finding active users %d\n", err)
	}
	// user submits
	// mock find round by id
	mock.ExpectQuery("SELECT(.*)").
		WithArgs(newRound.ID).
		WillReturnRows(sqlmock.NewRows([]string{"id", "duration", "room_id", "status"}).AddRow("1", 1, mockRoomUUID.String(), constants.ROUND_STARTED))
	// mock find participant object by round and user id
	mock.ExpectQuery("SELECT(.*)").
		WithArgs(newUser.AuthID, newRound.ID).
		WillReturnRows(sqlmock.NewRows([]string{"id", "participant_auth_id", "round_id", "solved_problem_count", "score"}).AddRow(
			"1",
			newUser.AuthID,
			newRound.ID,
			0,
			0,
		))
	// mock find problem
	mock.ExpectQuery("SELECT(.*)"). 
			WithArgs(1).
			WillReturnRows(sqlmock.NewRows([]string{"id", "name", "description", "hints", "difficulty"}).
			AddRow(1, "problem1", "", "", constants.DIFFICULTY_EASY))
	// mock create submission object
	mock.ExpectBegin()
	mock.ExpectQuery("INSERT(.*)").WithArgs(0, 0, 3).WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(1))
	mock.ExpectQuery("INSERT(.*)").WithArgs(
		"hello world",
		"cpp",
		1,
		constants.SUBMISSION_STATUS_SUBMITTED,
		0,
		1,
		"round_submissions",
	).WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(1))
	mock.ExpectCommit()
	// mock relationship
	mock.ExpectBegin()
	mock.ExpectQuery("INSERT(.*)").WithArgs(newRound.ID, 0, 3, 1).WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(1))
	mock.ExpectCommit()
	mock.ExpectBegin()
	mock.ExpectQuery("INSERT(.*)").WithArgs(newRound.ID, 1, 3, 1).WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(1))
	mock.ExpectCommit()
	submissionData, err := roundSubmissionService.CreateRoundSubmission(RoundSubmissionParameters{
		RoundID: 1,
		Code: "hello world",
		Language: "cpp",
		ProblemID: 1,
	}, newUser)
	if err != nil {
		t.Fatalf("Error making submission: %v\n", err)
	}
	if submissionData == nil {
		t.Fatalf("No submission object found")
	}
	if err = mockRedis.ExpectationsWereMet(); err != nil {
		t.Error(err)
	}
}

func TestSubmitAfterRoundEnds(t *testing.T) {
	// setup infrastructure
	mockDb, mock, err := sqlmock.New()
	rdb, mockRedis := redismock.NewClientMock()
	if err != nil {
		t.Fatalf("an error %s was not expected when opening a stub database connection", err)
	}
	defer mockDb.Close()
	dialector := postgres.New(postgres.Config{
		Conn: mockDb,
		DriverName: "postgres",
	})
	db, _ := gorm.Open(dialector, &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err := createMockProblems(db, &mock); err != nil {
		t.Fatalf("Error generating mock problems: %v\n", err)
	}
	mockRoomUUID := uuid.New()
	mock.ExpectBegin()
	mock.ExpectExec("INSERT INTO \"rooms\" (.+) VALUES (.+)").
		WithArgs(mockRoomUUID.String(), "abc12345", "Hello World").
		WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()
	mockRoom, err := createMockRoom(db, mockRoomUUID)
	if err != nil {
		t.Fatalf("error creating mock room: %v\n", err)
	}
	// create new round
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
	roomService := InitializeRoomService(db, rdb, MAX_ROUND_PER_ROOM)
	userService := InitializeUserService(db)
	roomAccessor := NewRoomAccessor(&roomService)
	roundScheduler := tasks.New()
	problemService := InitializeProblemService(db)
	problemAccessor := NewProblemAccessor(&problemService)
	roundService := InitializeRoundService(db, rdb, &roomAccessor, roundScheduler, &problemAccessor)
	roundAccessor := NewRoundAccessor(&roundService)
	roundSubmissionService := InitializeRoundSubmissionService(db, &problemAccessor, &roundAccessor)
	newRound, err := roundService.CreateRound(&RoundCreationParameters{
		RoomID:            mockRoomUUID.String(),
		Duration:          1,
		NumEasyProblems:   1,
		NumMediumProblems: 2,
		NumHardProblems:   1,
	})
	if err != nil {
		t.Fatalf("Error creating new round: %v\n", err)
	}
	if newRound == nil {
		t.Fatal("No round found")
	}
	var roundList []models.Round
	mock.ExpectQuery("SELECT(.*)").WithArgs(mockRoom.ID.String()).WillReturnRows(sqlmock.NewRows([]string{"id", "duration", "room_id"}).AddRow(newRound.ID, 1, mockRoom.ID.String()))
	err = db.Model(mockRoom).Association("Rounds").Find(&roundList)
	if err != nil {
		t.Fatalf("Error finding association: %v\n", err)
	}
	if len(roundList) != 1 {
		t.Fatalf("Error setting up association. Only %d rounds found\n", len(roundList))
	}
	// create new user
	mock.ExpectBegin()
	mock.ExpectQuery("INSERT(.*)").WithArgs("hello", "world", "helloworld", "helloworld@gmail.com", "abc12345").WillReturnRows(
		sqlmock.NewRows([]string{"id", "first_name", "last_name", "handle", "email", "auth_id"}).AddRow(
			1,
			"hello",
			"world",
			"helloworld",
			"helloworld@gmail.com",
			"abc12345",
		),
	)
	mock.ExpectCommit()
	newUser, err := userService.CreateUser("abc12345", &UserModifiableData{
		FirstName: "hello",
		LastName: "world",
		Handle: "helloworld",
		Email: "helloworld@gmail.com",
	})
	if err != nil {
		t.Fatalf("Error creating new user: %v\n", err)
	}
	// user join room
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
	_, err = roomService.JoinRoom(mockRoom.ID.String(), newUser.AuthID)
	if err != nil {
		t.Fatalf("Error joining room: %v\n", err)
	}
	// waits until round starts
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
	mockRedis.ExpectZRange(mockRedisZKey, 0, -1).SetVal([]string{"abc12345"})
	roundStartTime, err := roundService.InitiateRoundStart(newRound.ID)
	if err != nil {
		t.Fatalf("Error starting round: %v\n", err)
	}
	if roundStartTime == nil {
		t.Fatalf("Start time is nil")
	}
	time.Sleep(time.Second * 12)
	// Check participant object in redis cache
	mockRedis.ExpectZRange(mockRedisZKey, 0, -1).SetVal([]string{"abc12345"})
	_, err = roomService.FindActiveUsers(mockRoomUUID.String())
	if err != nil {
		t.Fatalf("Error finding active users %d\n", err)
	}
	// Wait until ROUND_END task is fired
	mock.ExpectBegin()
	mock.ExpectExec("UPDATE(.*)").WithArgs(constants.ROUND_END, newRound.ID).WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()
	time.Sleep(time.Second * 60)
	// user submit
	mock.ExpectQuery("SELECT(.*)").
		WithArgs(newRound.ID).
		WillReturnRows(sqlmock.NewRows([]string{"id", "duration", "room_id", "status"}).AddRow("1", 1, mockRoomUUID.String(), constants.ROUND_END))
	mock.ExpectQuery("SELECT(.*)").
		WithArgs(newUser.AuthID, newRound.ID).
		WillReturnRows(sqlmock.NewRows([]string{"id", "participant_auth_id", "round_id", "solved_problem_count", "score"}).AddRow(
			"1",
			newUser.AuthID,
			newRound.ID,
			0,
			0,
		))
	_, err = roundSubmissionService.CreateRoundSubmission(RoundSubmissionParameters{
		RoundID: 1,
		Code: "hello world",
		Language: "cpp",
		ProblemID: 1,
	}, newUser)
	if err == nil {
		t.Fatal("Failed to flag submission after round ended")
	}
	serviceErr, isValidType := err.(*RoundSubmissionServiceError)
	if !isValidType {
		t.Fatalf("Unexpected error found: %s\n", err.Error())
	}
	if serviceErr.Error() != "Round already ended" {
		t.Fatalf("Unexpected message found: %s\n", serviceErr.Error())
	}
}

func TestSubmitBeforeRoundStarts(t *testing.T) {
	// setup infrastructure
	mockDb, mock, err := sqlmock.New()
	rdb, mockRedis := redismock.NewClientMock()
	if err != nil {
		t.Fatalf("an error %s was not expected when opening a stub database connection", err)
	}
	defer mockDb.Close()
	dialector := postgres.New(postgres.Config{
		Conn: mockDb,
		DriverName: "postgres",
	})
	db, _ := gorm.Open(dialector, &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err := createMockProblems(db, &mock); err != nil {
		t.Fatalf("Error generating mock problems: %v\n", err)
	}
	mockRoomUUID := uuid.New()
	mock.ExpectBegin()
	mock.ExpectExec("INSERT INTO \"rooms\" (.+) VALUES (.+)").
		WithArgs(mockRoomUUID.String(), "abc12345", "Hello World").
		WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()
	mockRoom, err := createMockRoom(db, mockRoomUUID)
	if err != nil {
		t.Fatalf("error creating mock room: %v\n", err)
	}
	// create new round
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
	roomService := InitializeRoomService(db, rdb, MAX_ROUND_PER_ROOM)
	userService := InitializeUserService(db)
	roomAccessor := NewRoomAccessor(&roomService)
	roundScheduler := tasks.New()
	problemService := InitializeProblemService(db)
	problemAccessor := NewProblemAccessor(&problemService)
	roundService := InitializeRoundService(db, rdb, &roomAccessor, roundScheduler, &problemAccessor)
	roundAccessor := NewRoundAccessor(&roundService)
	roundSubmissionService := InitializeRoundSubmissionService(db, &problemAccessor, &roundAccessor)
	newRound, err := roundService.CreateRound(&RoundCreationParameters{
		RoomID:            mockRoomUUID.String(),
		Duration:          1,
		NumEasyProblems:   1,
		NumMediumProblems: 2,
		NumHardProblems:   1,
	})
	if err != nil {
		t.Fatalf("Error creating new round: %v\n", err)
	}
	if newRound == nil {
		t.Fatal("No round found")
	}
	var roundList []models.Round
	mock.ExpectQuery("SELECT(.*)").WithArgs(mockRoom.ID.String()).WillReturnRows(sqlmock.NewRows([]string{"id", "duration", "room_id"}).AddRow(newRound.ID, 1, mockRoom.ID.String()))
	err = db.Model(mockRoom).Association("Rounds").Find(&roundList)
	if err != nil {
		t.Fatalf("Error finding association: %v\n", err)
	}
	if len(roundList) != 1 {
		t.Fatalf("Error setting up association. Only %d rounds found\n", len(roundList))
	}
	// create new user
	mock.ExpectBegin()
	mock.ExpectQuery("INSERT(.*)").WithArgs("hello", "world", "helloworld", "helloworld@gmail.com", "abc12345").WillReturnRows(
		sqlmock.NewRows([]string{"id", "first_name", "last_name", "handle", "email", "auth_id"}).AddRow(
			1,
			"hello",
			"world",
			"helloworld",
			"helloworld@gmail.com",
			"abc12345",
		),
	)
	mock.ExpectCommit()
	newUser, err := userService.CreateUser("abc12345", &UserModifiableData{
		FirstName: "hello",
		LastName: "world",
		Handle: "helloworld",
		Email: "helloworld@gmail.com",
	})
	if err != nil {
		t.Fatalf("Error creating new user: %v\n", err)
	}
	// user join room
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
	_, err = roomService.JoinRoom(mockRoom.ID.String(), newUser.AuthID)
	if err != nil {
		t.Fatalf("Error joining room: %v\n", err)
	}
	mock.ExpectQuery("SELECT(.*)").
		WithArgs(newRound.ID).
		WillReturnRows(sqlmock.NewRows([]string{"id", "duration", "room_id", "status"}).AddRow("1", 1, mockRoomUUID.String(), constants.ROUND_CREATED))
	mock.ExpectQuery("SELECT(.*)").
		WithArgs(newUser.AuthID, newRound.ID).
		WillReturnRows(sqlmock.NewRows([]string{"id", "participant_auth_id", "round_id", "solved_problem_count", "score"}).AddRow(
			"1",
			newUser.AuthID,
			newRound.ID,
			0,
			0,
		))
	_, err = roundSubmissionService.CreateRoundSubmission(RoundSubmissionParameters{
		RoundID: 1,
		Code: "hello world",
		Language: "cpp",
		ProblemID: 1,
	}, newUser)
	if err == nil {
		t.Fatal("Failed to flag submission after round ended")
	}
	serviceErr, isValidType := err.(*RoundSubmissionServiceError)
	if !isValidType {
		t.Fatalf("Unexpected error found: %s\n", err.Error())
	}
	if serviceErr.Error() != "Round haven't started yet" {
		t.Fatalf("Unexpected message found: %s\n", serviceErr.Error())
	}
}

func TestSubmitWithoutJoiningRound(t *testing.T) {
	// setup infrastructure
	mockDb, mock, err := sqlmock.New()
	rdb, mockRedis := redismock.NewClientMock()
	if err != nil {
		t.Fatalf("an error %s was not expected when opening a stub database connection", err)
	}
	defer mockDb.Close()
	dialector := postgres.New(postgres.Config{
		Conn: mockDb,
		DriverName: "postgres",
	})
	db, _ := gorm.Open(dialector, &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err := createMockProblems(db, &mock); err != nil {
		t.Fatalf("Error generating mock problems: %v\n", err)
	}
	mockRoomUUID := uuid.New()
	mock.ExpectBegin()
	mock.ExpectExec("INSERT INTO \"rooms\" (.+) VALUES (.+)").
		WithArgs(mockRoomUUID.String(), "abc12345", "Hello World").
		WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()
	mockRoom, err := createMockRoom(db, mockRoomUUID)
	if err != nil {
		t.Fatalf("error creating mock room: %v\n", err)
	}
	// create new round
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
	roomService := InitializeRoomService(db, rdb, MAX_ROUND_PER_ROOM)
	userService := InitializeUserService(db)
	roomAccessor := NewRoomAccessor(&roomService)
	roundScheduler := tasks.New()
	problemService := InitializeProblemService(db)
	problemAccessor := NewProblemAccessor(&problemService)
	roundService := InitializeRoundService(db, rdb, &roomAccessor, roundScheduler, &problemAccessor)
	roundAccessor := NewRoundAccessor(&roundService)
	roundSubmissionService := InitializeRoundSubmissionService(db, &problemAccessor, &roundAccessor)
	newRound, err := roundService.CreateRound(&RoundCreationParameters{
		RoomID:            mockRoomUUID.String(),
		Duration:          1,
		NumEasyProblems:   1,
		NumMediumProblems: 2,
		NumHardProblems:   1,
	})
	if err != nil {
		t.Fatalf("Error creating new round: %v\n", err)
	}
	if newRound == nil {
		t.Fatal("No round found")
	}
	var roundList []models.Round
	mock.ExpectQuery("SELECT(.*)").WithArgs(mockRoom.ID.String()).WillReturnRows(sqlmock.NewRows([]string{"id", "duration", "room_id"}).AddRow(newRound.ID, 1, mockRoom.ID.String()))
	err = db.Model(mockRoom).Association("Rounds").Find(&roundList)
	if err != nil {
		t.Fatalf("Error finding association: %v\n", err)
	}
	if len(roundList) != 1 {
		t.Fatalf("Error setting up association. Only %d rounds found\n", len(roundList))
	}
	// create new user
	mock.ExpectBegin()
	mock.ExpectQuery("INSERT(.*)").WithArgs("hello", "world", "helloworld", "helloworld@gmail.com", "abc12345").WillReturnRows(
		sqlmock.NewRows([]string{"id", "first_name", "last_name", "handle", "email", "auth_id"}).AddRow(
			1,
			"hello",
			"world",
			"helloworld",
			"helloworld@gmail.com",
			"abc12345",
		),
	)
	mock.ExpectCommit()
	newUser, err := userService.CreateUser("abc12345", &UserModifiableData{
		FirstName: "hello",
		LastName: "world",
		Handle: "helloworld",
		Email: "helloworld@gmail.com",
	})
	if err != nil {
		t.Fatalf("Error creating new user: %v\n", err)
	}
	mock.ExpectQuery("SELECT(.*)").
		WithArgs(newRound.ID).
		WillReturnRows(sqlmock.NewRows([]string{"id", "duration", "room_id", "status"}).AddRow("1", 1, mockRoomUUID.String(), constants.ROUND_STARTED))
	mock.ExpectQuery("SELECT(.*)").
		WithArgs(newUser.AuthID, newRound.ID).
		WillReturnRows(sqlmock.NewRows([]string{"id", "participant_auth_id", "round_id", "solved_problem_count", "score"}))
	_, err = roundSubmissionService.CreateRoundSubmission(RoundSubmissionParameters{
		RoundID: 1,
		Code: "hello world",
		Language: "cpp",
		ProblemID: 1,
	}, newUser)
	if err == nil {
		t.Fatal("Failed to flag submission after round ended")
	}
	serviceErr, isValidType := err.(*RoundSubmissionServiceError)
	if !isValidType {
		t.Fatalf("Unexpected error found: %s\n", err.Error())
	}
	if serviceErr.Error() != "User haven't joined round..." {
		t.Fatalf("Unexpected message found: %s\n", serviceErr.Error())
	}

}