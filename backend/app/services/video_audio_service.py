# backend/app/services/video_audio_service.py
import httpx
import base64
import tempfile
import os
from pathlib import Path
from typing import Dict, List
from app.core.config import settings
from app.services.free_tts_service import FreeTTSService, VOICE_PRESETS


class VideoAudioService:
    """
    Service for video analysis and audio generation.
    
    Process:
    1. Download Pexels video temporarily
    2. Extract key frames from video (screenshots)
    3. Send frames to Gemini Vision API for analysis
    4. Gemini describes what it SEES in the video
    5. Generate audio narration from the description
    """
    
    def __init__(self):
        self.gemini_key = settings.GEMINI_API_KEY
        self.gemini_url = "https://generativelanguage.googleapis.com/v1beta/models"
        self.tts_service = FreeTTSService()
    
    async def download_video_temporarily(self, video_url: str, video_id: int) -> str:
        """Download video from Pexels to temporary file."""
        print(f"[Download] Downloading video from: {video_url}")
        
        temp_dir = Path(tempfile.gettempdir()) / "video_analysis"
        temp_dir.mkdir(exist_ok=True)
        
        video_path = temp_dir / f"video_{video_id}_{os.getpid()}.mp4"
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.get(video_url)
            response.raise_for_status()
            
            with open(video_path, 'wb') as f:
                f.write(response.content)
        
        print(f"[Download] Video saved to: {video_path}")
        return str(video_path)
    
    async def extract_video_frames(self, video_path: str, num_frames: int = 5) -> List[str]:
        """
        Extract evenly spaced frames from video as base64 images.
        These frames will be sent to Gemini Vision API for analysis.
        """
        print(f"[Frame Extraction] Extracting {num_frames} frames from video")
        
        try:
            import cv2
        except ImportError:
            raise ValueError(
                "opencv-python is required for video analysis. "
                "Install with: pip install opencv-python"
            )
        
        frames = []
        cap = cv2.VideoCapture(video_path)
        
        if not cap.isOpened():
            raise ValueError(f"Failed to open video file: {video_path}")
        
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        if total_frames == 0:
            cap.release()
            raise ValueError("Video has no frames")
        
        frame_interval = max(1, total_frames // num_frames)
        frame_indices = [i * frame_interval for i in range(num_frames)]
        
        print(f"[Frame Extraction] Total frames: {total_frames}, Interval: {frame_interval}")
        
        for idx in frame_indices:
            cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
            ret, frame = cap.read()
            
            if ret:
                # Resize frame to reduce size (max 1024px width)
                height, width = frame.shape[:2]
                if width > 1024:
                    scale = 1024 / width
                    new_width = 1024
                    new_height = int(height * scale)
                    frame = cv2.resize(frame, (new_width, new_height))
                
                # Convert to JPEG with good quality
                _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
                frame_base64 = base64.b64encode(buffer).decode('utf-8')
                frames.append(frame_base64)
                print(f"[Frame Extraction] Extracted frame {len(frames)}/{num_frames}")
        
        cap.release()
        print(f"[Frame Extraction] Extraction complete: {len(frames)} frames")
        
        if len(frames) == 0:
            raise ValueError("Failed to extract any frames from video")
        
        return frames
    
    async def analyze_frames_with_gemini(self, frames: List[str], duration: float) -> str:
        """
        🎯 THIS IS WHERE THE MAGIC HAPPENS!
        
        Gemini Vision API LOOKS AT the video frames and creates a narration script.
        
        Input: List of base64-encoded video frames (JPEG images)
        Output: Narration text describing what Gemini SAW in the frames
        """
        print(f"[Gemini Analysis] Analyzing {len(frames)} frames")
        
        if not self.gemini_key or self.gemini_key.strip() == "":
            raise ValueError(
                "GEMINI_API_KEY is not configured. "
                "Get a FREE API key from: https://aistudio.google.com/app/apikey"
            )
        
        # Enhanced prompt for better narration
        prompt = f"""You are a professional video narrator creating voiceover narration for a {duration:.1f}-second video.

Analyze these {len(frames)} frames from the video and create a compelling narration script that:

1. **Describes what's happening chronologically** as the video unfolds
2. **Uses vivid, descriptive language** that paints a picture for listeners
3. **Maintains a natural, conversational flow** - as if you're narrating a documentary
4. **Includes smooth transitions** between different moments in the video
5. **Focuses on visual elements**: actions, people, objects, settings, colors, movements
6. **Creates atmosphere and mood** through your word choices
7. **Is approximately 30-60 seconds of spoken narration** (around 100-200 words)
8. **Starts directly with the narration** - no preamble or introduction

CRITICAL RULES:
- Write ONLY the narration script - no explanations, no meta-commentary
- Use present tense ("we see", "there is", "the scene shows")
- Be specific about what's visible in the frames
- Don't speculate about things not shown
- Don't use hashtags, emojis, or social media language
- Don't mention "frame 1", "frame 2", etc.
- Create a single flowing narrative, not bullet points

Example style:
"As the camera pans across the landscape, golden sunlight filters through tall trees, casting dappled shadows on the forest floor. In the distance, a figure emerges, moving gracefully through the undergrowth. The scene transitions to a wider view, revealing..."

Begin your narration:"""

        # 🎯 PREPARE CONTENT WITH VIDEO FRAMES
        content_parts = [{"text": prompt}]
        
        # Add each frame as an image for Gemini to analyze
        for i, frame_base64 in enumerate(frames):
            content_parts.append({
                "inline_data": {
                    "mime_type": "image/jpeg",
                    "data": frame_base64  # ← ACTUAL VIDEO FRAME
                }
            })
            print(f"[Gemini Analysis] Added frame {i+1}/{len(frames)} for analysis")
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            url = f"{self.gemini_url}/gemini-2.0-flash-exp:generateContent?key={self.gemini_key}"
            
            payload = {
                "contents": [{
                    "parts": content_parts  # ← Text prompt + Video frames
                }],
                "generationConfig": {
                    "temperature": 0.8,  # More creative
                    "maxOutputTokens": 600,
                    "topP": 0.95,
                    "topK": 40
                }
            }
            
            print(f"[Gemini Analysis] Sending request to Gemini API with {len(frames)} frames...")
            
            try:
                response = await client.post(url, json=payload)
                response.raise_for_status()
            except httpx.HTTPStatusError as e:
                print(f"[Gemini Analysis] HTTP Error: {e.response.status_code}")
                print(f"[Gemini Analysis] Response: {e.response.text}")
                if e.response.status_code == 400:
                    raise ValueError(
                        "Invalid Gemini API request. Check your API key and frame sizes. "
                        f"Error: {e.response.text}"
                    )
                elif e.response.status_code == 429:
                    raise ValueError(
                        "Gemini API rate limit exceeded. Please try again in a few seconds."
                    )
                else:
                    raise ValueError(f"Gemini API error: {e.response.text}")
            
            result = response.json()
            
            # Extract description from Gemini's response
            try:
                candidates = result.get("candidates", [])
                if not candidates:
                    print(f"[Gemini Analysis] Full response: {result}")
                    raise ValueError("No candidates in Gemini response")
                
                content_obj = candidates[0].get("content", {})
                parts = content_obj.get("parts", [])
                
                if not parts:
                    print(f"[Gemini Analysis] Candidate: {candidates[0]}")
                    raise ValueError("No parts in Gemini response")
                
                description = parts[0].get("text", "")
                
                if not description:
                    raise ValueError("No text content in Gemini response")
                
                print(f"[Gemini Analysis] ✅ Analysis complete: {len(description)} characters")
                print(f"[Gemini Analysis] Preview: {description[:100]}...")
                return description.strip()
                
            except (KeyError, IndexError) as e:
                print(f"[Gemini Analysis] Parse error: {str(e)}")
                print(f"[Gemini Analysis] Full response: {result}")
                raise ValueError(f"Failed to parse Gemini response: {str(e)}")
    
    async def generate_audio_from_text(
        self,
        text: str,
        voice: str = "en-US-AriaNeural"
    ) -> Dict:
        """
        Generate audio narration using FREE Edge TTS.
        
        Args:
            text: Narration script (from Gemini analysis)
            voice: Voice preset or voice ID
        
        Returns:
            Audio data dictionary
        """
        print(f"[Audio Generation] Generating audio for {len(text)} characters")
        
        # Map voice preset to actual voice ID
        if voice in VOICE_PRESETS:
            voice_id = VOICE_PRESETS[voice]
            print(f"[Audio Generation] Using preset '{voice}' → {voice_id}")
        else:
            voice_id = voice
        
        result = await self.tts_service.generate_audio(
            text=text,
            voice=voice_id
        )
        
        if not result.get("success"):
            raise ValueError(result.get("error", "Failed to generate audio"))
        
        return result
    
    async def analyze_video_and_generate_narration(
        self,
        video_url: str,
        video_id: int,
        duration: float,
        voice_id: str = "default"  # Can use presets: "default", "professional", "friendly", etc.
    ) -> Dict:
        """
        🎬 COMPLETE WORKFLOW: Video Analysis + Audio Generation
        
        This is the main function that:
        1. Downloads Pexels video
        2. Extracts frames (screenshots)
        3. Sends frames to Gemini Vision (Gemini SEES the video)
        4. Gemini writes a narration script
        5. Converts script to audio
        
        Returns: Description text + Audio file
        """
        video_path = None
        
        try:
            print(f"\n{'='*60}")
            print(f"🎬 STARTING VIDEO ANALYSIS + NARRATION")
            print(f"Video ID: {video_id}")
            print(f"Duration: {duration}s")
            print(f"Voice: {voice_id}")
            print(f"{'='*60}\n")
            
            # Step 1: Download video
            print("📥 STEP 1: Downloading video...")
            video_path = await self.download_video_temporarily(video_url, video_id)
            
            # Step 2: Extract frames
            print("\n📸 STEP 2: Extracting video frames...")
            frames = await self.extract_video_frames(video_path, num_frames=5)
            
            # Step 3: 🎯 Analyze with Gemini Vision (AI SEES the video)
            print("\n🤖 STEP 3: Gemini analyzing video content...")
            print("   → Gemini is LOOKING AT the video frames...")
            description = await self.analyze_frames_with_gemini(frames, duration)
            print(f"   ✅ Gemini's narration: {len(description)} chars")
            
            # Step 4: Generate audio from description
            print("\n🔊 STEP 4: Generating audio narration...")
            audio_result = await self.generate_audio_from_text(description, voice_id)
            print(f"   ✅ Audio generated: {audio_result['size_bytes']} bytes")
            
            print(f"\n{'='*60}")
            print("✅ VIDEO ANALYSIS + NARRATION COMPLETE!")
            print(f"{'='*60}\n")
            
            return {
                "success": True,
                "description": description,  # What Gemini saw
                "audio_base64": audio_result["audio_base64"],
                "audio_data_url": audio_result["audio_data_url"],
                "size_bytes": audio_result["size_bytes"],
                "voice": voice_id,
                "frames_analyzed": len(frames),
                "duration": duration,
                "duration_estimate": audio_result.get("duration_estimate", 0)
            }
            
        finally:
            # Cleanup temporary video file
            if video_path and os.path.exists(video_path):
                try:
                    os.remove(video_path)
                    print(f"[Cleanup] ✅ Removed temp video: {video_path}")
                except Exception as e:
                    print(f"[Cleanup] ⚠️  Failed to remove temp file: {str(e)}")