"""
Kine Social Post Generator v3 — Design-forward approach
Uses background imagery prominently, bold geometric accents, and layered composition.

Background options:
  - "hero"           → Hero training photo (default — woman with gym rings)
  - "geometric"      → Abstract geometric circles in muted rose
  - "gradient"       → Soft colour-field gradient mesh (rose / blue / gold glows)
  - "textural"       → Dark brushed-concrete texture with vignette
  - "/path/to/img"   → Any custom image path (JPG/PNG)
"""
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
import os, textwrap, math

# === PATHS ===
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SKILL_DIR = os.path.dirname(SCRIPT_DIR)
ASSETS_DIR = os.path.join(SKILL_DIR, "assets")
FONT_DIR = "/sessions/lucid-amazing-maxwell/mnt/.claude/skills/canvas-design/canvas-fonts"
HERO_BG = os.path.join(ASSETS_DIR, "bg-hero-training.jpg")
OUTPUT_DIR = "/sessions/lucid-amazing-maxwell/mnt/kine-next"

# === BACKGROUND LIBRARY ===
BG_LIBRARY = {
    "hero": os.path.join(ASSETS_DIR, "bg-hero-training.jpg"),
    "geometric": os.path.join(ASSETS_DIR, "bg-geometric-rose.png"),
    "gradient": os.path.join(ASSETS_DIR, "bg-gradient-mesh.png"),
    "textural": os.path.join(ASSETS_DIR, "bg-textural-dark.png"),
}

# Recommended backgrounds per post type (used when background="auto")
BG_DEFAULTS = {
    "educational": "hero",
    "statement": "hero",
    "testimonial": "hero",
}

# === BRAND COLOURS ===
BG = (17, 17, 17)
SURFACE = (25, 25, 25)
SURFACE2 = (33, 33, 33)
BORDER = (37, 37, 37)
ACCENT = (196, 144, 152)
TEXT = (240, 240, 240)
TEXT_MUTED = (136, 136, 136)
TEXT_DIM = (90, 90, 90)

def load_fonts():
    return {
        "display_xxl": ImageFont.truetype(os.path.join(FONT_DIR, "BigShoulders-Bold.ttf"), 120),
        "display_xl": ImageFont.truetype(os.path.join(FONT_DIR, "BigShoulders-Bold.ttf"), 96),
        "display_lg": ImageFont.truetype(os.path.join(FONT_DIR, "BigShoulders-Bold.ttf"), 72),
        "display_md": ImageFont.truetype(os.path.join(FONT_DIR, "BigShoulders-Bold.ttf"), 56),
        "display_sm": ImageFont.truetype(os.path.join(FONT_DIR, "BigShoulders-Bold.ttf"), 40),
        "body_lg": ImageFont.truetype(os.path.join(FONT_DIR, "InstrumentSans-Regular.ttf"), 34),
        "body": ImageFont.truetype(os.path.join(FONT_DIR, "InstrumentSans-Regular.ttf"), 28),
        "body_sm": ImageFont.truetype(os.path.join(FONT_DIR, "InstrumentSans-Regular.ttf"), 22),
        "body_bold": ImageFont.truetype(os.path.join(FONT_DIR, "InstrumentSans-Bold.ttf"), 28),
        "body_bold_lg": ImageFont.truetype(os.path.join(FONT_DIR, "InstrumentSans-Bold.ttf"), 34),
        "mono": ImageFont.truetype(os.path.join(FONT_DIR, "DMMono-Regular.ttf"), 20),
        "mono_lg": ImageFont.truetype(os.path.join(FONT_DIR, "DMMono-Regular.ttf"), 26),
        "stat_huge": ImageFont.truetype(os.path.join(FONT_DIR, "BigShoulders-Bold.ttf"), 180),
        "logo_lg": ImageFont.truetype(os.path.join(FONT_DIR, "BigShoulders-Bold.ttf"), 48),
        "logo_sm": ImageFont.truetype(os.path.join(FONT_DIR, "BigShoulders-Bold.ttf"), 32),
    }


