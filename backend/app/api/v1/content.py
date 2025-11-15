from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import List, Optional
from datetime import datetime
import httpx
import base64
import tempfile
import os
from pathlib import Path
from app.services.video_audio_service import VideoAudioService
from app.database import get_db
from app.models.user import User
from app.models.content import Content, ContentStatus
from app.services.elevenlabs_service import ElevenLabsService
from app.api.v1.auth import get_current_user
from app.services.content_generator import ContentGeneratorService
from pydantic import BaseModel
from app.services.pexels_service import PexelsService
from app.services.keyword_extractor import KeywordExtractorService
from app.core.config import settings
from typing import List
import subprocess
import json
from pathlib import Path
import uuid
import asyncio

router = APIRouter()


# ============================================================================
# SCHEMAS
# ============================================================================


class VideoSearchRequest(BaseModel):
    prompt: str
    per_page: int = 5


class VideoSearchResponse(BaseModel):
    success: bool
    query: str
    total_results: int
    videos: List[dict]

class VideoMergeRequest(BaseModel):
    videos: List[dict]  # Each video has: id, video_url, duration, width, height
class VideoMergeResponse(BaseModel):
    success: bool
    merged_video_url: Optional[str] = None
    file_path: Optional[str] = None
    duration: Optional[float] = None
    error: Optional[str] = None
class AudioGenerateRequest(BaseModel):
    text: str
    voice_id: Optional[str] = "21m00Tcm4TlvDq8ikWAM"


class AudioGenerateResponse(BaseModel):
    success: bool
    audio_base64: Optional[str] = None
    audio_data_url: Optional[str] = None
    size_bytes: Optional[int] = None
    voice_id: Optional[str] = None
    error: Optional[str] = None


class VoicesResponse(BaseModel):
    success: bool
    voices: Optional[List[dict]] = None
    error: Optional[str] = None


class VideoAnalyzeRequest(BaseModel):
    video_url: str
    video_id: int
    duration: float


class VideoAnalyzeResponse(BaseModel):
    success: bool
    description: str
    video_id: int
    analysis_details: Optional[dict] = None
    error: Optional[str] = None


class ContentGenerateRequest(BaseModel):
    topic: str
    auto_approve: bool = False


class ContentResponse(BaseModel):
    id: int
    topic: str
    facebook_caption: Optional[str]
    instagram_caption: Optional[str]
    linkedin_caption: Optional[str]
    pinterest_caption: Optional[str]
    twitter_caption: Optional[str]
    threads_caption: Optional[str]
    image_prompt: Optional[str]
    image_caption: Optional[str]
    image_url: Optional[str]
    extra_data: Optional[dict]
    status: ContentStatus
    created_at: datetime

    class Config:
        from_attributes = True


class ContentApprovalRequest(BaseModel):
    approved: bool
    feedback: Optional[str] = None


@router.post(
    "/generate", response_model=ContentResponse, status_code=status.HTTP_201_CREATED
)
class ContentCreateRequest(BaseModel):
    topic: str
    facebook_caption: Optional[str] = None
    instagram_caption: Optional[str] = None
    linkedin_caption: Optional[str] = None
    pinterest_caption: Optional[str] = None
    twitter_caption: Optional[str] = None
    threads_caption: Optional[str] = None
    image_prompt: Optional[str] = None
    image_url: Optional[str] = None
    auto_approve: bool = False


class ImageGenerateRequest(BaseModel):
    prompt: str


class ImageGenerateResponse(BaseModel):
    image_url: str
    file_path: str


# ============================================================================
# VIDEO SEARCH
# ============================================================================


