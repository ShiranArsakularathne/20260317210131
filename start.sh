#!/bin/bash

echo "Starting MES System..."
echo "======================"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Error: Docker is not running. Please start Docker first."
    exit 1
fi

# Check if docker-compose is available
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker-compose"
elif docker compose version &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker compose"
else
    echo "Error: docker-compose is not installed."
    exit 1
fi

# Create data directory
mkdir -p data

# Start services
echo "Starting services with Docker Compose..."
$DOCKER_COMPOSE_CMD up -d

echo ""
echo "Services started successfully!"
echo ""
echo "Access the application at:"
echo "  Frontend: http://localhost"
echo "  Backend API: http://localhost:8000"
echo "  API Docs: http://localhost:8000/docs"
echo ""
echo "To view logs: docker-compose logs -f"
echo "To stop: docker-compose down"
echo ""