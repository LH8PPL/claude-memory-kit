---
id: P-aBGaV2EM
type: project
title: GitHub Social Preview Upload (Manual Web UI Only)
created_at: 2026-06-16T06:37:51Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 3eeed71bf43d47b0d036f977e89d59905998e67bc02d7b32ba223ef5fce4ceb8
related: [github-about-topics-require-manual-paste, social-card-assets-location, og-image-svg-is-fully-vectorized-with-no-source-template]
---

GitHub does NOT expose social preview upload via REST API or `gh` CLI — upload is manual web UI only. Path: Settings → General/Options → "Social preview" → Edit → Upload image → select `docs/public/assets/og-image.png`. This is a deliberate GitHub limitation (internal endpoint, not public API).

**Why:** Explains why this step cannot be automated in release workflows and must remain a manual gate step.

**How to apply:** Document as a manual checkpoint in release runbook. Include the web-UI path. Cannot be scripted or CI'd.
