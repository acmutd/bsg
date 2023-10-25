package services

import (
	"regexp"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func TestCreateNewUser(t *testing.T) {
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
	rows := sqlmock.NewRows([]string{"id", "first_name", "last_name", "handle", "email", "auth_id"}).AddRow(1, "hello", "world", "helloworld", "helloworld@gmail.com", "abc12345")
	userService := InitializeUserService(db)
	userService.CreateUser("abc12345", &UserModifiableData{
		FirstName: "hello",
		LastName:  "world",
		Handle:    "helloworld",
		Email:     "helloworld@gmail.com",
	})
	mock.ExpectQuery("SELECT * from \"users\"").WillReturnRows(rows)
}

func TestUpdateUserData(t *testing.T) {
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
	rows := sqlmock.NewRows([]string{"id", "first_name", "last_name", "handle", "email", "auth_id"}).AddRow(1, "hello", "world", "hellothere", "helloworld@gmail.com", "abc12345")
	userService := InitializeUserService(db)
	mock.ExpectBegin()
	mock.ExpectQuery("INSERT INTO \"users\" (.+) VALUES (.+)").
		WithArgs("hello", "world", "helloworld", "helloworld@gmail.com", "abc12345").
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow("1"))
	mock.ExpectCommit()
	userService.CreateUser("abc12345", &UserModifiableData{
		FirstName: "hello",
		LastName:  "world",
		Handle:    "helloworld",
		Email:     "helloworld@gmail.com",
	})
	mock.ExpectQuery("SELECT (.+) FROM \"users\" WHERE \"users\".\"auth_id\" =(.+)").WillReturnRows(rows)
	mock.ExpectBegin()
	mock.ExpectExec(regexp.QuoteMeta(`UPDATE "users" SET "first_name"=$1,"last_name"=$2,"handle"=$3,"email"=$4 WHERE "id" = $5`)).
		WithArgs("hello", "world", "hellothere", "helloworld@gmail.com", 1).
		WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()
	userService.UpdateUserData("abc12345", &UserModifiableData{
		FirstName: "hello",
		LastName:  "world",
		Handle:    "hellothere",
		Email:     "helloworld@gmail.com",
	})
}

func TestFindUserByAuthID(t *testing.T) {
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
	userService := InitializeUserService(db)
	mock.ExpectBegin()
	mock.ExpectQuery("INSERT INTO \"users\" (.+) VALUES (.+)").
		WithArgs("hello", "world", "helloworld", "helloworld@gmail.com", "abc12345").
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow("1"))
	mock.ExpectCommit()
	mock.ExpectQuery("SELECT (.+) FROM \"users\" WHERE \"users\".\"auth_id\" =(.+)").WillReturnRows(
		sqlmock.NewRows([]string{"id", "first_name", "last_name", "handle", "email", "auth_id"}).AddRow(
			1, "hello", "world", "helloworld", "helloworld@gmail.com", "abc12345"))

	_, err = userService.CreateUser("abc12345", &UserModifiableData{
		FirstName: "hello",
		LastName:  "world",
		Handle:    "helloworld",
		Email:     "helloworld@gmail.com",
	})
	if err != nil {
		t.Fatalf("%s\n", err)
	}
	user, err := userService.FindUserByAuthID("abc12345")
	if err != nil {
		t.Fatalf("%s\n", err)
	}
	if user == nil {
		t.Fatal("Cannot find user")
	}
}

func TestFindUserByUserID(t *testing.T) {
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
	userService := InitializeUserService(db)
	mock.ExpectBegin()
	mock.ExpectQuery("INSERT INTO \"users\" (.+) VALUES (.+)").
		WithArgs("hello", "world", "helloworld", "helloworld@gmail.com", "abc12345").
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow("1"))
	mock.ExpectCommit()
	mock.ExpectQuery("SELECT (.+) FROM \"users\" WHERE ID =(.+)").WillReturnRows(
		sqlmock.NewRows([]string{"id", "first_name", "last_name", "handle", "email", "auth_id"}).AddRow(
			1, "hello", "world", "helloworld", "helloworld@gmail.com", "abc12345"))

	_, err = userService.CreateUser("abc12345", &UserModifiableData{
		FirstName: "hello",
		LastName:  "world",
		Handle:    "helloworld",
		Email:     "helloworld@gmail.com",
	})
	if err != nil {
		t.Fatalf("%s\n", err)
	}
	user, err := userService.FindUserByUserID("1")
	if err != nil {
		t.Fatalf("%s\n", err)
	}
	if user == nil {
		t.Fatal("Cannot find user")
	}
}

func TestFindUserByInvalidUserID(t *testing.T) {
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
	userService := InitializeUserService(db)
	mock.ExpectQuery("SELECT (.+) FROM \"users\" WHERE ID =(.+)").WillReturnRows(
		sqlmock.NewRows([]string{"id", "first_name", "last_name", "handle", "email", "auth_id"}))
	user, err := userService.FindUserByUserID("1")
	if err != nil {
		t.Fatalf("%s\n", err)
	}
	if user != nil {
		t.Fatal("Found invalid user")
	}
}

func TestFindUserByInvalidAuthID(t *testing.T) {
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
	userService := InitializeUserService(db)
	mock.ExpectQuery("SELECT (.+) FROM \"users\" WHERE \"users\".\"auth_id\" =(.+)").WillReturnRows(
		sqlmock.NewRows([]string{"id", "first_name", "last_name", "handle", "email", "auth_id"}))
	user, err := userService.FindUserByAuthID("abc12345")
	if err != nil {
		t.Fatalf("%s\n", err)
	}
	if user != nil {
		t.Fatal("Found invalid user")
	}
}
