---
name: kine-social-posts
description: "Create branded social media marketing posts for Kine, the AI-powered strength training app for women. Generates full social media kits: a branded .png visual asset using Kine's hero photography with dark overlays (#111111) and muted rose accent (#C49098), the KINĒ wordmark (K in rose, INĒ in white), plus caption copy, hashtags, and a call-to-action. Use this skill whenever the user asks to create marketing content, social media posts, promotional graphics, Instagram posts, TikTok content, or any visual marketing material for Kine. Also trigger when the user mentions 'post', 'content', 'marketing', 'promo', 'social', 'caption', or 'graphic' in the context of Kine."
---

# Kine Social Post Creator

Create scroll-stopping social media content for Kine that stays true to the brand while cutting through the noise on Instagram and TikTok.

## What This Skill Produces

A **full social media kit** for each post request:

1. **Branded visual** (.png) — A design-forward image built on Kine's hero photography with dark overlays, the KINĒ wordmark, and muted rose accents
2. **Caption** — Platform-ready copy that hooks, delivers value, and drives action
3. **Hashtags** — A curated set (8-15) mixing reach and niche
4. **CTA** — A clear call-to-action tied to Kine's core proposition

---

## Step 1: Read the bundled reference script

Before writing ANY code, read `scripts/generate_post.py` in this skill's directory. This is a proven, tested post generator that produces on-brand visuals. You have three options:

1. **Use it directly** — call the appropriate function (`create_educational_post`, `create_statement_post`, or `create_testimonial_post`) with the content for this specific post. This is the fastest and most reliable path.
2. **Adapt it** — if the post type doesn't match one of the three templates, use the script's helper functions (`load_hero`, `apply_gradient_overlay`, `draw_kine_logo`, `draw_accent_bar`, `load_fonts`, etc.) and compose a new layout following the same patterns.
3. **Extend it** — add a new post type function following the same visual system.

The script is the source of truth for visual quality. Do not start from scratch with basic Pillow rectangles and text — that produces flat, wireframe-looking results that aren't shareable.

---

## Kine's Core Proposition

Every post must connect back to this, even if subtly:

> Kine is an AI-powered strength training programming tool built specifically for women. It removes the friction between wanting to train and actually doing it — with structured progression that adapts to your body, your cycle, and your life.

**Key differentiators to weave in:**
- Cycle-aware programming (adapts across hormonal phases)
- Built on women's physiology, not scaled-down men's training
- AI-generated weekly programs personalised to the individual
- No guilt, no streaks, no scores — observation-based coaching
- Education with every decision (the "why" behind your program)
- Smart injury management with exercise substitutions

---

## Visual Design System

### The Non-Negotiables

Every visual MUST have these elements. If any are missing, the post is off-brand:

1. **A background image** — The script supports multiple backgrounds via the `background` parameter. The built-in library lives in `assets/`:

   | Value | Description |
   |-------|-------------|
   | `"hero"` | Hero training photo — woman with gym rings (default) |
   | `"geometric"` | Abstract geometric circles in muted rose on dark |
   | `"gradient"` | Soft colour-field gradient mesh with rose / blue / gold glows |
   | `"textural"` | Dark brushed-concrete texture with subtle vignette |
   | `"/path/to/image.jpg"` | Any custom image — the user's own photo |
   | `None` or `"auto"` | Auto-picks the default for the post type |

   The background gets darkened, rose-tinted, and gradient-overlaid so text is always readable. Photography backgrounds (hero, custom) give the richest results. If the user says "use this image" or provides a photo, pass the path as the `background` parameter.

