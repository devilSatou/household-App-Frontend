# Build stage
FROM golang:1.21-alpine AS builder

WORKDIR /build

# Install dependencies
RUN apk add --no-cache gcc musl-dev

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source
COPY . .

# Build
RUN CGO_ENABLED=0 GOOS=linux go build -o main .

# Production stage
FROM alpine:latest

WORKDIR /app

# Install ca-certificates for HTTPS requests
RUN apk add --no-cache ca-certificates tzdata

# Set timezone
ENV TZ=Asia/Tokyo

# Copy binary
COPY --from=builder /build/main .

# Copy templates and static files
COPY --from=builder /build/templates ./templates
COPY --from=builder /build/static ./static

# Expose port
EXPOSE 3000

# Run
CMD ["./main"]
