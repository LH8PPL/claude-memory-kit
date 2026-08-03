---
date: 2026-08-03
topic: Visual design for a zero-dependency single-file viewer — design tokens from claude-mem, PAI/Pulse, EverOS, datasette, Primer, Vite, Caddy, Pico, Open Props, Radix (Task 260 research)
source: Two subagent surveys; all values read from primary source CSS (jsDelivr / GitHub raw / MDN / caniuse), plus locally rendered screenshots of our own page beside the references
tags: [task-260, task-255, viewer, visual-design, css, zero-dep, D-419]
---

# Viewer visual design — what makes a zero-dependency page look designed

**Why this note exists:** Task 255 shipped `cmk view` with the design brief "legibility over polish" — a call I made in passing, and the 255 grill never asked what the page should *look* like. The user's verdict on first sight: *"even just from looking at the first page i can say it is ugly."* Correct. This note is the outward research that should have preceded the build, and it is the input to Task 260 (the visual pass).

**The constraint is unchanged and non-negotiable** (design §24.1.7): ONE static HTML file, inline vanilla CSS/JS, ZERO dependencies, fully offline (no CDN, no fetched fonts, no framework). The finding below is that this constraint was never the problem.

## Screenshots

Rendered locally to `C:\tmp\cmk-view-refs\` (headless Chrome against a real `startViewer` on our real dogfood corpus):

| File | What |
| --- | --- |
| `ours-facts.png` / `ours-facts-dark.png` | our page today, light + dark |
| `ours-graph.png` / `ours-health.png` | our graph + health views |
| `claude-mem-feed.png` | claude-mem's viewer, dark, real feed |
| `claude-mem-card-variants.png` | **the money shot** — their three card kinds side by side |
| `everos-dash.png` | EverOS's zero-dep single-file dashboard |
| `pai-index.png` / `pai-docs.png` | PAI/Pulse chrome (data panes empty — daemon not running; honest caveat) |

## The one-sentence answer

> A handsome zero-dep page is **off-white with white panels, one tinted-neutral ramp, one accent used on ~5% of pixels, three spacing values, four type sizes, 1px alpha borders doing the work shadows usually do badly, and semantic color mapped strictly one-hue-per-meaning.**

**The empirical proof that shadows are not the answer:** Deno's docs ship **117 KB of compiled CSS with zero real drop-shadows** (grepped: 4 inert Tailwind ring placeholders and one `box-shadow: none`). Datasette has exactly one, for its modal. Both look good. Separation is done with 1px borders + one background step.

## Design tokens — actual values

### claude-mem (the direct competitor; `src/ui/viewer-template.html`, 2,402 lines, all CSS inline — architecturally identical to our page)

| Token | Light | Dark |
| --- | --- | --- |
| bg-primary (page) | `#ffffff` | `#1a1916` |
| bg-secondary | `#efebe4` | `#252320` |
| bg-card | `#ffffff` | `#252320` |
| bg-card-hover | `#f6f8fa` | `#2d2a26` |
| border-primary | `#d0d7de` | `#3a3834` |
| border-hover | `#0969da` | `#4a4540` |
| text-primary | `#2b2520` | `#dcd6cc` |
| text-secondary | `#5a5248` | `#b8b0a4` |
| text-tertiary | `#726b5f` | `#938a7e` |
| text-muted | `#8f8a7e` | `#7a7266` |
| accent-primary | `#0969da` | `#58a6ff` |
| accent-success | `#1a7f37` | `#16c60c` |
| accent-error | `#d1242f` | `#e74856` |
| **summary** bg/border/text | `#fffbf0` / `#d4a72c` / `#8a6116` | `#2a2724` / `#7a6a50` / `#d4b888` |
| **prompt** bg/border/text | `#f6f3fb` / `#8250df` / `#8250df` | `#262033` / `#6e5b9e` / `#9e8ccc` |
| **observation** bg/border | `#f0f6fb` / `#0969da` | `#1a2332` / `#527aa0` |
| badge bg | `rgba(<accent>, 0.12)` | `rgba(<accent>, 0.125–0.15)` |
| focus ring | `0 0 0 2px rgba(9,105,218,.3)` | `0 0 0 2px rgba(88,166,255,.2)` |

**Warm neutrals, never grey**: `#2b2520` ink, `#efebe4` panel, `#1a1916` dark ground. Geometry: body 14px · card radius 8px · card padding 24px (→20 →16 responsive) · card gap 24px · `line-height: 1.7` · title `17px/1.4/600/-0.01em` · meta 11px mono · badge `11px uppercase .5px radius 3px` · **feed column `max-width: 650px`** · transition `.2s cubic-bezier(.4,0,.2,1)`.

### PAI/Pulse — the cleanest naming scheme in the survey (3 surfaces / 3 lines / 3 inks / 3 statuses)

