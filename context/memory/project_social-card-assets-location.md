---
id: P-6SPFPW4Z
type: project
shape: State
title: Social Card Assets Location
created_at: 2026-07-15T18:33:21Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 074721d23e2534704f3abdc07d2f198298a1928926288928aea6854318218899
related: [github-social-preview-upload-manual-web-ui-only, ci-authority-convention, avoid-duplicating-authoritative-docs-in-temp-locations]
---

og-image files (`og-image.png` and `og-image.svg`) are located exclusively in `docs/public/assets/`. No duplicates exist in `packages/cli/` or other directories.

**Why:** Prevents deploying stale images elsewhere; clarifies the single source of truth for social previews.

**How to apply:** When updating social card assets, edit only `docs/public/assets/og-image.*` files.
