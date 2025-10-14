import httpx
from typing import Dict, Optional
from app.core.config import settings
import json


class ContentGeneratorService:
    """Service for generating AI content for social media platforms."""
    
    def __init__(self):
        self.openrouter_url = "https://openrouter.ai/api/v1/chat/completions"
        self.openai_key = settings.OPENAI_API_KEY
        self.anthropic_key = settings.ANTHROPIC_API_KEY
        
    async def generate_platform_captions(self, topic: str, model: str = "google/gemini-2.0-flash-exp:free") -> Dict[str, str]:
        """
        Generate captions for all social media platforms.
        
        Args:
            topic: The content topic
            model: AI model to use
            
        Returns:
            Dictionary with captions for each platform
        """
        prompt = f"""Topic: {topic}

Based on this topic, generate perfect and platform-specific captions for social media. 
Don't use (*) star symbols in the output.

Generate:
1. Facebook Caption - Engaging caption with proper hashtags (can be longer, storytelling)
2. Instagram Caption - Visual-focused caption with relevant hashtags and emojis
3. LinkedIn Caption - Professional caption with industry hashtags
4. Pinterest Caption - Descriptive caption with searchable hashtags
5. X Tweet - Concise tweet under 280 characters with trending hashtags
6. Threads Caption - Conversational thread under 500 characters

Format as JSON with keys: facebook_caption, instagram_caption, linkedin_caption, pinterest_caption, x_tweet, threads_caption"""

        async with httpx.AsyncClient(timeout=60.0) as client:
            headers = {
                "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "model": model,
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "response_format": {"type": "json_object"}
            }
            
            response = await client.post(
                self.openrouter_url,
                headers=headers,
                json=payload
            )
            response.raise_for_status()
            
            result = response.json()
            content = result["choices"][0]["message"]["content"]
            
            # Parse JSON response
            captions = json.loads(content)
            
            return {
                "facebook": captions.get("facebook_caption", ""),
                "instagram": captions.get("instagram_caption", ""),
                "linkedin": captions.get("linkedin_caption", ""),
                "pinterest": captions.get("pinterest_caption", ""),
                "twitter": captions.get("x_tweet", ""),
                "threads": captions.get("threads_caption", "")
            }
    
    async def generate_image_prompt(self, topic: str, model: str = "google/gemini-2.0-flash-exp:free") -> str:
        """
        Generate an optimized image prompt for image generation.
        
        Args:
            topic: The content topic
            model: AI model to use
            
        Returns:
            Optimized image generation prompt
        """
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
            headers = {
                "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "model": model,
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            }
            
            response = await client.post(
                self.openrouter_url,
                headers=headers,
                json=payload
            )
            response.raise_for_status()
            
            result = response.json()
            image_prompt = result["choices"][0]["message"]["content"]
            
            return image_prompt.strip()
    
    async def generate_image_from_prompt(
        self, 
        prompt: str, 
        model: str = "google/gemini-2.5-flash-image-preview"
    ) -> Optional[str]:
        """
        Generate an image using AI from a text prompt.
        
        Args:
            prompt: Image generation prompt
            model: AI model to use for image generation
            
        Returns:
            Base64 encoded image data URL or None
        """
        async with httpx.AsyncClient(timeout=120.0) as client:
            headers = {
                "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "model": model,
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": prompt
                            }
                        ]
                    }
                ]
            }
            
            try:
                response = await client.post(
                    self.openrouter_url,
                    headers=headers,
                    json=payload
                )
                response.raise_for_status()
                
                result = response.json()
                
                # Extract image URL from response
                if "choices" in result and len(result["choices"]) > 0:
                    message = result["choices"][0].get("message", {})
                    images = message.get("images", [])
                    
                    if images and len(images) > 0:
                        image_url = images[0].get("image_url", {}).get("url", "")
                        return image_url
                
                return None
                
            except Exception as e:
                print(f"Error generating image: {str(e)}")
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
            "image_base64": image_data.split(',')[1] if image_data and ',' in image_data else None,
            "image_mime": image_data.split(';')[0].split(':')[1] if image_data and ';' in image_data else None
        }