@router.post("/search-videos", response_model=VideoSearchResponse)
async def search_videos(
    request: VideoSearchRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Search for videos on Pexels based on the prompt.
    Automatically extracts 3-4 keywords from detailed prompts.
    """
    print(f"[VIDEO SEARCH] User: {current_user.email}")
    print(f"[VIDEO SEARCH] Original prompt: {request.prompt}")
    print(f"[VIDEO SEARCH] Per page: {request.per_page}")

    try:
        # Step 1: Extract keywords from the prompt
        keyword_extractor = KeywordExtractorService()
        search_keywords = await keyword_extractor.extract_keywords(
            prompt=request.prompt, max_keywords=4
        )

        print(f"[VIDEO SEARCH] Extracted keywords: {search_keywords}")

        # Step 2: Search Pexels with the extracted keywords
        pexels = PexelsService()
        result = await pexels.search_videos(
            query=search_keywords, per_page=request.per_page
        )

        print(f"[VIDEO SEARCH] Result success: {result.get('success')}")
        print(f"[VIDEO SEARCH] Videos found: {len(result.get('videos', []))}")

        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("error", "Failed to search videos"),
            )

        return VideoSearchResponse(
            success=True,
            query=search_keywords,
            total_results=result["total_results"],
            videos=result["videos"],
        )

    except ValueError as e:
        print(f"[VIDEO SEARCH] ValueError: {str(e)}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        print(f"[VIDEO SEARCH] Exception: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to search videos: {str(e)}",
        )


# ============================================================================
# VIDEO ANALYSIS (Using Free Gemini Vision)
# ============================================================================


@router.post("/analyze-video", response_model=VideoAnalyzeResponse)
async def analyze_video(
    request: VideoAnalyzeRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Analyze video content using FREE Google Gemini Vision API.
    Downloads video, extracts key frames, analyzes them, and generates description.
    """
    try:
        print(f"[Video Analysis] Starting analysis for video {request.video_id}")
        print(f"[Video Analysis] Video URL: {request.video_url}")
        print(f"[Video Analysis] Duration: {request.duration}s")

        # Step 1: Download video temporarily
        video_path = await download_video_temporarily(
            request.video_url, request.video_id
        )

        # Step 2: Extract key frames from video
        frames = await extract_video_frames(video_path, num_frames=5)

        # Step 3: Analyze frames with Gemini Vision (FREE)
        description = await analyze_frames_with_gemini(frames, request.duration)

        # Step 4: Cleanup
        cleanup_temp_files(video_path, frames)

        print(f"[Video Analysis] Analysis complete!")
        print(f"[Video Analysis] Description length: {len(description)} chars")

        return VideoAnalyzeResponse(
            success=True,
            description=description,
            video_id=request.video_id,
            analysis_details={
                "frames_analyzed": len(frames),
                "duration": request.duration,
            },
        )

    except Exception as e:
        print(f"[Video Analysis] Error: {str(e)}")
        import traceback

        traceback.print_exc()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze video: {str(e)}",
        )


async def download_video_temporarily(video_url: str, video_id: int) -> str:
    """Download video to temporary file."""
    print(f"[Download] Downloading video from: {video_url}")

    temp_dir = Path(tempfile.gettempdir()) / "video_analysis"
    temp_dir.mkdir(exist_ok=True)

    video_path = temp_dir / f"video_{video_id}_{os.getpid()}.mp4"

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.get(video_url)
        response.raise_for_status()

        with open(video_path, "wb") as f:
            f.write(response.content)

    print(f"[Download] Video saved to: {video_path}")
    return str(video_path)


async def extract_video_frames(video_path: str, num_frames: int = 5) -> list[str]:
    """Extract evenly spaced frames from video as base64 images."""
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

    print(
        f"[Frame Extraction] Total frames: {total_frames}, Interval: {frame_interval}"
    )

    frame_indices = [i * frame_interval for i in range(num_frames)]

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
            _, buffer = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
            frame_base64 = base64.b64encode(buffer).decode("utf-8")
            frames.append(frame_base64)
            print(f"[Frame Extraction] Extracted frame {len(frames)}/{num_frames}")

    cap.release()
    print(f"[Frame Extraction] Extraction complete: {len(frames)} frames")

    if len(frames) == 0:
        raise ValueError("Failed to extract any frames from video")

    return frames