```css
--ground:#060B1A; --surface-1:#0F1A33; --surface-2:#141C38; --surface-3:#1A2444;
--line-1:#1A2A4D;  --line-2:#23305A;   --line-3:#2E3E6E;
--ink-1:#E8EFFF;   --ink-2:#A8A5C8;    --ink-3:#6B80AB;
--accent-blue:#3B82F6; --accent-soft:#9ACBFF;
--ok:#4ADE80; --warn:#FBBF24; --err:#F87171;
--radius: 0.75rem;
```

**The tint formula** — one rule generates every pill, tab and badge:
```
background: rgba(<hue>, 0.14) · color: <hue> · border: 1px solid rgba(<hue>, 0.30)
inactive:   bg rgba(168,165,200,.08) · color --ink-2 · border rgba(168,165,200,.22)
```
Type scale is deliberately one notch above Tailwind's (body **17px/1.55**). Micro-label used everywhere: `12px / 600 / uppercase / letter-spacing .12em / --ink-3`.

### EverOS — a genuinely handsome ZERO-DEP single-file dashboard (our exact shape)

```
ground #0d1117 · card #161b22 · card-hover #1c2128 · line #30363d · line-soft #21262d
ink #c9d1d9 · ink-strong #f0f6fc · ink-muted #8b949e · ink-faint #6e7681
accent #FFC53D · accent-tint #FFC53D22        (one accent, period)
radius 12/8/6/4/2px · padding 20px card, 16px 20px row · grid gap 16px · section gap 32px
shadow: 0 4px 12px rgba(0,0,0,.4) — TOOLTIP ONLY; cards use border, not shadow
```
Stat tile: label `12px uppercase #8b949e` → value `32px/600 #f0f6fc` → sub `12px #FFC53D`.

### Radix `slate` — the recommended neutral (contrast-guaranteed)

Twelve steps with **assigned semantics** (1 app bg · 2 subtle bg · 3 UI bg · 4 hover · 5 active · 6 subtle border · 7 border/focus · 8 hover border · 9 solid · 10 solid hover · **11 low-contrast text, guaranteed Lc 60 APCA on step 2** · **12 high-contrast text, Lc 90**). No other system here offers a contrast guarantee.

```css
/* light */ #fcfcfd #f9f9fb #f0f0f3 #e8e8ec #e0e1e6 #d9d9e0 #cdced6 #b9bbc6 #8b8d98 #80838d #60646c #1c2024
/* dark  */ #111113 #18191b #212225 #272a2d #2e3135 #363a3f #43484e #5a6169 #696e77 #777b84 #b0b4ba #edeef0
```

### Other verified sources

- **Pico v2** — best complete light+dark token set; radius `.25rem`, border `1px`, transition `.2s ease-in-out`, spacing `1rem`; ink `#373c44` (not `#000`); dark bg `#13161e`; **a card's border EQUALS its background in dark mode** (elevation by bg step alone). Its 7-layer blue-grey shadow is the most physically plausible in the survey and the most expensive — one floating surface only.
- **Open Props** — best scales: sizes `.25→30rem`, radii `2/5/16/32/64/128px` + `--radius-round`, shadow strengths as one retunable variable (dark mode needs **25×** the alpha), easings (`--ease-3: cubic-bezier(.25,0,.3,1)` is the UI workhorse). `--radius-conditional-*` auto-collapses rounding when an element goes full-bleed, no media query.
- **simple.css** — a centered column in three declarations, zero wrappers: `body { display:grid; grid-template-columns: 1fr min(45rem,90%) 1fr } body>* { grid-column:2 }`.
- **GitHub Primer** — density reference: body **14px**, code **13px** (smaller than body), inline code `0.9285em` (em-relative so it tracks its container), control height 32px, radius **6px** default, spacing only `.5/1/1.5rem` at component level, focus ring with a **negative** offset, `inset 0 0 0 1px` as a layout-free border. **The accent is a different hex per theme** (`#0969da`→`#4493f8`).
- **Vite's error overlay** — the best single-file example there is, and the direct model for trust-as-color: **five semantic colors, one meaning each** (red=error, yellow=code frame, cyan=file, purple=plugin, dim=stack), so you parse by color without reading. `border-top: 8px solid var(--red)` is the *entire* "this is an error" signal — no icon, no banner. Exactly two type sizes (16/13).
- **Datasette** — the closest philosophical match: page `#F8FAFB` (off-white, not white), ink `#111A35` (blue-shifted, not `#000`), **vertical rhythm is exactly two numbers (`.75rem` and `1rem`) across 3,888 lines**, tables use strong horizontal borders + nearly-invisible vertical ones and **zero zebra striping**, one accent hue does three jobs, messages are one alpha (`0.3`) over the page, dropdowns are native `<details>`, and there is **no global max-width** (tables run full-bleed; only forms are constrained).
- **Caddy's file-browse page** — one HTML file with full light/dark, a filter box and a data table (our exact shape). Sticky `th` in two lines, `%`-based gutters, whole-row-height clickable cells. Its weakness is the lesson: every color hardcoded twice, no custom properties, ~30 overrides — unpleasant at that size.

## Modern CSS worth using (support verified this session)

