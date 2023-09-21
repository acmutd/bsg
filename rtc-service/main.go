package main

import (
	"fmt"
	"log"
	"os"
)

var (
	// Loggers for the RTC service
	InfoLogger    = log.New(os.Stdout, "RTC-SERVICE - INFO: ", log.Ldate|log.Ltime)
	WarningLogger = log.New(os.Stdout, "RTC-SERVICE - WARNING: ", log.Ldate|log.Ltime)
	ErrorLogger   = log.New(os.Stdout, "RTC-SERVICE - ERROR: ", log.Ldate|log.Ltime)
)

func main() {
	fmt.Println("Welcome to RTC service")
	InfoLogger.Println("RTC service started")
}
