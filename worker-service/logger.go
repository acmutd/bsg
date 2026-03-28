package main

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"time"
)

const (
	LevelDebug   = "DEBUG"
	LevelInfo    = "INFO"
	LevelWarning = "WARNING"
	LevelError   = "ERROR"
	LevelFatal   = "FATAL"
)

// StructuredLogEntry represents a JSON log entry
type StructuredLogEntry struct {
	Timestamp string                 `json:"timestamp"`
	Level     string                 `json:"level"`
	Service   string                 `json:"service"`
	Message   string                 `json:"message"`
	Error     string                 `json:"error,omitempty"`
	Metadata  map[string]interface{} `json:"metadata,omitempty"`
}

// WorkerLogger provides structured logging for the worker service
type WorkerLogger struct {
	service string
	logger  *log.Logger
}

// NewWorkerLogger creates a new worker logger
func NewWorkerLogger(service string) *WorkerLogger {
	return &WorkerLogger{
		service: service,
		logger:  log.New(os.Stdout, "", 0),
	}
}

// logWithLevel logs a message with the specified level
func (wl *WorkerLogger) logWithLevel(level, message string, err error, metadata map[string]interface{}) {
	entry := &StructuredLogEntry{
		Timestamp: time.Now().UTC().Format(time.RFC3339Nano),
		Level:     level,
		Service:   wl.service,
		Message:   message,
		Metadata:  metadata,
	}

	if err != nil {
		entry.Error = err.Error()
	}

	data, marshalErr := json.Marshal(entry)
	if marshalErr != nil {
		wl.logger.Printf("Error marshaling log entry: %v", marshalErr)
		return
	}

	wl.logger.Println(string(data))
}

// Debug logs a debug message
func (wl *WorkerLogger) Debug(message string, metadata map[string]interface{}) {
	wl.logWithLevel(LevelDebug, message, nil, metadata)
}

// Info logs an informational message
func (wl *WorkerLogger) Info(message string, metadata map[string]interface{}) {
	wl.logWithLevel(LevelInfo, message, nil, metadata)
}

// Warn logs a warning message
func (wl *WorkerLogger) Warn(message string, metadata map[string]interface{}) {
	wl.logWithLevel(LevelWarning, message, nil, metadata)
}

// Error logs an error message
func (wl *WorkerLogger) Error(message string, err error, metadata map[string]interface{}) {
	wl.logWithLevel(LevelError, message, err, metadata)
}

// Fatal logs a fatal message and exits
func (wl *WorkerLogger) Fatal(message string, err error, metadata map[string]interface{}) {
	wl.logWithLevel(LevelFatal, message, err, metadata)
	os.Exit(1)
}

// LogSubmission logs a submission processing event
func (wl *WorkerLogger) LogSubmission(submissionID, problemID, verdict string, runtime float64, metadata map[string]interface{}) {
	if metadata == nil {
		metadata = make(map[string]interface{})
	}
	metadata["submission_id"] = submissionID
	metadata["problem_id"] = problemID
	metadata["verdict"] = verdict
	metadata["runtime_ms"] = runtime
	wl.logWithLevel(LevelInfo, "submission processed", nil, metadata)
}

// LogSubmissionError logs a submission processing error
func (wl *WorkerLogger) LogSubmissionError(submissionID, problemID string, err error, metadata map[string]interface{}) {
	if metadata == nil {
		metadata = make(map[string]interface{})
	}
	metadata["submission_id"] = submissionID
	metadata["problem_id"] = problemID
	wl.logWithLevel(LevelError, "submission processing failed", err, metadata)
}

// LogKafkaEvent logs a Kafka event
func (wl *WorkerLogger) LogKafkaEvent(eventType, topic string, metadata map[string]interface{}) {
	if metadata == nil {
		metadata = make(map[string]interface{})
	}
	metadata["event_type"] = eventType
	metadata["topic"] = topic
	wl.logWithLevel(LevelInfo, "kafka event", nil, metadata)
}

