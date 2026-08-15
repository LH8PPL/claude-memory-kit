---
id: P-JCWYH36Z
type: project
title: GitHub About/Topics Require Manual Paste
created_at: 2026-06-28T11:50:34Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 44af72d936e6e95a05b887adf2384e96dbadcb5d83ddb48bbf3532a80d55518a
related: [github-social-preview-upload-manual-web-ui-only, og-image-svg-is-fully-vectorized-with-no-source-template, claude-memory-kit-github-about-configuration-user-tier-initi]
---

Claude cannot directly edit GitHub's repo "About" or "Topics" fields via API or web UI — only the repo owner can edit these fields. The workflow must be: text prepared in Claude, then manually pasted by the user via the ⚙️ gear next to "About."

**Why:** GitHub repo metadata is only editable by the owner via the web UI. This is a permissions constraint, not a Claude limitation, but it creates a two-step workflow that's easy to overlook.

**How to apply:** When updating repo metadata (About, topics, description), provide the finalized text with explicit copy-paste instructions. Make it clear that the user must manually complete the GitHub UI step.
