FROM golang:1.25-bookworm

WORKDIR /app

COPY go.work go.work.sum ./
COPY central-service/go.mod central-service/go.sum ./central-service/
COPY rtc-service/go.mod rtc-service/go.sum ./rtc-service/
COPY worker-service/go.mod worker-service/go.sum ./worker-service/

# Download dependencies for central-service
WORKDIR /app/central-service
RUN go mod download

# Copy source code
WORKDIR /app
COPY central-service ./central-service
COPY rtc-service ./rtc-service
COPY worker-service ./worker-service

# Build
WORKDIR /app/central-service
RUN CGO_ENABLED=0 GOOS=linux go build -o ./central-service

CMD ["/app/central-service/central-service"]