// LogKafkaError logs a Kafka error event
func (wl *WorkerLogger) LogKafkaError(eventType, topic string, err error, metadata map[string]interface{}) {
	if metadata == nil {
		metadata = make(map[string]interface{})
	}
	metadata["event_type"] = eventType
	metadata["topic"] = topic
	wl.logWithLevel(LevelError, "kafka error", err, metadata)
}

// ProcessingError represents an error during submission processing
type ProcessingError struct {
	Message string
	Code    string
}

// Error implements the error interface
func (pe *ProcessingError) Error() string {
	if pe.Code != "" {
		return fmt.Sprintf("ProcessingError: %s (%s)", pe.Message, pe.Code)
	}
	return fmt.Sprintf("ProcessingError: %s", pe.Message)
}

// IsRetryable determines if the error is retryable
func (pe *ProcessingError) IsRetryable() bool {
	retryableCodes := map[string]bool{
		"EXEC_TIMEOUT":  true,
		"NETWORK_ERROR": true,
		"QUEUE_ERROR":   true,
	}
	return retryableCodes[pe.Code]
}

// MessageQueueError represents an error with Kafka messages
type MessageQueueError struct {
	Topic   string
	Offset  int64
	Message string
}

// Error implements the error interface
func (mq *MessageQueueError) Error() string {
	return fmt.Sprintf("MessageQueueError: topic=%s offset=%d: %s", mq.Topic, mq.Offset, mq.Message)
}

// InputValidator provides validation for Kafka messages
type InputValidator struct {
	logger *WorkerLogger
}

// NewInputValidator creates a new input validator
func NewInputValidator(logger *WorkerLogger) *InputValidator {
	return &InputValidator{logger: logger}
}

// ValidateIngressMessage validates a Kafka ingress message
func (iv *InputValidator) ValidateIngressMessage(msg *KafkaIngressDTO) error {
	if msg == nil {
		return fmt.Errorf("message is nil")
	}

	if msg.ProblemSlug == "" {
		return fmt.Errorf("problemSlug is required")
	}

	if msg.ProblemId == 0 {
		return fmt.Errorf("problemID is required")
	}

	if msg.Lang == "" {
		return fmt.Errorf("lang is required")
	}

	if msg.Code == "" {
		return fmt.Errorf("code is required")
	}

	if len(msg.Code) > 1<<20 { // 1MB limit
		return fmt.Errorf("code exceeds maximum size of 1MB")
	}

	if msg.SubmissionId == 0 {
		return fmt.Errorf("submissionID is required")
	}

	iv.logger.Debug("Message validated", map[string]interface{}{
		"problem_slug": msg.ProblemSlug,
		"problem_id":   msg.ProblemId,
		"language":     msg.Lang,
	})

	return nil
}

// ValidateEgressMessage validates a Kafka egress message
func (iv *InputValidator) ValidateEgressMessage(msg *KafkaEgressDTO) error {
	if msg == nil {
		return fmt.Errorf("message is nil")
	}

	if msg.SubmissionId == 0 {
		return fmt.Errorf("submissionID is required")
	}

	if msg.Verdict == "" {
		return fmt.Errorf("verdict is required")
	}

	// Validate verdict is one of acceptable values
	validVerdicts := map[string]bool{
		"Accepted":            true,
		"Rejected":            true,
		"CompileError":        true,
		"RuntimeError":        true,
		"TimeLimitExceeded":   true,
		"MemoryLimitExceeded": true,
		"WrongAnswer":         true,
		"Pending":             true,
	}

	if !validVerdicts[msg.Verdict] {
		return fmt.Errorf("invalid verdict: %s", msg.Verdict)
	}

	return nil
}

// SanitizeCode sanitizes code input
func (iv *InputValidator) SanitizeCode(code string) string {
	// Remove null bytes
	cleaned := ""
	for _, r := range code {
		if r != '\x00' {
			cleaned += string(r)
		}
	}
	return cleaned
}
