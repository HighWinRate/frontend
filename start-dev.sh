#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to display messages
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info "Starting web-app setup..."

# Check for Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js."
    exit 1
fi

# Check for npm
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm."
    exit 1
fi

# Check for .env file
if [ ! -f ".env" ]; then
    print_warning ".env file not found."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_success ".env file created from .env.example."
    else
        print_warning ".env.example file not found. Creating .env with default values..."
        cat > .env << 'ENVEOF'
# Supabase (public)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Supabase (server-only)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional overrides
NEXT_PUBLIC_LANDING_URL=http://localhost:3003
NEXT_PUBLIC_APP_NAME=High Win Rate
ENVEOF
        print_success ".env file created with default values."
    fi
fi

# Check for node_modules
if [ ! -d "node_modules" ]; then
    print_warning "node_modules not found. Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        print_error "Error installing dependencies!"
        exit 1
    fi
    print_success "Dependencies installed."
fi

# Check if server is running
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    print_warning "Port 3001 is in use."
    read -p "Do you want to continue? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Stopped."
        exit 0
    fi
fi

# Start server
print_info "Starting Next.js server..."
print_success "Server is starting..."
print_info "Press Ctrl+C to stop."
print_info "Web App will be available at http://localhost:3001"
echo ""

npm run dev

