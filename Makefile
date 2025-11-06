# Makefile for Social Media Automation Platform
# Provides convenient commands for development

.PHONY: help install setup clean test lint format docker-up docker-down migrate db-reset

# Default target
help:
	@echo "Social Media Automation Platform - Development Commands"
	@echo ""
	@echo "Setup Commands:"
	@echo "  make install        - Install all dependencies (backend + frontend)"
	@echo "  make setup          - Initial project setup"
	@echo ""
	@echo "Development Commands:"
	@echo "  make dev            - Start development servers (backend + frontend)"
	@echo "  make dev-backend    - Start backend only"
	@echo "  make dev-frontend   - Start frontend only"
	@echo ""
	@echo "Database Commands:"
	@echo "  make migrate        - Run database migrations"
	@echo "  make db-reset       - Reset database (WARNING: deletes all data)"
	@echo "  make db-seed        - Seed database with sample data"
	@echo ""
	@echo "Testing Commands:"
	@echo "  make test           - Run all tests"
	@echo "  make test-backend   - Run backend tests"
	@echo "  make test-frontend  - Run frontend tests"
	@echo "  make test-coverage  - Run tests with coverage report"
	@echo ""
	@echo "Code Quality Commands:"
	@echo "  make lint           - Run all linters"
	@echo "  make lint-backend   - Lint backend code"
	@echo "  make lint-frontend  - Lint frontend code"
	@echo "  make format         - Format all code"
	@echo "  make format-backend - Format backend code"
	@echo "  make format-frontend- Format frontend code"
	@echo ""
	@echo "Docker Commands:"
	@echo "  make docker-up      - Start all Docker services"
	@echo "  make docker-down    - Stop all Docker services"
	@echo "  make docker-logs    - View Docker logs"
	@echo "  make docker-rebuild - Rebuild and restart Docker services"
	@echo ""
	@echo "Cleanup Commands:"
	@echo "  make clean          - Remove build artifacts and caches"
	@echo "  make clean-backend  - Clean backend artifacts"
	@echo "  make clean-frontend - Clean frontend artifacts"

# Setup Commands
install:
	@echo "Installing dependencies..."
	cd backend && pip install -r requirements-dev.txt
	cd frontend && npm install
	@echo "✓ Dependencies installed"

setup:
	@echo "Running project setup..."
	python setup.py
	@echo "✓ Setup complete"

# Development Commands
dev:
	@echo "Starting development servers..."
	@echo "Backend will run on http://localhost:8000"
	@echo "Frontend will run on http://localhost:3000"
	@echo "Press Ctrl+C to stop"
	@(trap 'kill 0' SIGINT; \
		cd backend && uvicorn app.main:app --reload & \
		cd frontend && npm run dev)

dev-backend:
	@echo "Starting backend server..."
	cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

dev-frontend:
	@echo "Starting frontend server..."
	cd frontend && npm run dev

# Database Commands
migrate:
	@echo "Running database migrations..."
	cd backend && alembic upgrade head
	@echo "✓ Migrations complete"

db-reset:
	@echo "WARNING: This will delete all data!"
	@read -p "Are you sure? [y/N] " confirm && [ $$confirm = y ] || exit 1
	cd backend && alembic downgrade base
	cd backend && alembic upgrade head
	@echo "✓ Database reset complete"

db-seed:
	@echo "Seeding database..."
	cd backend && python scripts/seed_database.py
	@echo "✓ Database seeded"

# Testing Commands
test: test-backend test-frontend

test-backend:
	@echo "Running backend tests..."
	cd backend && pytest tests/ -v

test-frontend:
	@echo "Running frontend tests..."
	cd frontend && npm test

test-coverage:
	@echo "Running tests with coverage..."
	cd backend && pytest tests/ --cov=app --cov-report=html --cov-report=term
	@echo "✓ Coverage report generated in backend/htmlcov/"

# Code Quality Commands
lint: lint-backend lint-frontend

lint-backend:
	@echo "Linting backend..."
	cd backend && flake8 app/
	cd backend && mypy app/ --ignore-missing-imports
	@echo "✓ Backend linting complete"

lint-frontend:
	@echo "Linting frontend..."
	cd frontend && npm run lint
	@echo "✓ Frontend linting complete"

format: format-backend format-frontend

format-backend:
	@echo "Formatting backend code..."
	cd backend && black app/
	cd backend && isort app/
	@echo "✓ Backend formatting complete"

format-frontend:
	@echo "Formatting frontend code..."
	cd frontend && npx prettier --write "**/*.{ts,tsx,js,jsx,json,css,md}"
	@echo "✓ Frontend formatting complete"

# Docker Commands
docker-up:
	@echo "Starting Docker services..."
	docker-compose up -d
	@echo "✓ Docker services started"
	@echo "  PostgreSQL: localhost:5432"
	@echo "  Redis: localhost:6379"
	@echo "  Backend: localhost:8000"

docker-down:
	@echo "Stopping Docker services..."
	docker-compose down
	@echo "✓ Docker services stopped"

docker-logs:
	docker-compose logs -f

docker-rebuild:
	@echo "Rebuilding Docker services..."
	docker-compose down
	docker-compose up --build -d
	@echo "✓ Docker services rebuilt and started"

# Cleanup Commands
clean: clean-backend clean-frontend

clean-backend:
	@echo "Cleaning backend..."
	find backend -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find backend -type f -name "*.pyc" -delete 2>/dev/null || true
	find backend -type f -name "*.pyo" -delete 2>/dev/null || true
	rm -rf backend/.pytest_cache 2>/dev/null || true
	rm -rf backend/htmlcov 2>/dev/null || true
	rm -rf backend/.coverage 2>/dev/null || true
	@echo "✓ Backend cleaned"

clean-frontend:
	@echo "Cleaning frontend..."
	rm -rf frontend/.next 2>/dev/null || true
	rm -rf frontend/node_modules/.cache 2>/dev/null || true
	@echo "✓ Frontend cleaned"
