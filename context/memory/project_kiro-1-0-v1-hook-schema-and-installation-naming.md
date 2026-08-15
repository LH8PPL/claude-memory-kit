---
id: P-YW3DSPJ3
type: project
title: Kiro 1.0 v1 Hook Schema and Installation Naming
created_at: 2026-06-25T09:41:46Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 44d3248b6c239aecefc25bf5aeb3ba4c2f44be01408f59ff1631d51ae3ffaade
related: [kiro-ide-kiro-hook-on-disk-format-verified-from-a-real-hook, kiro-cli-dual-emit-architecture, kiro-ide-1-0-52-agent-hooks-v2-format-verification-gate]
---

- **Version field:** `version: "v1"`
- **Trigger field:** Hook triggers as strings, e.g. `trigger: "Stop"`
- **Action structure:** `action: {type: "command", ...}`
- **File naming:** Kiro 1.0 expects hook files as `cmk-<hookname>.json` (e.g., `cmk-capture.json`), NOT legacy `.kiro.hook` extension
- **Backward-compat:** Legacy `.kiro.hook` files are inert on 1.0; dual-emitting both formats is safe (no double-fire)
- **Discovery method:** Clicking IDE "Migrate" button on legacy hooks revealed exact v1 format and filenames by observing real output

**Why:** Live IDE 1.0 gate confirmed v1 schema guesses and caught bug #231 (installer generating wrong filenames). This ground truth will guide all v1 hook generation; backward-compat safety is now proven.

**How to apply:** All v1 hook generation must use `cmk-<hookname>.json` filenames with `version:"v1"` and schema structure above. Test fresh installs in Kiro IDE 1.0 to verify auto-load.