@router.post("/merge-videos", response_model=VideoMergeResponse)
async def merge_videos(
    request: VideoMergeRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Merge multiple Pexels videos using Remotion.
    
    Process:
    1. Download videos temporarily
    2. Create Remotion composition config
    3. Render merged video using Remotion
    4. Save and return merged video
    """
    try:
        print(f"[Video Merge] User: {current_user.email}")
        print(f"[Video Merge] Merging {len(request.videos)} videos")
        
        if len(request.videos) < 2:
            raise ValueError("At least 2 videos are required for merging")
        
        if len(request.videos) > 3:
            raise ValueError("Maximum 3 videos can be merged at once")
        
        # Create temp directories
        temp_dir = Path(tempfile.gettempdir()) / "video_merge" / str(uuid.uuid4())
        temp_dir.mkdir(parents=True, exist_ok=True)
        
        downloads_dir = temp_dir / "downloads"
        downloads_dir.mkdir(exist_ok=True)
        
        output_dir = Path("uploads/videos")
        output_dir.mkdir(parents=True, exist_ok=True)
        
        print(f"[Video Merge] Temp directory: {temp_dir}")
        
        # Step 1: Download all videos
        downloaded_videos = []
        total_duration = 0
        
        for idx, video in enumerate(request.videos):
            print(f"[Video Merge] Downloading video {idx + 1}/{len(request.videos)}")
            
            video_path = downloads_dir / f"video_{idx}.mp4"
            
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.get(video["video_url"])
                response.raise_for_status()
                
                with open(video_path, 'wb') as f:
                    f.write(response.content)
            
            downloaded_videos.append({
                "path": str(video_path),
                "duration": video["duration"],
                "width": video["width"],
                "height": video["height"],
            })
            
            total_duration += video["duration"]
            print(f"[Video Merge] Downloaded: {video_path}")
        
        # Step 2: Create Remotion composition config
        composition_config = {
            "videos": downloaded_videos,
            "fps": 30,
            "durationInFrames": int(total_duration * 30),  # 30 fps
            "width": 1080,  # Portrait video width
            "height": 1920,  # Portrait video height
        }
        
        config_path = temp_dir / "composition.json"
        with open(config_path, 'w') as f:
            json.dump(composition_config, f, indent=2)
        
        print(f"[Video Merge] Composition config created: {config_path}")
        
        # Step 3: Render video using Remotion
        output_filename = f"merged_{current_user.id}_{uuid.uuid4().hex[:8]}.mp4"
        output_path = output_dir / output_filename
        
        print(f"[Video Merge] Starting Remotion render...")
        
        # Call Remotion render using Node.js subprocess
        remotion_result = await render_with_remotion(
            composition_config=config_path,
            output_path=output_path,
            temp_dir=temp_dir
        )
        
        if not remotion_result["success"]:
            raise ValueError(remotion_result["error"])
        
        print(f"[Video Merge] Render complete: {output_path}")
        
        # Step 4: Cleanup temp files
        cleanup_temp_directory(temp_dir)
        
        # Return merged video URL
        video_url = f"/uploads/videos/{output_filename}"
        
        return VideoMergeResponse(
            success=True,
            merged_video_url=video_url,
            file_path=str(output_path),
            duration=total_duration,
        )
        
    except ValueError as e:
        print(f"[Video Merge] ValueError: {str(e)}")
        return VideoMergeResponse(
            success=False,
            error=str(e)
        )
    except Exception as e:
        print(f"[Video Merge] Exception: {str(e)}")
        import traceback
        traceback.print_exc()
        return VideoMergeResponse(
            success=False,
            error=f"Failed to merge videos: {str(e)}"
        )


async def render_with_remotion(
    composition_config: Path,
    output_path: Path,
    temp_dir: Path
) -> dict:
    """
    Render video using Remotion via Node.js subprocess.
    
    This calls a separate Node.js script that uses Remotion's rendering API.
    """
    try:
        # Path to the Remotion render script
        render_script = Path("backend/scripts/render_video.js")
        
        if not render_script.exists():
            return {
                "success": False,
                "error": "Remotion render script not found. Please create backend/scripts/render_video.js"
            }
        
        # Call Node.js script
        process = await asyncio.create_subprocess_exec(
            "node",
            str(render_script),
            str(composition_config),
            str(output_path),
            str(temp_dir),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        
        stdout, stderr = await process.communicate()
        
        if process.returncode != 0:
            error_msg = stderr.decode() if stderr else "Unknown render error"
            print(f"[Remotion] Render failed: {error_msg}")
            return {
                "success": False,
                "error": f"Remotion render failed: {error_msg}"
            }
        
        output = stdout.decode() if stdout else ""
        print(f"[Remotion] Render output: {output}")
        
        return {
            "success": True,
            "output": output
        }
        
    except FileNotFoundError:
        return {
            "success": False,
            "error": "Node.js not found. Please install Node.js to use video merging."
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Remotion render error: {str(e)}"
        }


def cleanup_temp_directory(temp_dir: Path):
    """Clean up temporary directory and all files."""
    try:
        import shutil
        if temp_dir.exists():
            shutil.rmtree(temp_dir)
            print(f"[Cleanup] Removed temp directory: {temp_dir}")
    except Exception as e:
        print(f"[Cleanup] Failed to remove temp directory: {str(e)}")


# Also update the main.py to mount videos directory
# In backend/app/main.py, add this after the uploads mount:

# app.mount("/uploads/videos", StaticFiles(directory="uploads/videos"), name="videos")
async def analyze_frames_with_gemini(frames: list[str], duration: float) -> str:
    """
    Analyze video frames using FREE Google Gemini Vision API.
    Gemini 2.0 Flash is completely FREE with high rate limits.
    """
    print(f"[Gemini Analysis] Analyzing {len(frames)} frames")

    if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY.strip() == "":
        raise ValueError(
            "GEMINI_API_KEY is not configured. "
            "Get a FREE API key from: https://aistudio.google.com/app/apikey"
        )

    # Create prompt for video description
    prompt = f"""You are a professional video narrator. Analyze these {len(frames)} frames from a {duration:.1f}-second video and create a detailed, engaging narration script.

Your narration should:
1. Describe what's happening in the video chronologically
2. Mention key visual elements, actions, people, objects, and settings
3. Use descriptive, engaging language suitable for voiceover
4. Be natural and conversational, as if you're narrating for a documentary
5. Include smooth transitions between scenes/moments
6. Be approximately 30-60 seconds of spoken narration (100-200 words)
7. Focus on what viewers can SEE in the video
8. Start directly with the description, no preamble

DO NOT:
- Speculate about things not visible
- Add opinions or judgments
- Use hashtags or social media language
- Mention "frame 1, frame 2" etc.
- Start with "This video shows..." or similar phrases

Create a flowing narrative that describes this video as if you're watching it unfold in real-time."""

    # Prepare content for Gemini
    content_parts = [{"text": prompt}]

    # Add each frame
    for frame_base64 in frames:
        content_parts.append(
            {"inline_data": {"mime_type": "image/jpeg", "data": frame_base64}}
        )

    async with httpx.AsyncClient(timeout=120.0) as client:
        # Using Gemini 2.0 Flash Experimental - FREE with high limits
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key={settings.GEMINI_API_KEY}"

        payload = {
            "contents": [{"parts": content_parts}],
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": 500,
                "topP": 0.95,
                "topK": 40,
            },
        }

        print(f"[Gemini Analysis] Sending request to Gemini API...")

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

        # Extract description
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

            print(f"[Gemini Analysis] Analysis complete: {len(description)} characters")
            return description.strip()

        except (KeyError, IndexError) as e:
            print(f"[Gemini Analysis] Parse error: {str(e)}")
            print(f"[Gemini Analysis] Full response: {result}")
            raise ValueError(f"Failed to parse Gemini response: {str(e)}")


