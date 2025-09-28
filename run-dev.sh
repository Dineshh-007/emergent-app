#!/bin/bash

# Development runner script for Image Distortion Corrector
# This script starts both frontend and backend in development mode

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}[DEV]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Function to cleanup background processes
cleanup() {
    print_info "Shutting down development servers..."
    kill $(jobs -p) 2>/dev/null || true
    exit 0
}

# Set up signal handling
trap cleanup SIGINT SIGTERM

print_info "Starting Image Distortion Corrector in development mode..."

# Check if environment files exist
if [ ! -f "backend/.env" ]; then
    cp backend/.env.example backend/.env
    print_success "Created backend/.env"
fi

if [ ! -f "frontend/.env" ]; then
    cp frontend/.env.example frontend/.env
    print_success "Created frontend/.env"
fi

# Start MongoDB (if not running)
if ! pgrep mongod >/dev/null; then
    print_info "Starting MongoDB..."
    mongod --dbpath ./data/db --fork --logpath ./data/mongodb.log 2>/dev/null || {
        mkdir -p data/db
        mongod --dbpath ./data/db --fork --logpath ./data/mongodb.log
    }
fi

# Start backend
print_info "Starting FastAPI backend on port 8001..."
cd backend

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Install dependencies if needed
if [ ! -f "venv/pyvenv.cfg" ]; then
    print_info "Installing backend dependencies..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
fi

# Start backend server
uvicorn server:app --reload --host 0.0.0.0 --port 8001 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Start frontend
print_info "Starting React frontend on port 3000..."
cd frontend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_info "Installing frontend dependencies..."
    if command -v yarn >/dev/null; then
        yarn install
    else
        npm install
    fi
fi

# Start frontend server
if command -v yarn >/dev/null; then
    yarn start &
else
    npm start &
fi
FRONTEND_PID=$!
cd ..

# Wait for services to be ready
print_info "Waiting for services to be ready..."
sleep 5

# Show status
echo ""
print_success "🎉 Development servers are running!"
echo ""
echo "📱 Application URLs:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:8001"
echo "   API Docs: http://localhost:8001/docs"
echo ""
echo "📋 Development Features:"
echo "   ✅ Hot reloading enabled"
echo "   ✅ Auto-restart on file changes"
echo "   ✅ Development logging"
echo ""
echo "🛑 Press Ctrl+C to stop all servers"
echo ""

# Wait for user interrupt
wait