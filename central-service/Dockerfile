FROM golang:1.21-bookworm

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

COPY central-service/ .
COPY rtc-service/ ../rtc-service/

RUN go mod download

# Build with dynamic linking
RUN CGO_ENABLED=1 GOOS=linux go build -tags dynamic -o ./central-service

CMD ["/app/central-service"]
