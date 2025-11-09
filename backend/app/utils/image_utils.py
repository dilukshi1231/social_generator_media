"""
Image utility functions for processing and manipulating images.
"""

from PIL import Image, ImageDraw, ImageFont
from pilmoji import Pilmoji
from pathlib import Path
import textwrap
from typing import Tuple, Optional
import re
import requests
import os


# Google Fonts URLs - using free fonts from GitHub repositories
GOOGLE_FONTS = {
    "roboto": "https://github.com/google/roboto/raw/main/src/hinted/Roboto-Bold.ttf",
    "open_sans": "https://github.com/googlefonts/opensans/raw/main/fonts/ttf/OpenSans-Bold.ttf",
    "lato": "https://github.com/googlefonts/lato/raw/main/fonts/Lato-Bold.ttf",
    "montserrat": "https://github.com/JulietaUla/Montserrat/raw/master/fonts/ttf/Montserrat-Bold.ttf",
    "poppins": "https://github.com/itfoundry/Poppins/raw/master/products/Poppins-Bold.ttf",
    "raleway": "https://github.com/impallari/Raleway/raw/master/fonts/Raleway-Bold.ttf",
    "oswald": "https://github.com/googlefonts/OswaldFont/raw/master/fonts/ttf/Oswald-Bold.ttf",
    "ubuntu": "https://github.com/canonical/Ubuntu-fonts/raw/main/sources/Ubuntu-Bold.ttf",
    "playfair": "https://github.com/clauseggers/Playfair-Display/raw/master/fonts/PlayfairDisplay-Bold.ttf",
    "merriweather": "https://github.com/SorkinType/Merriweather/raw/master/fonts/ttf/Merriweather-Bold.ttf",
    "source_sans": "https://github.com/adobe-fonts/source-sans/raw/release/TTF/SourceSans3-Bold.ttf",
    "impact": "https://github.com/theleagueof/league-gothic/raw/master/LeagueGothic-Regular.otf",
}

# Cache directory for downloaded fonts
FONT_CACHE_DIR = Path("uploads/fonts")
FONT_CACHE_DIR.mkdir(parents=True, exist_ok=True)


def download_font(font_url: str, font_name: str) -> Optional[Path]:
    """
    Download a font from a URL and cache it locally.

    Args:
        font_url: URL to download the font from
        font_name: Name to save the font as

    Returns:
        Path to the downloaded font file, or None if download fails
    """
    try:
        cache_path = FONT_CACHE_DIR / font_name

        # If already cached, return the path
        if cache_path.exists():
            return cache_path

        # Download the font
        response = requests.get(font_url, timeout=10)
        response.raise_for_status()

        # Save to cache
        with open(cache_path, "wb") as f:
            f.write(response.content)

        return cache_path
    except Exception as e:
        print(f"Failed to download font from {font_url}: {e}")
        return None


def get_font_by_family(font_family: str, font_size: int, prefer_emoji: bool = True):
    """
    Load a font by family name from Google Fonts.

    Args:
        font_family: Font family name (roboto, open_sans, lato, etc.)
        font_size: Size of the font
        prefer_emoji: Whether to prefer emoji-supporting variants

    Returns:
        ImageFont object
    """
    font = None

    # Try to load the requested font family from Google Fonts
    if font_family in GOOGLE_FONTS:
        font_url = GOOGLE_FONTS[font_family]
        font_filename = f"{font_family}.ttf"
        font_path = download_font(font_url, font_filename)

        if font_path:
            try:
                font = ImageFont.truetype(str(font_path), font_size)

                # Test if the font supports emojis
                if prefer_emoji:
                    test_emoji = "😀"
                    test_img = Image.new("RGBA", (100, 100))
                    test_draw = ImageDraw.Draw(test_img)

                    try:
                        test_draw.text((0, 0), test_emoji, font=font, fill=(255, 255, 255, 255))
                        # If we get here, emoji is supported
                        return font
                    except Exception:
                        # Font doesn't support emojis, will try fallback
                        print(f"Font {font_family} doesn't support emojis, using fallback")
            except Exception as e:
                print(f"Failed to load font {font_family}: {e}")

    # Fallback to emoji-supporting font or default
    if font is None or prefer_emoji:
        return get_font_with_emoji_support(font_size)

    return font