2. **The KINĒ wordmark** — Rendered with the K in muted rose (#C49098) and INĒ in white (#F0F0F0). Must appear at top-left AND in the bottom bar. Use BigShoulders-Bold font.

3. **Bottom branded bar** — A #191919 surface strip at the bottom with a 2px rose accent line on top, the KINĒ logo on the left, and a tagline/CTA on the right.

4. **Dark-to-image gradient** — The background image should be visible in the upper portion, with a gradient fading to near-black (#111111) as content appears below. This creates the layered, premium feel.

5. **Muted rose (#C49098) as the accent** — Used sparingly on one or two key elements: a headline word, a stat number, accent lines, the "K" in KINĒ. Never used everywhere.

### Colour Palette (exact values)

| Role | RGB | Hex |
|------|-----|-----|
| Background | (17, 17, 17) | #111111 |
| Surface | (25, 25, 25) | #191919 |
| Accent (muted rose) | (196, 144, 152) | #C49098 |
| Text primary | (240, 240, 240) | #F0F0F0 |
| Text muted | (136, 136, 136) | #888888 |
| Text dim | (90, 90, 90) | #5A5A5A |
| Border | (37, 37, 37) | #252525 |

### Typography

Fonts are in the canvas-design skill's `canvas-fonts/` directory:
- **Headlines:** `BigShoulders-Bold.ttf` — condensed, architectural (Kine uses Bebas Neue; BigShoulders is the closest available match)
- **Body:** `InstrumentSans-Regular.ttf` and `InstrumentSans-Bold.ttf` — clean, modern
- **Data/mono:** `DMMono-Regular.ttf` — for stats, context labels

### Dimensions

- **Instagram feed:** 1080 x 1350px (portrait — preferred for reach)
- **Instagram story / TikTok:** 1080 x 1920px
- Default to **1080 x 1350** unless user specifies otherwise or the post is for TikTok/stories

### How the Hero Image Works

The hero image (`/public/hero-bg.JPG`) is the foundation of every post:

1. Load and scale to cover the canvas
2. Apply a rose tint: `Image.blend(hero, rose_overlay, alpha=0.12-0.18)`
3. Darken to ~30-40% brightness: `ImageEnhance.Brightness(hero).enhance(0.28-0.40)`
4. Desaturate slightly: `ImageEnhance.Color(hero).enhance(0.4-0.5)`
5. Apply gradient overlays so text is readable over the dark lower portion

The result: the training imagery is visible and gives the post visual richness, while text remains readable against the dark-gradient areas.

---

## Post Types

### 1. Educational / Data Card
Use `create_educational_post()` from the script.

**Layout:** Background image top → gradient → stat card with accent left-edge → bullet points → closing line → bottom bar

**Content parameters:**
- `headline_top` / `headline_accent` — Two-line headline, accent line in rose
- `stat_number` / `stat_label` — A compelling stat rendered large
- `body_points` — 2-3 educational bullet points
- `closing_line` — The Kine tie-in
- `background` — (optional) `"hero"`, `"geometric"`, `"gradient"`, `"textural"`, or a file path

### 2. Statement / Provocative (TikTok)
Use `create_statement_post()` from the script.

**Layout:** Full background → bold statement text → subtext → CTA card → bottom bar

**Content parameters:**
- `lines` — List of `{"text": "...", "color": "accent"|"text"|"muted"}` for each line
- `subtext` — Supporting copy
- `cta_text` — Call to action
- `background` — (optional) `"hero"`, `"geometric"`, `"gradient"`, `"textural"`, or a file path

### 3. Testimonial
Use `create_testimonial_post()` from the script.

**Layout:** Background image top → decorative quotation mark → gradient → quote text → attribution → insight card → bottom bar

**Content parameters:**
- `quote` — The testimonial text
- `attribution` — Who said it
- `context_line` — Optional training context (e.g. "Week 4 · Follicular phase")
- `background` — (optional) `"hero"`, `"geometric"`, `"gradient"`, `"textural"`, or a file path

### 4. Custom / Brand
For posts that don't fit the three templates above, use the script's helper functions to compose a new layout. Follow the same visual system: hero background, gradient overlays, KINĒ wordmark, accent colour, bottom bar.

---

## Brand Voice for Social

### Voice Rules

- **Be direct.** Lead with the insight. Don't hedge.
- **Be specific.** "Your training adapts in your luteal phase" beats "We adapt to your body."
- **Sound human.** Write like you'd talk to a training partner.
- **Respect intelligence.** The audience trains seriously.
- **Stay grounded.** Facts over hype. No cheerleading.

### Never Use These Words

"tone" / "toning" / "beast mode" / "crush it" / "slay" / "no excuses" / "bikini body" / "summer ready" / "simple" / "easy" / "just" (as minimiser) / "ladies" / "workout" (use "session" or "training") / "algorithm" (use "your program" or "Kine")

---

## Caption Structure

```
[HOOK — first line, visible before "...more". Must earn the tap.]

[VALUE — 2-4 lines. Teach, reveal, or resonate.]

[BRIDGE — connect to Kine. 1 line. Natural, not forced.]

[CTA]
```

### Hook Techniques

**Tension:** "Your program shouldn't punish you for having a life."
**Curiosity:** "There's a reason the same weight feels different every week."
**Recognition:** "You know that feeling when you walk into the gym with no plan?"
**Contrast:** "Other apps track what you did. Kine plans what's next."
**Specificity:** "Week 2. Follicular phase. This is when you push."

### CTA Options (rotate)

- "Link in bio → try Kine free during beta"
- "Kine is in private beta. Link in bio."
- "Your program is waiting. Link in bio."
- "Stop guessing. Start training. Link in bio."
- "Built for your body. Link in bio."
- "Join the beta → link in bio"

### Hashtag Strategy (8-15 per post)

**Reach:** #strengthtraining #womenwholift #gymlife #fitnessmotivation #liftingwomen
**Niche:** #cycleawaretraining #periodisedtraining #womenstrength #femalestrengthtraining #smarttraining #strengthprogramming
**Brand:** #kineapp #trainwithkine #kinetraining

---

## Platform Notes

### Instagram
- 1080x1350 preferred. Caption up to 2200 chars. Front-load the hook.

### TikTok
- 1080x1920. Shorter captions (1-3 lines). Punchier. Fewer hashtags (3-5).
- Hook format: even more direct. "POV: your training app actually knows you have a cycle."

---

## Output Format

For every post, deliver:

1. **The Visual** — saved as `kine-post-[topic-slug].png`
2. **The Caption** — in a code block for easy copy-paste
3. **Hashtags** — space-separated block
4. **CTA** — the call-to-action line
5. **Post Notes** — platform, post type, suggested context

---

## Quality Gate

Before delivering, verify:

1. **Hero image visible?** The training photography should be clearly visible in the upper portion — not barely-there texture.
2. **KINĒ logo present?** K in rose, INĒ in white. At top AND in bottom bar.
3. **Bottom branded bar?** #191919 surface, 2px rose line on top, logo + tagline.
4. **Would you actually post this?** If it looks like a wireframe or a developer mockup, it's not ready. It should look like it came from a design tool, not a code editor.
5. **Accent colour correct?** Muted rose #C49098 — not pink, not red, not salmon.
6. **No banned words in caption?**
7. **Hook earns the tap?**
8. **Connects to Kine's proposition?**
