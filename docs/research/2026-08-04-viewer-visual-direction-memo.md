---
date: 2026-08-04
topic: cmk view visual direction — the measured diagnosis + one design position ("instrument panel over a warm archive") for the viewer redesign
source: 5-domain parallel design survey (graph-viz, dev-tool UI, knowledge apps, dark-UI craft, dense lists) synthesized against the actual viewer source + a palette-validator run on our real colors
tags: [task-268, task-260, viewer, visual-design, redesign, D-425]
---

# `cmk view` — visual direction memo

*Grounded in the 5 surveys + a read of the actual source (`packages/cli/src/viewer-page.html`, `viewer.mjs`) + a run of the palette validator against our real colors. Measured numbers are from the code, not estimated.*

---

## 0. The measurements the diagnosis rests on

| What | Measured value | Where |
|---|---|---|
| Facts shown on landing | **50** (`VIEWER_DEFAULT_LIMIT`) of ~2,300 = **2.2%** | `viewer.mjs:87` |
| Graph node source | newest **200** by `created_at`, then orphans dropped → **~71** = **3.1%** | `viewer.mjs:629`, `viewer-page.html:1020` |
| Largest type anywhere on the page | **16px** (`.brand h1`) | `viewer-page.html:152` |
| Full type range on the page | 11px → 16px = **1.45× total** | tokens block |
| Node radius formula | `5 + Math.min(7, deg*1.4)` → 6.4px at deg 1, **hard-capped at 12px** | `:1108` |
| Repulsion force | `f = 2600 / d²` — **identical for every pair, degree-blind** | `:1054` |
| Pixel budget per node | 71 nodes / ~900×560 = **7,100 px² each**; an r=6.4 dot is 129 px² = **1.8% of its share** | computed |
| Hues on the page | **6**, all rendered as 11px pills at 13% tint alpha | tokens + `.badge` |
| Continuous encodings anywhere | **zero** — `trust_score` is returned by the server and never drawn | `viewer.mjs:650` vs `:1112` |

**Verified palette finding (I ran the validator, I did not eyeball it):**

```
### CURRENT light trust node colors (#176f30, #805a14, #676158) on canvas #eae4da:
  [FAIL] Chroma floor        #805a14 (0.095), #676158 (0.016) — below floor, READ AS GRAY
  [FAIL] CVD separation      worst pair ΔE 3.6 (protan)
  [FAIL] Normal-vision floor worst pair #676158↔#805a14 ΔE 7.9 — below the 15 floor

### CURRENT dark trust node colors (#4ec97a, #e0b055, #aaa399) on canvas #1f1d1a:
  [FAIL] Lightness band      ALL THREE outside L 0.48–0.67 (0.75 / 0.78 / 0.72)
  [FAIL] Chroma floor        #aaa399 (0.016)
  [FAIL] Normal-vision floor worst pair ΔE 12.4
```

Read that literally: **a full-colour-vision viewer cannot reliably tell "medium trust" from "low trust" on our graph today.** Not a preference — a computed failure.

---

## 1. The diagnosis — why it still reads dull, ranked

### #1 — [TYPE] Nothing on the page is big. There is no display tier.

Max type is **16px**. Everything else is 11–15px. Total range 1.45×.

Every reference class in survey 2 has a display tier at 28–80px with a negative tracking ramp (Linear 80/-3.0 → 16/-0.05; Warp 64/-1.6; Vercel 48/-2.28). Survey 2 calls the tracking ramp *"the highest-leverage 'looks designed' change available with system-ui and no font file."* **We can't have a tracking ramp because we have no large type to hang it on.**

A page whose loudest element is a 16px `h1` reads as a settings dialog regardless of palette. This is the single largest cause and it is the cheapest to fix.

### #2 — [STRUCTURE] 50 identical rounded white boxes, stacked.

`.card` = `#ffffff`, `border-radius: 10px`, `1px solid`, `margin-bottom: 14px`, on `#f2efe9`. Fifty of them, at one measure, in one rhythm, each carrying 3–5 identically-shaped 11px pills.

