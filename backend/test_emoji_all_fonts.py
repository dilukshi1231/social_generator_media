"""
Test emoji support with all Google Fonts
"""

from pathlib import Path
from PIL import Image
from app.utils.image_utils import add_caption_to_image


def test_all_fonts_with_emojis():
    """Test that all fonts work with emoji text"""

    # Create a test image
    test_image_path = Path("uploads/images/temp/test_emoji_fonts.png")
    test_image_path.parent.mkdir(parents=True, exist_ok=True)

    img = Image.new("RGB", (800, 600), color=(100, 150, 200))
    img.save(test_image_path)

    fonts_to_test = [
        "default",
        "roboto",
        "open_sans",
        "lato",
        "montserrat",
        "poppins",
        "raleway",
        "oswald",
        "ubuntu",
        "playfair",
        "merriweather",
        "source_sans",
        "impact",
    ]

    test_caption = "Hello World 🌍! This is awesome 🎉😀👍"

    print("=" * 70)
    print("Testing Emoji Support for All Fonts")
    print("=" * 70)

    for font_family in fonts_to_test:
        try:
            # Create test image for this font
            output_path = Path(f"uploads/images/temp/test_{font_family}_emoji.png")

            # Copy original test image
            img = Image.open(test_image_path)
            img.save(output_path)

            # Add caption with emoji
            result = add_caption_to_image(
                image_path=output_path,
                caption=test_caption,
                font_size=50,
                position="center",
                font_family=font_family,
            )

            print(f"✓ {font_family:20s} - Emoji support working! Output: {result.name}")

        except Exception as e:
            print(f"✗ {font_family:20s} - Failed: {e}")

    print("\n" + "=" * 70)
    print("Test completed! Check 'uploads/images/temp/' for output images")
    print("=" * 70)


if __name__ == "__main__":
    test_all_fonts_with_emojis()
