import httpx
from typing import Dict, Optional
from app.core.config import settings
import base64


class ElevenLabsService:
    """Service for generating audio using ElevenLabs API."""

    def __init__(self):
        self.api_key = settings.ELEVENLABS_API_KEY
        self.base_url = "https://api.elevenlabs.io/v1"
        
    async def generate_audio(
        self,
        text: str,
        voice_id: str = "21m00Tcm4TlvDq8ikWAM",  # Default voice (Rachel)
        model_id: str = "eleven_monolingual_v1",
        stability: float = 0.5,
        similarity_boost: float = 0.75,
    ) -> Dict:
        """
        Generate audio from text using ElevenLabs.

        Args:
            text: Text to convert to speech
            voice_id: ElevenLabs voice ID
            model_id: Model to use for generation
            stability: Voice stability (0-1)
            similarity_boost: Voice similarity boost (0-1)

        Returns:
            Dictionary with audio data and metadata
        """
        if not self.api_key or self.api_key.strip() == "":
            raise ValueError(
                "ELEVENLABS_API_KEY is not configured. Please add your ElevenLabs API key to the .env file."
            )

        headers = {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": self.api_key
        }

        data = {
            "text": text,
            "model_id": model_id,
            "voice_settings": {
                "stability": stability,
                "similarity_boost": similarity_boost
            }
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                response = await client.post(
                    f"{self.base_url}/text-to-speech/{voice_id}",
                    headers=headers,
                    json=data
                )
                response.raise_for_status()

                # Convert audio bytes to base64
                audio_bytes = response.content
                audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')

                return {
                    "success": True,
                    "audio_base64": audio_base64,
                    "audio_data_url": f"data:audio/mpeg;base64,{audio_base64}",
                    "size_bytes": len(audio_bytes),
                    "voice_id": voice_id,
                    "model_id": model_id
                }

            except httpx.HTTPError as e:
                return {
                    "success": False,
                    "error": f"ElevenLabs API error: {str(e)}"
                }
            except Exception as e:
                return {
                    "success": False,
                    "error": f"Unexpected error: {str(e)}"
                }

    async def get_voices(self) -> Dict:
        """
        Get list of available voices from ElevenLabs.

        Returns:
            Dictionary with available voices
        """
        if not self.api_key or self.api_key.strip() == "":
            raise ValueError("ELEVENLABS_API_KEY is not configured")

        headers = {
            "Accept": "application/json",
            "xi-api-key": self.api_key
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.get(
                    f"{self.base_url}/voices",
                    headers=headers
                )
                response.raise_for_status()
                data = response.json()

                voices = []
                for voice in data.get("voices", []):
                    voices.append({
                        "voice_id": voice.get("voice_id"),
                        "name": voice.get("name"),
                        "category": voice.get("category"),
                        "description": voice.get("description"),
                        "labels": voice.get("labels", {}),
                    })

                return {
                    "success": True,
                    "voices": voices
                }

            except httpx.HTTPError as e:
                return {
                    "success": False,
                    "error": f"ElevenLabs API error: {str(e)}"
                }
            except Exception as e:
                return {
                    "success": False,
                    "error": f"Unexpected error: {str(e)}"
                }

    async def generate_audio_for_caption(
        self,
        caption: str,
        max_chars: int = 5000,
        voice_id: str = "21m00Tcm4TlvDq8ikWAM"
    ) -> Dict:
        """
        Generate audio from a social media caption.
        Automatically truncates if caption is too long.

        Args:
            caption: Social media caption text
            max_chars: Maximum characters to process
            voice_id: ElevenLabs voice ID

        Returns:
            Dictionary with audio data
        """
        # Remove hashtags and mentions for cleaner audio
        clean_text = caption
        
        # Remove hashtags
        import re
        clean_text = re.sub(r'#\w+', '', clean_text)
        
        # Remove mentions
        clean_text = re.sub(r'@\w+', '', clean_text)
        
        # Remove URLs
        clean_text = re.sub(r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+', '', clean_text)
        
        # Clean up extra whitespace
        clean_text = ' '.join(clean_text.split())
        
        # Truncate if needed
        if len(clean_text) > max_chars:
            clean_text = clean_text[:max_chars] + "..."

        if not clean_text.strip():
            return {
                "success": False,
                "error": "No text to convert after cleaning"
            }

        return await self.generate_audio(text=clean_text, voice_id=voice_id)