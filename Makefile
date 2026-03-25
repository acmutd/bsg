.PHONY: test test-go test-node test-server test-frontend test-central test-rtc test-worker test-kafka help

help:
	@echo "Available test commands:"
	@echo "  make test              - Run all tests (Go + Node.js)"
	@echo "  make test-go           - Run all Go tests"
	@echo "  make test-node         - Run all Node.js tests"
	@echo "  make test-server       - Run server tests only"
	@echo "  make test-frontend     - Run bsg-frontend tests only"
	@echo "  make test-central      - Run central-service tests only"
	@echo "  make test-rtc          - Run rtc-service tests only"
	@echo "  make test-worker       - Run worker-service tests only"
	@echo "  make test-kafka        - Run kafka-queue tests only"

# Run all tests
test: test-go test-node
	@echo "✓ All tests completed"

# Run all Go tests across the workspace
test-go:
	@echo "Running Go tests..."
	@cd central-service && go test ./... -v
	@cd rtc-service && go test ./... -v
	@cd worker-service && go test ./... -v
	@cd kafka-queue && go test ./... -v
	@echo "✓ Go tests completed"

# Run all Node.js tests
test-node: test-server test-frontend
	@echo "✓ Node.js tests completed"

# Run server tests (Node.js with Jest)
test-server:
	@echo "Running server tests..."
	@cd server && npm test

# Run bsg-frontend tests (if configured)
test-frontend:
	@echo "Running bsg-frontend tests..."
	@if [ -f bsg-frontend/package.json ] && grep -q '"test"' bsg-frontend/package.json; then \
		cd bsg-frontend && npm test; \
	else \
		echo "⊘ No test script configured for bsg-frontend"; \
	fi

# Run service-specific tests
test-central:
	@echo "Running central-service tests..."
	@cd central-service && go test ./... -v

test-rtc:
	@echo "Running rtc-service tests..."
	@cd rtc-service && go test ./... -v

test-worker:
	@echo "Running worker-service tests..."
	@cd worker-service && go test ./... -v

test-kafka:
	@echo "Running kafka-queue tests..."
	@cd kafka-queue && go test ./... -v
