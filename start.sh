#!/bin/bash

# Order Matching System - Quick Start Script
# This script sets up and starts the complete system

set -e  # Exit on any error

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

# Check if Node.js is installed
check_node() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js v23.3.0 or higher."
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2)
    REQUIRED_VERSION="23.3.0"
    
    if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
        print_warning "Node.js version $NODE_VERSION detected. Version $REQUIRED_VERSION or higher is recommended."
    else
        print_success "Node.js version $NODE_VERSION detected."
    fi
}

# Check if PostgreSQL is running
check_postgres() {
    if ! command -v psql &> /dev/null; then
        print_error "PostgreSQL is not installed. Please install PostgreSQL."
        exit 1
    fi
    
    if ! pg_isready -q; then
        print_error "PostgreSQL is not running. Please start PostgreSQL service."
        exit 1
    fi
    
    print_success "PostgreSQL is running."
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Install root dependencies
    npm install
    
    # Install frontend dependencies
    if [ -d "frontend" ]; then
        print_status "Installing frontend dependencies..."
        cd frontend && npm install && cd ..
    fi
    
    # Install mobile dependencies (optional)
    if [ -d "mobile" ]; then
        print_status "Installing mobile dependencies..."
        cd mobile && npm install && cd ..
    fi
    
    print_success "Dependencies installed successfully."
}

# Setup database
setup_database() {
    print_status "Setting up database..."
    
    # Create database if it doesn't exist
    createdb order_matching_system 2>/dev/null || print_warning "Database 'order_matching_system' already exists or could not be created."
    
    # Run database setup
    npm run setup-db
    
    print_success "Database setup completed."
}

# Start backend server
start_backend() {
    print_status "Starting backend server..."
    
    # Start backend in background
    npm start &
    BACKEND_PID=$!
    
    # Wait for backend to start
    sleep 5
    
    # Check if backend is running
    if curl -s http://localhost:3000/health > /dev/null; then
        print_success "Backend server started successfully on port 3000"
    else
        print_error "Backend server failed to start"
        exit 1
    fi
}

# Start frontend
start_frontend() {
    print_status "Starting frontend..."
    
    # Start frontend in background
    cd frontend && npm start &
    FRONTEND_PID=$!
    cd ..
    
    # Wait for frontend to start
    sleep 10
    
    print_success "Frontend started successfully on port 3001"
}

# Run tests
run_tests() {
    print_status "Running system tests..."
    
    # Wait a bit for services to be fully ready
    sleep 5
    
    # Run tests
    node test-system.js
    
    print_success "Tests completed."
}

# Main execution
main() {
    echo "🚀 Order Matching System - Quick Start"
    echo "====================================="
    echo ""
    
    # Check prerequisites
    print_status "Checking prerequisites..."
    check_node
    check_postgres
    
    # Install dependencies
    install_dependencies
    
    # Setup database
    setup_database
    
    # Start services
    start_backend
    start_frontend
    
    # Run tests
    run_tests
    
    echo ""
    echo "🎉 Order Matching System is now running!"
    echo ""
    echo "📊 Backend API: http://localhost:3000"
    echo "🌐 Frontend UI: http://localhost:3001"
    echo "📱 Mobile App: Run 'npm run mobile' in another terminal"
    echo ""
    echo "Press Ctrl+C to stop all services"
    echo ""
    
    # Wait for user to stop
    wait
}

# Cleanup function
cleanup() {
    print_status "Stopping services..."
    
    # Kill background processes
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    
    print_success "Services stopped."
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Run main function
main "$@" 