def cleanup_temp_files(video_path: str, frames: list[str]):
    """Clean up temporary video file."""
    try:
        if os.path.exists(video_path):
            os.remove(video_path)
            print(f"[Cleanup] Removed temp video: {video_path}")
    except Exception as e:
        print(f"[Cleanup] Failed to remove temp files: {str(e)}")


# ============================================================================
# AUDIO GENERATION (Using ElevenLabs)
# ============================================================================


@router.post("/generate-audio", response_model=AudioGenerateResponse)
async def generate_audio(
    request: AudioGenerateRequest,
    current_user: User = Depends(get_current_user),
):
    """Generate audio from text using ElevenLabs."""
    try:
        print(f"[API] Received audio generation request")
        print(f"[API] Text length: {len(request.text)}")
        print(f"[API] Voice ID: {request.voice_id}")

        elevenlabs = ElevenLabsService()
        result = await elevenlabs.generate_audio(
            text=request.text, voice_id=request.voice_id
        )

        print(f"[API] Result: {result.get('success')}")
        if not result.get("success"):
            print(f"[API] Error: {result.get('error')}")

        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("error", "Failed to generate audio"),
            )

        return AudioGenerateResponse(**result)

    except ValueError as e:
        print(f"[API] ValueError: {str(e)}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        print(f"[API] Exception: {str(e)}")
        import traceback

        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate audio: {str(e)}",
        )


