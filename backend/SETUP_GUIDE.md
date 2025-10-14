# Navigate to backend directory
cd backend

# Copy environment file
cp .env.example .env

# Edit .env with your credentials
nano .env
# Required API Keys
OPENAI_API_KEY=sk-your-openai-key-here
SECRET_KEY=your-generated-secret-key-here

# Optional: Add social media credentials as you get them
INSTAGRAM_USERNAME=your-instagram-username
INSTAGRAM_PASSWORD=your-instagram-password

TWITTER_API_KEY=your-twitter-api-key
TWITTER_API_SECRET=your-twitter-api-secret

# ... etc
# From project root directory
docker-compose up --build

# Or run in background
docker-compose up -d --build
# The tables are created automatically on first run in DEBUG mode
# Or manually run migrations:
docker-compose exec backend alembic upgrade head
# Local Development Setup (Without Docker)
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # Linux/Mac
# OR
venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Install PostgreSQL
sudo apt-get install postgresql  # Ubuntu/Debian

# Create database
sudo -u postgres psql
CREATE DATABASE social_media_db;
CREATE USER postgres WITH PASSWORD 'postgres';
GRANT ALL PRIVILEGES ON DATABASE social_media_db TO postgres;
\q

# Install Redis
sudo apt-get install redis-server  # Ubuntu/Debian

# Start Redis
sudo systemctl start redis

cp .env.example .env

# Edit .env
nano .env

# Update database URL for local setup:
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/social_media_db
DATABASE_URL_SYNC=postgresql://postgres:postgres@localhost:5432/social_media_db
REDIS_URL=redis://localhost:6379/0


# Initialize alembic (if not done)
alembic init alembic

# Create initial migration
alembic revision --autogenerate -m "Initial migration"

# Apply migrations
alembic upgrade head

# Terminal 1: Start FastAPI
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: Start Celery Worker
celery -A app.celery_app worker --loglevel=info

# Terminal 3: Start Celery Beat (for scheduled tasks)
celery -A app.celery_app beat --loglevel=info

# Make script executable
chmod +x test_api.py

# Run tests
python test_api.py

# Manual Testing with cURL
# 1. Register a user
curl -X POST "http://localhost:8000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "SecurePass123!",
    "full_name": "Test User",
    "user_type": "individual"
  }'

# 2. Login
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=test@example.com&password=SecurePass123!"

# Save the access_token from response

# 3. Generate content
curl -X POST "http://localhost:8000/api/v1/content/generate" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Benefits of meditation for mental health",
    "auto_approve": true
  }'

  