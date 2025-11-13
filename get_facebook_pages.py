"""
Helper script to get your Facebook Pages and Instagram Business Accounts.
This will show you the correct IDs to use for connection.
"""

import requests
import json

# Your Facebook Access Token from .env
ACCESS_TOKEN = "EAAWT5sBxwGwBP25yWUkyaFRKtG4ZC0OJyilLAOMT2FZCMDINOqqy8Hmu4zi8bZBZCV3fB0OseaJzzKJkTKyyku5CjGZCnJPZCEhh0iJNdAjYsMIyEGkJIZAuITSkHKaNq00GB2ReHyBkwZC6C0Krtnak1mPHK75FzMrGNz1h3TjZCHjRsBooMLCwVYVqZBYLw2MztCDsZCZCrGZAThDbFMcjx2moJZCpbISP6oycZBwUpImsEbmE2ysZBgTKjiFoBZAHHcJZAnjd7zYBvNZADmrCPss4hWM2mXfFcvdXgZDZD"


def get_user_pages():
    """Get all Facebook Pages the user manages"""
    print("=" * 70)
    print("Fetching Your Facebook Pages...")
    print("=" * 70)
    print()

    try:
        # Get pages with Instagram account info
        response = requests.get(
            "https://graph.facebook.com/v18.0/me/accounts",
            params={
                "fields": "id,name,access_token,category,instagram_business_account{id,username,name}",
                "access_token": ACCESS_TOKEN,
            },
        )

        if response.status_code != 200:
            print(f"❌ Error: {response.status_code}")
            print(f"Response: {response.text}")
            return

        data = response.json()
        pages = data.get("data", [])

        if not pages:
            print("❌ No pages found!")
            print("Make sure:")
            print("  1. You have admin access to at least one Facebook Page")
            print("  2. Your token has 'pages_show_list' permission")
            print()
            print(
                "Get a new token from: https://developers.facebook.com/tools/explorer"
            )
            print(
                "Required permissions: pages_show_list, pages_manage_posts, pages_read_engagement"
            )
            return

        print(f"✅ Found {len(pages)} page(s):\n")

        for i, page in enumerate(pages, 1):
            print(f"📄 Page {i}:")
            print(f"   Name: {page['name']}")
            print(f"   ID: {page['id']}")
            print(f"   Category: {page.get('category', 'N/A')}")
            print(f"   ⚠️  Page Access Token: {page.get('access_token', 'N/A')[:50]}...")

            # Check for Instagram Business Account
            ig_account = page.get("instagram_business_account")
            if ig_account:
                print(f"   📷 Instagram Connected:")
                print(f"      Username: @{ig_account.get('username', 'N/A')}")
                print(f"      Name: {ig_account.get('name', 'N/A')}")
                print(f"      ID: {ig_account['id']}")
            else:
                print(f"   📷 Instagram: Not connected")

            print()

        print("=" * 70)
        print("📝 Use these tokens/IDs in your connection:")
        print("=" * 70)
        for i, page in enumerate(pages, 1):
            print(f"\nPage {i}: {page['name']}")
            print(f"  Facebook Page ID: {page['id']}")
            print(f"  ⚠️  USE THIS TOKEN (Page Access Token):")
            print(f"     {page.get('access_token', 'N/A')}")
            ig_account = page.get("instagram_business_account")
            if ig_account:
                print(f"  Instagram Business Account ID: {ig_account['id']}")
                print(f"  Instagram Token: Same as Page Access Token above")

    except Exception as e:
        print(f"❌ Error: {str(e)}")


def debug_token():
    """Check token information"""
    print("\n" + "=" * 70)
    print("Token Information")
    print("=" * 70)
    print()

    try:
        response = requests.get(
            "https://graph.facebook.com/v18.0/debug_token",
            params={"input_token": ACCESS_TOKEN, "access_token": ACCESS_TOKEN},
        )

        if response.status_code == 200:
            data = response.json().get("data", {})
            print(f"✅ Token is valid!")
            print(f"   App ID: {data.get('app_id')}")
            print(f"   Type: {data.get('type')}")
            print(f"   User ID: {data.get('user_id')}")

            scopes = data.get("scopes", [])
            print(f"   Permissions: {', '.join(scopes)}")

            expires_at = data.get("expires_at", 0)
            if expires_at > 0:
                import datetime

                exp_date = datetime.datetime.fromtimestamp(expires_at)
                days_left = (exp_date - datetime.datetime.now()).days
                print(
                    f"   Expires: {exp_date.strftime('%Y-%m-%d')} ({days_left} days left)"
                )
            else:
                print(f"   Expires: Never")

            # Check for required permissions
            required = [
                "pages_show_list",
                "pages_manage_posts",
                "pages_read_engagement",
            ]
            missing = [perm for perm in required if perm not in scopes]

            if missing:
                print(f"\n⚠️  Missing permissions: {', '.join(missing)}")
                print("   Get a new token with these permissions from:")
                print("   https://developers.facebook.com/tools/explorer")
        else:
            print(f"❌ Token validation failed: {response.text}")

    except Exception as e:
        print(f"❌ Error: {str(e)}")


if __name__ == "__main__":
    print("\n🔍 Facebook Page & Instagram Account Finder\n")

    # Debug token first
    debug_token()

    # Get pages
    get_user_pages()

    print("\n" + "=" * 70)
    print("🔧 IMPORTANT: Getting Token with Correct Permissions")
    print("=" * 70)
    print("\nYour token is missing 'pages_manage_posts' permission!")
    print("This is required to post to Facebook Pages.\n")
    print("To get a new token with all permissions:")
    print("\n1. Go to: https://developers.facebook.com/tools/explorer")
    print("2. Select your app: 'Your App Name'")
    print("3. Click 'Generate Access Token'")
    print("4. Select these permissions:")
    print("   ✓ pages_show_list")
    print("   ✓ pages_manage_posts  ⚠️  (Required for posting!)")
    print("   ✓ pages_read_engagement")
    print("   ✓ instagram_basic")
    print("   ✓ instagram_content_publish")
    print("5. Click 'Generate Access Token' and authorize")
    print("6. Copy the new token and update your .env file")
    print("7. Reconnect your Facebook Page in the application")
    print("\n✨ Done! Use the IDs shown above in your application.\n")
