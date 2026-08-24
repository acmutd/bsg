package servicesmanager

import (
	"sync"

	"github.com/acmutd/bsg/rtc-service/logging"
)

type ServiceManager struct {
	// List of all services connected to RTC service.
	Services ServicesList

	// Used to avoid concurrent writes to the services list.
	sync.RWMutex
}

func NewServiceManager() *ServiceManager {
	return &ServiceManager{
		Services: make(ServicesList),
	}
}

func (sm *ServiceManager) AddService(service *Service) {
	sm.Lock()
	defer sm.Unlock()

	sm.Services[service] = true

	logging.Info("Service added: ", service.Name)
}

func (sm *ServiceManager) RemoveService(service *Service) {
	sm.Lock()
	defer sm.Unlock()

	// Only remove a client if they exist.
	if _, ok := sm.Services[service]; ok {
		service.Connection.Close()
		delete(sm.Services, service)
		logging.Info("Service removed: ", service.Name)
		return
	}

	logging.Info("Service not found: ", service.Name)
}

func (sm *ServiceManager) FindService(serviceName string) *Service {
	sm.Lock()
	defer sm.Unlock()

	for service := range sm.Services {
		if service.Name == serviceName {
			return service
		}
	}

	logging.Info("Service not found: ", serviceName)
	return nil
}

// FindOtherService returns a connected service with the given name, excluding
// the provided one. Used to detect whether other connections share a handle
// (e.g. multiple tabs logged in as the same user).
func (sm *ServiceManager) FindOtherService(serviceName string, except *Service) *Service {
	sm.Lock()
	defer sm.Unlock()

	for service := range sm.Services {
		if service != except && service.Name == serviceName {
			return service
		}
	}
	return nil
}