def draw_kine_logo(draw, x, y, font, spacing=0):
    """Draw KINĒ wordmark: K in rose, INĒ in white. Tight kerning."""
    draw.text((x, y), "K", fill=ACCENT, font=font)
    k_w = font.getbbox("K")[2] - font.getbbox("K")[0]
    draw.text((x + k_w + spacing, y), "INĒ", fill=TEXT, font=font)
    total_w = font.getbbox("KINĒ")[2] - font.getbbox("KINĒ")[0]
    return total_w


def resolve_background(background, post_type="educational"):
    """
    Resolve a background argument to a file path.
    - None or "auto"  → pick default for this post type
    - "hero" / "geometric" / "gradient" / "textural" → library lookup
    - "/path/to/file"  → custom image path (used directly)
    """
    if background is None or background == "auto":
        background = BG_DEFAULTS.get(post_type, "hero")
    if background in BG_LIBRARY:
        return BG_LIBRARY[background]
    # Treat as a custom file path
    if os.path.isfile(background):
        return background
    # Fallback to hero
    print(f"Warning: background '{background}' not found, falling back to hero")
    return BG_LIBRARY["hero"]


def load_background(width, height, background=None, post_type="educational"):
    """Load and scale a background image to cover dimensions."""
    bg_path = resolve_background(background, post_type)
    bg_img = Image.open(bg_path)
    scale = max(width / bg_img.width, height / bg_img.height)
    new_w, new_h = int(bg_img.width * scale), int(bg_img.height * scale)
    bg_img = bg_img.resize((new_w, new_h), Image.LANCZOS)
    left = (new_w - width) // 2
    top = (new_h - height) // 2
    return bg_img.crop((left, top, left + width, top + height))


# Keep backward compat
def load_hero(width, height):
    """Legacy: load the hero training image."""
    return load_background(width, height, "hero")


def apply_gradient_overlay(base, direction="bottom", color=BG, start_alpha=0, end_alpha=240, start_pct=0.0, end_pct=1.0):
    """Apply a gradient overlay for depth. direction: 'bottom', 'top', 'left'."""
    w, h = base.size
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    if direction == "bottom":
        start_y = int(h * start_pct)
        end_y = int(h * end_pct)
        for y in range(start_y, end_y):
            t = (y - start_y) / max(1, end_y - start_y)
            a = int(start_alpha + (end_alpha - start_alpha) * t)
            draw.line([(0, y), (w, y)], fill=color + (a,))
        # Fill solid below gradient
        if end_y < h:
            draw.rectangle([0, end_y, w, h], fill=color + (end_alpha,))
    elif direction == "top":
        start_y = int(h * start_pct)
        end_y = int(h * end_pct)
        for y in range(start_y, end_y):
            t = (y - start_y) / max(1, end_y - start_y)
            a = int(end_alpha - (end_alpha - start_alpha) * t)
            draw.line([(0, y), (w, y)], fill=color + (a,))
        if start_y > 0:
            draw.rectangle([0, 0, w, start_y], fill=color + (end_alpha,))
    elif direction == "left":
        start_x = int(w * start_pct)
        end_x = int(w * end_pct)
        for x in range(start_x, end_x):
            t = (x - start_x) / max(1, end_x - start_x)
            a = int(end_alpha - (end_alpha - start_alpha) * t)
            draw.line([(x, 0), (x, h)], fill=color + (a,))
        if start_x > 0:
            draw.rectangle([0, 0, start_x, h], fill=color + (end_alpha,))

    base_rgba = base.convert("RGBA")
    return Image.alpha_composite(base_rgba, overlay).convert("RGB")


def draw_accent_bar(draw, x, y, w, h):
    """Draw a filled accent-coloured rectangle."""
    draw.rectangle([x, y, x + w, y + h], fill=ACCENT)


