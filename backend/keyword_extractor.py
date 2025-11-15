# In keyword_extractor.py, add at class level:
from functools import lru_cache
import hashlib

class KeywordExtractorService:
    # ... existing code ...
    
    @lru_cache(maxsize=100)
    async def extract_keywords_cached(self, prompt_hash: str, prompt: str, max_keywords: int = 4) -> str:
        """Cached version of keyword extraction"""
        return await self.extract_keywords(prompt, max_keywords)
    
    async def extract_keywords(self, prompt: str, max_keywords: int = 4, model: str = "gemini-2.0-flash-exp") -> str:
        """Extract keywords with optional caching"""
        # Create hash for caching
        prompt_hash = hashlib.md5(prompt.encode()).hexdigest()
        
        # Use cached version
        return await self.extract_keywords_cached(prompt_hash, prompt, max_keywords)