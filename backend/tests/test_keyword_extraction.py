#!/usr/bin/env python3
"""
Test keyword extraction from video prompts
"""
import asyncio
from app.services.keyword_extractor import KeywordExtractorService


async def test_extraction():
    """Test keyword extraction with sample prompts"""
    
    extractor = KeywordExtractorService()
    
    # Sample video prompts (like those from your n8n workflow)
    test_prompts = [
        """A dynamic camera shot of a professional footballer executing a powerful kick on a sunlit stadium field. 
        The camera tracks the ball's trajectory in slow motion as it curves through the air, with lens flares from 
        the stadium lights creating a cinematic effect. The grass particles fly up as the player's boot makes contact, 
        and the crowd in the blurred background erupts in celebration.""",
        
        """A serene meditation scene in a minimalist zen garden at golden hour. Smooth camera glide reveals a person 
        in lotus position on a wooden platform, surrounded by carefully raked sand patterns and smooth stones. 
        Gentle wind causes bamboo leaves to sway, creating dappled sunlight patterns.""",
        
        """An energetic startup office environment with diverse team members collaborating around a modern glass 
        whiteboard. Dynamic tracking shot moves through the space as people gesture, laugh, and share ideas. 
        Natural window light floods the contemporary workspace with plants and colorful furniture."""
    ]
    
    print("="*60)
    print("KEYWORD EXTRACTION TEST")
    print("="*60)
    
    for i, prompt in enumerate(test_prompts, 1):
        print(f"\n--- Test {i} ---")
        print(f"Original prompt ({len(prompt)} chars):")
        print(f"{prompt[:100]}...")
        print()
        
        keywords = await extractor.extract_keywords(prompt, max_keywords=4)
        
        print(f"✅ Extracted keywords: {keywords}")
        print(f"   Keyword count: {len(keywords.split())}")
        print()


if __name__ == "__main__":
    asyncio.run(test_extraction())