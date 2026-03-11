package main

import (
	"testing"
	"time"
)

// TestWorkerLoggerCreation tests logger instantiation
func TestWorkerLoggerCreation(t *testing.T) {
	logger := NewWorkerLogger("worker-service")
	if logger == nil {
		t.Error("NewWorkerLogger() returned nil")
	}
	if logger.service != "worker-service" {
		t.Errorf("logger.service = %s, want worker-service", logger.service)
	}
}

// TestWorkerLoggerInfo tests info logging
func TestWorkerLoggerInfo(t *testing.T) {
	logger := NewWorkerLogger("worker-service")
	// Test that this doesn't panic
	logger.Info("test message", map[string]interface{}{"key": "value"})
}

// TestWorkerLoggerWarn tests warning logging
func TestWorkerLoggerWarn(t *testing.T) {
	logger := NewWorkerLogger("worker-service")
	// Test that this doesn't panic
	logger.Warn("warning message", map[string]interface{}{"key": "value"})
}

// TestWorkerLoggerDebug tests debug logging
func TestWorkerLoggerDebug(t *testing.T) {
	logger := NewWorkerLogger("worker-service")
	// Test that this doesn't panic
	logger.Debug("debug message", map[string]interface{}{"key": "value"})
}

// TestWorkerLoggerError tests error logging
func TestWorkerLoggerError(t *testing.T) {
	logger := NewWorkerLogger("worker-service")
	err := &ProcessingError{Message: "test error"}
	// Test that this doesn't panic
	logger.Error("error occurred", err, map[string]interface{}{"key": "value"})
}

// TestWorkerLoggerSubmission tests submission logging
func TestWorkerLoggerSubmission(t *testing.T) {
	logger := NewWorkerLogger("worker-service")
	// Test that this doesn't panic
	logger.LogSubmission("sub-123", "prob-456", "Accepted", 125.5, map[string]interface{}{
		"runtime_ms": 125.5,
	})
}

// TestWorkerLoggerSubmissionError tests submission error logging
func TestWorkerLoggerSubmissionError(t *testing.T) {
	logger := NewWorkerLogger("worker-service")
	err := &ProcessingError{Message: "compilation failed"}
	// Test that this doesn't panic
	logger.LogSubmissionError("sub-123", "prob-456", err, map[string]interface{}{
		"language": "python3",
	})
}

// TestWorkerLoggerKafkaEvent tests Kafka event logging
func TestWorkerLoggerKafkaEvent(t *testing.T) {
	logger := NewWorkerLogger("worker-service")
	// Test that this doesn't panic
	logger.LogKafkaEvent("message_consumed", "submissions_ingress", map[string]interface{}{
		"offset": 12345,
	})
}

// TestWorkerLoggerKafkaError tests Kafka error logging
func TestWorkerLoggerKafkaError(t *testing.T) {
	logger := NewWorkerLogger("worker-service")
	err := &ProcessingError{Message: "connection timeout"}
	// Test that this doesn't panic
	logger.LogKafkaError("consume_failed", "submissions_ingress", err, map[string]interface{}{
		"retry_count": 3,
	})
}

// TestProcessingErrorString tests error string representation
func TestProcessingErrorString(t *testing.T) {
	err := &ProcessingError{Message: "test error", Code: "EXEC_TIMEOUT"}
	expected := "ProcessingError: test error (EXEC_TIMEOUT)"
	if err.Error() != expected {
		t.Errorf("Error() = %s, want %s", err.Error(), expected)
	}
}

// TestProcessingErrorWithoutCode tests error without code
func TestProcessingErrorWithoutCode(t *testing.T) {
	err := &ProcessingError{Message: "test error"}
	if len(err.Error()) == 0 {
		t.Error("Error() returned empty string")
	}
}

// TestRetryableError tests retryable error determination
func TestRetryableError(t *testing.T) {
	tests := []struct {
		name      string
		err       error
		wantRetry bool
	}{
		{
			name:      "timeout error",
			err:       &ProcessingError{Code: "EXEC_TIMEOUT"},
			wantRetry: true,
		},
		{
			name:      "compilation error",
			err:       &ProcessingError{Code: "COMPILATION_ERROR"},
			wantRetry: false,
		},
		{
			name:      "network error",
			err:       &ProcessingError{Code: "NETWORK_ERROR"},
			wantRetry: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if procErr, ok := tt.err.(*ProcessingError); ok {
				if procErr.IsRetryable() != tt.wantRetry {
					t.Errorf("IsRetryable() = %v, want %v", procErr.IsRetryable(), tt.wantRetry)
				}
			}
		})
	}
}

// TestLoggerConcurrency tests concurrent logging
func TestLoggerConcurrency(t *testing.T) {
	logger := NewWorkerLogger("worker-service")

	// Concurrent logging should not panic
	done := make(chan bool)
	for i := 0; i < 10; i++ {
		go func(id int) {
			logger.Info("concurrent message", map[string]interface{}{"id": id})
			done <- true
		}(i)
	}

	// Wait for all goroutines
	for i := 0; i < 10; i++ {
		<-done
	}
}

// TestMessageQueueError tests message queue error handling
func TestMessageQueueError(t *testing.T) {
	err := &MessageQueueError{
		Topic:   "submissions",
		Message: "failed to produce",
	}

	if err.Message != "failed to produce" {
		t.Errorf("Message = %s, want failed to produce", err.Message)
	}
	if err.Topic != "submissions" {
		t.Errorf("Topic = %s, want submissions", err.Topic)
	}
}

// TestDataRaceDetection tests that logging is thread-safe
func TestDataRaceDetection(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping race detection test in short mode")
	}

	logger := NewWorkerLogger("worker-service")

	// Run concurrent operations that might trigger race conditions
	go func() {
		for i := 0; i < 100; i++ {
			logger.Info("test", nil)
		}
	}()

	go func() {
		for i := 0; i < 100; i++ {
			logger.Error("test", nil, nil)
		}
	}()

	// Give goroutines time to run
	time.Sleep(100 * time.Millisecond)
}