@router.post(
    "/generate-audio-for-caption/{content_id}", response_model=AudioGenerateResponse
)
async def generate_audio_for_content_caption(
    content_id: int,
    platform: str = "instagram",
    voice_id: str = "21m00Tcm4TlvDq8ikWAM",
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Generate audio from a specific content's caption.
    Automatically cleans and processes the caption for audio generation.
    """
    result = await db.execute(
        select(Content).where(
            Content.id == content_id, Content.user_id == current_user.id
        )
    )
    content = result.scalar_one_or_none()

    if not content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Content not found"
        )

    caption_map = {
        "facebook": content.facebook_caption,
        "instagram": content.instagram_caption,
        "linkedin": content.linkedin_caption,
        "twitter": content.twitter_caption,
        "threads": content.threads_caption,
    }

    caption = caption_map.get(platform.lower(), content.instagram_caption)

    if not caption:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No caption found for {platform}",
        )

    try:
        elevenlabs = ElevenLabsService()
        result = await elevenlabs.generate_audio_for_caption(
            caption=caption, voice_id=voice_id
        )

        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("error", "Failed to generate audio"),
            )

        return AudioGenerateResponse(**result)

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate audio: {str(e)}",
        )


@router.get("/voices", response_model=VoicesResponse)
async def get_available_voices(
    current_user: User = Depends(get_current_user),
):
    """Get list of available voices from ElevenLabs."""
    try:
        elevenlabs = ElevenLabsService()
        result = await elevenlabs.get_voices()

        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("error", "Failed to fetch voices"),
            )

        return VoicesResponse(**result)

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch voices: {str(e)}",
        )


# ============================================================================
# CONTENT GENERATION
# ============================================================================


@router.post(
    "/generate", response_model=ContentResponse, status_code=status.HTTP_201_CREATED
)
async def generate_content(
    request: ContentGenerateRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Generate AI content for social media platforms.
    """
    generator = ContentGeneratorService()

    try:
        content_data = await generator.generate_complete_content(request.topic)

        new_content = Content(
            user_id=current_user.id,
            topic=request.topic,
            facebook_caption=content_data["captions"].get("facebook"),
            instagram_caption=content_data["captions"].get("instagram"),
            linkedin_caption=content_data["captions"].get("linkedin"),
            pinterest_caption=content_data["captions"].get("pinterest"),
            twitter_caption=content_data["captions"].get("twitter"),
            threads_caption=content_data["captions"].get("threads"),
            image_prompt=content_data.get("image_prompt"),
            image_data=content_data.get("image_base64"),
            image_url=content_data.get("image_data"),
            status=(
                ContentStatus.APPROVED
                if request.auto_approve
                else ContentStatus.PENDING_APPROVAL
            ),
            approved_at=datetime.utcnow() if request.auto_approve else None,
            extra_data={
                "image_mime": content_data.get("image_mime"),
                "generated_at": datetime.utcnow().isoformat(),
            },
        )
        db.add(new_content)
        await db.commit()
        await db.refresh(new_content)

        return new_content

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate content: {str(e)}",
        )


# Add this to backend/app/api/v1/content.py


class ContentCreateRequest(BaseModel):
    topic: str
    facebook_caption: Optional[str] = None
    instagram_caption: Optional[str] = None
    linkedin_caption: Optional[str] = None
    pinterest_caption: Optional[str] = None
    twitter_caption: Optional[str] = None
    threads_caption: Optional[str] = None
    image_prompt: Optional[str] = None
    image_caption: Optional[str] = None
    image_url: Optional[str] = None
    auto_approve: bool = False


@router.post(
    "/create", response_model=ContentResponse, status_code=status.HTTP_201_CREATED
)
# Add this schema at the top with other schemas:
class PromptSummarizeRequest(BaseModel):
    prompt: str
    max_words: int = 50


class PromptSummarizeResponse(BaseModel):
    success: bool
    summarized_prompt: str
    original_word_count: int
    summarized_word_count: int
    error: Optional[str] = None


