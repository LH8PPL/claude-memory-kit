---
id: P-AT2QCUET
type: project
title: Design Assets in assets/ Directory
created_at: 2026-06-16T06:37:51Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: ad84e2680104d935dac2d07ee2e08c9f952b6242b5425e5d94a1247b04b38dc5
related: [design-system-color-palette, github-social-preview-upload-manual-web-ui-only]
---

- wordmark.svg (light) — ink text with clay accent, 360×64
- wordmark-dark.svg — off-white/clay for dark backgrounds, 360×64
- og-image.png — 1280×640 social preview (committed, ready for web UI upload)
- og-image.svg — scalable OG image variant
All text converted to path data (font-independent; renders correctly without JetBrains Mono).

**Why:** Centralized asset location; font-independence ensures consistent rendering across platforms and social media without typeface dependencies.

**How to apply:** Reference these paths in deployment and docs. When regenerating wordmark, use path-based assets rather than text+font fallbacks.
