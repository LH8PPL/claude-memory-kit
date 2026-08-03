---
id: P-aLR5W59a
aliases: [P-aLR5W59a]
type: project
shape: State
title: Design Token System and Card Identity Pattern
created_at: 2026-08-03T13:29:49Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: c72a156ff5cfdd8eb106e0395e8d8b2de0d5150eb2c7c86c23dc6171efeaa1ad
---

Established direction uses:
- **Warm neutrals**: text #2b2520, secondary bg #efebe4, dark mode #1a1916 (no pure black/white/grey)
- **Per-type card tinting**: observations blue (#f0f6fb on #0969da), summaries amber (#fffbf0 on #d4a72c), prompts purple (#f6f3fb on #8250df)
- **Card craft**: 24px padding, 8px radius, 1px border, `transition: all 0.15s ease`, 1.7 line-height, minimal shadow (0 1px 2px rgba(0,0,0,.04))
- **Responsive**: padding steps 24→20→16px on smaller screens
- **Token layer**: semantic CSS variables (--color-bg-card, --color-text-secondary, etc.), light/dark swap
- **Typography**: system font stack, no webfont

**Why:** Single choice—warm neutrals instead of browser greys—creates most visual impact; per-type tinting differentiates card roles; token system enables consistent dark mode

**How to apply:** Apply these tokens to all cards in wave-2; use tier (P/L/U) or trust level as primary accent axis; establish as reference for all future UI components
