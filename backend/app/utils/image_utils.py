"""
Image utility functions for processing and manipulating images.
"""

from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import textwrap
from typing import Tuple, Optional
import re


def get_font_with_emoji_support(font_size: int):
    """
    Load a font that supports emoji characters.

    Args:
        font_size: Size of the font

    Returns:
        ImageFont object with emoji support
    """
    # Font paths that support emojis
    emoji_font_paths = [
        # Windows emoji fonts
        "C:/Windows/Fonts/seguiemj.ttf",  # Segoe UI Emoji
        "C:/Windows/Fonts/NotoColorEmoji.ttf",
        # Try regular fonts with better Unicode support
        "C:/Windows/Fonts/segoeuib.ttf",  # Segoe UI Bold
        "C:/Windows/Fonts/segoeui.ttf",  # Segoe UI
        # macOS
        "/System/Library/Fonts/Apple Color Emoji.ttc",
        "/Library/Fonts/Arial Unicode.ttf",
        # Linux
        "/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf",
        "/usr/share/fonts/truetype/ancient-scripts/Symbola_hint.ttf",
        "/usr/share/fonts/truetype/unifont/unifont.ttf",
        # Common fallbacks
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "C:/Windows/Fonts/arialbd.ttf",
        "C:/Windows/Fonts/arial.ttf",
    ]

    font = None
    for font_path in emoji_font_paths:
        try:
            if Path(font_path).exists():
                font = ImageFont.truetype(font_path, font_size)
                # Test if the font can render an emoji
                test_draw = ImageDraw.Draw(Image.new("RGBA", (100, 100)))
                try:
                    test_draw.textbbox((0, 0), "✨", font=font)
                    # If we get here, the font can render emojis
                    return font
                except Exception:
                    # Font doesn't support this emoji, try next
                    continue
        except Exception:
            continue

    # If no emoji font found, return default (emojis may not render properly)
    try:
        return ImageFont.load_default()
    except Exception:
        return None


def split_text_and_emoji(text: str):
    """
    Split text into segments of regular text and emoji.
    This helps in rendering text with mixed content.

    Args:
        text: Input text with potential emojis

    Returns:
        List of tuples (text, is_emoji)
    """
    # Emoji regex pattern
    emoji_pattern = re.compile(
        "["
        "\U0001f600-\U0001f64f"  # emoticons
        "\U0001f300-\U0001f5ff"  # symbols & pictographs
        "\U0001f680-\U0001f6ff"  # transport & map symbols
        "\U0001f1e0-\U0001f1ff"  # flags (iOS)
        "\U00002702-\U000027b0"
        "\U000024c2-\U0001f251"
        "\U0001f900-\U0001f9ff"  # Supplemental Symbols and Pictographs
        "\U0001fa00-\U0001fa6f"  # Chess Symbols
        "\U0001fa70-\U0001faff"  # Symbols and Pictographs Extended-A
        "\U00002600-\U000026ff"  # Miscellaneous Symbols
        "\U00002700-\U000027bf"  # Dingbats
        "]+",
        flags=re.UNICODE,
    )

    segments = []
    last_end = 0

    for match in emoji_pattern.finditer(text):
        # Add text before emoji
        if match.start() > last_end:
            segments.append((text[last_end : match.start()], False))
        # Add emoji
        segments.append((match.group(), True))
        last_end = match.end()

    # Add remaining text
    if last_end < len(text):
        segments.append((text[last_end:], False))

    return segments if segments else [(text, False)]


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

    # Load font with emoji support
    font = get_font_with_emoji_support(font_size)

    if font is None:
        # Ultimate fallback - use bitmap font
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
                try:
                    draw.text(
                        (x + adj_x, current_y + adj_y),
                        line,
                        font=font,
                        fill=(0, 0, 0, 255),  # Black outline
                        embedded_color=True,  # Enable color emoji rendering
                    )
                except TypeError:
                    # If embedded_color not supported, draw without it
                    draw.text(
                        (x + adj_x, current_y + adj_y),
                        line,
                        font=font,
                        fill=(0, 0, 0, 255),
                    )

        # Draw main text
        try:
            draw.text(
                (x, current_y),
                line,
                font=font,
                fill=text_color,
                embedded_color=True,  # Enable color emoji rendering
            )
        except TypeError:
            # If embedded_color not supported, draw without it
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
    text_color: Tuple[int, int, int, int] = (255, 255, 255, 255),
    bg_color: Tuple[int, int, int, int] = (0, 0, 0, 180),
    padding: int = 20,
    max_width_ratio: float = 0.9,
    font_family: str = "default",
) -> str:
    """
    Convenience wrapper for adding caption to image.

    Args:
        image_path: Path to the image file
        caption: Caption text to embed
        position: Position of caption ("top", "bottom", "center")
        font_size: Font size for the caption
        text_color: RGBA color tuple for text
        bg_color: RGBA color tuple for background
        padding: Padding around text
        max_width_ratio: Maximum width of text as ratio of image width
        font_family: Font family preference

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
        text_color=text_color,
        bg_color=bg_color,
        padding=padding,
        max_width_ratio=max_width_ratio,
    )

    return str(result_path)