def wrap_text(text, font, max_width):
    """Word-wrap text to fit within max_width pixels. Returns list of lines."""
    words = text.split()
    lines = []
    current = ""
    for word in words:
        test = current + (" " if current else "") + word
        tw = font.getbbox(test)[2] - font.getbbox(test)[0]
        if tw > max_width and current:
            lines.append(current)
            current = word
        else:
            current = test
    if current:
        lines.append(current)
    return lines


def draw_wrapped(draw, text, font, max_width, x, y, fill=TEXT, line_spacing=1.35):
    """Draw wrapped text, return y after last line."""
    lines = wrap_text(text, font, max_width)
    lh = font.getbbox("Ag")[3] - font.getbbox("Ag")[1]
    for line in lines:
        draw.text((x, y), line, fill=fill, font=font)
        y += int(lh * line_spacing)
    return y


# =====================================================
# POST 1: EDUCATIONAL — Hero top, content bottom
# =====================================================
def create_educational_post(
    headline_top, headline_accent, stat_number, stat_label,
    body_points, closing_line,
    output_path="kine-edu.png", width=1080, height=1350,
    background=None,
):
    """
    Educational / data card post.
    background: "hero", "geometric", "gradient", "textural", "/path/to/img", or None (auto).
    """
    fonts = load_fonts()

    # --- Background image takes top 45% ---
    bg_img = load_background(width, height, background, "educational")
    # Tint with a rose colour wash
    tint = Image.new("RGB", (width, height), ACCENT)
    bg_img = Image.blend(bg_img, tint, alpha=0.15)
    # Darken to ~35% brightness
    bg_img = ImageEnhance.Brightness(bg_img).enhance(0.35)
    bg_img = ImageEnhance.Color(bg_img).enhance(0.5)

    img = bg_img.copy()

    # Gradient: dark from bottom eating into image
    img = apply_gradient_overlay(img, "bottom", BG, start_alpha=0, end_alpha=255, start_pct=0.30, end_pct=0.55)
    # Slight dark from top for text readability
    img = apply_gradient_overlay(img, "top", BG, start_alpha=0, end_alpha=180, start_pct=0.0, end_pct=0.15)

    draw = ImageDraw.Draw(img)
    m = 80  # margin

    # --- Top: Logo + accent bar ---
    y = 65
    draw_kine_logo(draw, m, y, fonts["logo_sm"])
    y += 55

    # Thin accent line under logo
    draw.rectangle([m, y, m + 60, y + 3], fill=ACCENT)
    y += 35

    # --- Headline over the hero ---
    draw.text((m, y), headline_top, fill=TEXT, font=fonts["display_xxl"])
    y += fonts["display_xxl"].getbbox(headline_top)[3] - fonts["display_xxl"].getbbox(headline_top)[1] + 5
    draw.text((m, y), headline_accent, fill=ACCENT, font=fonts["display_xxl"])
    y += fonts["display_xxl"].getbbox(headline_accent)[3] - fonts["display_xxl"].getbbox(headline_accent)[1]

    # --- Stat block (over the gradient transition) ---
    y = int(height * 0.42)
    # Rose-tinted surface behind stat
    stat_card_h = 200
    overlay_rgba = Image.new("RGBA", (width - 2*m, stat_card_h), ACCENT + (20,))
    img_rgba = img.convert("RGBA")
    img_rgba.paste(overlay_rgba, (m, y), overlay_rgba)
    # Accent left edge
    accent_bar = Image.new("RGBA", (5, stat_card_h), ACCENT + (255,))
    img_rgba.paste(accent_bar, (m, y), accent_bar)
    img = img_rgba.convert("RGB")
    draw = ImageDraw.Draw(img)

    stat_y_off = 5
    draw.text((m + 30, y + stat_y_off), stat_number, fill=ACCENT, font=fonts["stat_huge"])
    stat_h = fonts["stat_huge"].getbbox(stat_number)[3] - fonts["stat_huge"].getbbox(stat_number)[1]
    draw.text((m + 35, y + stat_y_off + stat_h + 12), stat_label, fill=TEXT_MUTED, font=fonts["body"])

    # --- Body content area (fully dark section) ---
    y = int(height * 0.62)
    content_w = width - 2*m

    for i, point in enumerate(body_points):
        # Small accent square bullet
        draw.rectangle([m, y + 10, m + 8, y + 18], fill=ACCENT)
        y = draw_wrapped(draw, point, fonts["body"], content_w - 30, m + 25, y, fill=TEXT_MUTED)
        y += 18

    y += 20

    # --- Closing line ---
    draw.rectangle([m, y, m + 40, y + 3], fill=ACCENT)
    y += 20
    draw_wrapped(draw, closing_line, fonts["body_bold_lg"], content_w, m, y, fill=TEXT)

    # --- Bottom bar ---
    bar_y = height - 90
    draw.rectangle([0, bar_y, width, height], fill=SURFACE)
    draw.rectangle([0, bar_y, width, bar_y + 2], fill=ACCENT)
    draw_kine_logo(draw, m, bar_y + 25, fonts["logo_lg"])

    # Right-aligned tagline
    tag = "Training that knows your body"
    tw = fonts["body_sm"].getbbox(tag)[2] - fonts["body_sm"].getbbox(tag)[0]
    draw.text((width - m - tw, bar_y + 35), tag, fill=TEXT_DIM, font=fonts["body_sm"])

    path = os.path.join(OUTPUT_DIR, output_path)
    img.save(path, quality=95)
    print(f"Saved: {path} ({os.path.getsize(path)//1024}KB)")
    return path


