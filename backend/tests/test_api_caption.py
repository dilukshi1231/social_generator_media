"""
Test the full caption embedding flow through the API
"""

import requests
import json
from pathlib import Path
from PIL import Image

# Configuration
API_URL = "http://localhost:8000"
TOKEN = None  # You'll need to get this from localStorage or login


def test_full_flow():
    """Test the complete caption embedding flow"""

    print("=" * 70)
    print("Testing Full Caption Embedding Flow")
    print("=" * 70)

    # Step 1: Create a test image in the uploads folder
    print("\n1. Creating test image in uploads folder...")
    test_dir = Path("uploads/images/temp")
    test_dir.mkdir(parents=True, exist_ok=True)

    img = Image.new("RGB", (1000, 700), color=(100, 150, 200))
    test_image_path = test_dir / "api_test_caption.png"
    img.save(test_image_path)
    print(f"   ✓ Test image created: {test_image_path}")

    # Step 2: Prepare the embed caption request
    print("\n2. Preparing caption embed request...")
    image_url = "/uploads/images/temp/api_test_caption.png"

    embed_request = {
        "image_url": image_url,
        "caption": "Amazing content! 🎉✨ Full of colors 🌈💙",
        "position": "bottom",
        "font_size": 60,
        "text_color": "#FFFFFF",
        "text_opacity": 255,
        "bg_color": "#000000",
        "bg_opacity": 200,
        "padding": 25,
        "max_width_ratio": 0.9,
        "font_family": "roboto",
    }

    print(f"   Caption: {embed_request['caption']}")
    print(f"   Font: {embed_request['font_family']}, Size: {embed_request['font_size']}")
    print(f"   Position: {embed_request['position']}")

    # Step 3: Test without API (direct function call)
    print("\n3. Testing direct function call (bypassing API)...")
    try:
        from app.utils.image_utils import embed_caption_on_image

        # Convert hex to RGBA
        def hex_to_rgba(hex_color: str, opacity: int):
            hex_color = hex_color.lstrip("#")
            r, g, b = tuple(int(hex_color[i : i + 2], 16) for i in (0, 2, 4))
            return (r, g, b, opacity)

        result = embed_caption_on_image(
            image_path=str(test_image_path),
            caption=embed_request["caption"],
            position=embed_request["position"],
            font_size=embed_request["font_size"],
            text_color=hex_to_rgba(embed_request["text_color"], embed_request["text_opacity"]),
            bg_color=hex_to_rgba(embed_request["bg_color"], embed_request["bg_opacity"]),
            padding=embed_request["padding"],
            max_width_ratio=embed_request["max_width_ratio"],
            font_family=embed_request["font_family"],
        )

        print(f"   ✓ Direct function call SUCCESS!")
        print(f"   ✓ Caption embedded at: {result}")

        # Check if file was modified
        if Path(result).exists():
            print(f"   ✓ File exists and is accessible")
            print(f"\n🎉 SUCCESS! Caption embedding works!")
            print(f"\nOpen the image to verify:")
            print(f"   {Path(result).absolute()}")

    except Exception as e:
        print(f"   ✗ Direct function call FAILED!")
        print(f"   Error: {e}")
        import traceback

        traceback.print_exc()

    print("\n" + "=" * 70)


if __name__ == "__main__":
    test_full_flow()