def get_font_with_emoji_support(font_size: int):
    """
    Load a font that supports emoji characters.
    First tries system fonts, then falls back to default.

    Args:
        font_size: Size of the font

    Returns:
        ImageFont object with emoji support
    """
    # System emoji fonts
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
        List of tuples (text_segment, is_emoji)
    """
    # Emoji pattern - matches most common emoji sequences
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
    font_family: str = "default",
) -> Path:
    """
    Add a caption overlay to an image with full emoji support.

    This function uses a hybrid approach:
    - Regular text is rendered with the selected font family
    - Emojis are automatically rendered with an emoji-supporting font
    - All Google Fonts support emojis through this hybrid rendering

    Args:
        image_path: Path to the input image
        caption: Text to overlay on the image (emojis fully supported)
        output_path: Path for the output image (if None, overwrites input)
        font_size: Size of the font
        position: Position of the caption ("top", "bottom", "center")
        text_color: RGBA color for the text
        bg_color: RGBA color for the background overlay
        padding: Padding around the text
        max_width_ratio: Maximum width of text as a ratio of image width
        font_family: Font family to use (roboto, open_sans, lato, montserrat,
                     poppins, raleway, oswald, ubuntu, playfair, merriweather,
                     source_sans, impact, or default)

    Returns:
        Path to the output image
    """
    # Open the image
    img = Image.open(image_path).convert("RGBA")
    img_width, img_height = img.size

    # Create a transparent overlay
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    # Load primary font
    if font_family == "default":
        primary_font = get_font_with_emoji_support(font_size)
        emoji_font = primary_font  # Default font already supports emojis
    else:
        # Load the requested font for text
        font_url = GOOGLE_FONTS.get(font_family)
        if font_url:
            font_filename = f"{font_family}.ttf"
            font_path = download_font(font_url, font_filename)
            if font_path:
                try:
                    primary_font = ImageFont.truetype(str(font_path), font_size)
                except Exception as e:
                    print(f"Failed to load {font_family}, using default: {e}")
                    primary_font = get_font_with_emoji_support(font_size)
            else:
                primary_font = get_font_with_emoji_support(font_size)
        else:
            primary_font = get_font_with_emoji_support(font_size)

        # Always load emoji font as fallback for emojis
        emoji_font = get_font_with_emoji_support(font_size)

    if primary_font is None:
        # Ultimate fallback - use bitmap font
        primary_font = ImageFont.load_default()
        emoji_font = primary_font

    # Wrap text to fit image width
    max_text_width = int(img_width * max_width_ratio)

    # Calculate average character width (approximate)
    try:
        bbox = draw.textbbox((0, 0), "A", font=primary_font)
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
            bbox = draw.textbbox((0, 0), line, font=primary_font)
            line_height = bbox[3] - bbox[1]
        except Exception:
            line_height = font_size
        line_heights.append(line_height)
        total_height += line_height

    # Add spacing between lines
    line_spacing = font_size // 4
    total_height += line_spacing * (len(wrapped_lines) - 1) if len(wrapped_lines) > 1 else 0

    # Calculate background rectangle dimensions
    bg_height = total_height + (padding * 2)
    bg_width = img_width

    # Determine vertical position
    if position == "top":
        bg_y = 0
        text_y = padding
    elif position == "center":
        bg_y = (img_height - bg_height) // 2
        text_y = bg_y + padding
    else:  # bottom
        bg_y = img_height - bg_height
        text_y = bg_y + padding

    # Draw background rectangle
    draw.rectangle([(0, bg_y), (bg_width, bg_y + bg_height)], fill=bg_color)

    # Draw each line of text with color emoji support using Pilmoji
    current_y = text_y

    # Create Pilmoji instance for color emoji rendering
    with Pilmoji(overlay) as pilmoji:
        for line, line_height in zip(wrapped_lines, line_heights):
            # Calculate text width for centering using primary font
            try:
                bbox = draw.textbbox((0, 0), line, font=primary_font)
                text_width = bbox[2] - bbox[0]
            except Exception:
                text_width = len(line) * avg_char_width

            # Start position for centered text
            text_x = (img_width - text_width) // 2

            # Draw text with color emojis using Pilmoji
            try:
                pilmoji.text(
                    (text_x, current_y),
                    line,
                    font=primary_font,
                    fill=text_color,
                    emoji_scale_factor=1.0,  # Keep emojis same size as text
                )
            except Exception as e:
                # Fallback to regular drawing if Pilmoji fails
                print(f"Pilmoji failed, using fallback: {e}")
                try:
                    draw.text((text_x, current_y), line, font=primary_font, fill=text_color)
                except:
                    pass

            current_y += line_height + line_spacing

    # Composite the overlay onto the original image
    img = Image.alpha_composite(img, overlay)

    # Save the result
    if output_path is None:
        output_path = image_path

    # Convert back to RGB if saving as JPEG
    if output_path.suffix.lower() in [".jpg", ".jpeg"]:
        img = img.convert("RGB")

    img.save(output_path)
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
    Convenience wrapper for adding caption to image with full emoji support.

    All fonts automatically support emojis through hybrid rendering:
    - Text uses the selected Google Font
    - Emojis are rendered with an emoji-supporting fallback font
    - Seamlessly combines both for perfect rendering

    Args:
        image_path: Path to the image file
        caption: Caption text to embed (emojis fully supported 😀🎉👍)
        position: Position of caption ("top", "bottom", "center")
        font_size: Font size for the caption
        text_color: RGBA color tuple for text
        bg_color: RGBA color tuple for background
        padding: Padding around text
        max_width_ratio: Maximum width of text as ratio of image width
        font_family: Font family (roboto, open_sans, lato, montserrat, poppins,
                     raleway, oswald, ubuntu, playfair, merriweather,
                     source_sans, impact, or default)

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
        font_family=font_family,
    )

    return str(result_path)
