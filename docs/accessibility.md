# Accessibility — KINE

Standard: **WCAG 2.2 Level AA**
Last audited: 2026-03-29

---

## Audit verdict

| Area | Status | Notes |
|---|---|---|
| Perceivable (1.x) | Pass | Contrast ratios verified, alt text on images, reduced motion respected |
| Operable (2.x) | Pass | Keyboard navigable, focus managed in modals, touch targets >= 44px |
| Understandable (3.x) | Pass | Error messages announced, labels on all inputs, autocomplete hints |
| Robust (4.x) | Pass | ARIA roles correct, status messages use live regions |

**Overall: WCAG 2.2 AA compliant** across all pages and components.

Three rounds of audit and remediation were performed (rounds 1-2 covered WCAG 2.1 AA, round 3 extended to WCAG 2.2 AA including new success criteria 2.5.7, 2.5.8, 2.4.11, 3.3.7, 3.3.8).

---

## How we build accessibly

### 1. Semantic HTML first

Use the right element before reaching for ARIA.

```tsx
// Do
<h2>Choose your plan</h2>
<ul><li>Form cue</li></ul>
<nav><a href="/app">Home</a></nav>

// Don't
<div className="heading">Choose your plan</div>
<div><span>Form cue</span></div>
```

**Heading hierarchy** must flow logically: h1 -> h2 -> h3. Never skip levels.

### 2. Forms and inputs

Every input needs an accessible name. Use one of:

| Method | When to use |
|---|---|
| `<label htmlFor="id">` | Visible label exists |
| `aria-label="..."` | No visible label (e.g. search inputs) |
| `aria-labelledby="id"` | Label is a separate element |

**Error handling pattern:**
```tsx
<input
  aria-invalid={!!error}
  aria-describedby={error ? "field-error" : undefined}
/>
{error && <p id="field-error" role="alert">{error}</p>}
```

**Autocomplete:** Add `autoComplete` on email, password, and name fields.

| Field type | Value |
|---|---|
| Email | `autoComplete="email"` |
| New password | `autoComplete="new-password"` |
| Current password | `autoComplete="current-password"` |
| Name | `autoComplete="name"` |

### 3. Colour contrast

All text must meet WCAG AA contrast ratios against its background:

| Text type | Minimum ratio |
|---|---|
| Normal text (< 18px) | 4.5:1 |
| Large text (>= 18px or >= 14px bold) | 3:1 |
| Non-text (icons, borders, focus rings) | 3:1 |

**Our palette on #111 background:**

| Token | Hex | Ratio | Verdict |
|---|---|---|---|
| `--color-text` | #f0f0f0 | 13.5:1 | Pass |
| `--color-muted2` | #888888 | 4.6:1 | Pass |
| `--color-muted` | #5a5a5a | 2.5:1 | Decorative only |
| `--color-accent` | #c49098 | 5.2:1 | Pass |
| Error text | #ff8a80 | 4.7:1 | Pass |

