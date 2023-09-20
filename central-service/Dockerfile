FROM golang:1.21.0-alpine AS builder

WORKDIR /app

COPY go.mod ./
COPY go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o ./central-service

FROM scratch

COPY --from=builder /app/central-service /app/central-service

WORKDIR /app

ENTRYPOINT ["/app/central-service"]
