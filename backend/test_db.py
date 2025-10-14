#!/usr/bin/env python3
"""
Test database connection
Run: python test_db.py
"""
import asyncio
import asyncpg
from app.core.config import settings

async def test_connection():
    """Test PostgreSQL connection"""
    try:
        # Parse the connection URL
        url = settings.DATABASE_URL.replace('postgresql+asyncpg://', 'postgresql://')
        
        print("Testing database connection...")
        print(f"Connecting to: localhost:5432/social_media_db")
        print(f"Username: postgres")
        print("-" * 50)
        
        # Try to connect
        conn = await asyncpg.connect(url)
        
        # Test query
        version = await conn.fetchval('SELECT version()')
        print(f"✓ Connected successfully!")
        print(f"PostgreSQL version: {version.split(',')[0]}")
        
        # List databases
        databases = await conn.fetch('SELECT datname FROM pg_database WHERE datistemplate = false;')
        print(f"\nAvailable databases:")
        for db in databases:
            print(f"  - {db['datname']}")
        
        # Close connection
        await conn.close()
        print("\n✓ Connection test passed!")
        
        return True
        
    except Exception as e:
        print(f"✗ Connection failed!")
        print(f"Error: {str(e)}")
        print("\nTroubleshooting steps:")
        print("1. Make sure PostgreSQL is running (check pgAdmin)")
        print("2. Verify the database 'social_media_db' exists")
        print("3. Check your .env file has the correct password")
        print("4. Make sure password special characters are URL-encoded (@=%40)")
        return False

if __name__ == "__main__":
    asyncio.run(test_connection())