Survey 5's verdict is unambiguous and every craft-tier source it could read source for agrees: **cards do not share boundaries.** N items = N separate visual objects + N borders + N radii + N shadows-or-not. Primer uses `border-block-end` per cell. Sentry uses flex rows + 1px `::before` column rules. NetNewsWire literally sets `drawsGrid = false` and lets rhythm do it. Grafana uses transparent reserved borders + hover. **None of them wraps records in cards.**

The visual result of our current shape is *uniform texture with no rail* — the eye has nothing to track down the page.

### #3 — [DENSITY] The page shows 2% of itself, and never states its own scale.

2,300 facts exist. The landing renders 50 and says `newest 50`. There is no count, no distribution, no timeline, no tier breakdown, no aggregate object of any kind.

The most impressive true fact about this product — *you have 2,300 durable facts and it never forgot one* — is **never on screen**. That is not a styling problem; it's a missing object. Survey 1's sharpest structural note applies inverted: *"an always-visible empty detail panel actively advertises that the graph is small."* Ours advertises smallness by omission instead.

### #4 — [COLOR — and it is a real colour problem, but not the one it looks like] The palette was tuned as *text* colour and reused as *data* colour.

Those are different objectives and nobody owned the seam. This is a textbook composition failure:

- **Text colour** optimises luminance contrast against a *surface* (4.5:1 AA). The tokens block says so explicitly, and it did that job correctly.
- **Data colour** optimises chroma separation from *each other* (CVD ΔE ≥ 8, chroma ≥ 0.1, L in band, ≥3:1 per WCAG **1.4.11**).

`#805a14` at chroma 0.095 and `#676158` at chroma 0.016 are, as marks, **two greys**. In dark mode all three node fills sit above the lightness band, which is why the dark graph reads washed rather than luminous.

Second half of the colour problem: **six hues exist on the page, and every one of them appears only as an 11px pill at 13% alpha.** Chroma is present but homeopathically distributed. There is no single saturated region anywhere. Vercel's own brief: *"Design in monochrome; use colour only when it encodes meaning."* We did the opposite of both halves — colour everywhere, saturated nowhere.

### #5 — [STRUCTURE, graph] The graph draws the wrong 71 nodes with a degree-blind force.

Three compounding faults, none of them palette:

1. **Wrong selection.** `ORDER BY created_at DESC LIMIT 200` picks the **newest** facts — precisely the slice that has had the least time to accumulate links. Then we drop orphans. We are selecting *against* the structure we want to draw.
2. **Degree-blind repulsion.** `f = 2600/d²` is constant per pair. Survey 1, from the ForceAtlas2 paper: the dandelion silhouette is a *direct function* of degree-scaled repulsion `Fr = Cr·(deg(a)+1)·(deg(b)+1)/d`. A constant charge **structurally cannot produce it** — it yields an even mesh. We have the mesh the maths predicts.
3. **Dust-sized nodes with a capped ramp.** 6.4px at degree 1, **clamped at 12px**. A degree-40 hub renders identically to a degree-5 node. 1.8% of each node's pixel share is inked.

---

## 2. The hypothesis — verdict

> *"graphify looks dramatic because it renders ~500 nodes with visible community structure while we draw ~71. If true, no palette change alone fixes it."*

**The conclusion is right. The stated cause is wrong, and the wrong cause points at an expensive non-fix.**

**SUPPORTED — no palette change alone will fix the graph.** Confirmed twice, independently:
- *Mechanically:* the shape is produced by the layout, not the renderer. Degree-scaled repulsion or no dandelions, at any node count, in any palette (survey 1 / FA2).
- *Empirically:* I ran the validator. A node-link graph is an **all-pairs** form — any two communities can land adjacent on screen. Under `--pairs all` on a dark surface, the validated categorical palette **caps at three slots**. Slot 4 fails (`#c98500↔#d95926` normal-vision ΔE 10.6). Slot 5 fails hard (`#d55181↔#199e70` CVD ΔE 1.6). **graphify's 7–9 saturated community colours are not honestly shippable under AA.** The look you're admiring is partly an accessibility failure. Palette is capped by arithmetic, not by nerve.

**REFUTED — the strong form ("we need ~500 nodes").**
- Connected Papers ships **~50 nodes in production** and reads dense — with *zero* categorical colour. Two continuous ramps + weighted edges.
- 500 uniform-degree nodes would be a *bigger mesh*, not a dandelion. Node count is not the causal variable.

