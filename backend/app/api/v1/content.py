from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.models.user import User
from app.models.content import Content, ContentStatus
from app.services.elevenlabs_service import ElevenLabsService
# Note: Posting is handled via posts API; no need to import SocialAccount/Post here
from app.api.v1.auth import get_current_user
from app.services.content_generator import ContentGeneratorService
from pydantic import BaseModel
# Add these imports at the top of content.py
from app.services.pexels_service import PexelsService
from app.services.keyword_extractor import KeywordExtractorService


router = APIRouter()


# Schemas

# Add this new schema class with the other schemas
class VideoSearchRequest(BaseModel):
    prompt: str
    per_page: int = 5

class VideoSearchResponse(BaseModel):
    success: bool
    query: str
    total_results: int
    videos: List[dict]
# Add these new schemas with the other schemas in content.py
class AudioGenerateRequest(BaseModel):
    text: str
    voice_id: Optional[str] = "21m00Tcm4TlvDq8ikWAM"  # Default voice

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

# Update the search-videos endpoint
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
            prompt=request.prompt,
            max_keywords=4  # Extract 3-4 keywords
        )
        
        print(f"[VIDEO SEARCH] Extracted keywords: {search_keywords}")
        
        # Step 2: Search Pexels with the extracted keywords
        pexels = PexelsService()
        result = await pexels.search_videos(
            query=search_keywords,  # Use extracted keywords instead of full prompt
            per_page=request.per_page
        )
        
        print(f"[VIDEO SEARCH] Result success: {result.get('success')}")
        print(f"[VIDEO SEARCH] Videos found: {len(result.get('videos', []))}")
        
        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("error", "Failed to search videos")
            )
        
        return VideoSearchResponse(
            success=True,
            query=search_keywords,  # Return the keywords that were actually used
            total_results=result["total_results"],
            videos=result["videos"]
        )
        
    except ValueError as e:
        print(f"[VIDEO SEARCH] ValueError: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        print(f"[VIDEO SEARCH] Exception: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to search videos: {str(e)}"
        )
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
async def generate_content(
    request: ContentGenerateRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Generate AI content for social media platforms.

    This endpoint:
    1. Generates platform-specific captions
    2. Creates an image prompt
    3. Generates an AI image
    4. Saves everything to the database
    """
    # Initialize content generator
    generator = ContentGeneratorService()

    try:
        # Generate complete content package
        content_data = await generator.generate_complete_content(request.topic)

        # Create content record
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
            extra_data={  # Changed from metadata to extra_data
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


@router.post(
    "/create", response_model=ContentResponse, status_code=status.HTTP_201_CREATED
)
async def create_content(
    request: ContentCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create and save content that was generated via webhook (n8n).
    This endpoint saves content without generating it.
    """
    try:
        # Create content record
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
        # Mark as approved only; posting will be handled explicitly via /posts
        content.status = ContentStatus.APPROVED
        content.approved_at = datetime.utcnow()
        content.approved_by = current_user.id
    else:
        content.status = ContentStatus.REJECTED
        if approval.feedback:
            # Build a safe JSON dict for extra_data and persist via a direct UPDATE
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

    # Initialize generator
    generator = ContentGeneratorService()

    try:
        # Regenerate image
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
        # This is likely an API configuration error
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        # Rollback any changes
        await db.rollback()
        # Log the full error for debugging
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

    # Initialize generator
    generator = ContentGeneratorService()

    try:
        # Regenerate captions
        captions = await generator.generate_platform_captions(content.topic)

        # Update content
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
        # This is likely an API configuration error
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        # Rollback any changes
        await db.rollback()
        # Log the full error for debugging
        import traceback

        print(f"Error regenerating captions: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to regenerate captions: {str(e)}",
        )


class ImageGenerateRequest(BaseModel):
    prompt: str


class ImageGenerateResponse(BaseModel):
    image_url: str
    file_path: str


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
    import httpx
    import os
    from datetime import datetime
    from pathlib import Path
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
    
@router.post("/generate-audio", response_model=AudioGenerateResponse)
async def generate_audio(
    request: AudioGenerateRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Generate audio from text using ElevenLabs.
    Perfect for creating voiceovers for social media captions.
    """
    try:
        elevenlabs = ElevenLabsService()
        result = await elevenlabs.generate_audio(
            text=request.text,
            voice_id=request.voice_id
        )
        
        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("error", "Failed to generate audio")
            )
        
        return AudioGenerateResponse(**result)
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate audio: {str(e)}"
        )


@router.post("/generate-audio-for-caption/{content_id}", response_model=AudioGenerateResponse)
async def generate_audio_for_content_caption(
    content_id: int,
    platform: str = "instagram",  # Default platform
    voice_id: str = "21m00Tcm4TlvDq8ikWAM",
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Generate audio from a specific content's caption.
    Automatically cleans and processes the caption for audio generation.
    """
    # Get content
    result = await db.execute(
        select(Content).where(
            Content.id == content_id,
            Content.user_id == current_user.id
        )
    )
    content = result.scalar_one_or_none()

    if not content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content not found"
        )

    # Get caption based on platform
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
            detail=f"No caption found for {platform}"
        )

    try:
        elevenlabs = ElevenLabsService()
        result = await elevenlabs.generate_audio_for_caption(
            caption=caption,
            voice_id=voice_id
        )
        
        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("error", "Failed to generate audio")
            )
        
        return AudioGenerateResponse(**result)
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate audio: {str(e)}"
        )


@router.get("/voices", response_model=VoicesResponse)
async def get_available_voices(
    current_user: User = Depends(get_current_user),
):
    """
    Get list of available voices from ElevenLabs.
    """
    try:
        elevenlabs = ElevenLabsService()
        result = await elevenlabs.get_voices()
        
        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("error", "Failed to fetch voices")
            )
        
        return VoicesResponse(**result)
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch voices: {str(e)}"
        )