#!/bin/bash

echo "🚀 Setting up Social Media Automation Backend..."

# Create virtual environment
echo "📦 Creating virtual environment..."
python3 -m venv venv

# Activate virtual environment
echo "✅ Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Copy environment file
echo "📝 Setting up environment file..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "⚠️  Please update .env with your actual credentials"
fi

# Generate secret key
SECRET_KEY=$(python -c "import secrets; print(secrets.token_urlsafe(32))")
echo "🔐 Generated SECRET_KEY: $SECRET_KEY"

# Update SECRET_KEY in .env if it exists
if [ -f .env ]; then
    # Use single quotes around sed expression to prevent variable interpolation issues on macOS/Linux
    sed -i.bak "s/^SECRET_KEY=.*/SECRET_KEY=${SECRET_KEY}/" .env
    echo "✅ Updated SECRET_KEY in .env"
fi

echo "
✨ Setup complete! 

Next steps:
1. Update .env file with your credentials
2. Start Docker services: docker-compose up -d
3. Run migrations: alembic upgrade head
4. Start development server: uvicorn app.main:app --reload

Or use Docker:
docker-compose up --build
"
