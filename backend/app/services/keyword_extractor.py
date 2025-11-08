import httpx
from typing import List
from app.core.config import settings
import json
import re


class KeywordExtractorService:
    """Service for extracting keywords from prompts using Google Gemini."""

    def __init__(self):
        self.gemini_url = "https://generativelanguage.googleapis.com/v1beta/models"
        self.gemini_key = settings.GEMINI_API_KEY

    async def extract_keywords(
        self, 
        prompt: str, 
        max_keywords: int = 4,
        model: str = "gemini-2.0-flash-exp"
    ) -> str:
        """
        Extract 3-4 core keywords from a detailed prompt.

        Args:
            prompt: The detailed video/image prompt
            max_keywords: Maximum number of keywords (default: 4)
            model: Gemini model to use

        Returns:
            Space-separated keywords string suitable for video search
        """
        if not self.gemini_key or self.gemini_key.strip() == "":
            # Fallback: Simple extraction if API key not configured
            return self._simple_keyword_extraction(prompt, max_keywords)

        extraction_prompt = f"""Extract ONLY {max_keywords} core keywords from this prompt that would be best for searching stock videos.

Rules:
- Return ONLY {max_keywords} keywords maximum
- Focus on visual concepts, actions, subjects, and settings
- Avoid adjectives and technical details
- Use single words or very short phrases (2 words max)
- Keywords should be concrete and searchable
- Separate keywords with spaces only

Prompt to analyze:
{prompt}

Return only the keywords, nothing else:"""

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                url = f"{self.gemini_url}/{model}:generateContent?key={self.gemini_key}"

                payload = {
                    "contents": [{"parts": [{"text": extraction_prompt}]}],
                    "generationConfig": {
                        "temperature": 0.3,  # Lower temperature for consistent extraction
                        "maxOutputTokens": 50,
                    },
                }

                response = await client.post(url, json=payload)
                response.raise_for_status()

                result = response.json()
                
                candidates = result.get("candidates", [])
                if not candidates:
                    print("[Keyword Extraction] No candidates, using fallback")
                    return self._simple_keyword_extraction(prompt, max_keywords)

                content_obj = candidates[0].get("content", {})
                parts = content_obj.get("parts", [])

                if not parts:
                    print("[Keyword Extraction] No parts, using fallback")
                    return self._simple_keyword_extraction(prompt, max_keywords)

                keywords_text = parts[0].get("text", "").strip()
                
                # Clean up the response
                keywords_text = re.sub(r'[^\w\s]', ' ', keywords_text)  # Remove punctuation
                keywords_text = ' '.join(keywords_text.split())  # Normalize whitespace
                
                # Limit to max_keywords
                keywords_list = keywords_text.split()[:max_keywords]
                final_keywords = ' '.join(keywords_list)
                
                print(f"[Keyword Extraction] Original prompt length: {len(prompt)}")
                print(f"[Keyword Extraction] Extracted keywords: {final_keywords}")
                
                return final_keywords if final_keywords else self._simple_keyword_extraction(prompt, max_keywords)

            except Exception as e:
                print(f"[Keyword Extraction] Error: {str(e)}, using fallback")
                return self._simple_keyword_extraction(prompt, max_keywords)

    def _simple_keyword_extraction(self, prompt: str, max_keywords: int = 4) -> str:
        """
        Fallback: Simple keyword extraction without AI.
        Extracts important nouns and action words.
        """
        # Common words to exclude
        stop_words = {
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
            'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 
            'should', 'could', 'may', 'might', 'must', 'can', 'this', 'that',
            'these', 'those', 'it', 'its', 'their', 'there', 'very', 'more',
            'most', 'some', 'any', 'all', 'each', 'every', 'both', 'few', 'many'
        }
        
        # Remove special characters and convert to lowercase
        cleaned = re.sub(r'[^\w\s]', ' ', prompt.lower())
        words = cleaned.split()
        
        # Filter out stop words and short words
        keywords = [
            word for word in words 
            if len(word) > 3 and word not in stop_words
        ]
        
        # Remove duplicates while preserving order
        seen = set()
        unique_keywords = []
        for word in keywords:
            if word not in seen:
                seen.add(word)
                unique_keywords.append(word)
        
        # Take first max_keywords
        final_keywords = ' '.join(unique_keywords[:max_keywords])
        
        print(f"[Simple Extraction] Extracted: {final_keywords}")
        return final_keywords if final_keywords else "nature landscape"