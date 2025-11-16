"""
Quick test script to verify the new Facebook/Instagram token connection endpoints.
Run this after starting the backend server.
"""

import requests
import json

# Configuration
BASE_URL = "http://localhost:8000"
API_URL = f"{BASE_URL}/api/v1"

# You'll need to get a JWT token first by logging in
# For now, this shows the expected API structure


def test_facebook_token():
    """Test Facebook Page token connection"""

    # Replace with your actual token
    jwt_token = "YOUR_JWT_TOKEN_HERE"

    headers = {
        "Authorization": f"Bearer {jwt_token}",
        "Content-Type": "application/json",
    }

    # Test the token first
    test_data = {
        "platform": "facebook",
        "access_token": "EAAWT5sBxwGwBP25yWUkyaFRKtG4ZC0OJyilLAOMT2FZCMDINOqqy8Hmu4zi8bZBZCV3fB0OseaJzzKJkTKyyku5CjGZCnJPZCEhh0iJNdAjYsMIyEGkJIZAuITSkHKaNq00GB2ReHyBkwZC6C0Krtnak1mPHK75FzMrGNz1h3TjZCHjRsBooMLCwVYVqZBYLw2MztCDsZCZCrGZAThDbFMcjx2moJZCpbISP6oycZBwUpImsEbmE2ysZBgTKjiFoBZAHHcJZAnjd7zYBvNZADmrCPss4hWM2mXfFcvdXgZDZD",
        "page_id": "860825170448051",  # Correct Facebook Page ID
    }

    print("Testing Facebook token...")
    response = requests.post(
        f"{API_URL}/social-accounts/token/test", headers=headers, json=test_data
    )

    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")

    if response.status_code == 200 and response.json().get("valid"):
        print("\n✓ Token is valid! Now connecting...")

        # Connect the account
        connect_data = {
            "platform": "facebook",
            "access_token": "YOUR_FACEBOOK_PAGE_TOKEN",
            "page_id": "YOUR_FACEBOOK_PAGE_ID",
        }

        response = requests.post(
            f"{API_URL}/social-accounts/token/connect",
            headers=headers,
            json=connect_data,
        )

        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")

        if response.status_code == 200:
            print("\n✓ Facebook Page connected successfully!")
    else:
        print("\n✗ Token validation failed")


def test_instagram_token():
    """Test Instagram Business Account token connection"""

    # Replace with your actual token
    jwt_token = "YOUR_JWT_TOKEN_HERE"

    headers = {
        "Authorization": f"Bearer {jwt_token}",
        "Content-Type": "application/json",
    }

    # Test the token first
    test_data = {
        "platform": "instagram",
        "access_token": "EAAWT5sBxwGwBP4cuRFYixl73CGZBf65JMel97pMXIwqKbqipGrNZB3Q4NWbKQiArdOvo87Hfn4GidfpyAERKfxJaQrc3tjfd9augw0PkLvZAi7yVHz9ErVbB7xCtxZCwbC2zRvwBrCYsA8mCd8FUHm9KObh7hOMWU2UhZB4lx7al0CcCsSDhELpcmSUcY1cCsPZB4LZAya7cn63",
        "instagram_business_account_id": "17841478349500749",  # Correct Instagram Business Account ID
    }

    print("Testing Instagram token...")
    response = requests.post(
        f"{API_URL}/social-accounts/token/test", headers=headers, json=test_data
    )

    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")

    if response.status_code == 200 and response.json().get("valid"):
        print("\n✓ Token is valid! Now connecting...")

        # Connect the account
        connect_data = {
            "platform": "instagram",
            "access_token": "YOUR_FACEBOOK_PAGE_TOKEN",
            "instagram_business_account_id": "YOUR_INSTAGRAM_BUSINESS_ACCOUNT_ID",
        }

        response = requests.post(
            f"{API_URL}/social-accounts/token/connect",
            headers=headers,
            json=connect_data,
        )

        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")

        if response.status_code == 200:
            print("\n✓ Instagram Business Account connected successfully!")
    else:
        print("\n✗ Token validation failed")


def check_endpoints():
    """Check if the endpoints are available"""
    print("Checking if backend is running...")

    try:
        response = requests.get(f"{BASE_URL}/")
        if response.status_code == 200:
            print("✓ Backend is running!")
            print(f"  Backend URL: {BASE_URL}")
            print(f"  New endpoints:")
            print(f"    - POST {API_URL}/social-accounts/token/test")
            print(f"    - POST {API_URL}/social-accounts/token/connect")
            return True
        else:
            print("✗ Backend is not responding correctly")
            return False
    except requests.exceptions.ConnectionError:
        print(
            "✗ Cannot connect to backend. Make sure it's running on http://localhost:8000"
        )
        return False


if __name__ == "__main__":
    print("=" * 70)
    print("Facebook & Instagram Token Connection - Test Script")
    print("=" * 70)
    print()

    if check_endpoints():
        print("\n" + "=" * 70)
        print("To test the endpoints:")
        print("=" * 70)
        print("1. Login to the application and get your JWT token")
        print("2. Get your Facebook Page Access Token from Graph API Explorer")
        print("3. Get your Facebook Page ID or Instagram Business Account ID")
        print("4. Update the test functions above with your tokens")
        print("5. Run: python test_token_connection.py")
        print()
        print("Or simply use the frontend UI:")
        print(
            f"  1. Go to {BASE_URL.replace('8000', '3000')}/dashboard/social-accounts"
        )
        print("  2. Click 'Connect' on Facebook or Instagram")
        print("  3. Follow the dialog instructions")
        print()
        print("📖 For detailed instructions, see: FACEBOOK_INSTAGRAM_TOKEN_GUIDE.md")

    print()
    print("=" * 70)
