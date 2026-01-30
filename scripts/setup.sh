#!/bin/bash
# ============================================================================
# ChiroClickCRM Development Environment Setup (Linux/Mac)
# ============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=============================================="
echo "  ChiroClickCRM Development Setup"
echo "=============================================="
echo ""

# Check prerequisites
check_prerequisite() {
    if command -v "$1" &> /dev/null; then
        echo -e "${GREEN}✓${NC} $1 found"
        return 0
    else
        echo -e "${RED}✗${NC} $1 not found"
        return 1
    fi
}

echo "Checking prerequisites..."
MISSING=0

check_prerequisite "node" || MISSING=1
check_prerequisite "npm" || MISSING=1
check_prerequisite "docker" || MISSING=1
check_prerequisite "docker-compose" || MISSING=1

if [ $MISSING -eq 1 ]; then
    echo ""
    echo -e "${RED}Missing prerequisites. Please install them and try again.${NC}"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}Node.js version 18+ required. Found: $(node -v)${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Node.js version $(node -v)"

echo ""
echo "Starting services..."

# Start Docker services
cd "$PROJECT_DIR"
docker-compose up -d postgres redis

echo "Waiting for PostgreSQL to be ready..."
sleep 5

# Check if database is ready
for i in {1..30}; do
    if docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} PostgreSQL is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}PostgreSQL failed to start${NC}"
        exit 1
    fi
    sleep 1
done

# Setup backend
echo ""
echo "Setting up backend..."
cd "$PROJECT_DIR/backend"

if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${YELLOW}!${NC} Created backend/.env from .env.example"
    echo -e "${YELLOW}!${NC} Please edit backend/.env with your configuration"
fi

npm install

# Run database migrations
echo "Running database migrations..."
npm run db:migrate 2>/dev/null || echo "No migrations script found, skipping..."

# Seed demo data
echo "Seeding demo data..."
docker-compose exec -T postgres psql -U postgres -d chiroclickcrm < "$PROJECT_DIR/database/seeds/demo-users.sql" 2>/dev/null || true
docker-compose exec -T postgres psql -U postgres -d chiroclickcrm < "$PROJECT_DIR/database/seeds/spine-templates.sql" 2>/dev/null || true

# Setup frontend
echo ""
echo "Setting up frontend..."
cd "$PROJECT_DIR/frontend"

if [ ! -f .env ]; then
    cp .env.example .env 2>/dev/null || echo "VITE_API_URL=http://localhost:3000/api/v1" > .env
    echo -e "${YELLOW}!${NC} Created frontend/.env"
fi

npm install

echo ""
echo "=============================================="
echo -e "${GREEN}Setup complete!${NC}"
echo "=============================================="
echo ""
echo "To start the application:"
echo ""
echo "  Backend:  cd backend && npm run dev"
echo "  Frontend: cd frontend && npm run dev"
echo ""
echo "Or use Docker:"
echo "  docker-compose up"
echo ""
echo "Access:"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:3000/api/v1"
echo ""
echo "Demo credentials:"
echo "  Admin:       admin@chiroclickcrm.no / admin123"
echo "  Practitioner: kiropraktor@chiroclickcrm.no / admin123"
echo "  Receptionist: resepsjon@chiroclickcrm.no / admin123"
echo ""
