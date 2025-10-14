import httpx
import base64
from typing import Dict, List, Optional
from datetime import datetime
import tweepy
from instagrapi import Client as InstaClient
from app.core.config import settings
import io
from PIL import Image


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
        image_base64: Optional[str] = None
    ) -> Dict:
        """
        Post content to Facebook page.
        
        Args:
            page_id: Facebook page ID
            access_token: Facebook page access token
            caption: Post caption
            image_base64: Base64 encoded image (optional)
            
        Returns:
            Response from Facebook API
        """
        url = f"https://graph.facebook.com/v18.0/{page_id}/photos"
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            if image_base64:
                # Post with image
                image_bytes = base64.b64decode(image_base64)
                
                files = {
                    'source': ('image.png', image_bytes, 'image/png')
                }
                
                data = {
                    'message': caption,
                    'access_token': access_token
                }
                
                response = await client.post(url, data=data, files=files)
            else:
                # Post text only
                url = f"https://graph.facebook.com/v18.0/{page_id}/feed"
                data = {
                    'message': caption,
                    'access_token': access_token
                }
                response = await client.post(url, data=data)
            
            response.raise_for_status()
            return response.json()
    
    async def post_to_instagram(
        self, 
        username: str, 
        password: str, 
        caption: str, 
        image_base64: str
    ) -> Dict:
        """
        Post content to Instagram.
        
        Args:
            username: Instagram username
            password: Instagram password
            caption: Post caption
            image_base64: Base64 encoded image
            
        Returns:
            Response data
        """
        try:
            # Initialize Instagram client
            client = InstaClient()
            client.login(username, password)
            
            # Decode base64 image
            image_bytes = base64.b64decode(image_base64)
            image = Image.open(io.BytesIO(image_bytes))
            
            # Save temporarily
            temp_path = f"/tmp/instagram_{datetime.now().timestamp()}.png"
            image.save(temp_path)
            
            # Upload photo
            result = client.photo_upload(temp_path, caption)
            
            return {
                "success": True,
                "post_id": result.pk,
                "platform": "instagram"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "platform": "instagram"
            }
    
    async def post_to_twitter(
        self, 
        api_key: str,
        api_secret: str,
        access_token: str,
        access_secret: str,
        text: str, 
        image_base64: Optional[str] = None
    ) -> Dict:
        """
        Post content to Twitter/X.
        
        Args:
            api_key: Twitter API key
            api_secret: Twitter API secret
            access_token: Twitter access token
            access_secret: Twitter access token secret
            text: Tweet text (max 280 chars)
            image_base64: Base64 encoded image (optional)
            
        Returns:
            Response from Twitter API
        """
        try:
            # Authenticate
            auth = tweepy.OAuthHandler(api_key, api_secret)
            auth.set_access_token(access_token, access_secret)
            
            # Create API object
            api = tweepy.API(auth)
            
            if image_base64:
                # Decode image
                image_bytes = base64.b64decode(image_base64)
                temp_path = f"/tmp/twitter_{datetime.now().timestamp()}.png"
                
                with open(temp_path, 'wb') as f:
                    f.write(image_bytes)
                
                # Upload media
                media = api.media_upload(temp_path)
                
                # Post tweet with media
                tweet = api.update_status(status=text, media_ids=[media.media_id])
            else:
                # Post text only tweet
                tweet = api.update_status(status=text)
            
            return {
                "success": True,
                "tweet_id": tweet.id_str,
                "platform": "twitter"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "platform": "twitter"
            }
    
    async def post_to_linkedin(
        self, 
        access_token: str,
        person_urn: str,
        text: str, 
        image_base64: Optional[str] = None
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
            "X-Restli-Protocol-Version": "2.0.0"
        }
        
        post_data = {
            "author": person_urn,
            "lifecycleState": "PUBLISHED",
            "specificContent": {
                "com.linkedin.ugc.ShareContent": {
                    "shareCommentary": {
                        "text": text
                    },
                    "shareMediaCategory": "NONE"
                }
            },
            "visibility": {
                "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
            }
        }
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(url, headers=headers, json=post_data)
            response.raise_for_status()
            return response.json()
    
    async def post_to_threads(
        self,
        access_token: str,
        user_id: str,
        text: str,
        image_url: Optional[str] = None
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
        
        params = {
            "media_type": "TEXT",
            "text": text,
            "access_token": access_token
        }
        
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
            publish_params = {
                "creation_id": container_id,
                "access_token": access_token
            }
            
            publish_response = await client.post(publish_url, params=publish_params)
            publish_response.raise_for_status()
            
            return publish_response.json()
    
    async def post_to_multiple_platforms(
        self,
        platforms: List[str],
        captions: Dict[str, str],
        credentials: Dict[str, Dict],
        image_base64: Optional[str] = None
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
        
        for platform in platforms:
            try:
                if platform == "facebook" and "facebook" in credentials:
                    result = await self.post_to_facebook(
                        page_id=credentials["facebook"]["page_id"],
                        access_token=credentials["facebook"]["access_token"],
                        caption=captions.get("facebook", ""),
                        image_base64=image_base64
                    )
                    results["facebook"] = {"success": True, "data": result}
                
                elif platform == "instagram" and "instagram" in credentials:
                    result = await self.post_to_instagram(
                        username=credentials["instagram"]["username"],
                        password=credentials["instagram"]["password"],
                        caption=captions.get("instagram", ""),
                        image_base64=image_base64
                    )
                    results["instagram"] = result
                
                elif platform == "twitter" and "twitter" in credentials:
                    result = await self.post_to_twitter(
                        api_key=credentials["twitter"]["api_key"],
                        api_secret=credentials["twitter"]["api_secret"],
                        access_token=credentials["twitter"]["access_token"],
                        access_secret=credentials["twitter"]["access_secret"],
                        text=captions.get("twitter", ""),
                        image_base64=image_base64
                    )
                    results["twitter"] = result
                
                elif platform == "linkedin" and "linkedin" in credentials:
                    result = await self.post_to_linkedin(
                        access_token=credentials["linkedin"]["access_token"],
                        person_urn=credentials["linkedin"]["person_urn"],
                        text=captions.get("linkedin", ""),
                        image_base64=image_base64
                    )
                    results["linkedin"] = {"success": True, "data": result}
                
                elif platform == "threads" and "threads" in credentials:
                    result = await self.post_to_threads(
                        access_token=credentials["threads"]["access_token"],
                        user_id=credentials["threads"]["user_id"],
                        text=captions.get("threads", "")
                    )
                    results["threads"] = {"success": True, "data": result}
                
            except Exception as e:
                results[platform] = {
                    "success": False,
                    "error": str(e)
                }
        
        return results