FROM golang:1.25-bookworm

# Install build dependencies for librdkafka
RUN apt-get update && apt-get install -y \
    build-essential \
    libssl-dev \
    libsasl2-dev \
    libzstd-dev \
    pkg-config \
    git \
    && rm -rf /var/lib/apt/lists/*

# Build librdkafka from source for ARM64 compatibility
RUN git clone https://github.com/confluentinc/librdkafka.git && \
    cd librdkafka && \
    git checkout v2.0.2 && \
    ./configure && \
    make && \
    make install && \
    cd .. && \
    rm -rf librdkafka

# Update library path
ENV LD_LIBRARY_PATH=/usr/local/lib:$LD_LIBRARY_PATH

WORKDIR /app

# listen, the build was failing and i couldn't figure out why so 
# this is what ai got me, i don't know if it's optimal but it works
COPY go.work go.work.sum ./
COPY central-service/go.mod central-service/go.sum ./central-service/
COPY rtc-service/go.mod rtc-service/go.sum ./rtc-service/
COPY kafka-queue/go.mod kafka-queue/go.sum ./kafka-queue/
COPY worker-service/go.mod worker-service/go.sum ./worker-service/

# Download dependencies for central-service
WORKDIR /app/central-service
RUN go mod download

# Copy source code
WORKDIR /app
COPY central-service ./central-service
COPY rtc-service ./rtc-service
COPY kafka-queue ./kafka-queue
COPY worker-service ./worker-service

# Build with dynamic linking
WORKDIR /app/central-service
RUN CGO_ENABLED=1 GOOS=linux go build -tags dynamic -o ./central-service

CMD ["/app/central-service/central-service"]
