# backend/app/services/free_tts_service.py
import edge_tts
import base64
import os
import re
from pathlib import Path
from typing import Dict, List, Optional
import asyncio


class FreeTTSService:
    """
    Free Text-to-Speech service using Microsoft Edge TTS.
    No API key required, unlimited usage, high-quality neural voices.
    """

    def __init__(self):
        self.temp_dir = Path("/tmp/audio_generation")
        self.temp_dir.mkdir(exist_ok=True)

    async def generate_audio(
        self,
        text: str,
        voice: str = "en-US-AriaNeural",
        rate: str = "+0%",
        volume: str = "+0%",
        pitch: str = "+0Hz"
    ) -> Dict:
        """
        Generate audio from text using Edge TTS.

        Args:
            text: Text to convert to speech
            voice: Voice ID (default: en-US-AriaNeural)
            rate: Speech rate adjustment (e.g., "+10%", "-10%")
            volume: Volume adjustment
            pitch: Pitch adjustment

        Returns:
            Dictionary with audio data and metadata
        """
        try:
            print(f"[Free TTS] Generating audio for {len(text)} characters")
            print(f"[Free TTS] Using voice: {voice}")

            # Generate unique filename
            temp_file = self.temp_dir / f"audio_{hash(text)}_{os.getpid()}.mp3"

            # Create TTS communicate object
            communicate = edge_tts.Communicate(
                text=text,
                voice=voice,
                rate=rate,
                volume=volume,
                pitch=pitch
            )

            # Generate and save audio
            await communicate.save(str(temp_file))

            # Read audio file
            with open(temp_file, 'rb') as f:
                audio_bytes = f.read()

            # Encode to base64
            audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')

            # Cleanup
            try:
                os.remove(temp_file)
            except:
                pass

            print(f"[Free TTS] Audio generated successfully: {len(audio_bytes)} bytes")

            return {
                "success": True,
                "audio_base64": audio_base64,
                "audio_data_url": f"data:audio/mpeg;base64,{audio_base64}",
                "size_bytes": len(audio_bytes),
                "voice": voice,
                "duration_estimate": len(text) / 14,  # Rough estimate: 14 chars per second
            }

        except Exception as e:
            print(f"[Free TTS] Error: {str(e)}")
            return {
                "success": False,
                "error": f"Audio generation failed: {str(e)}"
            }

    async def get_available_voices(self, language: str = "en") -> List[Dict]:
        """
        Get list of available voices for a specific language.

        Args:
            language: Language code (e.g., "en", "es", "fr")

        Returns:
            List of voice dictionaries
        """
        try:
            all_voices = await edge_tts.list_voices()
            
            filtered_voices = []
            for voice in all_voices:
                if voice["Locale"].startswith(language):
                    filtered_voices.append({
                        "voice_id": voice["ShortName"],
                        "name": voice["FriendlyName"],
                        "gender": voice["Gender"],
                        "locale": voice["Locale"],
                        "suggested_codec": voice.get("SuggestedCodec", "audio-24khz-48kbitrate-mono-mp3"),
                    })
            
            return filtered_voices

        except Exception as e:
            print(f"[Free TTS] Error fetching voices: {str(e)}")
            return []

    async def generate_audio_for_caption(
        self,
        caption: str,
        max_chars: int = 5000,
        voice: str = "en-US-AriaNeural"
    ) -> Dict:
        """
        Generate audio from a social media caption.
        Automatically cleans and processes the caption.

        Args:
            caption: Social media caption text
            max_chars: Maximum characters to process
            voice: Voice ID

        Returns:
            Dictionary with audio data
        """
        # Clean caption
        clean_text = self._clean_caption(caption)

        # Truncate if needed
        if len(clean_text) > max_chars:
            clean_text = clean_text[:max_chars] + "..."

        if not clean_text.strip():
            return {
                "success": False,
                "error": "No text to convert after cleaning"
            }

        return await self.generate_audio(text=clean_text, voice=voice)

    def _clean_caption(self, caption: str) -> str:
        """Clean caption for TTS (remove hashtags, mentions, URLs)."""
        clean_text = caption

        # Remove hashtags
        clean_text = re.sub(r'#\w+', '', clean_text)

        # Remove mentions
        clean_text = re.sub(r'@\w+', '', clean_text)

        # Remove URLs
        clean_text = re.sub(
            r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+',
            '',
            clean_text
        )

        # Remove emojis (optional)
        clean_text = re.sub(r'[^\w\s\.,!?\-\'"()]', '', clean_text)

        # Clean up extra whitespace
        clean_text = ' '.join(clean_text.split())

        return clean_text.strip()


# Predefined voice presets
VOICE_PRESETS = {
    "default": "en-US-AriaNeural",
    "professional": "en-US-GuyNeural",
    "friendly": "en-US-JennyNeural",
    "energetic": "en-US-DavisNeural",
    "calm": "en-US-SaraNeural",
    "british": "en-GB-SoniaNeural",
    "australian": "en-AU-NatashaNeural",
}


# Example usage function
async def test_free_tts():
    """Test the free TTS service."""
    service = FreeTTSService()

    # Test text
    text = """
    Welcome to our video! Today we're exploring the beautiful mountains,
    where nature's grandeur unfolds before our eyes. Watch as the sun
    sets over the peaks, painting the sky in shades of gold and crimson.
    """

    # Generate audio
    result = await service.generate_audio(
        text=text,
        voice="en-US-AriaNeural"
    )

    if result["success"]:
        print(f"✅ Audio generated: {result['size_bytes']} bytes")
        print(f"📊 Estimated duration: {result['duration_estimate']:.1f} seconds")
    else:
        print(f"❌ Error: {result['error']}")


if __name__ == "__main__":
    asyncio.run(test_free_tts())