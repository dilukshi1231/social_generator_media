"""
Image utility functions for processing and manipulating images.
"""

from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import textwrap
from typing import Tuple, Optional


def add_caption_to_image(
    image_path: Path,
    caption: str,
    output_path: Optional[Path] = None,
    font_size: int = 40,
    position: str = "bottom",
    text_color: Tuple[int, int, int, int] = (255, 255, 255, 255),
    bg_color: Tuple[int, int, int, int] = (0, 0, 0, 180),
    padding: int = 20,
    max_width_ratio: float = 0.9,
) -> Path:
    """
    Add a caption overlay to an image.

    Args:
        image_path: Path to the input image
        caption: Text to overlay on the image
        output_path: Path for the output image (if None, overwrites input)
        font_size: Size of the font
        position: Position of the caption ("top", "bottom", "center")
        text_color: RGBA color for the text
        bg_color: RGBA color for the background overlay
        padding: Padding around the text
        max_width_ratio: Maximum width of text as a ratio of image width

    Returns:
        Path to the output image
    """
    # Open the image
    img = Image.open(image_path).convert("RGBA")
    img_width, img_height = img.size

    # Create a transparent overlay
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    # Try to load a nice font, fall back to default if not available
    try:
        # Try common font paths
        font_paths = [
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
            "/System/Library/Fonts/Helvetica.ttc",
            "C:/Windows/Fonts/arialbd.ttf",  # Windows bold Arial
            "C:/Windows/Fonts/arial.ttf",
        ]
        font = None
        for font_path in font_paths:
            if Path(font_path).exists():
                font = ImageFont.truetype(font_path, font_size)
                break

        if font is None:
            # If no font found, use default
            font = ImageFont.load_default()
    except Exception:
        # Fall back to default font
        font = ImageFont.load_default()

    # Wrap text to fit image width
    max_text_width = int(img_width * max_width_ratio)

    # Calculate average character width (approximate)
    try:
        bbox = draw.textbbox((0, 0), "A", font=font)
        avg_char_width = bbox[2] - bbox[0]
    except Exception:
        avg_char_width = font_size // 2

    chars_per_line = max(1, max_text_width // avg_char_width)
    wrapped_lines = textwrap.wrap(caption, width=chars_per_line)

    # Calculate total text height
    line_heights = []
    total_height = 0
    for line in wrapped_lines:
        try:
            bbox = draw.textbbox((0, 0), line, font=font)
            line_height = bbox[3] - bbox[1]
        except Exception:
            line_height = font_size
        line_heights.append(line_height)
        total_height += line_height

    # Add spacing between lines
    line_spacing = font_size // 4
    total_height += line_spacing * (len(wrapped_lines) - 1)

    # Calculate background box dimensions
    box_height = total_height + (padding * 2)

    # Determine position
    if position == "top":
        y_start = padding
    elif position == "center":
        y_start = (img_height - total_height) // 2
    else:  # bottom
        y_start = img_height - box_height - padding

    # Draw semi-transparent background
    draw.rectangle(
        [(0, y_start - padding), (img_width, y_start + total_height + padding)],
        fill=bg_color,
    )

    # Draw text lines
    current_y = y_start
    for i, line in enumerate(wrapped_lines):
        # Get text dimensions
        try:
            bbox = draw.textbbox((0, 0), line, font=font)
            text_width = bbox[2] - bbox[0]
        except Exception:
            text_width = len(line) * avg_char_width

        # Center text horizontally
        x = (img_width - text_width) // 2

        # Draw text with outline for better readability
        outline_range = 2
        for adj_x in range(-outline_range, outline_range + 1):
            for adj_y in range(-outline_range, outline_range + 1):
                draw.text(
                    (x + adj_x, current_y + adj_y),
                    line,
                    font=font,
                    fill=(0, 0, 0, 255),  # Black outline
                )

        # Draw main text
        draw.text((x, current_y), line, font=font, fill=text_color)

        current_y += line_heights[i] + line_spacing

    # Composite the overlay onto the original image
    img_with_caption = Image.alpha_composite(img, overlay)

    # Convert back to RGB for saving as JPEG
    final_img = img_with_caption.convert("RGB")

    # Determine output path
    if output_path is None:
        output_path = image_path

    # Save the image
    final_img.save(output_path, "JPEG", quality=95)

    return output_path


def embed_caption_on_image(
    image_path: str,
    caption: str,
    position: str = "bottom",
    font_size: int = 40,
) -> str:
    """
    Convenience wrapper for adding caption to image.

    Args:
        image_path: Path to the image file
        caption: Caption text to embed
        position: Position of caption ("top", "bottom", "center")
        font_size: Font size for the caption

    Returns:
        Path to the output image (same as input, modified in place)
    """
    path = Path(image_path)

    if not path.exists():
        raise FileNotFoundError(f"Image not found: {image_path}")

    result_path = add_caption_to_image(
        image_path=path,
        caption=caption,
        output_path=path,  # Overwrite the original
        font_size=font_size,
        position=position,
    )

    return str(result_path)
