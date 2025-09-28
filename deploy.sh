#!/bin/bash

# Image Distortion Corrector - Deployment Script
# Developed by: Dinesh, Iniyan, Sudharshan, Arjun, Boophesh

set -e

echo "🚀 Starting Image Distortion Corrector Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Function to setup environment files
setup_env_files() {
    print_status "Setting up environment files..."
    
    # Backend environment
    if [ ! -f "backend/.env" ]; then
        cp backend/.env.example backend/.env
        print_success "Created backend/.env from example"
    else
        print_warning "backend/.env already exists, skipping..."
    fi
    
    # Frontend environment
    if [ ! -f "frontend/.env" ]; then
        cp frontend/.env.example frontend/.env
        print_success "Created frontend/.env from example"
    else
        print_warning "frontend/.env already exists, skipping..."
    fi
}

# Function to build and start services
start_services() {
    print_status "Building and starting services with Docker Compose..."
    
    # Stop any existing containers
    docker-compose down 2>/dev/null || true
    
    # Build and start services
    docker-compose up --build -d
    
    print_success "Services started successfully!"
}

# Function to wait for services to be ready
wait_for_services() {
    print_status "Waiting for services to be ready..."
    
    # Wait for backend
    echo "Waiting for backend..."
    for i in {1..30}; do
        if curl -f http://localhost:8001/api/health >/dev/null 2>&1; then
            print_success "Backend is ready!"
            break
        fi
        echo -n "."
        sleep 2
    done
    
    # Wait for frontend
    echo "Waiting for frontend..."
    for i in {1..30}; do
        if curl -f http://localhost:3000 >/dev/null 2>&1; then
            print_success "Frontend is ready!"
            break
        fi
        echo -n "."
        sleep 2
    done
}

# Function to show deployment info
show_deployment_info() {
    echo ""
    echo "🎉 Deployment completed successfully!"
    echo ""
    echo "📱 Application URLs:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend API: http://localhost:8001"
    echo "   API Documentation: http://localhost:8001/docs"
    echo "   MongoDB: mongodb://localhost:27017"
    echo ""
    echo "🔧 Useful Commands:"
    echo "   View logs: docker-compose logs -f"
    echo "   Stop services: docker-compose down"
    echo "   Restart services: docker-compose restart"
    echo "   View status: docker-compose ps"
    echo ""
    echo "📊 Service Status:"
    docker-compose ps
}

# Function for development setup
dev_setup() {
    print_status "Setting up development environment..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 16+ first."
        exit 1
    fi
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 is not installed. Please install Python 3.8+ first."
        exit 1
    fi
    
    # Setup backend
    print_status "Setting up backend..."
    cd backend
    
    if [ ! -d "venv" ]; then
        python3 -m venv venv
        print_success "Created Python virtual environment"
    fi
    
    source venv/bin/activate
    pip install -r requirements.txt
    print_success "Backend dependencies installed"
    cd ..
    
    # Setup frontend
    print_status "Setting up frontend..."
    cd frontend
    
    if command -v yarn &> /dev/null; then
        yarn install
    else
        npm install
    fi
    
    print_success "Frontend dependencies installed"
    cd ..
    
    print_success "Development environment setup complete!"
    echo ""
    echo "🚀 To start development servers:"
    echo "   Backend: cd backend && source venv/bin/activate && uvicorn server:app --reload --host 0.0.0.0 --port 8001"
    echo "   Frontend: cd frontend && yarn start"
}

# Main deployment logic
case "$1" in
    "dev")
        setup_env_files
        dev_setup
        ;;
    "docker")
        setup_env_files
        start_services
        wait_for_services
        show_deployment_info
        ;;
    "stop")
        print_status "Stopping services..."
        docker-compose down
        print_success "Services stopped"
        ;;
    "logs")
        docker-compose logs -f
        ;;
    "status")
        docker-compose ps
        ;;
    *)
        echo "🖼️ Image Distortion Corrector - Deployment Script"
        echo "Usage: $0 {dev|docker|stop|logs|status}"
        echo ""
        echo "Commands:"
        echo "  dev     - Setup development environment"
        echo "  docker  - Deploy with Docker Compose"
        echo "  stop    - Stop Docker services"
        echo "  logs    - View service logs"
        echo "  status  - Show service status"
        echo ""
        echo "Examples:"
        echo "  $0 dev     # Setup for development"
        echo "  $0 docker  # Deploy with Docker"
        echo "  $0 stop    # Stop services"
        exit 1
        ;;
esac