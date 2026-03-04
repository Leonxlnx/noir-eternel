# NOIR ÉTERNEL — Complete Build Prompt

> I have 6 short video clips (~8s each, MP4) telling a cinematic perfume story. Build a scroll-driven, Apple-style frame-sequence website called **NOIR ÉTERNEL**. No frameworks — pure HTML, CSS, JS with GSAP and Three.js.

---

## Videos & Frame Extraction

| # | Folder | What happens | Frames |
|---|--------|--------------|--------|
| 1 | scene-01 | Black void → portal emerges | 98 |
| 2 | scene-02 | Portal → perfume bottle appears | 98 |
| 3 | scene-03 | Explosive golden burst | 98 |
| 4 | scene-04 | Cloud forms a ring | 98 |
| 5 | scene-05 | Infinity symbol | 98 |
| 6 | scene-06 | Heart shape finale | 98 |

Extract 98 frames per video as WebP (1920px wide, quality 80) via ffmpeg into `frames/scene-XX/frame_0001.webp` through `frame_0098.webp`. Total: 588 frames.

---

## Project Structure

`index.html`, `css/style.css`, `js/app.js` (canvas engine + GSAP), `js/beams.js` (Three.js shader), `frames/scene-01/` through `scene-06/`.

---

## Design System

**Fonts:** Google Fonts — Cinzel (400–700, display/headings) + Outfit (200–600, body/UI).

**Palette (CSS vars):** `--black: #000`, `--bg: #0a0a0a`, `--ivory: #f0ece4`, `--ivory-mid: rgba(240,236,228,0.6)`, `--ivory-low: rgba(240,236,228,0.25)`, `--gold: #c9a96e`, `--gold-dim: rgba(201,169,110,0.4)`, `--surface: rgba(255,255,255,0.04)`, `--border: rgba(255,255,255,0.06)`.

**Easings:** `--ease: cubic-bezier(0.16,1,0.3,1)`, `--ease-out: cubic-bezier(0.33,1,0.68,1)`.

**Selection:** `::selection { background: var(--gold); color: var(--black); }` — gold highlight everywhere.

---

## Loader

Brand text "NOIR ÉTERNEL" — each letter is a separate `<span class="fold-letter">`. CSS-only 3D fold-in animation: `rotateX(90deg) translateY(20px)` → `rotateX(0) translateY(0)`, 0.25s each, staggered from 0.01s to 0.15s across 12 letters. Loader fades out (opacity 0 + visibility hidden, 1s transition) when class "done" is added after frames load.

---

## Navigation (Fixed, z-index 1000)

**Layout:** Flex space-between, padding 1.4rem 3.5rem. On scroll > 100px, add `.scrolled` → padding compresses to 0.8rem 3.5rem (transition 0.5s).

**Left side:**
- Brand link "NOIR ÉTERNEL" — Cinzel 0.78rem, weight 600, tracking 0.3em, opacity 0.9 → **1 on hover** (0.3s transition)
- Tagline "Haute Parfumerie · Paris" — 0.58rem, weight 300, rgba(255,255,255,0.28), separated by 1px border-left (0.08 white opacity)

**Right side — glassmorphism card:**
- Background rgba(12,12,12,0.6), backdrop-filter blur(30px) saturate(1.3), border 1px solid rgba(255,255,255,0.06), border-radius 16px, padding 0.4rem 0.5rem, box-shadow 0 2px 20px rgba(0,0,0,0.4) + inset 0 1px 0 rgba(255,255,255,0.04)

**4 nav items** separated by 1px dividers (height 20px, rgba(255,255,255,0.08)):

1. **"Fragrance"** button + chevron → dropdown
2. **"Story"** button + chevron → dropdown
3. **"Atelier"** simple link
4. **"Collection"** simple link

**Nav link hover behavior:**
- Default: rgba(255,255,255,0.55), Outfit 0.72rem, padding 0.5rem 1rem, border-radius 12px
- **:hover** → color var(--ivory) + background rgba(255,255,255,0.06) (pill highlight)
- Simple links: only text brightens to ivory, no background
- **Chevron:** SVG 10×10, opacity 0.4, on parent hover → rotates 180° + opacity 0.8 (0.25s)

**Dropdown behavior:**
- Positioned absolute, centered below trigger (top: calc(100% + 0.8rem), left 50% translateX(-50%))
- Default: opacity 0, translateY(-8px), visibility hidden, pointer-events none
- **On parent .nav-item:hover** → slides to translateY(0), opacity 1, visible (0.3s ease-out)
- Background rgba(14,14,14,0.95), blur 30px, border-radius 16px, box-shadow 0 8px 32px rgba(0,0,0,0.5)
- Invisible bridge (::after, 1rem height) prevents hover gap between link and dropdown

**Dropdown cards:**
- Icon (36px, border-radius 10px, gold color, surface bg) + title (0.78rem, weight 500) + description (0.65rem, rgba(255,255,255,0.35))
- **Card hover** → background rgba(255,255,255,0.05)
- Arrow icon on wide cards: opacity 0.3 → **0.8 on hover**
- First card in each dropdown ("wide card") has bottom border separator

**Fragrance dropdown:** ✦ The Scent (wide + arrow), ◈ Notes, ♦ Collection
**Story dropdown:** ∞ The Journey (wide + arrow), ◉ Craftsmanship, ▲ Philosophy

---

## Canvas (Frame Scroll Engine)

Fixed fullscreen `<canvas>` (z-index 1, opacity 0.55, black background). DPR-aware (capped at 2x), cover-fit rendering.