# =====================================================
# POST 2: STATEMENT — Full hero bg, bold text overlay
# =====================================================
def create_statement_post(
    lines, subtext, cta_text,
    output_path="kine-statement.png", width=1080, height=1920,
    background=None,
):
    """
    Bold statement / provocative post (TikTok / Stories format).
    background: "hero", "geometric", "gradient", "textural", "/path/to/img", or None (auto).
    """
    fonts = load_fonts()

    # Full background, dimmed and tinted
    bg_img = load_background(width, height, background, "statement")
    tint = Image.new("RGB", (width, height), ACCENT)
    bg_img = Image.blend(bg_img, tint, alpha=0.12)
    bg_img = ImageEnhance.Brightness(bg_img).enhance(0.28)
    bg_img = ImageEnhance.Color(bg_img).enhance(0.4)
    img = bg_img.copy()

    # Strong gradient from bottom for text area
    img = apply_gradient_overlay(img, "bottom", BG, start_alpha=0, end_alpha=250, start_pct=0.35, end_pct=0.65)
    # Lighter gradient from top
    img = apply_gradient_overlay(img, "top", BG, start_alpha=0, end_alpha=200, start_pct=0.0, end_pct=0.12)

    draw = ImageDraw.Draw(img)
    m = 80

    # --- Logo top left ---
    y = 70
    draw_kine_logo(draw, m, y, fonts["logo_sm"])

    # --- Main statement centred in the image ---
    color_map = {"accent": ACCENT, "text": TEXT, "muted": TEXT_MUTED}

    # Measure
    total_h = 0
    line_data = []
    for line in lines:
        font = fonts["display_xxl"]
        bbox = font.getbbox(line["text"])
        h = bbox[3] - bbox[1]
        line_data.append({
            "text": line["text"],
            "font": font,
            "color": color_map.get(line.get("color", "text"), TEXT),
            "h": h
        })
        total_h += h + 15

    start_y = int(height * 0.30)
    y = start_y

    # Accent bar before statement
    draw.rectangle([m, y - 20, m + 80, y - 15], fill=ACCENT)

    for ld in line_data:
        draw.text((m, y), ld["text"], fill=ld["color"], font=ld["font"])
        y += ld["h"] + 15

    y += 30

    # --- Subtext ---
    draw_wrapped(draw, subtext, fonts["body_lg"], width - 2*m, m, y, fill=TEXT_MUTED, line_spacing=1.5)

    # --- CTA block at bottom ---
    cta_y = height - 220
    # Rose accent strip
    img_rgba = img.convert("RGBA")
    cta_bg = Image.new("RGBA", (width - 2*m, 80), ACCENT + (30,))
    img_rgba.paste(cta_bg, (m, cta_y), cta_bg)
    cta_bar = Image.new("RGBA", (4, 80), ACCENT + (255,))
    img_rgba.paste(cta_bar, (m, cta_y), cta_bar)
    img = img_rgba.convert("RGB")
    draw = ImageDraw.Draw(img)

    draw.text((m + 25, cta_y + 22), cta_text, fill=TEXT, font=fonts["body_bold"])

    # Bottom bar
    bar_y = height - 90
    draw.rectangle([0, bar_y, width, height], fill=SURFACE)
    draw.rectangle([0, bar_y, width, bar_y + 2], fill=ACCENT)
    draw_kine_logo(draw, m, bar_y + 22, fonts["logo_lg"])

    tag = "Built for your body \u2192 link in bio"
    tw = fonts["body_sm"].getbbox(tag)[2] - fonts["body_sm"].getbbox(tag)[0]
    draw.text((width - m - tw, bar_y + 35), tag, fill=ACCENT, font=fonts["body_sm"])

    path = os.path.join(OUTPUT_DIR, output_path)
    img.save(path, quality=95)
    print(f"Saved: {path} ({os.path.getsize(path)//1024}KB)")
    return path


