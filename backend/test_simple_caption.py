"""
Quick test to verify caption embedding works
"""

from pathlib import Path
from PIL import Image
from app.utils.image_utils import add_caption_to_image

# Create test directory
test_dir = Path("uploads/images/temp")
test_dir.mkdir(parents=True, exist_ok=True)

# Create a simple test image
print("Creating test image...")
img = Image.new("RGB", (800, 600), color=(70, 130, 180))
test_image = test_dir / "test_caption_simple.png"
img.save(test_image)
print(f"✓ Test image created: {test_image}")

# Test caption embedding
print("\nTesting caption embedding...")
try:
    result = add_caption_to_image(
        image_path=test_image,
        caption="Hello World! 🌍✨ This is a test caption with emojis 🎉",
        font_size=50,
        position="bottom",
        font_family="roboto",
        text_color=(255, 255, 255, 255),
        bg_color=(0, 0, 0, 200),
        padding=20,
    )
    print(f"✓ Caption embedded successfully!")
    print(f"✓ Output saved to: {result}")
    print("\n🎉 SUCCESS! Caption embedding is working!")
    print("Check the output image to verify emojis are in COLOR!")

except Exception as e:
    print(f"✗ Caption embedding failed!")
    print(f"Error: {e}")
    import traceback

    traceback.print_exc()