Preload all 588 frames. Path: `frames/${sceneId}/frame_${zeroPad(f,4)}.webp`. Fallback timeout at 15s. After load, wait 200ms, add "done" to loader, then init GSAP.

**GSAP ScrollTrigger (one per scene):** `scrub: 1.8`, maps scroll progress to frame index within each scene section.

---

## Scene Content & Scroll Triggers

### Scene 1 — Hero (250vh, centered)
- Eyebrow: "The Essence of Eternity" (gold, 0.6rem, tracking 0.4em, uppercase)
- Display: "NOIR" / "ÉTERNEL" (Cinzel, clamp(3.5rem, 9vw, 8rem), line-height 0.95)
- Tagline: "Where darkness meets desire · A fragrance without boundaries" (0.82rem, weight 200, ivory-mid)

**Behavior:** Auto-visible on load via `requestAnimationFrame(() => classList.add('visible'))`. Children transition from opacity 0 + translateY(28px) → visible with staggered delays (0s, 0.1s, 0.2s). Text-shadow added on visible for readability. On scroll: GSAP scrub fades hero out (opacity→0, y→-60) from `top top` to `35% top`.

### Scene 2 — Portal (200vh, split layout)

**Left — Creative fragrance notes (.creative-left):**
6 horizontal note lines (Bergamot, Black Pepper, Oud, Amber, Vanilla, Musk) — each has a gold dot (6px, glow shadow), gradient bar (gold→transparent, varying widths 60–140px), and uppercase label (0.6rem, ivory-low). Two accent symbols between lines: ◆ and ∞ (Cinzel 1.4rem, gold-dim). Animated via GSAP timeline: lines slide from translateX(-40px) → 0, stagger 0.12s, power3.out. Accents scale from 0.5 with back.out. Trigger: `top 70%` → `50% top`.

**Right — Text (.text-right, margin-right: -3vw, max-width 480px):**
Chapter "I" (with CSS ::before "— " prefix), heading "Born From / The Unknown", body text. Trigger: `top 75%` → `55% top`, toggles `.visible` class.

### Scene 3 — Explosion (350vh, U-shape grid centered)
CSS Grid 2×3, max-width 900px. Words: "Explosive" (slides from left), "Elegance" (gold, slides from right), body text (fades up), "Ignites" (drops from top), "Senses" (slides up), "∞" (gold, scales in with elastic.out + rotateZ -180°→0). Font: Cinzel clamp(2.2rem, 5vw, 4.2rem). Trigger: `35% top` → `95% top`. Individual gsap.fromTo() calls with staggered delays (0–0.65s). On leave: fade to opacity 0.

### Scene 4 — Ring (350vh, centered)
Chapter "III", "The Ripple / of Desire", body text. Trigger: `35% top` → `95% top`, toggle `.visible`.

### Scene 5 — Infinity (350vh, right-aligned)
Chapter "IV", "Infinite / Resonance", body text. Trigger: `35% top` → `95% top`, toggle `.visible`.

### Scene 6 — Heart (400vh, centered)
Chapter "V", "Forever / Yours", body text. Trigger: `30% top` → `95% top`, toggle `.visible`.

---

## Text Animation System (CSS)

All `.text-wrap > *` children: opacity 0, translateY(28px), transition 0.9s with custom ease. On `.visible`: opacity 1, translateY(0). Staggered delays via nth-child (0.1s increments). Text-shadow on visible state for readability over video: `0 2px 40px rgba(0,0,0,0.95), 0 0 100px rgba(0,0,0,0.6)`.

Chapter labels: Cinzel 0.55rem, gold-dim, tracking 0.5em, CSS `::before { content: '— ' }`.

---

## Three.js Beam Shader (beams.js)

Container `#beams`: fixed, inset 0, z-index 2, pointer-events none, **mix-blend-mode: lighten**.

Three.js r128 WebGLRenderer (alpha true, DPR capped at 2). Fullscreen quad with custom ShaderMaterial.

**Fragment shader ("GradientBlinds"):** Rotated UVs (0.52 rad ≈ 30°), 4-stop dark gold gradient (colors: 0.55/0.35/0.08, 0.25/0.15/0.03, 0.45/0.28/0.06, 0.15/0.08/0.02), mouse-following spotlight (radius 0.5, softness 1.0), 12 blind stripes via fract(), film grain (0.3 intensity), scroll-based opacity dimming.

**Mouse tracking:** Dampened follow (factor 0.15). **Scroll dim API:** `window.beamsDim(true/false)` — smoothly fades opacity to 0/1 (lerp 0.03/frame). Triggered at scrollY > 50vh. Responsive blind count: `min(12, floor(width/50))`.

---

## Footer

Semi-transparent (rgba(0,0,0,0.65), blur 40px), padding 4rem 3rem. Gradient ::before fade (60px, transparent→black). Brand "◆ NOIR ÉTERNEL" + © 2026 left, Privacy/Terms/Contact links right (ivory-low → ivory on hover, uppercase, 0.68rem, tracking 0.18em).

---

## Responsive (max-width 768px)

Hide nav-card + tagline. Hide creative-left. Scene-content padding 5vw. Text-wrap full width, no margins. Display font clamp(2.5rem, 10vw, 4rem). Scene-split stacks vertically. Footer stacks centered.

---

## Scripts (end of body, NO defer)

Three.js r128 CDN → beams.js → app.js.

---

## Performance

Canvas DPR capped at 2. Three.js pixelRatio capped at 2. GSAP scrub 1.8. Frame preload timeout 15s. Target 60fps.
