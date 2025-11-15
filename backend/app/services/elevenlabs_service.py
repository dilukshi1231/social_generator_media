# backend/app/services/elevenlabs_service.py
import httpx
import base64
import asyncio
from typing import Dict, Optional
from app.core.config import settings
import re


class ElevenLabsService:
    """Service for generating audio using ElevenLabs API."""

    def __init__(self):
        self.api_key = settings.ELEVENLABS_API_KEY
        self.base_url = "https://api.elevenlabs.io/v1"
        
        if not self.api_key or self.api_key.strip() == "":
            print("⚠️  WARNING: ELEVENLABS_API_KEY is not configured!")
        else:
            print(f"✅ ElevenLabs API Key loaded: {self.api_key[:10]}...")
        
        self._last_request_time = 0
        self._min_delay_seconds = 1
        
    async def _wait_for_rate_limit(self):
        """Ensure we don't make requests too quickly."""
        import time
        current_time = time.time()
        time_since_last = current_time - self._last_request_time
        
        if time_since_last < self._min_delay_seconds:
            wait_time = self._min_delay_seconds - time_since_last
            await asyncio.sleep(wait_time)
        
        self._last_request_time = time.time()
        
    async def generate_audio(
        self,
        text: str,
        voice_id: str = "21m00Tcm4TlvDq8ikWAM",
        model_id: str = "eleven_turbo_v2_5",  # ✅ FIXED: Using current model
        stability: float = 0.5,
        similarity_boost: float = 0.75,
    ) -> Dict:
        """
        Generate audio from text using ElevenLabs.
        
        Args:
            text: Text to convert to speech
            voice_id: ElevenLabs voice ID (default: Rachel)
            model_id: Model to use (eleven_turbo_v2_5 recommended)
            stability: Voice stability (0-1)
            similarity_boost: Voice similarity boost (0-1)

        Returns:
            Dictionary with audio data and metadata
        """
        
        if not self.api_key or self.api_key.strip() == "":
            return {
                "success": False,
                "error": "ELEVENLABS_API_KEY is not configured. Add it to your .env file."
            }
        
        # Truncate text to ~30 seconds (450 chars ≈ 30 seconds at 150 words/min)
        MAX_CHARS = 450
        original_length = len(text)
        if len(text) > MAX_CHARS:
            text = text[:MAX_CHARS].rsplit(' ', 1)[0] + "..."
            print(f"⚠️  Text truncated: {original_length} → {len(text)} chars")
        
        await self._wait_for_rate_limit()
        
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
        
        print(f"[ElevenLabs] 🎙️  Generating audio...")
        print(f"[ElevenLabs] Text length: {len(text)} chars")
        print(f"[ElevenLabs] Voice ID: {voice_id}")
        print(f"[ElevenLabs] Model: {model_id}")
        print(f"[ElevenLabs] API Key: {self.api_key[:10]}... (first 10 chars)")
        print(f"[ElevenLabs] Headers: {list(headers.keys())}")

        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                response = await client.post(
                    f"{self.base_url}/text-to-speech/{voice_id}",
                    headers=headers,
                    json=data
                )
                
                print(f"[ElevenLabs] Response status: {response.status_code}")
                
                # Better error handling
                if response.status_code == 401:
                    error_text = response.text
                    print(f"[ElevenLabs] ❌ 401 Authentication Error: {error_text}")
                    return {
                        "success": False,
                        "error": f"Authentication failed. Check ELEVENLABS_API_KEY: {error_text}"
                    }
                
                if response.status_code == 404:
                    error_text = response.text
                    print(f"[ElevenLabs] ❌ 404 Not Found: {error_text}")
                    return {
                        "success": False,
                        "error": f"Voice ID '{voice_id}' not found. Try using a default voice or check available voices at elevenlabs.io"
                    }
                
                response.raise_for_status()

                audio_bytes = response.content
                audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')

                print(f"[ElevenLabs] ✅ Audio generated: {len(audio_bytes)} bytes")

                return {
                    "success": True,
                    "audio_base64": audio_base64,
                    "audio_data_url": f"data:audio/mpeg;base64,{audio_base64}",
                    "size_bytes": len(audio_bytes),
                    "voice_id": voice_id,
                    "model_id": model_id,
                    "text_length": len(text)
                }

            except httpx.HTTPStatusError as e:
                error_msg = f"ElevenLabs API error: {e.response.status_code} - {e.response.text}"
                print(f"[ElevenLabs] ❌ {error_msg}")
                return {
                    "success": False,
                    "error": error_msg
                }
            except Exception as e:
                error_msg = f"Unexpected error: {str(e)}"
                print(f"[ElevenLabs] ❌ {error_msg}")
                return {
                    "success": False,
                    "error": error_msg
                }

    async def get_voices(self) -> Dict:
        """Get list of available voices from ElevenLabs."""
        
        if not self.api_key or self.api_key.strip() == "":
            return {
                "success": False,
                "error": "ELEVENLABS_API_KEY is not configured"
            }

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
        max_chars: int = 450,
        voice_id: str = "21m00Tcm4TlvDq8ikWAM"
    ) -> Dict:
        """Generate audio from social media caption."""
        clean_text = self._clean_caption(caption)
        
        if len(clean_text) > max_chars:
            clean_text = clean_text[:max_chars].rsplit('.', 1)[0] + "."
            print(f"[ElevenLabs] Caption truncated to {len(clean_text)} chars")

        if not clean_text.strip():
            return {
                "success": False,
                "error": "No text to convert after cleaning"
            }

        return await self.generate_audio(text=clean_text, voice_id=voice_id)

    def _clean_caption(self, caption: str) -> str:
        """Clean caption for TTS."""
        clean_text = caption
        clean_text = re.sub(r'#\w+', '', clean_text)
        clean_text = re.sub(r'@\w+', '', clean_text)
        clean_text = re.sub(
            r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+',
            '',
            clean_text
        )
        clean_text = re.sub(r'[^\w\s\.,!?\-\'"()]', ' ', clean_text)
        clean_text = ' '.join(clean_text.split())
        return clean_text.strip()