---
id: P-CG74LCQU
type: project
shape: State
title: og-image.svg is fully-vectorized with no source template
created_at: 2026-07-15T18:14:21Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 06686bcf61c616c5724f6f3f70687ae6e54be04ac4e3ea3b7064657557ad6667
related: [github-about-topics-require-manual-paste, github-social-preview-upload-manual-web-ui-only, diagnostic-technique-determine-sonarcloud-issue-origin-repo]
---

- The og-image.svg (.png export) is fully vector-based (`<path>` elements); contains no editable text layer
- No Figma file, design template, or generation script exists in the repository
- Updating text requires regenerating from original design source; direct SVG path editing is fragile and error-prone
- Image is uploaded manually to GitHub's social-preview via the web UI (not auto-generated or deployed)

**Why:** Future brand updates need to know that text changes cannot be done via SVG editing; regeneration from source is the proper workflow

**How to apply:** When updating og-image content, regenerate from the original design file; do not attempt direct SVG path edits
