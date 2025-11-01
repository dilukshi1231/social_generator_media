"""
Debug script to test Pexels API directly
Run this to verify your Pexels API key and search functionality

Usage:
    python test_pexels.py
"""

import httpx
import asyncio
import sys
from pathlib import Path

# Add parent directory to path to import from app
sys.path.insert(0, str(Path(__file__).parent))

try:
    from app.core.config import settings
    api_key = settings.PEXELS_API_KEY
    print(f"✅ Loaded API key from settings")
except Exception as e:
    print(f"⚠️  Could not load from settings: {e}")
    api_key = 'h8DQNAlUY0HqTWhYAJKLbD6u1kWC0jOwUn0oA5LmW9lGZPh9PmaoavMQ'
    print(f"Using hardcoded API key")

async def test_pexels_api():
    
    if not api_key or api_key == 'your_pexels_api_key_here':
        print("❌ ERROR: PEXELS_API_KEY not set or invalid")
        print("Get your key from: https://www.pexels.com/api/")
        return
    
    print(f"✅ API Key found: {api_key[:20]}...")
    
    # Test search queries
    test_queries = [
        "football",
        "soccer players",
        "sports action",
        "nature landscape",
        "business meeting"
    ]
    
    base_url = "https://api.pexels.com/videos/search"
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        for query in test_queries:
            print(f"\n🔍 Testing query: '{query}'")
            
            try:
                response = await client.get(
                    base_url,
                    headers={"Authorization": api_key},
                    params={
                        "query": query,
                        "per_page": 5,
                        "orientation": "landscape"
                    }
                )
                
                print(f"   Status: {response.status_code}")
                
                if response.status_code == 200:
                    data = response.json()
                    total = data.get("total_results", 0)
                    videos = data.get("videos", [])
                    
                    print(f"   ✅ Success!")
                    print(f"   Total results: {total}")
                    print(f"   Videos returned: {len(videos)}")
                    
                    if videos:
                        print(f"   First video:")
                        print(f"     - ID: {videos[0].get('id')}")
                        print(f"     - Duration: {videos[0].get('duration')}s")
                        print(f"     - Size: {videos[0].get('width')}x{videos[0].get('height')}")
                    else:
                        print(f"   ⚠️  No videos found for this query")
                        
                elif response.status_code == 401:
                    print(f"   ❌ Authentication failed - check your API key")
                    print(f"   Response: {response.text}")
                    break
                    
                elif response.status_code == 429:
                    print(f"   ⚠️  Rate limit exceeded")
                    break
                    
                else:
                    print(f"   ❌ Error: {response.status_code}")
                    print(f"   Response: {response.text}")
                    
            except Exception as e:
                print(f"   ❌ Exception: {str(e)}")
    
    print("\n" + "="*50)
    print("✅ Debug test complete!")
    print("="*50)


if __name__ == "__main__":
    print("="*50)
    print("🔧 Pexels API Debug Script")
    print("="*50)
    asyncio.run(test_pexels_api())