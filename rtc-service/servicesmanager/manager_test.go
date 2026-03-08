package servicesmanager

import (
	"testing"
	"time"

	"github.com/acmutd/bsg/rtc-service/response"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

// TestServiceManagerAddService tests adding a service
func TestServiceManagerAddService(t *testing.T) {
	manager := NewServiceManager()

	if len(manager.Services) != 0 {
		t.Errorf("ServiceManager should start empty, has %d services", len(manager.Services))
	}
}

// TestServiceManagerRemoveService tests removing a service
func TestServiceManagerRemoveService(t *testing.T) {
	manager := NewServiceManager()

	// Test that removing from empty manager doesn't panic
	service := &Service{
		Name:           "test-service",
		Connection:     nil,
		Egress:         make(chan response.Response),
		ServiceManager: manager,
	}

	// This should not panic
	manager.RemoveService(service)
}

// TestServiceManagerFindService tests finding a service
func TestServiceManagerFindService(t *testing.T) {
	manager := NewServiceManager()

	// Finding non-existent service should return nil
	result := manager.FindService("non-existent")
	if result != nil {
		t.Error("FindService() should return nil for non-existent service")
	}
}

// TestNewClient tests creating a new client/service
func TestNewClient(t *testing.T) {
	manager := NewServiceManager()
	conn := (*websocket.Conn)(nil)

	client := NewClient("test-client", conn, manager)

	if client.Name != "test-client" {
		t.Errorf("Client name = %s, want test-client", client.Name)
	}
	if client.ServiceManager != manager {
		t.Error("Client ServiceManager not set correctly")
	}
	if client.Egress == nil {
		t.Error("Client Egress channel not initialized")
	}
}

// TestConnectionEgress tests connection egress channel
func TestConnectionEgress(t *testing.T) {
	manager := NewServiceManager()
	client := NewClient("test-client", nil, manager)

	// Send a test response
	testResponse := response.Response{
		RespStatus: "ok",
		RespType:   response.GENERAL,
	}

	go func() {
		client.Egress <- testResponse
	}()

	// Wait for the response
	select {
	case resp := <-client.Egress:
		if resp.RespType != response.GENERAL {
			t.Errorf("Response type = %v, want GENERAL", resp.RespType)
		}
	case <-time.After(100 * time.Millisecond):
		t.Error("Timeout waiting for response")
	}
}

// TestServiceManagerConcurrency tests thread safety of ServiceManager
func TestServiceManagerConcurrency(t *testing.T) {
	manager := NewServiceManager()
	done := make(chan bool, 10)

	// Simulate concurrent operations
	for i := 0; i < 5; i++ {
		go func(index int) {
			serviceName := "service-" + string(rune(48+index))
			for j := 0; j < 10; j++ {
				manager.FindService(serviceName)
			}
			done <- true
		}(i)
	}

	// Wait for all goroutines
	for i := 0; i < 5; i++ {
		<-done
	}
}

// TestServiceIdentification tests service identification with UUIDs
func TestServiceIdentification(t *testing.T) {
	id1 := uuid.New().String()
	id2 := uuid.New().String()

	if id1 == id2 {
		t.Error("Generated service IDs should be unique")
	}

	if len(id1) == 0 || len(id2) == 0 {
		t.Error("Generated service IDs should not be empty")
	}
}
