package logging

import (
	"log"
	"os"
)

var (
	// Logger to log info messages
	infoLogger *log.Logger

	// Logger to log warning messages
	warningLogger *log.Logger

	// Logger to log error messages
	errorLogger *log.Logger
)

func init() {
	infoLogger = log.New(os.Stdout, "[RTC SERVICE] INFO: ", log.Ltime)
	warningLogger = log.New(os.Stdout, "[RTC SERVICE] WARNING: ", log.Ltime)
	errorLogger = log.New(os.Stderr, "[RTC SERVICE] ERROR: ", log.Ltime)
}

// Information logger to only print info messages.
func Info(msg ...interface{}) {
	infoLogger.Print(msg...)
}

// Warning logger to only print warning messages.
func Warning(msg ...interface{}) {
	warningLogger.Print(msg...)
}

// Error logger to only print error messages.
func Error(msg ...interface{}) {
	errorLogger.Print(msg...)
}
