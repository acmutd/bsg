FROM golang:1.21-bookworm

WORKDIR /app

COPY go.mod ./
COPY go.sum ./
RUN go mod download

COPY . .

ENV CGO_ENABLED 1
RUN go build -o /worker-service

CMD ["/worker-service"]