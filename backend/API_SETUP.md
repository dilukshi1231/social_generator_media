# API Setup Guide

## Required: Google Gemini API Key

The content generation feature uses Google's Gemini AI to generate social media captions and image prompts.

### How to get your Google Gemini API key:

1. **Visit Google AI Studio**: Go to https://aistudio.google.com/app/apikey
2. **Sign in**: Use your Google account
3. **Create API Key**: Click "Create API Key" 
4. **Copy the key**: Save it securely
5. **Free tier**: Google Gemini offers a generous free tier!

### Configure the API key:

Open `backend/.env` and add your key:

```bash
# AI Services
GEMINI_API_KEY=AIzaSy...YOUR-API-KEY-HERE
```

### Why Google Gemini?

Google Gemini provides:
- ✅ **Free tier** with generous quotas
- ✅ **Fast response times**
- ✅ **High-quality text generation**
- ✅ **JSON output support**
- ✅ **No credit card required** for free tier

### Models used in this project:

1. **Caption Generation**: `gemini-2.0-flash-exp` (Free tier)
2. **Image Prompt Generation**: `gemini-2.0-flash-exp` (Free tier)
3. **Image Generation**: Currently disabled (you can integrate DALL-E or Stable Diffusion separately)

### Note on Image Generation:

Google Gemini's free API doesn't directly generate images. The app will:
- ✅ Generate an optimized image prompt using Gemini
- ⏸️ Skip actual image generation (returns None)
- 💡 You can integrate DALL-E, Stable Diffusion, or other image APIs separately

### Testing without image generation:

The app works perfectly without images:
- ✅ Generates captions for all platforms
- ✅ Creates image prompts (which you can use manually)
- ✅ All other features work normally

### Restart the backend:

After adding the API key, restart your backend server:

```powershell
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Then try generating content again!

### Free Tier Limits (Gemini):

- **Requests per minute**: 15
- **Requests per day**: 1,500
- **Tokens per minute**: 1 million

This is more than enough for development and testing!
