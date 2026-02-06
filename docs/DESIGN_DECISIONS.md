# Design Decisions

Technical decisions and their rationale for the Job Intelligence Platform UI.

## Table of Contents

- [Animation: Framer Motion Removal](#animation-framer-motion-removal)
- [Color Scheme: High Contrast Glassmorphism](#color-scheme-high-contrast-glassmorphism)

---

## Animation: Framer Motion Removal

**Date:** 2026-02-05
**Status:** Removed
**Affected Files:** `GlassPanel.tsx`, `EmptyState.tsx`, `LogoHeader.tsx`, `SearchResultsHeader.tsx`

### What Happened

Framer Motion was originally included in v1.0.0 to provide entrance animations (fade-in, slide-up, scale effects) for the glassmorphism UI components. However, it caused persistent SSR hydration issues that resulted in invisible UI elements.

### The Problem

1. **Initial State Mismatch**: Framer Motion components render with `opacity: 0` as their initial state before animating to `opacity: 1`
2. **SSR/Hydration Race**: On the server, React renders the HTML but without JavaScript executing the animation
3. **Stale Chunks**: After rebuilding, browsers cached old JavaScript chunk URLs, causing 404s for animation code
4. **Invisible UI**: The combination resulted in components stuck at `opacity: 0` - appearing as a "dark mass" with no visible content

### Symptoms Observed

- UI appeared as solid dark background with no visible components
- Browser DevTools showed elements present but with `opacity: 0`
- 404 errors for `/_next/static/chunks/*.js` files
- Hard refresh / incognito didn't consistently fix the issue

### Solution

**Complete removal of Framer Motion** in favor of CSS-only animations:

```typescript
// BEFORE (problematic)
import { motion } from 'framer-motion';

export function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* content */}
    </motion.div>
  );
}

// AFTER (reliable)
export function EmptyState() {
  return (
    <div className="animate-fade-in">
      {/* content */}
    </div>
  );
}
```

CSS animations are defined in `tailwind.config.ts`:

```typescript
animation: {
  'fade-in': 'fadeIn 0.3s ease-out forwards',
  'slide-up': 'slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
},
keyframes: {
  fadeIn: {
    '0%': { opacity: '0' },
    '100%': { opacity: '1' },
  },
  slideUp: {
    '0%': { opacity: '0', transform: 'translateY(20px)' },
    '100%': { opacity: '1', transform: 'translateY(0)' },
  },
},
```

### Why CSS Animations Work

1. **Server-Safe**: CSS animations don't require JavaScript hydration
2. **No Initial State Issue**: Elements are visible immediately, animation is progressive enhancement
3. **Simpler Debugging**: No JavaScript library state to inspect
4. **Reduced Bundle Size**: Removed ~40KB of Framer Motion dependencies

### Recommendation

If complex animations are needed in future:
- Use CSS animations/transitions for entrance effects
- Reserve Framer Motion for gesture-based interactions (drag, pan, swipe) where CSS can't help
- Test SSR hydration thoroughly before deploying animation changes

---

## Color Scheme: High Contrast Glassmorphism

**Date:** 2026-02-05
**Status:** Active
**Files:** `app/globals.css`, `tailwind.config.ts`

### Design Philosophy

The UI uses a "glassmorphism" design language - translucent surfaces with blur effects that create depth. This is inspired by Apple's macOS design system.

**However, aesthetics must not compromise accessibility.** High contrast is essential for:

1. **Accessibility (WCAG compliance)** - Users with visual impairments, color blindness, or age-related vision changes need sufficient contrast
2. **User adoption** - Easy-to-read interfaces encourage usage; hard-to-see UIs frustrate users
3. **Diverse viewing conditions** - Bright offices, dim rooms, varying monitor quality
4. **Screen sharing** - Video compression on Zoom/Teams/Meet reduces contrast further

### Original Problem

Initial opacity values were too low for practical use:

| Element | Original | Problem |
|---------|----------|---------|
| Glass background | `0.03` | Nearly invisible on dark background |
| Glass border | `0.08` | Too subtle to define panel edges |
| Glass hover | `0.08` | Hover state barely noticeable |

This created accessibility barriers and usability issues.

### Current Values (High Contrast)

Updated for demo/presentation visibility:

```css
.glass {
  background: rgba(var(--color-glass), 0.12);      /* was 0.08 */
  border: 1px solid rgba(var(--color-glass-border), 0.25);  /* was 0.15 */
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.35),                /* was 0.25 */
    inset 0 0 0 1px rgba(255, 255, 255, 0.12);    /* was 0.08 */
}

.glass-card:hover {
  background: rgba(var(--color-glass), 0.18);     /* was 0.12 */
  border-color: rgba(var(--color-primary), 0.5);  /* was 0.4 */
}
```

### Color Palette Origin

The color scheme uses:

| Color | Value | Source |
|-------|-------|--------|
| Primary | Indigo-500 (`#6366f1`) | Tailwind's default indigo palette |
| Background | `rgb(10, 10, 15)` | Near-black for maximum glass contrast |
| Text primary | `#ffffff` | Pure white for readability |
| Text secondary | `#a1a1aa` | Zinc-400 for de-emphasized text |
| Text muted | `#71717a` | Zinc-500 for placeholders |

### Adjusting Contrast

To increase contrast further, modify CSS custom properties in `globals.css`:

```css
:root {
  /* Increase these values for more visible glass panels */
  --glass-bg-opacity: 0.15;       /* range: 0.08 - 0.25 */
  --glass-border-opacity: 0.30;   /* range: 0.15 - 0.40 */
}
```

Or add a high-contrast mode toggle:

```css
.high-contrast .glass {
  background: rgba(var(--color-glass), 0.20);
  border: 2px solid rgba(var(--color-glass-border), 0.40);
}
```

### Testing Contrast

**Accessibility testing:**
1. Use browser DevTools to simulate vision deficiencies (Chrome: Rendering > Emulate vision deficiencies)
2. Test with screen readers to ensure all interactive elements are discoverable
3. Check WCAG contrast ratios - aim for 4.5:1 for normal text, 3:1 for large text
4. Test on low-quality/uncalibrated monitors

**Video call testing:**
1. Share screen on target platform (Zoom/Teams/Meet)
2. View on a second device or have colleague check
3. Adjust opacity values until panels are clearly visible
4. Test at different window sizes (compression varies)

### Principle

**When in doubt, increase contrast.** A slightly less "glassy" effect that everyone can use is better than a beautiful UI that excludes users.
