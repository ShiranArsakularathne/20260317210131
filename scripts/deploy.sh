#!/bin/bash

# MES System Deployment Script
# This script deploys the MES application to touch panels

set -e

echo "=== MES System Deployment ==="
echo "Target: Touch Panels (Linux)"
echo "Date: $(date)"
echo ""

# Configuration
GIT_REPO="https://github.com/ShiranArsakularathne/20260317210131"
DOCKER_COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_warn "docker-compose not found, trying docker compose..."
        if ! docker compose version &> /dev/null; then
            log_error "Docker Compose is not installed. Please install Docker Compose."
            exit 1
        fi
        DOCKER_COMPOSE_CMD="docker compose"
    else
        DOCKER_COMPOSE_CMD="docker-compose"
    fi
    
    # Check git
    if ! command -v git &> /dev/null; then
        log_error "Git is not installed. Please install git first."
        exit 1
    fi
    
    log_info "Prerequisites check passed."
}

# Pull latest code from git
pull_latest_code() {
    log_info "Pulling latest code from Git..."
    
    if [ -d ".git" ]; then
        git pull origin main
    else
        log_warn "Not a git repository. Assuming code is already in place."
    fi
}

# Build Docker images
build_images() {
    log_info "Building Docker images..."
    
    $DOCKER_COMPOSE_CMD build --no-cache
    
    log_info "Docker images built successfully."
}

# Stop existing containers
stop_containers() {
    log_info "Stopping existing containers..."
    
    $DOCKER_COMPOSE_CMD down || true
    
    log_info "Containers stopped."
}

# Start containers
start_containers() {
    log_info "Starting containers..."
    
    $DOCKER_COMPOSE_CMD up -d
    
    log_info "Containers started successfully."
}

# Wait for services to be ready
wait_for_services() {
    log_info "Waiting for services to be ready..."
    
    # Wait for backend
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s http://localhost:8000/health > /dev/null 2>&1; then
            log_info "Backend service is up."
            break
        fi
        
        log_info "Waiting for backend... (attempt $attempt/$max_attempts)"
        sleep 2
        attempt=$((attempt + 1))
    done
    
    if [ $attempt -gt $max_attempts ]; then
        log_error "Backend service failed to start within timeout."
        exit 1
    fi
    
    # Wait for frontend
    attempt=1
    while [ $attempt -le $max_attempts ]; do
        if curl -s http://localhost > /dev/null 2>&1; then
            log_info "Frontend service is up."
            break
        fi
        
        log_info "Waiting for frontend... (attempt $attempt/$max_attempts)"
        sleep 2
        attempt=$((attempt + 1))
    done
    
    if [ $attempt -gt $max_attempts ]; then
        log_error "Frontend service failed to start within timeout."
        exit 1
    fi
}

# Run database migrations
run_migrations() {
    log_info "Running database migrations..."
    
    # This would run Alembic migrations in a real scenario
    # For now, we'll just ensure the database file exists
    mkdir -p data
    touch data/mes.db
    
    log_info "Database setup complete."
}

# Check device connectivity
check_devices() {
    log_info "Checking device connectivity..."
    
    # Check if serial ports exist (for RFID and barcode)
    if [ -e "$RFID_SERIAL_PORT" ]; then
        log_info "RFID serial port found: $RFID_SERIAL_PORT"
    else
        log_warn "RFID serial port not found: $RFID_SERIAL_PORT"
    fi
    
    if [ -e "$BARCODE_SERIAL_PORT" ]; then
        log_info "Barcode serial port found: $BARCODE_SERIAL_PORT"
    else
        log_warn "Barcode serial port not found: $BARCODE_SERIAL_PORT"
    fi
    
    # Check PLC connectivity (simulated)
    if nc -z "$PLC_HOST" "$PLC_PORT" 2>/dev/null; then
        log_info "PLC connectivity check passed."
    else
        log_warn "PLC not reachable at $PLC_HOST:$PLC_PORT"
    fi
}

# Setup cron job for periodic sync
setup_cron_job() {
    log_info "Setting up cron job for periodic sync..."
    
    # Create sync script
    cat > /usr/local/bin/mes-sync.sh << 'EOF'
#!/bin/bash
# MES System Sync Script
curl -X POST http://localhost:8000/api/sync/sync-all
EOF
    
    chmod +x /usr/local/bin/mes-sync.sh
    
    # Add to crontab (every 20 minutes)
    (crontab -l 2>/dev/null | grep -v "mes-sync.sh"; echo "*/20 * * * * /usr/local/bin/mes-sync.sh") | crontab -
    
    log_info "Cron job set up for every 20 minutes."
}

# Main deployment function
deploy() {
    log_info "Starting deployment..."
    
    check_prerequisites
    pull_latest_code
    
    # Load environment variables
    if [ -f "$ENV_FILE" ]; then
        log_info "Loading environment variables from $ENV_FILE"
        source "$ENV_FILE"
    else
        log_warn "Environment file $ENV_FILE not found. Using defaults."
    fi
    
    stop_containers
    build_images
    run_migrations
    start_containers
    wait_for_services
    check_devices
    setup_cron_job
    
    log_info "=== Deployment Completed Successfully ==="
    echo ""
    echo "Application URLs:"
    echo "  Frontend: http://localhost"
    echo "  Backend API: http://localhost:8000"
    echo "  API Documentation: http://localhost:8000/docs"
    echo ""
    echo "Next steps:"
    echo "  1. Access the application at http://localhost"
    echo "  2. Login with default credentials (admin/admin)"
    echo "  3. Configure device connections in Settings"
    echo "  4. Verify database sync is working"
    echo ""
}

# Handle script arguments
case "$1" in
    "deploy")
        deploy
        ;;
    "stop")
        stop_containers
        ;;
    "start")
        start_containers
        ;;
    "restart")
        stop_containers
        start_containers
        ;;
    "status")
        $DOCKER_COMPOSE_CMD ps
        ;;
    "logs")
        $DOCKER_COMPOSE_CMD logs -f
        ;;
    "update")
        pull_latest_code
        stop_containers
        build_images
        start_containers
        ;;
    *)
        echo "Usage: $0 {deploy|stop|start|restart|status|logs|update}"
        echo ""
        echo "Commands:"
        echo "  deploy   - Full deployment (stop, build, start)"
        echo "  stop     - Stop all containers"
        echo "  start    - Start all containers"
        echo "  restart  - Restart all containers"
        echo "  status   - Show container status"
        echo "  logs     - Follow container logs"
        echo "  update   - Pull latest code and restart"
        exit 1
        ;;
esac