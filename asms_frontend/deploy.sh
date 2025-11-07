#!/bin/bash

# ASMS Frontend Docker Deployment Script
# This script helps build and deploy the frontend application

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored messages
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    print_info "Docker is installed: $(docker --version)"
}

# Check if Docker Compose is installed
check_docker_compose() {
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    print_info "Docker Compose is installed: $(docker-compose --version)"
}

# Build Docker image
build() {
    print_info "Building Docker image..."
    docker build -t asms-frontend:latest .
    print_info "Build completed successfully!"
}

# Start services with Docker Compose
start() {
    print_info "Starting ASMS Frontend..."
    docker-compose up -d
    print_info "Frontend started successfully!"
    print_info "Frontend is running on http://localhost:3000"
}

# Stop services
stop() {
    print_info "Stopping ASMS Frontend..."
    docker-compose down
    print_info "Frontend stopped successfully!"
}

# Restart services
restart() {
    print_info "Restarting ASMS Frontend..."
    docker-compose restart
    print_info "Frontend restarted successfully!"
}

# View logs
logs() {
    print_info "Showing frontend logs (Ctrl+C to exit)..."
    docker-compose logs -f
}

# Check health
health() {
    print_info "Checking frontend health..."
    
    # Wait a bit for the service to start if it was just started
    sleep 2
    
    if curl -f http://localhost:3000 2>/dev/null > /dev/null; then
        print_info "Frontend is healthy!"
    else
        print_error "Frontend is not responding. Check logs with: ./deploy.sh logs"
        exit 1
    fi
}

# Clean up
clean() {
    print_warn "This will remove all containers, images, and volumes. Continue? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        print_info "Cleaning up..."
        docker-compose down -v
        docker rmi asms-frontend:latest 2>/dev/null || true
        print_info "Cleanup completed!"
    else
        print_info "Cleanup cancelled."
    fi
}

# Show status
status() {
    print_info "Container status:"
    docker ps -a | grep asms-frontend || echo "No frontend containers found"
    
    echo ""
    print_info "Resource usage:"
    docker stats --no-stream asms-frontend 2>/dev/null || echo "Frontend container is not running"
}

# Main script
main() {
    check_docker
    check_docker_compose
    
    case "$1" in
        build)
            build
            ;;
        start)
            start
            health
            ;;
        stop)
            stop
            ;;
        restart)
            restart
            health
            ;;
        logs)
            logs
            ;;
        health)
            health
            ;;
        status)
            status
            ;;
        clean)
            clean
            ;;
        deploy)
            build
            start
            health
            ;;
        *)
            echo "ASMS Frontend Deployment Script"
            echo ""
            echo "Usage: $0 {build|start|stop|restart|logs|health|status|clean|deploy}"
            echo ""
            echo "Commands:"
            echo "  build    - Build the Docker image"
            echo "  start    - Start the frontend service"
            echo "  stop     - Stop the frontend service"
            echo "  restart  - Restart the frontend service"
            echo "  logs     - Show frontend logs"
            echo "  health   - Check frontend health"
            echo "  status   - Show container status and resource usage"
            echo "  clean    - Remove all containers and images"
            echo "  deploy   - Build and start (full deployment)"
            echo ""
            exit 1
            ;;
    esac
}

main "$@"
