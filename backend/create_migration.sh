#!/bin/bash

echo "Creating initial database migration..."

# Activate virtual environment if exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Create migration
alembic revision --autogenerate -m "Initial migration: users, social_accounts, content, posts"

echo "Migration created! Run 'alembic upgrade head' to apply it."
