package logging

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
)

// StructuredLogEntry represents a JSON structured log entry
type StructuredLogEntry struct {
	Timestamp     string                 `json:"timestamp"`
	Level         string                 `json:"level"`
	Service       string                 `json:"service"`
	Message       string                 `json:"message"`
	CorrelationID string                 `json:"correlation_id,omitempty"`
	RoomID        string                 `json:"room_id,omitempty"`
	ServiceName   string                 `json:"service_name,omitempty"`
	Error         string                 `json:"error,omitempty"`
	Metadata      map[string]interface{} `json:"metadata,omitempty"`
}

var (
	// Logger to log info messages with structured JSON output
	infoLogger *log.Logger

	// Logger to log warning messages with structured JSON output
	warningLogger *log.Logger

	// Logger to log error messages with structured JSON output
	errorLogger *log.Logger

	// Logger to log debug messages with structured JSON output
	debugLogger *log.Logger
)

func init() {
	infoLogger = log.New(os.Stdout, "", 0)
	warningLogger = log.New(os.Stdout, "", 0)
	errorLogger = log.New(os.Stderr, "", 0)
	debugLogger = log.New(os.Stdout, "", 0)
}

// logWithLevel logs a message with the specified level
func logWithLevel(level string, logger *log.Logger, _ string, entry *StructuredLogEntry) {
	entry.Timestamp = time.Now().UTC().Format(time.RFC3339Nano)
	entry.Level = level
	entry.Service = "rtc-service"

	if entry.Metadata == nil {
		entry.Metadata = make(map[string]interface{})
	}

	data, err := json.Marshal(entry)
	if err != nil {
		logger.Printf("Error marshaling log entry: %v", err)
		return
	}

	logger.Println(string(data))
}

// Info logs an informational message with optional metadata
func Info(msg ...interface{}) {
	message := formatMessage(msg)
	entry := &StructuredLogEntry{Message: message}
	logWithLevel(LevelInfo, infoLogger, message, entry)
}

// InfoWithContext logs an informational message with context
func InfoWithContext(message string, roomID, serviceName string, metadata map[string]interface{}) {
	entry := &StructuredLogEntry{
		RoomID:      roomID,
		ServiceName: serviceName,
		Metadata:    metadata,
	}
	logWithLevel(LevelInfo, infoLogger, message, entry)
}

// Warning logs a warning message with optional metadata
func Warning(msg ...interface{}) {
	message := formatMessage(msg)
	entry := &StructuredLogEntry{Message: message}
	logWithLevel(LevelWarning, warningLogger, message, entry)
}

// WarningWithContext logs a warning message with context
func WarningWithContext(message string, roomID, serviceName string, metadata map[string]interface{}) {
	entry := &StructuredLogEntry{
		RoomID:      roomID,
		ServiceName: serviceName,
		Metadata:    metadata,
	}
	logWithLevel(LevelWarning, warningLogger, message, entry)
}

// Error logs an error message with optional metadata
func Error(msg ...interface{}) {
	message := formatMessage(msg)
	entry := &StructuredLogEntry{Message: message}
	logWithLevel(LevelError, errorLogger, message, entry)
}

// ErrorWithContext logs an error message with context and error details
func ErrorWithContext(message string, err error, roomID, serviceName string, metadata map[string]interface{}) {
	entry := &StructuredLogEntry{
		RoomID:      roomID,
		ServiceName: serviceName,
		Metadata:    metadata,
	}
	if err != nil {
		entry.Error = err.Error()
	}
	logWithLevel(LevelError, errorLogger, message, entry)
}

// Debug logs a debug message
func Debug(msg ...interface{}) {
	message := formatMessage(msg)
	entry := &StructuredLogEntry{Message: message}
	logWithLevel(LevelDebug, debugLogger, message, entry)
}

// DebugWithContext logs a debug message with context
func DebugWithContext(message string, roomID, serviceName string, metadata map[string]interface{}) {
	entry := &StructuredLogEntry{
		RoomID:      roomID,
		ServiceName: serviceName,
		Metadata:    metadata,
	}
	logWithLevel(LevelDebug, debugLogger, message, entry)
}

// formatMessage formats a variadic message parameter
func formatMessage(msg []interface{}) string {
	if len(msg) == 0 {
		return ""
	}
	if len(msg) == 1 {
		if s, ok := msg[0].(string); ok {
			return s
		}
	}
	// Fall back to string concatenation for multiple arguments
	result := ""
	for _, m := range msg {
		result += " " + toString(m)
	}
	return result[1:] // Remove leading space
}

// toString converts any value to string
func toString(v interface{}) string {
	switch val := v.(type) {
	case string:
		return val
	case error:
		return val.Error()
	default:
		return fmt.Sprintf("%v", val)
	}
}

// ConnectionLogger provides structured logging for WebSocket connections
type ConnectionLogger struct {
	ServiceName   string
	RoomID        string
	CorrelationID string
}

// LogConnected logs a new connection
func (cl *ConnectionLogger) LogConnected() {
	InfoWithContext("Client connected", cl.RoomID, cl.ServiceName, map[string]interface{}{
		"event": "connection_established",
	})
}

// LogDisconnected logs a disconnection
func (cl *ConnectionLogger) LogDisconnected() {
	InfoWithContext("Client disconnected", cl.RoomID, cl.ServiceName, map[string]interface{}{
		"event": "connection_closed",
	})
}

// LogMessageReceived logs when a message is received
func (cl *ConnectionLogger) LogMessageReceived(messageType string) {
	DebugWithContext("Message received", cl.RoomID, cl.ServiceName, map[string]interface{}{
		"event":          "message_received",
		"message_type":   messageType,
		"correlation_id": cl.CorrelationID,
	})
}

// LogMessageSent logs when a message is sent
func (cl *ConnectionLogger) LogMessageSent(messageType string) {
	DebugWithContext("Message sent", cl.RoomID, cl.ServiceName, map[string]interface{}{
		"event":          "message_sent",
		"message_type":   messageType,
		"correlation_id": cl.CorrelationID,
	})
}

// LogError logs an error with connection context
func (cl *ConnectionLogger) LogError(message string, err error) {
	ErrorWithContext(message, err, cl.RoomID, cl.ServiceName, map[string]interface{}{
		"correlation_id": cl.CorrelationID,
	})
}

// LogValidationError logs a validation error
func (cl *ConnectionLogger) LogValidationError(fieldName string, reason string) {
	WarningWithContext("Validation error", cl.RoomID, cl.ServiceName, map[string]interface{}{
		"field":          fieldName,
		"reason":         reason,
		"correlation_id": cl.CorrelationID,
		"event":          "validation_failed",
	})
}
