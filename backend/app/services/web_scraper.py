import httpx
from bs4 import BeautifulSoup
from typing import List, Dict
import json


class WebScraperService:
    """Service for scraping trending topics from various sources."""
    
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    
    async def scrape_twitter_trends(self, location: str = "worldwide") -> List[Dict[str, str]]:
        """
        Scrape trending topics from Twitter/X.
        Note: Requires Twitter API or scraping alternative
        """
        # Placeholder - would need Twitter API integration
        return [
            {"topic": "#TrendingNow", "tweet_volume": "50K"},
            {"topic": "#Technology", "tweet_volume": "30K"},
            {"topic": "#AI", "tweet_volume": "25K"}
        ]
    
    async def scrape_google_trends(self, category: str = "all") -> List[Dict[str, any]]:
        """
        Scrape trending searches from Google Trends.
        """
        try:
            url = "https://trends.google.com/trends/trendingsearches/daily/rss"
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(url, headers=self.headers)
                response.raise_for_status()
                
                soup = BeautifulSoup(response.text, 'xml')
                items = soup.find_all('item')
                
                trends = []
                for item in items[:10]:  # Top 10 trends
                    title = item.find('title').text if item.find('title') else ""
                    traffic = item.find('ht:approx_traffic').text if item.find('ht:approx_traffic') else "N/A"
                    
                    trends.append({
                        "topic": title,
                        "traffic": traffic,
                        "source": "Google Trends"
                    })
                
                return trends
        except Exception as e:
            print(f"Error scraping Google Trends: {str(e)}")
            return []
    
    async def scrape_reddit_trending(self, subreddit: str = "all") -> List[Dict[str, any]]:
        """
        Scrape trending posts from Reddit.
        """
        try:
            url = f"https://www.reddit.com/r/{subreddit}/hot.json?limit=10"
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(url, headers=self.headers)
                response.raise_for_status()
                
                data = response.json()
                posts = data.get('data', {}).get('children', [])
                
                trends = []
                for post in posts:
                    post_data = post.get('data', {})
                    trends.append({
                        "topic": post_data.get('title', ''),
                        "subreddit": post_data.get('subreddit', ''),
                        "score": post_data.get('score', 0),
                        "comments": post_data.get('num_comments', 0),
                        "url": f"https://reddit.com{post_data.get('permalink', '')}",
                        "source": "Reddit"
                    })
                
                return trends
        except Exception as e:
            print(f"Error scraping Reddit: {str(e)}")
            return []
    
    async def scrape_news_headlines(self, category: str = "technology") -> List[Dict[str, str]]:
        """
        Scrape news headlines from various sources.
        """
        try:
            # Using News API (requires API key)
            # For demo, returning placeholder
            return [
                {
                    "headline": "AI Revolution in 2025",
                    "source": "Tech News",
                    "url": "https://example.com/ai-revolution"
                },
                {
                    "headline": "Social Media Marketing Trends",
                    "source": "Marketing Today",
                    "url": "https://example.com/social-trends"
                }
            ]
        except Exception as e:
            print(f"Error scraping news: {str(e)}")
            return []
    
    async def scrape_instagram_hashtags(self) -> List[Dict[str, any]]:
        """
        Get trending hashtags from Instagram.
        Note: Requires Instagram API or alternative method
        """
        # Placeholder - would need Instagram API
        return [
            {"hashtag": "#instagood", "posts": "1B+"},
            {"hashtag": "#photooftheday", "posts": "900M+"},
            {"hashtag": "#fashion", "posts": "800M+"}
        ]
    
    async def get_industry_trends(self, industry: str) -> List[Dict[str, any]]:
        """
        Get trending topics for a specific industry.
        """
        all_trends = []
        
        # Scrape from multiple sources
        google_trends = await self.scrape_google_trends()
        reddit_trends = await self.scrape_reddit_trending("technology")
        news = await self.scrape_news_headlines(industry)
        
        # Combine and deduplicate
        all_trends.extend(google_trends)
        all_trends.extend(reddit_trends)
        all_trends.extend(news)
        
        return all_trends
    
    async def search_content_ideas(self, keyword: str, limit: int = 10) -> List[Dict[str, str]]:
        """
        Search for content ideas based on a keyword.
        """
        try:
            # Use DuckDuckGo for searching
            url = f"https://duckduckgo.com/html/?q={keyword}"
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(url, headers=self.headers)
                soup = BeautifulSoup(response.text, 'html.parser')
                
                results = []
                result_divs = soup.find_all('div', class_='result')[:limit]
                
                for div in result_divs:
                    title_tag = div.find('a', class_='result__a')
                    snippet_tag = div.find('a', class_='result__snippet')
                    
                    if title_tag:
                        results.append({
                            "title": title_tag.text.strip(),
                            "url": title_tag.get('href', ''),
                            "snippet": snippet_tag.text.strip() if snippet_tag else "",
                            "source": "DuckDuckGo"
                        })
                
                return results
        except Exception as e:
            print(f"Error searching content ideas: {str(e)}")
            return []
    
    async def get_trending_hashtags_by_platform(self, platform: str) -> List[str]:
        """
        Get trending hashtags for a specific platform.
        """
        hashtag_map = {
            "instagram": [
                "#instagood", "#photooftheday", "#fashion", "#beautiful",
                "#art", "#photography", "#happy", "#nature", "#travel", "#style"
            ],
            "twitter": [
                "#trending", "#news", "#technology", "#business",
                "#innovation", "#AI", "#marketing", "#socialmedia"
            ],
            "linkedin": [
                "#leadership", "#business", "#career", "#professional",
                "#innovation", "#technology", "#marketing", "#entrepreneur"
            ],
            "tiktok": [
                "#fyp", "#viral", "#trending", "#foryou",
                "#comedy", "#dance", "#music", "#entertainment"
            ]
        }
        
        return hashtag_map.get(platform.lower(), [])
    
    async def analyze_competitor_content(self, competitor_url: str) -> Dict[str, any]:
        """
        Analyze competitor's content strategy.
        """
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(competitor_url, headers=self.headers)
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # Extract meta information
                title = soup.find('title').text if soup.find('title') else ""
                description = ""
                meta_desc = soup.find('meta', attrs={'name': 'description'})
                if meta_desc:
                    description = meta_desc.get('content', '')
                
                # Extract headings
                headings = [h.text.strip() for h in soup.find_all(['h1', 'h2', 'h3'])[:10]]
                
                return {
                    "title": title,
                    "description": description,
                    "headings": headings,
                    "url": competitor_url
                }
        except Exception as e:
            print(f"Error analyzing competitor: {str(e)}")
            return {}