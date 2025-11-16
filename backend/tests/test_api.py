#!/usr/bin/env python3
"""
API Testing Script for Social Media Automation Platform
"""
import httpx
import asyncio
import json
from typing import Dict

BASE_URL = "http://localhost:8000"


class APITester:
    def __init__(self, base_url: str = BASE_URL):
        self.base_url = base_url
        self.access_token = None
        self.user_id = None
        
    async def test_health(self):
        """Test health endpoint"""
        print("\n=== Testing Health Endpoint ===")
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{self.base_url}/health")
            print(f"Status: {response.status_code}")
            print(f"Response: {response.json()}")
            return response.status_code == 200
    
    async def test_register(self, email: str, username: str, password: str):
        """Test user registration"""
        print("\n=== Testing User Registration ===")
        async with httpx.AsyncClient() as client:
            data = {
                "email": email,
                "username": username,
                "password": password,
                "full_name": "Test User",
                "user_type": "individual"
            }
            response = await client.post(
                f"{self.base_url}/api/v1/auth/register",
                json=data
            )
            print(f"Status: {response.status_code}")
            if response.status_code == 201:
                result = response.json()
                print(f"User created: {result['username']}")
                self.user_id = result['id']
                return True
            else:
                print(f"Error: {response.text}")
                return False
    
    async def test_login(self, email: str, password: str):
        """Test user login"""
        print("\n=== Testing User Login ===")
        async with httpx.AsyncClient() as client:
            data = {
                "username": email,  # OAuth2PasswordRequestForm uses 'username'
                "password": password
            }
            response = await client.post(
                f"{self.base_url}/api/v1/auth/login",
                data=data  # Form data, not JSON
            )
            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                result = response.json()
                self.access_token = result['access_token']
                print(f"Login successful! Token: {self.access_token[:20]}...")
                return True
            else:
                print(f"Error: {response.text}")
                return False
    
    async def test_get_current_user(self):
        """Test getting current user info"""
        print("\n=== Testing Get Current User ===")
        if not self.access_token:
            print("Not logged in!")
            return False
        
        async with httpx.AsyncClient() as client:
            headers = {"Authorization": f"Bearer {self.access_token}"}
            response = await client.get(
                f"{self.base_url}/api/v1/auth/me",
                headers=headers
            )
            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                result = response.json()
                print(f"Current user: {result['username']} ({result['email']})")
                return True
            else:
                print(f"Error: {response.text}")
                return False
    
    async def test_generate_content(self, topic: str):
        """Test content generation"""
        print("\n=== Testing Content Generation ===")
        if not self.access_token:
            print("Not logged in!")
            return None
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            headers = {"Authorization": f"Bearer {self.access_token}"}
            data = {
                "topic": topic,
                "auto_approve": True
            }
            print(f"Generating content for topic: {topic}")
            print("This may take 30-60 seconds...")
            
            response = await client.post(
                f"{self.base_url}/api/v1/content/generate",
                json=data,
                headers=headers
            )
            print(f"Status: {response.status_code}")
            if response.status_code == 201:
                result = response.json()
                print(f"Content created! ID: {result['id']}")
                print(f"Status: {result['status']}")
                print(f"\nCaptions generated:")
                print(f"- Facebook: {result['facebook_caption'][:100]}...")
                print(f"- Instagram: {result['instagram_caption'][:100]}...")
                print(f"- Twitter: {result['twitter_caption']}")
                return result['id']
            else:
                print(f"Error: {response.text}")
                return None
    
    async def test_list_content(self):
        """Test listing content"""
        print("\n=== Testing List Content ===")
        if not self.access_token:
            print("Not logged in!")
            return False
        
        async with httpx.AsyncClient() as client:
            headers = {"Authorization": f"Bearer {self.access_token}"}
            response = await client.get(
                f"{self.base_url}/api/v1/content/",
                headers=headers
            )
            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                contents = response.json()
                print(f"Found {len(contents)} content items")
                for content in contents:
                    print(f"- ID: {content['id']}, Topic: {content['topic']}, Status: {content['status']}")
                return True
            else:
                print(f"Error: {response.text}")
                return False
    
    async def test_connect_social_account(self, platform: str):
        """Test connecting a social media account"""
        print(f"\n=== Testing Connect {platform.title()} Account ===")
        if not self.access_token:
            print("Not logged in!")
            return None
        
        async with httpx.AsyncClient() as client:
            headers = {"Authorization": f"Bearer {self.access_token}"}
            data = {
                "platform": platform,
                "username": f"test_{platform}_user",
                "access_token": "test_access_token_12345",
                "refresh_token": "test_refresh_token_12345",
                "platform_user_id": "123456789",
                "display_name": f"Test {platform.title()} User",
                "platform_data": {
                    "page_id": "test_page_id",
                    "api_key": "test_api_key"
                }
            }
            response = await client.post(
                f"{self.base_url}/api/v1/social-accounts/",
                json=data,
                headers=headers
            )
            print(f"Status: {response.status_code}")
            if response.status_code == 201:
                result = response.json()
                print(f"Social account connected! ID: {result['id']}")
                print(f"Platform: {result['platform']}, Username: {result['username']}")
                return result['id']
            else:
                print(f"Error: {response.text}")
                return None
    
    async def test_list_social_accounts(self):
        """Test listing social accounts"""
        print("\n=== Testing List Social Accounts ===")
        if not self.access_token:
            print("Not logged in!")
            return False
        
        async with httpx.AsyncClient() as client:
            headers = {"Authorization": f"Bearer {self.access_token}"}
            response = await client.get(
                f"{self.base_url}/api/v1/social-accounts/",
                headers=headers
            )
            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                accounts = response.json()
                print(f"Found {len(accounts)} connected accounts")
                for account in accounts:
                    print(f"- {account['platform']}: {account['username']} (Active: {account['is_active']})")
                return True
            else:
                print(f"Error: {response.text}")
                return False
    
    async def test_create_posts(self, content_id: int, platforms: list):
        """Test creating posts"""
        print("\n=== Testing Create Posts ===")
        if not self.access_token:
            print("Not logged in!")
            return False
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            headers = {"Authorization": f"Bearer {self.access_token}"}
            data = {
                "content_id": content_id,
                "platforms": platforms,
                "scheduled_for": None  # Post immediately
            }
            print(f"Creating posts for platforms: {platforms}")
            
            response = await client.post(
                f"{self.base_url}/api/v1/posts/",
                json=data,
                headers=headers
            )
            print(f"Status: {response.status_code}")
            if response.status_code == 201:
                posts = response.json()
                print(f"Created {len(posts)} posts")
                for post in posts:
                    print(f"- {post['platform']}: Status={post['status']}")
                return True
            else:
                print(f"Error: {response.text}")
                return False
    
    async def test_list_posts(self):
        """Test listing posts"""
        print("\n=== Testing List Posts ===")
        if not self.access_token:
            print("Not logged in!")
            return False
        
        async with httpx.AsyncClient() as client:
            headers = {"Authorization": f"Bearer {self.access_token}"}
            response = await client.get(
                f"{self.base_url}/api/v1/posts/",
                headers=headers
            )
            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                posts = response.json()
                print(f"Found {len(posts)} posts")
                for post in posts:
                    print(f"- ID: {post['id']}, Platform: {post['platform']}, Status: {post['status']}")
                return True
            else:
                print(f"Error: {response.text}")
                return False
    
    async def run_full_test(self):
        """Run complete test suite"""
        print("\n" + "="*60)
        print("Social Media Automation API - Full Test Suite")
        print("="*60)
        
        # Test credentials
        test_email = "testuser@example.com"
        test_username = "testuser"
        test_password = "SecurePass123!"
        test_topic = "The benefits of meditation for mental health"
        
        # Run tests
        await self.test_health()
        
        # Register and login
        await self.test_register(test_email, test_username, test_password)
        await self.test_login(test_email, test_password)
        await self.test_get_current_user()
        
        # Content generation
        content_id = await self.test_generate_content(test_topic)
        await self.test_list_content()
        
        # Social accounts
        facebook_account = await self.connect_social_account("facebook")
        instagram_account = await self.test_connect_social_account("instagram")
        await self.test_list_social_accounts()
        
        # Posts (only if content and accounts created)
        if content_id and facebook_account:
            await self.test_create_posts(content_id, ["facebook", "instagram"])
            await self.test_list_posts()
        
        print("\n" + "="*60)
        print("Test Suite Complete!")
        print("="*60)


async def main():
    """Main test function"""
    tester = APITester()
    await tester.run_full_test()


if __name__ == "__main__":
    asyncio.run(main())