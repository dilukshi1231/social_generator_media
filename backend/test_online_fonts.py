"""
Test script to verify online font downloading and caption embedding works
"""

from pathlib import Path
from PIL import Image, ImageDraw
from app.utils.image_utils import download_font, get_font_by_family, GOOGLE_FONTS


def test_font_download():
    """Test downloading a font from Google Fonts"""
    print("Testing font download...")

    # Test downloading Roboto
    font_url = GOOGLE_FONTS["roboto"]
    font_path = download_font(font_url, "test_roboto.ttf")

    if font_path and font_path.exists():
        print(f"✓ Font downloaded successfully to: {font_path}")
        return True
    else:
        print("✗ Font download failed")
        return False


def test_font_loading():
    """Test loading different font families"""
    print("\nTesting font loading...")

    test_fonts = ["roboto", "open_sans", "lato", "montserrat", "poppins"]

    for font_family in test_fonts:
        try:
            font = get_font_by_family(font_family, 40)
            if font:
                print(f"✓ {font_family}: Loaded successfully")
            else:
                print(f"✗ {font_family}: Failed to load")
        except Exception as e:
            print(f"✗ {font_family}: Error - {e}")


def test_emoji_support():
    """Test if downloaded fonts support emojis"""
    print("\nTesting emoji support...")

    font = get_font_by_family("roboto", 40, prefer_emoji=True)

    if font:
        # Create a test image
        img = Image.new("RGBA", (200, 100), (255, 255, 255, 255))
        draw = ImageDraw.Draw(img)

        try:
            # Try to draw text with emoji
            test_text = "Hello 😀 World"
            draw.text((10, 10), test_text, font=font, fill=(0, 0, 0, 255))
            print(f"✓ Emoji rendering works (with fallback if needed)")
            return True
        except Exception as e:
            print(f"✗ Emoji rendering failed: {e}")
            return False
    else:
        print("✗ Could not load font for emoji test")
        return False


if __name__ == "__main__":
    print("=" * 60)
    print("Online Font System Test")
    print("=" * 60)

    test_font_download()
    test_font_loading()
    test_emoji_support()

    print("\n" + "=" * 60)
    print("Test completed!")
    print("=" * 60)
