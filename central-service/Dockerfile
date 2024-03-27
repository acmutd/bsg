FROM golang:1.21-bookworm

WORKDIR /app

COPY go.mod ./
COPY go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=1 GOOS=linux go build -o ./central-service

CMD ["/app/central-service"]