# Add this endpoint after the other content endpoints:
@router.post("/summarize-prompt", response_model=PromptSummarizeResponse)
async def summarize_prompt(
    request: PromptSummarizeRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Summarize a long video prompt to a specified word count using Gemini AI.
    Useful for creating concise voiceover scripts.
    """
    try:
        print(f"[Summarize Prompt] User: {current_user.email}")
        print(f"[Summarize Prompt] Original prompt length: {len(request.prompt)} chars")
        print(f"[Summarize Prompt] Target max words: {request.max_words}")

        # Count original words
        original_word_count = len(request.prompt.split())

        # If already short enough, return as-is
        if original_word_count <= request.max_words:
            print(
                f"[Summarize Prompt] Prompt already short enough ({original_word_count} words)"
            )
            return PromptSummarizeResponse(
                success=True,
                summarized_prompt=request.prompt,
                original_word_count=original_word_count,
                summarized_word_count=original_word_count,
            )

        # Check API key
        if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY.strip() == "":
            raise ValueError(
                "GEMINI_API_KEY is not configured. "
                "Get a FREE API key from: https://aistudio.google.com/app/apikey"
            )

        # Create summarization prompt for Gemini
        summarization_prompt = f"""Summarize this video prompt into EXACTLY {request.max_words} words or less while keeping the key visual concepts and essence.

Original prompt:
{request.prompt}

Requirements:
- Maximum {request.max_words} words
- Keep the most important visual elements
- Maintain the core message and mood
- Use concise, descriptive language
- Focus on what viewers will see

Return ONLY the summarized prompt, nothing else."""

        async with httpx.AsyncClient(timeout=30.0) as client:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key={settings.GEMINI_API_KEY}"

            payload = {
                "contents": [{"parts": [{"text": summarization_prompt}]}],
                "generationConfig": {
                    "temperature": 0.4,  # Lower for more focused output
                    "maxOutputTokens": 200,
                    "topP": 0.8,
                    "topK": 40,
                },
            }

            print(f"[Summarize Prompt] Calling Gemini API...")

            response = await client.post(url, json=payload)
            response.raise_for_status()

            result = response.json()

            # Extract summarized text
            candidates = result.get("candidates", [])
            if not candidates:
                raise ValueError("No candidates in Gemini response")

            content_obj = candidates[0].get("content", {})
            parts = content_obj.get("parts", [])

            if not parts:
                raise ValueError("No parts in Gemini response")

            summarized_prompt = parts[0].get("text", "").strip()

            if not summarized_prompt:
                raise ValueError("No text content in Gemini response")

            # Count summarized words
            summarized_word_count = len(summarized_prompt.split())

            print(f"[Summarize Prompt] Success!")
            print(f"[Summarize Prompt] Original: {original_word_count} words")
            print(f"[Summarize Prompt] Summarized: {summarized_word_count} words")
            print(
                f"[Summarize Prompt] Reduction: {((original_word_count - summarized_word_count) / original_word_count * 100):.1f}%"
            )

            return PromptSummarizeResponse(
                success=True,
                summarized_prompt=summarized_prompt,
                original_word_count=original_word_count,
                summarized_word_count=summarized_word_count,
            )

    except ValueError as e:
        print(f"[Summarize Prompt] ValueError: {str(e)}")
        return PromptSummarizeResponse(
            success=False,
            summarized_prompt=request.prompt[:200] + "...",  # Fallback
            original_word_count=len(request.prompt.split()),
            summarized_word_count=len(request.prompt[:200].split()),
            error=str(e),
        )
    except Exception as e:
        print(f"[Summarize Prompt] Exception: {str(e)}")
        import traceback

        traceback.print_exc()
        return PromptSummarizeResponse(
            success=False,
            summarized_prompt=request.prompt[:200] + "...",  # Fallback
            original_word_count=len(request.prompt.split()),
            summarized_word_count=len(request.prompt[:200].split()),
            error=f"Failed to summarize prompt: {str(e)}",
        )


@router.post(
    "/create", response_model=ContentResponse, status_code=status.HTTP_201_CREATED
)
async def create_content(
    request: ContentCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create and save content (from webhook or manual)."""
    try:
        new_content = Content(
            user_id=current_user.id,
            topic=request.topic,
            facebook_caption=request.facebook_caption,
            instagram_caption=request.instagram_caption,
            linkedin_caption=request.linkedin_caption,
            pinterest_caption=request.pinterest_caption,
            twitter_caption=request.twitter_caption,
            threads_caption=request.threads_caption,
            image_prompt=request.image_prompt,
            image_caption=request.image_caption,
            image_url=request.image_url,
            status=(
                ContentStatus.APPROVED
                if request.auto_approve
                else ContentStatus.PENDING_APPROVAL
            ),
            approved_at=datetime.utcnow() if request.auto_approve else None,
            extra_data={
                "source": "webhook",
                "created_at": datetime.utcnow().isoformat(),
            },
        )
        db.add(new_content)
        await db.commit()
        await db.refresh(new_content)

        return new_content

    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create content: {str(e)}",
        )


@router.get("/", response_model=List[ContentResponse])
async def list_content(
    skip: int = 0,
    limit: int = 20,
    status_filter: Optional[ContentStatus] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all content for the current user."""
    query = select(Content).where(Content.user_id == current_user.id)

    if status_filter:
        query = query.where(Content.status == status_filter)

    query = query.offset(skip).limit(limit).order_by(Content.created_at.desc())

    result = await db.execute(query)
    contents = result.scalars().all()

    return contents


@router.get("/{content_id}", response_model=ContentResponse)
async def get_content(
    content_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get specific content by ID."""
    result = await db.execute(
        select(Content).where(
            Content.id == content_id, Content.user_id == current_user.id
        )
    )
    content = result.scalar_one_or_none()

    if not content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Content not found"
        )

    return content


