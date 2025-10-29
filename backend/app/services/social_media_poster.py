import httpx
import base64
from typing import Dict, List, Optional
from datetime import datetime
import os


class SocialMediaPosterService:
    """Service for posting content to various social media platforms."""

    def __init__(self):
        self.facebook_access_token = None
        self.instagram_client = None
        self.twitter_client = None
        self.linkedin_access_token = None

    async def post_to_facebook(
        self,
        page_id: str,
        access_token: str,
        caption: str,
        image_bytes: Optional[bytes] = None,
    ) -> Dict:
        """
        Post content to Facebook page.

        Args:
            page_id: Facebook page ID
            access_token: Facebook page access token
            caption: Post caption
            image_bytes: Raw image bytes (optional)

        Returns:
            Response JSON from Facebook API
        """
        url = f"https://graph.facebook.com/v18.0/{page_id}/photos"

        async with httpx.AsyncClient(timeout=60.0) as client:
            if image_bytes:
                # Post with image (only visible to owner)
                files = {"source": ("image.png", image_bytes, "image/png")}
                data = {
                    "message": caption,
                    "access_token": access_token,
                    "privacy": '{"value":"SELF"}',  # Only owner can see
                }
                response = await client.post(url, data=data, files=files)
            else:
                # Post text only (only visible to owner)
                url = f"https://graph.facebook.com/v18.0/{page_id}/feed"
                data = {
                    "message": caption,
                    "access_token": access_token,
                    "privacy": '{"value":"SELF"}',  # Only owner can see
                }
                response = await client.post(url, data=data)

            response.raise_for_status()
            return response.json()

    async def post_to_instagram(
        self,
        access_token: str,
        instagram_business_account_id: str,
        caption: str,
        image_url: str,
    ) -> Dict:
        """
        Post content to Instagram Business Account using Graph API.

        Args:
            access_token: Instagram/Facebook page access token
            instagram_business_account_id: Instagram Business Account ID
            caption: Post caption
            image_url: Publicly accessible image URL

        Returns:
            Response data
        """
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                # Step 1: Create media container
                container_url = f"https://graph.facebook.com/v18.0/{instagram_business_account_id}/media"
                container_params = {
                    "image_url": image_url,
                    "caption": caption,
                    "access_token": access_token,
                }
                container_resp = await client.post(
                    container_url, params=container_params
                )
                container_resp.raise_for_status()
                container_data = container_resp.json()
                creation_id = container_data.get("id")

                if not creation_id:
                    return {
                        "success": False,
                        "error": "Failed to create media container",
                        "platform": "instagram",
                    }

                # Step 2: Publish the container
                publish_url = f"https://graph.facebook.com/v18.0/{instagram_business_account_id}/media_publish"
                publish_params = {
                    "creation_id": creation_id,
                    "access_token": access_token,
                }
                publish_resp = await client.post(publish_url, params=publish_params)
                publish_resp.raise_for_status()
                publish_data = publish_resp.json()

                return {
                    "success": True,
                    "post_id": publish_data.get("id"),
                    "platform": "instagram",
                }
        except Exception as e:
            return {"success": False, "error": str(e), "platform": "instagram"}

    async def post_to_twitter(
        self,
        access_token: str,
        text: str,
        image_bytes: Optional[bytes] = None,
    ) -> Dict:
        """
        Post content to Twitter/X using OAuth 2.0 and API v2.

        Args:
            access_token: Twitter OAuth 2.0 access token
            text: Tweet text (max 280 chars)
            image_bytes: Raw image bytes (optional)

        Returns:
            Response from Twitter API
        """
        try:
            print(f"[Twitter Post] Starting tweet post, text length: {len(text)}")
            print(f"[Twitter Post] Has image: {image_bytes is not None}")

            async with httpx.AsyncClient(timeout=60.0) as client:
                if image_bytes:
                    # Step 1: Upload media using v1.1 endpoint (still required for media)
                    print("[Twitter Post] Uploading media...")
                    media_url = "https://upload.twitter.com/1.1/media/upload.json"

                    media_headers = {
                        "Authorization": f"Bearer {access_token}",
                    }

                    files = {"media": ("image.png", image_bytes, "image/png")}

                    media_response = await client.post(
                        media_url, headers=media_headers, files=files
                    )

                    print(
                        f"[Twitter Post] Media upload status: {media_response.status_code}"
                    )

                    if media_response.status_code != 200:
                        print(
                            f"[Twitter Post] Media upload error: {media_response.text}"
                        )
                        return {
                            "success": False,
                            "error": f"Media upload failed: {media_response.text}",
                            "platform": "twitter",
                        }

                    media_response.raise_for_status()
                    media_json = media_response.json()
                    media_id = media_json.get("media_id_string")

                    print(f"[Twitter Post] Media uploaded, ID: {media_id}")

                    # Step 2: Create tweet with media using v2 endpoint
                    tweet_url = "https://api.twitter.com/2/tweets"
                    headers = {
                        "Authorization": f"Bearer {access_token}",
                        "Content-Type": "application/json",
                    }
                    tweet_data = {"text": text, "media": {"media_ids": [media_id]}}

                    print(f"[Twitter Post] Creating tweet with media...")
                    tweet_response = await client.post(
                        tweet_url, headers=headers, json=tweet_data
                    )

                    print(
                        f"[Twitter Post] Tweet creation status: {tweet_response.status_code}"
                    )

                    if tweet_response.status_code != 201:
                        print(
                            f"[Twitter Post] Tweet creation error: {tweet_response.text}"
                        )
                        return {
                            "success": False,
                            "error": f"Tweet creation failed: {tweet_response.text}",
                            "platform": "twitter",
                        }

                    tweet_response.raise_for_status()
                    tweet_result = tweet_response.json()
                    tweet_id = tweet_result.get("data", {}).get("id")

                    print(f"[Twitter Post] Tweet posted successfully, ID: {tweet_id}")

                    return {
                        "success": True,
                        "post_id": tweet_id,
                        "platform": "twitter",
                    }
                else:
                    # Post text-only tweet using v2 endpoint
                    tweet_url = "https://api.twitter.com/2/tweets"
                    headers = {
                        "Authorization": f"Bearer {access_token}",
                        "Content-Type": "application/json",
                    }
                    tweet_data = {"text": text}

                    print(f"[Twitter Post] Creating text-only tweet...")
                    tweet_response = await client.post(
                        tweet_url, headers=headers, json=tweet_data
                    )

                    print(
                        f"[Twitter Post] Tweet creation status: {tweet_response.status_code}"
                    )

                    if tweet_response.status_code != 201:
                        print(
                            f"[Twitter Post] Tweet creation error: {tweet_response.text}"
                        )
                        return {
                            "success": False,
                            "error": f"Tweet creation failed: {tweet_response.text}",
                            "platform": "twitter",
                        }

                    tweet_response.raise_for_status()
                    tweet_result = tweet_response.json()
                    tweet_id = tweet_result.get("data", {}).get("id")

                    print(f"[Twitter Post] Tweet posted successfully, ID: {tweet_id}")

                    return {
                        "success": True,
                        "post_id": tweet_id,
                        "platform": "twitter",
                    }
        except Exception as e:
            print(f"[Twitter Post] Exception occurred: {str(e)}")
            import traceback

            print(f"[Twitter Post] Traceback: {traceback.format_exc()}")
            return {"success": False, "error": str(e), "platform": "twitter"}

    async def post_to_linkedin(
        self,
        access_token: str,
        person_urn: str,
        text: str,
        image_bytes: Optional[bytes] = None,
    ) -> Dict:
        """
        Post content to LinkedIn.

        Args:
            access_token: LinkedIn access token
            person_urn: LinkedIn person URN
            text: Post text
            image_base64: Base64 encoded image (optional)

        Returns:
            Response from LinkedIn API
        """
        url = "https://api.linkedin.com/v2/ugcPosts"

        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
            "X-Restli-Protocol-Version": "2.0.0",
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            if image_bytes:
                # 1) Register image upload
                register_url = (
                    "https://api.linkedin.com/v2/assets?action=registerUpload"
                )
                register_payload = {
                    "registerUploadRequest": {
                        "recipes": ["urn:li:digitalmediaRecipe:feedshare-image"],
                        "owner": person_urn,
                        "serviceRelationships": [
                            {
                                "relationshipType": "OWNER",
                                "identifier": "urn:li:userGeneratedContent",
                            }
                        ],
                    }
                }
                reg_resp = await client.post(
                    register_url, headers=headers, json=register_payload
                )
                reg_resp.raise_for_status()
                reg_json = reg_resp.json()
                upload_mech = reg_json.get("value", {}).get("uploadMechanism", {})
                http_req = upload_mech.get(
                    "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest", {}
                )
                upload_url = http_req.get("uploadUrl")
                asset_urn = reg_json.get("value", {}).get("asset")

                if not upload_url or not asset_urn:
                    return {
                        "success": False,
                        "error": "LinkedIn upload registration failed",
                    }

                # 2) Upload the image bytes
                upload_headers = {
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "image/jpeg",
                }
                up_resp = await client.put(
                    upload_url, headers=upload_headers, content=image_bytes
                )
                up_resp.raise_for_status()

                # 3) Create the UGC post with the uploaded asset
                post_data = {
                    "author": person_urn,
                    "lifecycleState": "PUBLISHED",
                    "specificContent": {
                        "com.linkedin.ugc.ShareContent": {
                            "shareCommentary": {"text": text},
                            "shareMediaCategory": "IMAGE",
                            "media": [
                                {
                                    "status": "READY",
                                    "description": {"text": text[:200] if text else ""},
                                    "media": asset_urn,
                                    "title": {"text": " "},
                                }
                            ],
                        }
                    },
                    "visibility": {
                        "com.linkedin.ugc.MemberNetworkVisibility": "CONNECTIONS"
                    },
                }
                response = await client.post(url, headers=headers, json=post_data)
                response.raise_for_status()
                return response.json()
            else:
                # Text only
                post_data = {
                    "author": person_urn,
                    "lifecycleState": "PUBLISHED",
                    "specificContent": {
                        "com.linkedin.ugc.ShareContent": {
                            "shareCommentary": {"text": text},
                            "shareMediaCategory": "NONE",
                        }
                    },
                    "visibility": {
                        "com.linkedin.ugc.MemberNetworkVisibility": "CONNECTIONS"
                    },
                }
                response = await client.post(url, headers=headers, json=post_data)
                response.raise_for_status()
                return response.json()

    async def post_to_threads(
        self,
        access_token: str,
        user_id: str,
        text: str,
        image_url: Optional[str] = None,
    ) -> Dict:
        """
        Post content to Threads.

        Args:
            access_token: Threads access token
            user_id: Threads user ID
            text: Post text (max 500 chars)
            image_url: Image URL (optional)

        Returns:
            Response from Threads API
        """
        # Create media container
        url = f"https://graph.threads.net/v1.0/{user_id}/threads"

        params = {"media_type": "TEXT", "text": text, "access_token": access_token}

        if image_url:
            params["media_type"] = "IMAGE"
            params["image_url"] = image_url

        async with httpx.AsyncClient(timeout=60.0) as client:
            # Create container
            response = await client.post(url, params=params)
            response.raise_for_status()
            container_id = response.json().get("id")

            # Publish container
            publish_url = f"https://graph.threads.net/v1.0/{user_id}/threads_publish"
            publish_params = {"creation_id": container_id, "access_token": access_token}

            publish_response = await client.post(publish_url, params=publish_params)
            publish_response.raise_for_status()

            return publish_response.json()

    async def post_to_multiple_platforms(
        self,
        platforms: List[str],
        captions: Dict[str, str],
        credentials: Dict[str, Dict],
        image_base64: Optional[str] = None,
        image_url: Optional[str] = None,
    ) -> Dict[str, Dict]:
        """
        Post content to multiple platforms simultaneously.

        Args:
            platforms: List of platform names to post to
            captions: Dictionary of captions for each platform
            credentials: Dictionary of credentials for each platform
            image_base64: Base64 encoded image

        Returns:
            Dictionary with results for each platform
        """
        results = {}

        # Resolve image bytes from either base64 or URL/path
        async def _resolve_image_bytes() -> Optional[bytes]:
            if image_base64:
                try:
                    return base64.b64decode(image_base64)
                except Exception:
                    return None
            if not image_url:
                return None
            # Local uploads path
            if image_url.startswith("/uploads/"):
                local_path = image_url.lstrip("/")
                if os.path.exists(local_path):
                    try:
                        with open(local_path, "rb") as f:
                            return f.read()
                    except Exception:
                        return None
            # Remote URL
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    resp = await client.get(image_url)
                    resp.raise_for_status()
                    return resp.content
            except Exception:
                return None

        image_bytes = await _resolve_image_bytes()

        for platform in platforms:
            try:
                if platform == "facebook" and "facebook" in credentials:
                    result = await self.post_to_facebook(
                        page_id=credentials["facebook"]["page_id"],
                        access_token=credentials["facebook"]["access_token"],
                        caption=captions.get("facebook", ""),
                        image_bytes=image_bytes,
                    )
                    results["facebook"] = {"success": True, "data": result}

                elif platform == "instagram" and "instagram" in credentials:
                    # Instagram requires a publicly accessible image URL
                    if image_url and (
                        image_url.startswith("http://")
                        or image_url.startswith("https://")
                    ):
                        result = await self.post_to_instagram(
                            access_token=credentials["instagram"]["access_token"],
                            instagram_business_account_id=credentials["instagram"][
                                "instagram_business_account_id"
                            ],
                            caption=captions.get("instagram", ""),
                            image_url=image_url,
                        )
                        results["instagram"] = result
                    else:
                        results["instagram"] = {
                            "success": False,
                            "error": "Public image URL required for Instagram (must be http:// or https://)",
                        }

                elif platform == "twitter" and "twitter" in credentials:
                    result = await self.post_to_twitter(
                        access_token=credentials["twitter"]["access_token"],
                        text=captions.get("twitter", ""),
                        image_bytes=image_bytes,
                    )
                    results["twitter"] = result

                elif platform == "linkedin" and "linkedin" in credentials:
                    result = await self.post_to_linkedin(
                        access_token=credentials["linkedin"]["access_token"],
                        person_urn=credentials["linkedin"]["person_urn"],
                        text=captions.get("linkedin", ""),
                        image_bytes=image_bytes,
                    )
                    # Normalize response to have success flag
                    results["linkedin"] = (
                        {"success": True, "data": result}
                        if "id" in result or result
                        else {"success": False, "error": str(result)}
                    )

                elif platform == "threads" and "threads" in credentials:
                    result = await self.post_to_threads(
                        access_token=credentials["threads"]["access_token"],
                        user_id=credentials["threads"]["user_id"],
                        text=captions.get("threads", ""),
                    )
                    results["threads"] = {"success": True, "data": result}

            except Exception as e:
                results[platform] = {"success": False, "error": str(e)}

        return results
