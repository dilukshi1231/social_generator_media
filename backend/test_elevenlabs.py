# test_elevenlabs.py
import asyncio
import httpx
import os
from dotenv import load_dotenv

load_dotenv()

async def test_api_key():
    api_key = os.getenv("ELEVENLABS_API_KEY")
    
    print(f"🔑 API Key from .env: {api_key[:20] if api_key else 'NOT FOUND'}...")
    
    if not api_key:
        print("❌ No API key found! Check your .env file")
        return
    
    # Test with a simple request
    headers = {
        "Accept": "application/json",
        "xi-api-key": api_key
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                "https://api.elevenlabs.io/v1/voices",
                headers=headers
            )
            
            print(f"📡 Response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ SUCCESS! Found {len(data.get('voices', []))} voices")
                print("   Your API key is valid!")
            elif response.status_code == 401:
                print("❌ 401 Unauthorized - API key is invalid")
                print(f"   Response: {response.text}")
            else:
                print(f"❌ Error {response.status_code}: {response.text}")
                
        except Exception as e:
            print(f"❌ Connection error: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_api_key())