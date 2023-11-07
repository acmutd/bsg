FROM golang:1.21.0-alpine

WORKDIR /app

COPY go.mod ./
COPY go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 go build -o /rtc-service

CMD ["/rtc-service"]