**The causal variable is degree spread**, and ours is flat for two fixable reasons: we select the newest (least-linked) facts, and we throw away the hub layer we already have on disk (`write_source` has ~4–8 distinct values across 2,300 facts — those are degree-200 hubs waiting to be drawn).

**Fix ranking, most to least causal:** degree heterogeneity → node size → labels → *which* 250 we pick (not *how many*) → layout algorithm → canvas polarity → palette.

Palette is last. Canvas polarity is second-to-last. **Answering "still dull" with a dark theme would be the colour answer to a structure problem.**

---

## 3. Recommended direction — one position

> ## "An instrument panel over a warm archive."
> **Keep the warm light identity for everything you read. Give the product exactly one permanently dark, permanently saturated region — the graph — and treat it as the hero object, not the fourth tab. Then fix the dullness where it actually lives: type scale, list structure, and one aggregate that shows the 2,300.**

**Why not dark-first, concretely:**

- **The dull-ness is polarity-invariant.** Ship today's page in dark mode and you get 50 identical dark boxes, a 16px maximum type size, and six 11px pills. Identical verdict.
- **This is a reading surface.** 2,300 records, prose bodies, Why/How rationale. NN/g's cited research (Piepenbrock 2013, Dobres 2017) finds light measurably better for normal vision; Flexoki's entire ink-on-paper argument is aimed at exactly this content.
- **The authority argues against it.** Survey 1's Gephi Lite entry is the *sigma.js maintainers* deliberately making all chrome neutral grey-and-white so the graph is the only chromatic object — stated goal: graphs *"stand out, full of colour, like fireworks at the centre of the screen."* The drama comes from chroma contrast between canvas and data, **not from the canvas being dark.**
- **Dark-first would make us a Linear clone.** Warm-light + one warm-dark canvas is a position nobody else in this reference class holds.
- **We already paid for the light palette.** It is AA-clean and hand-tuned. Discarding it re-opens a solved contrast problem to buy a resemblance.

**The graph canvas: `#221f1b`, warm-dark, in BOTH page modes.**

Warp's oklch(22% 0.004 84.6) is the reference — chroma 0.004, hue 85 (yellow-orange). That is the **same hue family as our `#f2efe9` ground, inverted**. It composes with our identity instead of fighting it. It sits between our light ground and our existing `#1a1916` dark ground, so it reads as one product in both modes.

**Not navy.** cosmos.gl ships neutral `#222222` as its library default (verified from `config.ts`); the navy is graphify's unverified product choice layered on top. Copying it buys resemblance to one competitor at the cost of coherence with ourselves.

**Practical bonus, and it's the argument that seals it:** a permanently-dark canvas means **one graph palette, one validation run, one contrast test** — instead of two of each, forever.

---

## 4. The steal list — 12 techniques

Ranked by (impact ÷ difficulty). Every value below is copy-pasteable.

---

**1 · Display type tier + negative tracking ramp** — *[survey 2: Linear / Warp / Vercel]*
```css
--t-display: 34px;  /* view title */   letter-spacing: -0.8px; line-height: 1.08;
--t-stat:    40px;  /* the count */    letter-spacing: -1.0px; font-variant-numeric: tabular-nums;
--t-title:   20px;  letter-spacing: -0.2px;
/* 16 / 15 / 13.5 / 12 / 11 keep their current tracking; ramp reaches 0 at 14px */
.micro { letter-spacing: +0.12em; }   /* inverse rule: caps go POSITIVE — already correct */
```
Add a real `<h2>` per view ("Memory", "Graph", "Health", "Decisions") at `--t-display`.
**Fixes:** diagnosis #1, the largest cause. **Difficulty: trivial** (CSS only, font-agnostic, works on system-ui).
> ⚠ The most likely way this fails is under-doing it. 20px is not a display tier. Go to 34.

---