# =====================================================
# POST 3: TESTIMONIAL — Split layout, hero + quote
# =====================================================
def create_testimonial_post(
    quote, attribution, context_line,
    output_path="kine-testimonial.png", width=1080, height=1350,
    background=None,
):
    """
    Testimonial / quote card post.
    background: "hero", "geometric", "gradient", "textural", "/path/to/img", or None (auto).
    """
    fonts = load_fonts()

    # Background takes top ~50% with gradient into dark
    bg_img = load_background(width, height, background, "testimonial")
    tint = Image.new("RGB", (width, height), ACCENT)
    bg_img = Image.blend(bg_img, tint, alpha=0.18)
    bg_img = ImageEnhance.Brightness(bg_img).enhance(0.4)
    bg_img = ImageEnhance.Color(bg_img).enhance(0.5)
    img = bg_img.copy()

    # Hard gradient — hero visible at top, dark at bottom
    img = apply_gradient_overlay(img, "bottom", BG, start_alpha=0, end_alpha=255, start_pct=0.25, end_pct=0.50)
    # Slight top darken
    img = apply_gradient_overlay(img, "top", BG, start_alpha=0, end_alpha=120, start_pct=0.0, end_pct=0.10)

    draw = ImageDraw.Draw(img)
    m = 80

    # --- Logo top left ---
    y = 60
    draw_kine_logo(draw, m, y, fonts["logo_sm"])

    # --- Context line (top right, monospace) ---
    if context_line:
        ctx_upper = context_line.upper()
        tw = fonts["mono"].getbbox(ctx_upper)[2] - fonts["mono"].getbbox(ctx_upper)[0]
        draw.text((width - m - tw, 72), ctx_upper, fill=TEXT_DIM, font=fonts["mono"])

    # --- Large decorative quotation mark in hero area ---
    qm_font = ImageFont.truetype(os.path.join(FONT_DIR, "BigShoulders-Bold.ttf"), 300)
    # Semi-transparent by drawing on RGBA overlay
    img_rgba = img.convert("RGBA")
    qm_overlay = Image.new("RGBA", (300, 280), (0, 0, 0, 0))
    qm_draw = ImageDraw.Draw(qm_overlay)
    qm_draw.text((0, 0), "\u201C", fill=ACCENT + (80,), font=qm_font)
    img_rgba.paste(qm_overlay, (m - 10, int(height * 0.18)), qm_overlay)
    img = img_rgba.convert("RGB")
    draw = ImageDraw.Draw(img)

    # --- Quote text in the dark zone ---
    y = int(height * 0.48)
    # Accent line before quote
    draw.rectangle([m, y, m + 50, y + 4], fill=ACCENT)
    y += 30

    quote_font = fonts["display_md"]
    content_w = width - 2*m
    q_lines = wrap_text(quote, quote_font, content_w)
    lh = quote_font.getbbox("Ag")[3] - quote_font.getbbox("Ag")[1]
    for ql in q_lines:
        draw.text((m, y), ql, fill=TEXT, font=quote_font)
        y += int(lh * 1.25)

    y += 25

    # Attribution with accent dash
    draw.rectangle([m, y, m + 30, y + 3], fill=ACCENT)
    draw.text((m + 45, y - 8), attribution, fill=TEXT_MUTED, font=fonts["body"])

    y += 55

    # --- Insight card ---
    card_w = width - 2*m
    card_h = 140
    img_rgba = img.convert("RGBA")
    card_bg = Image.new("RGBA", (card_w, card_h), SURFACE + (220,))
    img_rgba.paste(card_bg, (m, y), card_bg)
    card_accent = Image.new("RGBA", (card_w, 3), ACCENT + (255,))
    img_rgba.paste(card_accent, (m, y), card_accent)
    img = img_rgba.convert("RGB")
    draw = ImageDraw.Draw(img)

    insight = "Your program, built each week. Personalised to your goals, your cycle, your life."
    draw_wrapped(draw, insight, fonts["body_sm"], card_w - 50, m + 25, y + 25, fill=TEXT_MUTED, line_spacing=1.4)

    # --- Bottom bar ---
    bar_y = height - 90
    draw.rectangle([0, bar_y, width, height], fill=SURFACE)
    draw.rectangle([0, bar_y, width, bar_y + 2], fill=ACCENT)
    draw_kine_logo(draw, m, bar_y + 22, fonts["logo_lg"])

    tag = "Join the beta \u2192 link in bio"
    tw = fonts["body_sm"].getbbox(tag)[2] - fonts["body_sm"].getbbox(tag)[0]
    draw.text((width - m - tw, bar_y + 35), tag, fill=ACCENT, font=fonts["body_sm"])

    path = os.path.join(OUTPUT_DIR, output_path)
    img.save(path, quality=95)
    print(f"Saved: {path} ({os.path.getsize(path)//1024}KB)")
    return path