**Safe:** `color-scheme: light dark` (one line themes native controls + scrollbars — highest payoff per character on the list) · `light-dark()` (Baseline 2024; halves the theme CSS) · `color-mix()` (91.2%) · `oklch()` (91.6%) · `:has()` (92.7%) · CSS nesting (90.8%; keeps a single-file stylesheet navigable) · `:focus-visible` · `accent-color` · container queries · `@property` (transition a custom property — a trust meter) · `subgrid` (90.5%) · `text-wrap: balance/pretty` (Baseline 2024; balance caps at 6 lines in Chromium, 10 in Firefox — a heading tool) · `popover` (89.8%).

**Newer but safe on a current browser:** `scrollbar-color`/`scrollbar-width` (**Baseline Dec 2025**, standard, no `-webkit-`) — disproportionate payoff, since a default chrome scrollbar is the loudest un-designed element on a dark page · `field-sizing: content` (**Baseline June 2026**) · same-document view transitions (88.5%; degrades to an instant swap).

**Risky — progressive enhancement only:** CSS anchor positioning (**81.7%, absent from all iOS through 18.7**) — `@supports`-gate it or skip.

## Fonts

**UI sans (recommended):** `system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"`. `system-ui` is 95.5% supported. MDN warns it is for UI rather than long-form typesetting — which is exactly our case.

**Mono (recommended):** `ui-monospace, SFMono-Regular, "SF Mono", Menlo, "Cascadia Mono", Consolas, "Liberation Mono", monospace`.

**Numerics — the data-density detail:** `font-variant-numeric: tabular-nums` on **counts, dates, ids, sizes, trust scores, and anything that updates in place** (without it, right-aligned columns wobble and an in-place counter shifts the layout). Add `slashed-zero` on id/hash columns. **Do not** apply tabular figures to prose. `font-optical-sizing` buys nothing with system fonts — skip it.

**Three corrections to the common wisdom, verified:** (1) Tailwind v4's `--font-sans` does **not** start with `ui-sans-serif, system-ui` — it starts `-apple-system, BlinkMacSystemFont, 'Segoe UI'`. (2) `system-ui` on Windows 11 resolves to **Segoe UI, not Segoe UI Variable**, deliberately (Firefox bug 1732404, RESOLVED WONTFIX — Windows reports Segoe UI as its menu font); do not add `"Segoe UI Variable"` to the stack. (3) Primer's mono stack contains neither `Cascadia Mono` nor `Courier New`.

## Diagnosis of OUR page, specifically

From `ours-facts.png` beside the references:

1. **No card title.** Every fact is one undifferentiated 15px paragraph — the wall-of-text effect. Theirs stack four typographic tiers (tinted badge → 16px/600 title → muted body → 11px mono id·date).
2. **Measure far too wide** — ~1040px vs claude-mem's 650.
3. **Outlined badges** — five `border: 1px solid currentColor` pills per card is visual static; both references *tint* instead.
4. **No surface separation** — `#fbfaf8` page on `#ffffff` panels is a 2% delta, so borders do 100% of the work and nothing reads as a surface.
5. **The health strip is the loudest element on the page** — a full-width pale-green bar for the *good* state.
6. **The graph has a picture-frame of orphan dots** (~150 degree-0 nodes the force layout never relaxed) and labels overlapping on white.
7. **Markdown leaks into snippets** — `**Global install**:` and backticked spans render literally.
8. **Spacing rhythm inverted** — card padding 13px vs card gap 9px, so cards crowd each other more than their own contents.

## The ranked changes (input to Task 260)

1. Card **title** + clamp the measure to ~760px (biggest single win).
2. **Tint** the badges instead of outlining them (one rule, all badges).
3. Real **surface separation** with the warm ladder (page ≠ panel).
4. **Four type sizes** and one uppercase micro-label.
5. Fix the **rhythm** (4/8/12/16/20/24; padding 20, gap 14).
6. **Sticky header** with blur + real pill tabs.
7. Shrink the **health strip** to a pill; it becomes a bar only when not-ok.
8. **Rescue the graph** — drop degree-0 nodes, label only degree≥3 + hovered, tinted canvas, `paint-order: stroke` label halos, supersession edges at higher opacity than the rest.

Runners-up: strip/render the markdown in snippets · shrink the 335px tier `<select>` (its option labels are prose — move to `title`) · switch the health table to a row layout (glyph · title · right-aligned status · detail · fix command) so the CHECK column stops wrapping.

## Honest gaps

- No data-populated PAI/Pulse screenshot (the daemon wasn't running; only chrome rendered). Neither repo has screenshots in its README.
- claude-mem's viewer-delete history is inferred from issues + a current component grep, not a commit-by-commit trace.
- `color-mix()` appears in the recommended snippets; both reference projects use literal `rgba()` pairs instead, which is the safer substitution if support ever matters.
- Bun's docs were dropped from the exemplar list mid-survey: `bun.sh/docs` now redirects to a Mintlify-generated site with hash-named CSS — no longer a readable design source.
