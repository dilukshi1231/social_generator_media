"""
Quick script to verify LinkedIn OAuth configuration
Run this to check if your .env file is properly set up for LinkedIn OAuth
"""

from app.core.config import settings

print("=" * 60)
print("LinkedIn OAuth Configuration Check")
print("=" * 60)


def check_setting(name: str, value: str, required: bool = True) -> bool:
    """Check if a setting is configured"""
    is_set = bool(value and value.strip())
    status = (
        "✅ SET" if is_set else ("❌ MISSING" if required else "⚠️  OPTIONAL (not set)")
    )
    print(f"{name:30} : {status}")
    if is_set and len(value) > 50:
        print(f"{'':30}   Value: {value[:47]}...")
    elif is_set:
        print(f"{'':30}   Value: {value}")
    return is_set


print("\n🔑 Required for LinkedIn OAuth:")
print("-" * 60)
linkedin_id = check_setting(
    "LINKEDIN_CLIENT_ID", settings.LINKEDIN_CLIENT_ID, required=True
)
linkedin_secret = check_setting(
    "LINKEDIN_CLIENT_SECRET", settings.LINKEDIN_CLIENT_SECRET, required=True
)
frontend_url = check_setting("FRONTEND_URL", settings.FRONTEND_URL, required=True)
backend_url = check_setting("BACKEND_URL", settings.BACKEND_URL, required=True)

print("\n🔧 Optional Settings:")
print("-" * 60)
linkedin_redirect = check_setting(
    "LINKEDIN_REDIRECT_URI", settings.LINKEDIN_REDIRECT_URI, required=False
)

print("\n📋 OAuth Flow Configuration:")
print("-" * 60)

if linkedin_redirect:
    redirect_uri = linkedin_redirect
else:
    redirect_uri = f"{backend_url}/api/v1/oauth/linkedin/callback"

print(f"{'Redirect URI':30} : {redirect_uri}")
print(
    f"{'Authorization Endpoint':30} : https://www.linkedin.com/oauth/v2/authorization"
)
print(f"{'Token Endpoint':30} : https://www.linkedin.com/oauth/v2/accessToken")
print(f"{'Profile Endpoint':30} : https://api.linkedin.com/v2/me")

print("\n" + "=" * 60)

all_required_set = all([linkedin_id, linkedin_secret, frontend_url, backend_url])

if all_required_set:
    print("✅ All required settings are configured!")
    print("\n📝 Next Steps:")
    print("   1. Make sure you added this redirect URI in LinkedIn app:")
    print(f"      {redirect_uri}")
    print("   2. Restart your backend server")
    print("   3. Try connecting LinkedIn from the frontend")
    print("\n🚀 You're ready to test LinkedIn OAuth!")
else:
    print("❌ LinkedIn OAuth is NOT properly configured")
    print("\n📝 To Fix:")
    print("   1. Open backend/.env file")
    print("   2. Add these settings:")
    if not linkedin_id:
        print("      LINKEDIN_CLIENT_ID=your_client_id_from_linkedin_app")
    if not linkedin_secret:
        print("      LINKEDIN_CLIENT_SECRET=your_client_secret_from_linkedin_app")
    if not frontend_url:
        print("      FRONTEND_URL=http://localhost:3000")
    if not backend_url:
        print("      BACKEND_URL=http://localhost:8000")
    print("\n   3. Get credentials from: https://www.linkedin.com/developers/apps")
    print("   4. See LINKEDIN_OAUTH_SETUP.md for detailed instructions")

print("=" * 60)
