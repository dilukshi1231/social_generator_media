"""
Test script to verify emoji rendering in image captions.
"""

from PIL import Image, ImageDraw
from pathlib import Path
from app.utils.image_utils import get_font_with_emoji_support, add_caption_to_image


def test_emoji_font():
    """Test if we can find and load an emoji-supporting font."""
    print("Testing emoji font support...")

    font = get_font_with_emoji_support(40)

    if font:
        print(f"✅ Found emoji-supporting font: {font}")

        # Create a test image
        img = Image.new("RGBA", (800, 400), color=(100, 150, 200, 255))
        draw = ImageDraw.Draw(img)

        # Test text with emojis
        test_text = "Hello! 👋 This is a test ✨🎨💫"

        try:
            # Try to render the text
            draw.text((50, 180), test_text, font=font, fill=(255, 255, 255, 255))
            print(f"✅ Successfully rendered: {test_text}")

            # Save test image
            test_path = Path("test_emoji_output.png")
            img.save(test_path)
            print(f"✅ Saved test image to: {test_path}")

        except Exception as e:
            print(f"❌ Error rendering emoji: {e}")
    else:
        print("❌ No emoji-supporting font found")


def test_caption_with_emoji():
    """Test adding a caption with emoji to an image."""
    print("\nTesting caption embedding with emoji...")

    # Create a sample image
    test_img = Image.new("RGB", (1024, 768), color=(50, 50, 50))
    test_img_path = Path("uploads/images/test_image.jpg")
    test_img_path.parent.mkdir(parents=True, exist_ok=True)
    test_img.save(test_img_path)

    # Test caption with emojis
    caption = "Unleashing emotions, one dance at a time. ✨💃🎭"

    try:
        result = add_caption_to_image(
            image_path=test_img_path,
            caption=caption,
            output_path=Path("test_captioned_image.jpg"),
            font_size=50,
            position="bottom",
        )
        print(f"✅ Successfully embedded caption with emoji")
        print(f"   Caption: {caption}")
        print(f"   Output: {result}")
    except Exception as e:
        print(f"❌ Error embedding caption: {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    print("=" * 60)
    print("EMOJI CAPTION TEST")
    print("=" * 60)

    test_emoji_font()
    test_caption_with_emoji()

    print("\n" + "=" * 60)
    print("Test complete!")
    print("=" * 60)
