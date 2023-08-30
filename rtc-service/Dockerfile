FROM golang:1.21.0-alpine

WORKDIR /app

COPY go.mod ./
RUN go mod download

COPY *.go ./

RUN go build -o /rtc-service

CMD ["/rtc-service"]