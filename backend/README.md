# Clone the repository
cd backend

# Copy environment file
cp .env.example .env

# Update .env with your credentials
nano .env

# Start all services
docker-compose up --build

# The API will be available at http://localhost:8000
# API docs at http://localhost:8000/api/docs



#local development
# Navigate to backend directory
cd backend

# Run setup script
chmod +x setup.sh
./setup.sh

# Or manually:
# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy and configure environment
cp .env.example .env
# Edit .env with your credentials

# Start PostgreSQL and Redis (if not using Docker)
# Or run only these services:
docker-compose up -d postgres redis

# Run database migrations
alembic upgrade head

# Start the development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

#database
# Create a new migration
alembic revision --autogenerate -m "Description of changes"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# View migration history
alembic history

#testing
# Run all tests
pytest

# Run with coverage
pytest --cov=app tests/

# Run specific test file
pytest tests/test_auth.py

# Run with verbose output
pytest -v

#environmental variables
# Database
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/dbname

# Security
SECRET_KEY=your-secret-key-here

# AI Services
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key

# Social Media APIs
INSTAGRAM_USERNAME=your-username
INSTAGRAM_PASSWORD=your-password
# ... more credentials