# =====================================================
# GENERATE
# =====================================================
if __name__ == "__main__":
    create_educational_post(
        headline_top="YOUR STRENGTH",
        headline_accent="HAS A CYCLE",
        stat_number="10-15%",
        stat_label="strength variation across your menstrual cycle",
        body_points=[
            "Follicular phase: energy and strength rise. This is when you push.",
            "Luteal phase: recovery slows, intensity should adapt \u2014 not stop.",
            "Your cycle isn't a limitation. It's information your program should use.",
        ],
        closing_line="Your training should adapt. Kine makes sure it does.",
        output_path="kine-post-v3-educational.png",
    )

    create_statement_post(
        lines=[
            {"text": "MISSED", "color": "accent"},
            {"text": "A SESSION?", "color": "text"},
            {"text": "GOOD.", "color": "text"},
        ],
        subtext="No guilt. No broken streaks. No shame. Your program rebuilds around what actually happened \u2014 your phase, your capacity, your real life.",
        cta_text="Stop punishing yourself. Try Kine free \u2192",
        output_path="kine-post-v3-statement.png",
    )

    create_testimonial_post(
        quote="I used to spend 20 minutes before every session figuring out what to do. Now I open Kine and it's already there.",
        attribution="Beta user",
        context_line="Week 4 \u00b7 Follicular phase",
        output_path="kine-post-v3-testimonial.png",
    )

    print("\nAll v3 posts generated.")
