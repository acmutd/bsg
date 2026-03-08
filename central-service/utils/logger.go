package utils

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"time"
)

const (
	// Log levels
	LevelDebug   = "DEBUG"
	LevelInfo    = "INFO"
	LevelWarning = "WARNING"
	LevelError   = "ERROR"
	LevelFatal   = "FATAL"
)

// StructuredLogger provides JSON structured logging with context
type StructuredLogger struct {
	service string
	logger  *log.Logger
}

// LogEntry represents a structured log entry
type LogEntry struct {
	Timestamp     string                 `json:"timestamp"`
	Level         string                 `json:"level"`
	Service       string                 `json:"service"`
	Message       string                 `json:"message"`
	CorrelationID string                 `json:"correlation_id,omitempty"`
	UserID        string                 `json:"user_id,omitempty"`
	RoomID        string                 `json:"room_id,omitempty"`
	Error         string                 `json:"error,omitempty"`
	StatusCode    int                    `json:"status_code,omitempty"`
	Duration      float64                `json:"duration_ms,omitempty"`
	Metadata      map[string]interface{} `json:"metadata,omitempty"`
}

// NewStructuredLogger creates a new structured logger instance
func NewStructuredLogger(service string) *StructuredLogger {
	return &StructuredLogger{
		service: service,
		logger:  log.New(os.Stdout, "", 0),
	}
}

// log is the internal logging function
func (sl *StructuredLogger) log(level, message string, entry *LogEntry) {
	entry.Timestamp = time.Now().UTC().Format(time.RFC3339Nano)
	entry.Level = level
	entry.Service = sl.service
	entry.Message = message

	data, err := json.Marshal(entry)
	if err != nil {
		sl.logger.Printf("Error marshaling log entry: %v", err)
		return
	}

	sl.logger.Println(string(data))
}

// Debug logs a debug message
func (sl *StructuredLogger) Debug(message string, metadata map[string]interface{}) {
	sl.log(LevelDebug, message, &LogEntry{Metadata: metadata})
}

// Info logs an informational message
func (sl *StructuredLogger) Info(message string, metadata map[string]interface{}) {
	sl.log(LevelInfo, message, &LogEntry{Metadata: metadata})
}

// Warn logs a warning message
func (sl *StructuredLogger) Warn(message string, metadata map[string]interface{}) {
	sl.log(LevelWarning, message, &LogEntry{Metadata: metadata})
}

// Error logs an error message
func (sl *StructuredLogger) Error(message string, err error, metadata map[string]interface{}) {
	if metadata == nil {
		metadata = make(map[string]interface{})
	}
	errMsg := ""
	if err != nil {
		errMsg = err.Error()
	}
	sl.log(LevelError, message, &LogEntry{Error: errMsg, Metadata: metadata})
}

// Fatal logs a fatal message and exits
func (sl *StructuredLogger) Fatal(message string, err error, metadata map[string]interface{}) {
	if metadata == nil {
		metadata = make(map[string]interface{})
	}
	errMsg := ""
	if err != nil {
		errMsg = err.Error()
	}
	sl.log(LevelFatal, message, &LogEntry{Error: errMsg, Metadata: metadata})
	os.Exit(1)
}

// WithContext returns a logger entry builder for contextual logging
func (sl *StructuredLogger) WithContext(correlationID, userID, roomID string) *ContextLogger {
	return &ContextLogger{
		logger:        sl,
		correlationID: correlationID,
		userID:        userID,
		roomID:        roomID,
	}
}

// ContextLogger allows logging with predefined context
type ContextLogger struct {
	logger        *StructuredLogger
	correlationID string
	userID        string
	roomID        string
}

// logWithContext logs with predefined context
func (cl *ContextLogger) log(level, message string, entry *LogEntry) {
	entry.CorrelationID = cl.correlationID
	entry.UserID = cl.userID
	entry.RoomID = cl.roomID
	cl.logger.log(level, message, entry)
}

// Info logs info with context
func (cl *ContextLogger) Info(message string, metadata map[string]interface{}) {
	cl.log(LevelInfo, message, &LogEntry{Metadata: metadata})
}

// Error logs error with context
func (cl *ContextLogger) Error(message string, err error, metadata map[string]interface{}) {
	if metadata == nil {
		metadata = make(map[string]interface{})
	}
	errMsg := ""
	if err != nil {
		errMsg = err.Error()
	}
	cl.log(LevelError, message, &LogEntry{Error: errMsg, Metadata: metadata})
}

// Warn logs warning with context
func (cl *ContextLogger) Warn(message string, metadata map[string]interface{}) {
	cl.log(LevelWarning, message, &LogEntry{Metadata: metadata})
}

// RequestLog represents a structured HTTP request log
type RequestLog struct {
	logger        *StructuredLogger
	start         time.Time
	Method        string
	Path          string
	StatusCode    int
	UserID        string
	CorrelationID string
	Error         error
	Metadata      map[string]interface{}
}

// NewRequestLog creates a new request log
func (sl *StructuredLogger) NewRequestLog(method, path string) *RequestLog {
	return &RequestLog{
		logger:   sl,
		start:    time.Now(),
		Method:   method,
		Path:     path,
		Metadata: make(map[string]interface{}),
	}
}

// Complete logs the end of the request with duration
func (rl *RequestLog) Complete(statusCode int, err error) {
	duration := time.Since(rl.start).Seconds() * 1000
	entry := &LogEntry{
		StatusCode:    statusCode,
		CorrelationID: rl.CorrelationID,
		UserID:        rl.UserID,
		Duration:      duration,
		Metadata:      rl.Metadata,
	}
	if err != nil {
		entry.Error = err.Error()
	}

	message := fmt.Sprintf("%s %s", rl.Method, rl.Path)
	rl.logger.log(LevelInfo, message, entry)
}

// AddMetadata adds metadata to the request log
func (rl *RequestLog) AddMetadata(key string, value interface{}) *RequestLog {
	rl.Metadata[key] = value
	return rl
}