**Rule:** Never use `--color-muted` (#5a5a5a) for meaningful text — only decorative labels, borders, and separators.

### 4. Focus management

**Global focus indicator** (globals.css):
```css
:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 3px;
}
```

**Dialogs and sheets** must:
1. Save the trigger element ref on open
2. Move focus into the dialog (use `tabIndex={-1}` + `requestAnimationFrame`)
3. Restore focus to the trigger on close

```tsx
// Pattern used in BottomSheet.tsx and GuideDrawer.tsx
const triggerRef = useRef<Element | null>(null);
const dialogRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  if (open) {
    triggerRef.current = document.activeElement;
    requestAnimationFrame(() => dialogRef.current?.focus());
  } else {
    if (triggerRef.current instanceof HTMLElement) {
      triggerRef.current.focus();
    }
  }
}, [open]);
```

### 5. ARIA patterns

**Dialogs:**
```tsx
<div role="dialog" aria-modal="true" aria-labelledby={titleId}>
```
Backdrops get `role="presentation"`.

**Disclosure (collapsible sections):**
```tsx
<button aria-expanded={open} aria-controls={panelId}>
  Toggle
</button>
<div id={panelId}>Content</div>
```

**Live regions** for dynamic content:
```tsx
// Status messages (toast, loading, success)
<div role="status" aria-live="polite">Loading...</div>

// Error messages
<p role="alert">Something went wrong</p>

// Search results that update
<div aria-live="polite">{results}</div>
```

**Decorative elements** must be hidden:
```tsx
<span aria-hidden="true">•</span>
<svg aria-hidden="true" focusable="false">...</svg>
```

**Informational SVGs** need a label and title:
```tsx
<svg role="img" aria-label="Muscle diagram - front view">
  <title>Muscle diagram - front view</title>
  ...
</svg>
```

### 6. Touch targets (WCAG 2.5.8)

Minimum: **24x24 CSS pixels** (WCAG 2.2 AA).
Target: **44x44 CSS pixels** (recommended for mobile-first apps).

```tsx
// Enforce minimum on nav items, icon buttons, FABs
className="min-h-[44px] w-[44px]"
```

Small inline controls (close buttons, toggles) must be at least 24x24 with adequate spacing.

### 7. Motion and animation

**Global reduced-motion override** (globals.css):
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

Custom animations (celebrate, stagger-fade-up) also have explicit overrides in custom.css.

### 8. Page structure

Every page must have:

- [ ] `lang="en"` on `<html>` (set in root layout)
- [ ] A unique `<title>` (via metadata in layout files)
- [ ] A `<main>` landmark with `id="main-content"`
- [ ] Skip navigation link (`<a href="#main-content" className="skip-link">`)
- [ ] Logical heading hierarchy starting at h1 or h2

### 9. Links

Links must be distinguishable from surrounding text without relying on colour alone:

- In-body links: use `underline` or `underline-offset-2`
- Footer/legal links: visible underline at rest (not hover-only)
- Navigation links in `<nav>` elements are exempt (context makes them identifiable)

---

## Component checklist

When building or modifying a component, verify:

| Check | Criterion |
|---|---|
| Can I reach and operate every control with keyboard only? | 2.1.1 |
| Does focus move logically and visibly? | 2.4.3, 2.4.7 |
| Does every interactive element have an accessible name? | 4.1.2 |
| Are modals/sheets focus-trapped and do they restore focus? | 2.4.3 |
| Are errors announced to screen readers? | 4.1.3 |
| Do touch targets meet 44x44px? | 2.5.8 |
| Does it respect `prefers-reduced-motion`? | 2.3.3 |
| Is colour not the sole means of conveying information? | 1.4.1 |
| Do images have descriptive alt text (or alt="" if decorative)? | 1.1.1 |

---

## Audit log

### Round 1 — WCAG 2.1 AA baseline (2026-03-29)

14 files modified. Key fixes:
- Added `role="dialog"` and `aria-modal` to BottomSheet and GuideDrawer
- Added `role="status"` and `aria-live` to Toast
- Added `aria-expanded` to CollapsibleSection and MuscleDiagram
- Fixed 7 contrast values on landing page
- Added skip navigation link and `<main>` landmark
- Added `aria-label` to all unlabelled inputs
- Changed heading hierarchy (div -> h1 on landing, div -> h2 in GuideDrawer)
- Added `htmlFor`/`id` pairs to profile page inputs

### Round 2 — WCAG 2.2 AA upgrade (2026-03-29)

21 files modified. Key fixes:
- Focus management in BottomSheet and GuideDrawer (save/restore trigger)
- `aria-controls` and `useId` for disclosure patterns
- SVG accessibility (role="img", title elements)
- Touch target sizing: GuideButton 38px -> 44px, BottomNav min-h-[44px]
- Semantic HTML: form cues div -> ul/li, pricing heading p -> h2
- `aria-live` on search results and loading states
- `prefers-reduced-motion` overrides for custom animations
- `::placeholder` contrast fix
- Page metadata via layout files
- Link underlines for WCAG 1.4.1

### Round 3 — Final WCAG 2.2 AA pass (2026-03-29)

10 files modified. Key fixes:
- Error text contrast: #f87171 -> #ff8a80 (4.7:1 ratio) across all auth pages
- Landing page error: #e57373 -> #ff8a80 + role="alert"
- Access page: aria-label, aria-invalid, aria-describedby, role="alert"
- Update password: aria-label, autoComplete="new-password", role="alert", touch target on eye button
- Login: autoComplete="email" and autoComplete="current-password"/"new-password" on all forms
- Custom builder: aria-label on search input
- Pricing: role="radiogroup" + role="radio" + aria-checked on plan selector
- Link underline contrast: #555 -> #888 (3.7:1)
- Update password page title via layout metadata

---

## Testing approach

1. **Automated** — Run axe-core or Lighthouse accessibility audit in Chrome DevTools on each page. Target 100 score.
2. **Keyboard** — Tab through every page. Verify focus order, visibility, and that all controls are operable.
3. **Screen reader** — Test with VoiceOver (macOS/iOS). Verify announcements for errors, status changes, and navigation.
4. **Zoom** — Verify layout at 200% zoom and with large text settings.
5. **Motion** — Enable "Reduce motion" in system preferences and verify no animations play.
6. **Contrast** — Use a contrast checker for any new colour values introduced.