@router.post("/{content_id}/approve", response_model=ContentResponse)
async def approve_content(
    content_id: int,
    approval: ContentApprovalRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Approve or reject generated content."""
    result = await db.execute(
        select(Content).where(
            Content.id == content_id, Content.user_id == current_user.id
        )
    )
    content = result.scalar_one_or_none()

    if not content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Content not found"
        )

    if approval.approved:
        content.status = ContentStatus.APPROVED
        content.approved_at = datetime.utcnow()
        content.approved_by = current_user.id
    else:
        content.status = ContentStatus.REJECTED
        if approval.feedback:
            extra = content.extra_data or {}
            if not isinstance(extra, dict):
                extra = {}
            extra["rejection_feedback"] = approval.feedback

            # Use an explicit UPDATE statement to ensure JSON is persisted
            await db.execute(
                update(Content).where(Content.id == content_id).values(extra_data=extra)
            )

    await db.commit()
    await db.refresh(content)

    return content


@router.delete("/{content_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_content(
    content_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete content."""
    result = await db.execute(
        select(Content).where(
            Content.id == content_id, Content.user_id == current_user.id
        )
    )
    content = result.scalar_one_or_none()

    if not content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Content not found"
        )

    await db.delete(content)
    await db.commit()

    return None


@router.post("/{content_id}/regenerate-image", response_model=ContentResponse)
async def regenerate_image(
    content_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Regenerate image for existing content."""
    result = await db.execute(
        select(Content).where(
            Content.id == content_id, Content.user_id == current_user.id
        )
    )
    content = result.scalar_one_or_none()

    if not content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Content not found"
        )

    generator = ContentGeneratorService()

    try:
        image_data = await generator.generate_image_from_prompt(content.image_prompt)

        # Update content
        content.image_data = (
            image_data.split(",")[1] if image_data and "," in image_data else None
        )
        content.image_url = image_data
        content.status = ContentStatus.PENDING_APPROVAL

        await db.commit()
        await db.refresh(content)

        return content

    except ValueError as e:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        await db.rollback()
        import traceback

        print(f"Error regenerating image: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to regenerate image: {str(e)}",
        )


@router.post("/{content_id}/regenerate-captions", response_model=ContentResponse)
async def regenerate_captions(
    content_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Regenerate captions for existing content."""
    result = await db.execute(
        select(Content).where(
            Content.id == content_id, Content.user_id == current_user.id
        )
    )
    content = result.scalar_one_or_none()

    if not content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Content not found"
        )

    generator = ContentGeneratorService()

    try:
        captions = await generator.generate_platform_captions(content.topic)

        content.facebook_caption = captions.get("facebook")
        content.instagram_caption = captions.get("instagram")
        content.linkedin_caption = captions.get("linkedin")
        content.pinterest_caption = captions.get("pinterest")
        content.twitter_caption = captions.get("twitter")
        content.threads_caption = captions.get("threads")
        content.status = ContentStatus.PENDING_APPROVAL

        await db.commit()
        await db.refresh(content)

        return content

    except ValueError as e:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        await db.rollback()
        import traceback

        print(f"Error regenerating captions: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to regenerate captions: {str(e)}",
        )


