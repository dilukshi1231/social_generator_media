import httpx
from typing import Dict, Optional
from app.core.config import settings
import json


class ContentGeneratorService:
    """Service for generating AI content for social media platforms using Google Gemini."""

    def __init__(self):
        self.gemini_url = "https://generativelanguage.googleapis.com/v1beta/models"
        self.gemini_key = settings.GEMINI_API_KEY

    async def generate_platform_captions(
        self, topic: str, model: str = "gemini-2.0-flash-exp"
    ) -> Dict[str, str]:
        """
        Generate captions for all social media platforms using Google Gemini.

        Args:
            topic: The content topic
            model: Gemini model to use

        Returns:
            Dictionary with captions for each platform
        """
        # Check if API key is configured
        if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY.strip() == "":
            raise ValueError(
                "GEMINI_API_KEY is not configured. Please add your Google Gemini API key to the .env file. "
                "Get it from: https://aistudio.google.com/app/apikey"
            )

        prompt = f"""Topic: {topic}

Based on this topic, generate perfect and platform-specific captions for social media. 
Don't use (*) star symbols in the output. All the captions must be in English

Generate:
1. Facebook Caption - Engaging caption with proper hashtags (can be longer, storytelling)
2. Instagram Caption - Visual-focused caption with relevant hashtags and emojis
3. LinkedIn Caption - Professional caption with industry hashtags
4. Pinterest Caption - Descriptive caption with searchable hashtags
5. X Tweet - Concise tweet under 280 characters with trending hashtags
6. Threads Caption - Conversational thread under 500 characters

Format as JSON with keys: facebook_caption, instagram_caption, linkedin_caption, pinterest_caption, x_tweet, threads_caption"""

        async with httpx.AsyncClient(timeout=60.0) as client:
            url = f"{self.gemini_url}/{model}:generateContent?key={self.gemini_key}"

            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"response_mime_type": "application/json"},
            }

            response = await client.post(url, json=payload)
            response.raise_for_status()

            result = response.json()

            # Handle Gemini API response structure
            try:
                candidates = result.get("candidates", [])
                if not candidates:
                    raise ValueError("No candidates in Gemini response")

                content_obj = candidates[0].get("content", {})
                parts = content_obj.get("parts", [])

                if not parts:
                    raise ValueError("No parts in Gemini response")

                # Get the text from the first part
                content = parts[0].get("text", "")

                if not content:
                    raise ValueError("No text content in Gemini response")

                # Parse JSON response
                captions = json.loads(content)

                # Handle both dict and list responses
                if isinstance(captions, list):
                    # If it's a list, try to get the first item
                    if len(captions) > 0 and isinstance(captions[0], dict):
                        captions = captions[0]
                    else:
                        raise ValueError(
                            f"Unexpected list format in Gemini response. Content: {content[:500]}"
                        )

                if not isinstance(captions, dict):
                    raise ValueError(
                        f"Expected dict, got {type(captions).__name__}. Content: {content[:500]}"
                    )

                return {
                    "facebook": captions.get("facebook_caption", ""),
                    "instagram": captions.get("instagram_caption", ""),
                    "linkedin": captions.get("linkedin_caption", ""),
                    "pinterest": captions.get("pinterest_caption", ""),
                    "twitter": captions.get("x_tweet", ""),
                    "threads": captions.get("threads_caption", ""),
                }
            except (KeyError, IndexError, json.JSONDecodeError) as e:
                raise ValueError(
                    f"Failed to parse Gemini response: {str(e)}. Content snippet: {content[:500] if content else 'No content'}"
                )

    async def generate_image_prompt(
        self, topic: str, model: str = "gemini-2.0-flash-exp"
    ) -> str:
        """
        Generate an optimized image prompt for image generation using Google Gemini.

        Args:
            topic: The content topic
            model: Gemini model to use

        Returns:
            Optimized image generation prompt
        """
        # Check if API key is configured
        if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY.strip() == "":
            raise ValueError(
                "GEMINI_API_KEY is not configured. Please add your Google Gemini API key to the .env file. "
                "Get it from: https://aistudio.google.com/app/apikey"
            )

        prompt = f"""Topic: {topic}

Your task is to generate a perfect image prompt optimized for AI image generation models like DALL-E, Midjourney, or Stable Diffusion.

The prompt should:
- Be detailed and descriptive
- Include style, lighting, composition details
- Specify colors and mood
- Be clear and concise
- Avoid any controversial or sensitive content

Return only the image prompt as plain text."""

        async with httpx.AsyncClient(timeout=60.0) as client:
            url = f"{self.gemini_url}/{model}:generateContent?key={self.gemini_key}"

            payload = {"contents": [{"parts": [{"text": prompt}]}]}

            response = await client.post(url, json=payload)
            response.raise_for_status()

            result = response.json()

            # Handle Gemini API response structure
            try:
                candidates = result.get("candidates", [])
                if not candidates:
                    raise ValueError("No candidates in Gemini response")

                content_obj = candidates[0].get("content", {})
                parts = content_obj.get("parts", [])

                if not parts:
                    raise ValueError("No parts in Gemini response")

                # Get the text from the first part
                image_prompt = parts[0].get("text", "")

                if not image_prompt:
                    raise ValueError("No text content in Gemini response")

                return image_prompt.strip()
            except (KeyError, IndexError) as e:
                raise ValueError(
                    f"Failed to parse Gemini response: {str(e)}. Response: {result}"
                )

    async def generate_image_from_prompt(
        self, prompt: str, model: str = "gemini-2.0-flash-exp"
    ) -> Optional[str]:
        """
        Generate an image using Google Gemini Imagen from a text prompt.

        Args:
            prompt: Image generation prompt
            model: Gemini model to use

        Returns:
            Base64 encoded image data URL or None
        """
        # Check if API key is configured
        if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY.strip() == "":
            print(
                "Warning: GEMINI_API_KEY is not configured. Skipping image generation."
            )
            return None

        # Note: Gemini doesn't directly generate images yet in the free API
        # For now, we'll return None and you can integrate with another service
        # Options: DALL-E, Stable Diffusion, or Imagen via Vertex AI
        print(f"Image generation requested with prompt: {prompt[:100]}...")
        print(
            "Note: Direct image generation requires additional setup (DALL-E, Stable Diffusion, etc.)"
        )
        return None

    async def generate_complete_content(self, topic: str) -> Dict:
        """
        Generate complete content package: captions and image.

        Args:
            topic: The content topic

        Returns:
            Dictionary with captions and image data
        """
        # Generate captions
        captions = await self.generate_platform_captions(topic)

        # Generate image prompt
        image_prompt = await self.generate_image_prompt(topic)

        # Generate image
        image_data = await self.generate_image_from_prompt(image_prompt)

        return {
            "topic": topic,
            "captions": captions,
            "image_prompt": image_prompt,
            "image_data": image_data,
            "image_base64": (
                image_data.split(",")[1] if image_data and "," in image_data else None
            ),
            "image_mime": (
                image_data.split(";")[0].split(":")[1]
                if image_data and ";" in image_data
                else None
            ),
        }
