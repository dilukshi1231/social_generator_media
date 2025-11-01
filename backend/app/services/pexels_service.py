import httpx
from typing import Dict, List, Optional
from app.core.config import settings


class PexelsService:
    """Service for searching and fetching videos from Pexels."""

    def __init__(self):
        self.api_key = settings.PEXELS_API_KEY
        self.base_url = "https://api.pexels.com/videos"

    async def search_videos(
        self, 
        query: str, 
        per_page: int = 5,
        orientation: str = "landscape"
    ) -> Dict:
        """
        Search for videos on Pexels based on query.

        Args:
            query: Search query (use the image prompt)
            per_page: Number of results to return (default 5)
            orientation: Video orientation (landscape, portrait, square)

        Returns:
            Dictionary with video results
        """
        if not self.api_key or self.api_key.strip() == "":
            raise ValueError(
                "PEXELS_API_KEY is not configured. Please add your Pexels API key to the .env file. "
                "Get it from: https://www.pexels.com/api/"
            )

        headers = {
            "Authorization": self.api_key
        }

        params = {
            "query": query,
            "per_page": per_page,
            "orientation": orientation
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.get(
                    f"{self.base_url}/search",
                    headers=headers,
                    params=params
                )
                response.raise_for_status()
                data = response.json()

                # Extract relevant video information
                videos = []
                for video in data.get("videos", []):
                    # Get the best quality video file (HD or SD)
                    video_files = video.get("video_files", [])
                    
                    # Try to get HD quality first, fall back to SD
                    hd_video = None
                    sd_video = None
                    
                    for vf in video_files:
                        if vf.get("quality") == "hd":
                            hd_video = vf
                        elif vf.get("quality") == "sd":
                            sd_video = vf
                    
                    best_video = hd_video or sd_video or (video_files[0] if video_files else None)
                    
                    if best_video:
                        videos.append({
                            "id": video.get("id"),
                            "url": video.get("url"),  # Pexels page URL
                            "video_url": best_video.get("link"),  # Direct video URL
                            "width": video.get("width"),
                            "height": video.get("height"),
                            "duration": video.get("duration"),
                            "image": video.get("image"),  # Preview image
                            "user": {
                                "name": video.get("user", {}).get("name"),
                                "url": video.get("user", {}).get("url")
                            }
                        })

                return {
                    "success": True,
                    "query": query,
                    "total_results": data.get("total_results", 0),
                    "page": data.get("page", 1),
                    "per_page": data.get("per_page", per_page),
                    "videos": videos
                }

            except httpx.HTTPError as e:
                return {
                    "success": False,
                    "error": f"Pexels API error: {str(e)}"
                }
            except Exception as e:
                return {
                    "success": False,
                    "error": f"Unexpected error: {str(e)}"
                }

    async def get_video_by_id(self, video_id: int) -> Dict:
        """
        Get a specific video by its Pexels ID.

        Args:
            video_id: Pexels video ID

        Returns:
            Dictionary with video information
        """
        if not self.api_key or self.api_key.strip() == "":
            raise ValueError("PEXELS_API_KEY is not configured")

        headers = {
            "Authorization": self.api_key
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.get(
                    f"{self.base_url}/videos/{video_id}",
                    headers=headers
                )
                response.raise_for_status()
                return {
                    "success": True,
                    "video": response.json()
                }

            except httpx.HTTPError as e:
                return {
                    "success": False,
                    "error": f"Pexels API error: {str(e)}"
                }