@router.post("/generate-image-proxy", response_model=ImageGenerateResponse)
async def generate_image_proxy(
    request: ImageGenerateRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Proxy endpoint to generate images using Cloudflare Worker.
    This avoids CORS issues by making the request from the backend.
    Saves the image to disk and returns the file path.
    """
    import uuid

    cloudflare_url = os.getenv(
        "CLOUDEFARE_WORKER_URL",
        "https://rapid-cherry-82e1.tharindukasthurisinghe.workers.dev",
    )
    auth_token = os.getenv(
        "CLOUDEFARE_WORKER_AUTH_TOKEN", "8704cf55-470b-40fb-8ad8-a5afa16f2a51"
    )

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                cloudflare_url,
                headers={
                    "Authorization": f"Bearer {auth_token}",
                    "Content-Type": "application/json",
                },
                json={"prompt": request.prompt},
            )

            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Image generation failed: {response.text}",
                )

            # Create uploads directory if it doesn't exist
            upload_dir = Path("uploads/images")
            upload_dir.mkdir(parents=True, exist_ok=True)

            # Generate unique filename
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            unique_id = str(uuid.uuid4())[:8]
            filename = f"{timestamp}_{current_user.id}_{unique_id}.jpg"
            file_path = upload_dir / filename

            # Save image to disk
            with open(file_path, "wb") as f:
                f.write(response.content)

            # Return relative path for database storage
            relative_path = f"uploads/images/{filename}"
            image_url = f"/uploads/images/{filename}"

            return ImageGenerateResponse(image_url=image_url, file_path=relative_path)

    except httpx.TimeoutException:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Image generation timed out",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate image: {str(e)}",
        )


class EmbedCaptionRequest(BaseModel):
    image_url: str
    caption: str
    position: str = "bottom"  # top, bottom, or center
    font_size: int = 40
    # Text styling
    text_color: str = "#FFFFFF"  # Hex color for text
    text_opacity: int = 255  # 0-255
    # Background styling
    bg_color: str = "#000000"  # Hex color for background
    bg_opacity: int = 180  # 0-255
    # Layout
    padding: int = 20
    max_width_ratio: float = 0.9  # Ratio of image width for text
    # Font options
    font_family: str = "default"  # default, arial, segoe, etc.


class EmbedCaptionResponse(BaseModel):
    image_url: str
    file_path: str
    success: bool


@router.post("/embed-caption", response_model=EmbedCaptionResponse)
async def embed_caption_on_image(
    request: EmbedCaptionRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Embed a caption on an existing image.

    Takes an image URL (must be a local file), adds the caption text overlay,
    and returns the path to the modified image.
    """
    from pathlib import Path
    from app.utils.image_utils import embed_caption_on_image as embed_caption

    try:
        # Extract the file path from the URL
        # Expected format: /uploads/images/filename.jpg
        if not request.image_url.startswith("/uploads/images/"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid image URL. Must be a local upload.",
            )

        # Convert URL to file path
        relative_path = request.image_url.lstrip("/")
        file_path = Path(relative_path)

        if not file_path.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Image file not found: {request.image_url}",
            )

        # Validate position
        valid_positions = ["top", "bottom", "center"]
        position = request.position.lower()
        if position not in valid_positions:
            position = "bottom"

        # Convert hex colors to RGBA tuples
        def hex_to_rgba(hex_color: str, opacity: int) -> tuple:
            """Convert hex color and opacity to RGBA tuple."""
            hex_color = hex_color.lstrip("#")
            if len(hex_color) == 6:
                r, g, b = tuple(int(hex_color[i : i + 2], 16) for i in (0, 2, 4))
                return (r, g, b, opacity)
            return (255, 255, 255, opacity)  # Default to white

        text_color = hex_to_rgba(request.text_color, request.text_opacity)
        bg_color = hex_to_rgba(request.bg_color, request.bg_opacity)

        # Embed the caption on the image with all custom options
        result_path = embed_caption(
            image_path=str(file_path),
            caption=request.caption,
            position=position,
            font_size=request.font_size,
            text_color=text_color,
            bg_color=bg_color,
            padding=request.padding,
            max_width_ratio=request.max_width_ratio,
            font_family=request.font_family,
        )

        # Return the same URL (image is modified in place)
        return EmbedCaptionResponse(
            image_url=request.image_url,
            file_path=relative_path,
            success=True,
        )

    except FileNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Image not found: {str(e)}",
        )
    except Exception as e:
        import traceback

        print(f"Error embedding caption: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to embed caption: {str(e)}",
        )


@router.post("/analyze-video-with-narration", response_model=dict)
async def analyze_video_with_narration(
    video_url: str,
    video_id: int,
    duration: float,
    voice_id: str = "21m00Tcm4TlvDq8ikWAM",
    current_user: User = Depends(get_current_user),
):
    """
    Complete video analysis with AI narration generation.
    This endpoint:
    1. Downloads the video temporarily
    2. Extracts key frames
    3. Analyzes frames with Gemini Vision
    4. Generates audio narration with ElevenLabs
    5. Returns both description and audio
    """
    try:
        print(f"[Video + Audio] Starting complete analysis for video {video_id}")
        print(f"[Video + Audio] Video URL: {video_url}")
        print(f"[Video + Audio] Duration: {duration}s")
        print(f"[Video + Audio] Voice ID: {voice_id}")

        service = VideoAudioService()

        result = await service.analyze_video_and_generate_narration(
            video_url=video_url, video_id=video_id, duration=duration, voice_id=voice_id
        )

        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get(
                    "error", "Failed to analyze video and generate narration"
                ),
            )

        print(
            f"[Video + Audio] Complete! Description: {len(result['description'])} chars"
        )
        print(f"[Video + Audio] Audio: {result['size_bytes']} bytes")

        return {
            "success": True,
            "video_id": video_id,
            "description": result["description"],
            "audio_data_url": result["audio_data_url"],
            "audio_base64": result["audio_base64"],
            "size_bytes": result["size_bytes"],
            "voice_id": result["voice_id"],
            "analysis_details": {
                "frames_analyzed": result["frames_analyzed"],
                "duration": result["duration"],
            },
        }

    except Exception as e:
        print(f"[Video + Audio] Error: {str(e)}")
        import traceback

        traceback.print_exc()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze video and generate narration: {str(e)}",
        )
