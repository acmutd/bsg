FROM golang:1.25.0-alpine

RUN apk add --no-cache build-base librdkafka-dev pkgconf

WORKDIR /app

COPY go.mod ./

RUN go mod download

COPY *.go ./

RUN go mod tidy

RUN CGO_ENABLED=1 GOOS=linux go build -tags dynamic -o /worker-service

CMD ["/worker-service"]