**2 · Rows, not cards, in the list** — *[survey 5: Primer / Sentry / NetNewsWire / Grafana]*
```css
.list { background: var(--panel); border: 1px solid var(--line-soft);
        border-radius: var(--r-card); }          /* ONE panel */
a.row { display: grid; grid-template-columns: 20px 1fr auto; gap: 4px 16px;
        padding: 10px 16px; border-bottom: 1px solid var(--line-soft);
        border-top: 1px solid transparent;        /* reserve selection border */
        text-decoration: none; }
a.row:last-child { border-bottom: 0; }
a.row:hover { background: rgba(var(--ink-3-rgb), .05); }  /* ALPHA, never solid */
a.row:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }  /* INSET */
```
Keep `.card` for the **detail** view — a single object should read as an object.
**Fixes:** diagnosis #2. Removes 50 borders + 50 radii + 50 margins, replaces them with one panel + 49 hairlines + one continuous left rail. **Difficulty: easy-medium** (touches `viewFacts` + CSS).

---

**3 · 20px reserved status gutter, unconditionally** — *[survey 5: NetNewsWire `boxLeftMargin` = 4 + 8 + 8]*

Compute the text rail from `padding + dot + gap` and apply it **whether or not** the indicator renders. Survey 5: rows that jog horizontally when an item lacks a status are *"the single most common tell of an amateur list."*
**Difficulty: trivial** (it's the `20px` in the grid above).

---

**4 · Trust as a 3px left bar, not a pill** — *[survey 5: Grafana `logsRowLevel`, verbatim]*
```css
.row .trust { position: relative; }
.row .trust::after { content:''; position:absolute; top:1px; bottom:1px;
                     width:3px; left:4px; background: var(--hue); border-radius: 2px; }
```
The 1px top/bottom inset is what makes it read as *this row's* bar rather than a continuous stripe.
**Fixes:** removes one of the 3–5 pills per row, frees the meta gutter, encodes an ordinal in zero horizontal space.
> ⚠ **Colour-only ordinal is a known a11y failure** (survey 5 flags this as an unaudited gap in its own recommendation). Keep the trust word in the row `title` and in the detail view. Non-negotiable.
**Difficulty: easy.**

---

**5 · Density ladder that does not move the left edge** — *[survey 5: Primer `Table.module.css`, verbatim]*
```css
[data-density="condensed"] { --pad-b: 4px;  --pad-i: 8px;  --clamp: 1; }
[data-density="normal"]    { --pad-b: 8px;  --pad-i: 12px; --clamp: 2; }
[data-density="spacious"]  { --pad-b: 12px; --pad-i: 16px; --clamp: 3; }
.row > *:first-child { padding-inline-start: 16px; }  /* Primer's comment: */
.row > *:last-child  { padding-inline-end: 16px; }    /* "type aligns regardless of cell padding" */
```
Computed row heights land at Primer's clean 8px ladder: **29 / 37 / 45px**.
**Fixes:** a 2,300-fact browser with one density is wrong; and the control itself is a visible "someone designed this" signal. **Difficulty: easy.** Highest value-per-line in survey 5.

---

**6 · The overview object — stat tiles + a capture-per-week strip** — *[surveys 2 & 5 + the dataviz form heuristic]*

The one item on this list that is not pure CSS. It needs a small `/stats` aggregate route.
```
2,347          14           9              182
FACTS          THIS WEEK    DECISIONS      SUPERSEDED
```
`--t-stat` 40px tabular-nums over the Cursor micro-label recipe (**11px / weight 600 / uppercase / letter-spacing 0.88px**). Below it, a 26-week bar strip: plain divs, `height: N%`, single sequential hue.

**Validated ramp for the strip** (I ran `--ordinal`, both surfaces, all checks PASS):
| | light on `#f2efe9` | dark on `#221f1b` |
|---|---|---|
| 4-step | `#6da7ec` `#2a78d6` `#1c5cab` `#0d366b` | `#86b6ef` `#3987e5` `#256abf` `#184f95` |

**Fixes:** diagnosis #3 — the archive's scale becomes visible. **Difficulty: medium** (server work). **This is the single highest-impact non-CSS item on the list.**
> Honest tension: Vercel's reject list names *"metric boxes"* as a generated-design reflex. The distinction that makes it legitimate here: a metric box is decoration when the number isn't the point, and it's the artefact when the count **is** the product's claim. 2,347 is the claim.

---

**7 · `content-visibility: auto` — render the whole corpus, keep Ctrl+F** — *[survey 5: MDN, Baseline Sept 2024]*
```css
a.row { content-visibility: auto; contain-intrinsic-size: auto 37px; }
```
**Why this and not a JS virtualizer:** MDN is explicit that with `auto`, off-screen content **stays available to find-in-page, tab order, and text selection**; `hidden` loses all three. On a searchable facts archive, silently breaking Ctrl+F is a worse regression than the scroll perf it buys. **Difficulty: easy in CSS; requires raising the server list cap, which is the real work.**

---

**8 · Alpha hover / selection + hairline dividers at Radix step 6** — *[surveys 2 & 5: Primer + Radix + Linear, three-way convergence]*
```css
--hairline: .5px;              /* Linear's token; declare 1px first as fallback */
/* hover  = slate a4 · selected = slate a5 — ALPHA composes over a status-tinted row,
   a solid grey erases it. Primer light #818b981a / #818b9826; dark #656c7633 / #656c7640. */
```
No zebra striping — Primer, Grafana and NetNewsWire all omit it; Vercel makes it an opt-in prop. **Difficulty: trivial.**

---

**9 · Procedural film grain, inline, zero assets** — *[survey 4: CSS-Tricks + MDN]*
```css
body::after {
  content:''; position:fixed; inset:0; pointer-events:none; opacity:.03;
  background-image: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
}
```
Two mandatory details: **`%23` for `#`** (or it parses as a fragment) and **`stitchTiles='stitch'`** (or tile seams are visible). `fractalNoise`, not `turbulence`.
**Fixes:** the flat-hex look; on the dark graph canvas it also dithers 8-bit banding away for free.
✅ **Verified unblocked:** our CSP is `img-src data:` (`viewer.mjs:113`) — this will not be blocked.
**Difficulty: easy, but the escaping is the most likely silent failure on the whole list — test it first.**

---

**10 · ForceAtlas2 degree-scaled repulsion + phyllotaxis seeding** — *[survey 1: FA2 paper + d3-force]*

Replace lines 1046–1074:
```js
// seed: phyllotaxis, verbatim from d3 — 4 lines, removes the explosion frame, deterministic
const A = Math.PI * (3 - Math.sqrt(5));
nodes.forEach((n,i) => { const r = 10*Math.sqrt(0.5+i);
  n.x = W/2 + r*Math.cos(i*A); n.y = H/2 + r*Math.sin(i*A); });

// repulsion: FA2 — degree-scaled, /d not /d². THE substitution that buys dandelions.
const f = Cr * (a.deg+1) * (b.deg+1) / d;
// attraction: LinLog, for separated community lumps
const fa = Ca * Math.log(1 + d);
// gravity: degree-scaled, stops islands drifting
n.vx += Cg * (n.deg+1) * (W/2 - n.x);
```
Then **precompute 2,000 ticks before first paint** (at 250 nodes that's 31k pairs/tick — well under a second) and **best-of-5 on edge crossings** (Purchase 1997: crossings dominate comprehension; ~4,950 segment-pair tests is instant, and this is only tractable *because* the graph is small — the one place 71 nodes is an advantage over 500).
**Difficulty: medium.** ~40 lines changed. **⚠ The FA2 paper explicitly warns LinLog requires re-tuning `Cr`. Budget a tuning session against the real corpus, not a one-shot.**

---

**11 · Flannery node sizing — remove the clamp** — *[survey 1: Flannery 0.57 exponent]*
```js
const scale = Math.sqrt((W*H) / (N * 7000));      // absolute size ~ sqrt(area/N)
const r = (6 + 4 * Math.pow(n.deg, 0.57)) * scale;  // NO Math.min()
```
Current: 6.4px @ deg 1, capped 12. New: 10px @ deg 1, 21px @ deg 10, 36px @ deg 40. Humans systematically **underestimate area**, which is why 0.57 beats 0.5.
**Survey 1's verdict, and I agree: this single change does more for a 70-node graph than any colour decision.** **Difficulty: one line.**

---

**12 · Sigma's LabelGrid — label nearly everything** — *[survey 1: `core/labels.ts`, verbatim]*
```js
const cols = Math.ceil(W/100);
const cell = Math.floor(y/100)*cols + Math.floor(x/100);
// per cell: sort by size DESC, then key ASC (deterministic — kills frame-to-frame flicker)
// show top ceil((cellArea/ratio² * density) / cellArea)
```
At 900×560 that's **54 cells for 71 nodes** — essentially every node gets a label, spatially even, never stacked, and it degrades gracefully as the graph grows. Delete `LABEL_AT = 3`.
Keep the existing `paint-order: stroke` halo — **that's already right**; just repoint `stroke` at the new canvas colour.
**Fixes:** hidden labels are what make a small graph read as a debug dump. Survey 1: highest value-per-line in the whole survey, and *"the thing a 500-node graph physically cannot have."* **Difficulty: easy (~40 lines).**

---

*Runners-up, cheap, take them if the budget holds:* hover-dim the graph to α 0.2 except the hovered neighbourhood over 200ms + scale hovered node to 1.1× over 100ms (Quartz, verified values) · **white ring** for hover/focus, never a fill change (Cosmos — selection must never overwrite the encoded colour) · `text-wrap: balance` on headings / `pretty` on prose · concentric radius `outer = inner + padding`.

---

## 5. The graph — concrete plan

### Canvas
- **`#221f1b`, warm-dark, permanently, in both page modes.** Grain overlay at 0.03.
- Optional vignette: `radial-gradient(ellipse 120% 80% at 50% 40%, transparent 40%, rgba(0,0,0,.35) 100%)`.
- Desaturate all surrounding chrome so the canvas is the only chromatic region on screen (Gephi Lite).
- **Stay on SVG.** Canvas-2D buys additive `lighter` compositing but costs free links, focus, hover, `<title>` tooltips and the a11y tree — all of which a read-only browser needs more than it needs bloom. Glow via **one shared** `feGaussianBlur` + `feMerge` on a duplicate node group (never per-node), with the filter region widened to `x="-100%" y="-100%" width="300%" height="300%"` — MDN's default `-10%/120%` clips it.

### What colour should encode — and the hard cap

**Not trust.** Three ordinal levels → three blobs of identical dots; within a blob the picture is information-free (Connected Papers). Our current trust colours also fail the validator outright in both modes (§0).

**Hue = community. Hard-capped at 3 + "Other" (neutral).** This is arithmetic, not taste — the validator caps a node-link graph (an all-pairs form) at three slots on a dark surface:

| Slot | Hue | Hex (dark) | all-pairs on `#221f1b` |
|---|---|---|---|
| 1 | blue | `#3987e5` | ✅ ALL CHECKS PASS |
| 2 | orange | `#d95926` | worst CVD ΔE 9.4 (deutan) |
| 3 | aqua | `#199e70` | worst normal-vision ΔE 20.9 |
| — | Other | `#8a8279` | fold everything past 3 |

Slot 4 fails (ΔE 10.6 normal-vision). Slot 5 fails hard (ΔE 1.6 deutan). **Assign in fixed order, never cycled. A 4th community folds to Other — it does not get a generated hue.**

**This is the honest answer to "graphify's saturated community colours":** we can have three of them, and the remaining community structure must be carried by **position** (the FA2 layout) and **labels**. That is exactly Connected Papers' position, and it's why they look full at 50 nodes with zero categorical colour.

**Do NOT also modulate lightness by recency.** Double-encoding on the fill pushes nodes out of the L 0.48–0.67 band and breaks every CVD gate. **Recency belongs in the overview's week-strip**, not on the graph.

### Final encoding set — five honest channels
| Channel | Encodes | How |
|---|---|---|
| Position | structure | FA2 layout — the primary encoding |
| Radius | degree | `(6 + 4·deg^0.57) · scale`, uncapped |
| Fill hue | community | 3 slots + Other, validated all-pairs |
| Rim arc | trust | arc **fraction** — high = full ring, medium = ⅔, low = ⅓. Shape, not colour → CVD-immune, and it fixes the a11y gap for free (Kumu "flags", ~12 lines) |
| Shape | node kind | disc = fact · ring = anchor/source hub |

Edges keep their current logic — **that part is already correct.** Association at α 0.3, supersession at full strength with the arrow. Only repoint the association stroke to something that clears **3:1 against the new canvas** (WCAG 1.4.11 — the current `--ink-3` at α 0.3 almost certainly does not).

### Node cap — raise it, but change *which*, not just *how many*
- Current pick is the worst possible: **newest 200**, i.e. the least-linked slice.
- **Change to: top-N by degree (join on `edges`), then expand to depth-1 neighbours. Draw ~250–300.**
- Why 300: O(n²) × 320 ticks = 14.4M ops, sub-second. At 800 it's 100M+ and the page visibly hangs before first paint. **300 is also where LabelGrid still labels most nodes** — past that the labels go, and the labels are the intentionality signal.

### Manufacture hubs — the move that makes the density question moot
Promote **`write_source`** (and optionally `tier`) to graph nodes. This is Quartz/Obsidian's `showTags: true`, adapted. ~4–8 distinct sources over 2,300 facts → instant degree-100+ hubs → **instant dandelions once repulsion is degree-scaled**.

Anchors are already nodes (`kind: 'anchor'`), so half of this exists.

> ⚠ **This changes what the graph MEANS, and it is a taste call, not an implementation detail.** It is manufactured structure, not discovered structure — Meeks' warning about arbitrary positioning applies in spirit. Ship it as a default-on toggle ("show source hubs") so the honest citation-only graph is one click away.

### Community detection — worth it? **Yes, but second, and gated.**
- **Sequence it after hub-promotion + FA2.** Run label propagation *first*, on today's uniform-degree graph, and you get one giant component plus singletons — the colours would be noise.
- Once hubs exist and repulsion is degree-scaled, the silhouette comes from the **layout** for free and the hub *is* the community label. Label propagation (~30 lines) then becomes a refinement that assigns the three colours, not a prerequisite.
- **Gate it:** if it yields ≥2 communities of ≥3 nodes, colour by community. If it degenerates, fall back to colouring by `write_source`. Either way, fold past slot 3 into Other.
- Cheap follow-on: **bridge-node styling** — a distinct stroke on nodes whose neighbours span >1 community. ~8 lines, adds a readable second structural layer, and it's valuable *specifically because* at 71–300 nodes the eye has capacity for one.

### Sidebar — yes, but not graphify's
Ours is a **filter + legend + count rail**, always visible:
```
COMMUNITIES        DRAWN 247 / 2,347 facts
● capture-turn          88
● cmk remember          61
● auto-extract          44
○ other                 54
```
Three jobs at once: (a) it's the legend, which the a11y rules make **mandatory** for ≥2 series — identity is never colour-alone; (b) click-to-isolate; (c) **it states the corpus size, so the canvas being sparse stops reading as "there is nothing here."**

**Critical inversion from Gephi Lite:** the *detail* panel appears **only on selection**. An always-visible empty detail panel is the single most self-inflicted cause of a page looking under-populated.

---

## 6. What to explicitly NOT copy

| Don't | Why |
|---|---|
| **Dark navy canvas as identity** | cosmos.gl ships neutral `#222222` (verified from `config.ts`). The navy is graphify's unverified product choice. Copying it buys resemblance to one competitor and fights our warm palette. |
| **iwanthue palettes as published** | Tuned for **light** backgrounds. I ran the 8-colour `k-means-intense` set on dark: **FAIL on 4 of 5 checks** — `#58582d` at 2.36:1 contrast, three entries below the chroma floor, worst pair CVD ΔE 2.6. The survey flagged this; the validator makes it definitive. |
| **7–9 community hues** | Not shippable under AA on an all-pairs form. Three + Other. Position and labels carry the rest. |
| **Radial / circular layouts to fill the frame** | Meeks: *"obscures actual network structure through arbitrary positioning."* A `forceRadial` nudge at strength 0.2 is fine; pushing it to fill space trades the truth of the picture for the look of it — and in a **memory** browser the truth of the picture is the product. |
| **Cards for the list** | Survey 5's core verdict. Keep them for the detail view only. |
| **Zebra striping** | Primer, Grafana, NetNewsWire all omit it; Vercel makes it opt-in. Dividers + alpha hover already do that job. |
| **A JS virtualizer** | Breaks Ctrl+F, tab order and text selection — primary interactions on a facts archive. `content-visibility: auto` instead. |
| **More `backdrop-filter` glass** | Survey 2: near-pointless on a static read-only page with nothing moving behind it — cost without payoff. The header's existing use is fine; don't extend it. |
| **Superhuman's register** | Soft drop shadows + saturated brand surface reads "premium consumer," not "terminal-launched instrument." |
| **Base64-inlined webfont** | Technically single-file and offline. Violates the stated rule and adds 20–40KB. Out of bounds unless you reopen it. |
| **Recency as node fill lightness** | Breaks the categorical gates. It goes in the week-strip. |
| **Per-node SVG filters** | The reliable way to make a graph janky. One shared filter on one group. |

**And the honest tension, stated rather than cherry-picked:** Vercel's reject list names *"metric boxes"* and *"badges"* as generated-design reflexes, and I'm recommending stat tiles while the page already has badges. The resolution: stat tiles are legitimate because **the count IS the artefact here**, and the plan **removes** two of the five pills per row (trust → bar, tier → gutter). Net movement is toward Vercel's position, not away from it.

---

## 7. Risk list — honest

### Could go wrong
1. **The FA2 rewrite looks worse on the first attempt and gets abandoned.** The paper explicitly warns that switching to LinLog requires re-tuning the scaling ratio. Expose `Cr` as a knob, tune against the real corpus, budget more than one sitting. *Highest-probability failure on this plan.*
2. **Source-hub promotion is a claim about what the graph means**, not a rendering change. If it lands without a toggle, we've silently changed the product's assertion.
3. **`content-visibility` at 2,300 variable-height rows is unmeasured.** Survey 5 asserts the scrollbar-jitter artefact from the spec's design, not from measurement. Trial it before committing; fallback is the 200 cap + "load more."
4. **Raising the graph cap has a server cost.** `/graph` already walks every superseded fact file via `eachSupersededFact` on **every request**. More nodes = more disk on every page load, and the layout cost is quadratic. Measure; don't guess the number.
5. **Contrast must be re-tested end to end.** The current palette was validated as *text on light surfaces*. A warm-dark canvas re-opens it — and **WCAG 1.4.11 (3:1 for graphical objects vs adjacent colour)** governs edges, node outlines, rings and focus states, which is exactly where near-black-on-near-black ladders fail. Non-negotiable per the brief. Budget the pass.
6. **WCAG 2.x is a floor, not proof, at the dark end.** Myndex: it *"far overstates contrast for dark colours."* Target APCA **Lc 75+** for body, **Lc 45+** for headings, **Lc 15** as the divider visibility floor on anything dark that carries text.

### Might not survive zero-dep
- **Nothing on the list is dependency-blocked.** ✅ CSP verified permissive for the grain (`img-src data:` already present).
- **No webfont** → Linear's 510/590/680 variable weights collapse to 500/600/700. Use 500. No OpenType stylistic sets — `font-feature-settings` against system-ui is a silent no-op, not a fallback. (`tabular-nums` is the exception and does work.)
- **The feTurbulence data-URI escaping** is the single most likely silent failure. Survey 4 flags it explicitly as unrendered/unconfirmed. Test it before building anything on top.
- **`mix-blend-mode: screen`** is the SVG substitute for canvas's additive `lighter` compositing. Neither survey verified it. Test, and be willing to drop the glow.
- **The overview's `/stats` route is real server work** — the only item here that isn't CSS + local JS.

### Needs the user's taste call, not ours
1. **Source-hub promotion** — does the graph show *citations* (honest, sparse) or *the shape of your memory* (dramatic, manufactured)? **The single biggest fork in this memo.**
2. **A permanently dark canvas inside a light page** — a strong, polarising move. It's my recommendation; it's not a safe one.
3. **Warm-light identity vs dark-first overall.** I've argued light and I stand behind it, but it is genuinely contested: the reading evidence favours light, the dev-tool reference class favours dark. If the answer is "I want it to look like an instrument, not a document," the whole memo flips polarity — **and #1, #2, #3 and #5 of the diagnosis stay true unchanged**, which is the real point.
4. **How much of the 2,300 to show at once.**
5. **Whether three community colours reads as "striking" or as "not enough."** If it's the latter, the answer is more *labels and position*, not more hues — but that's a call to make with the thing in front of you.