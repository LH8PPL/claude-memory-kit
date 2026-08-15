---
id: P-NSM4THF5
type: project
title: Kiro 1.0 Hook Format Discovery via IDE-Generated Files
created_at: 2026-06-25T09:04:52Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 8c5765afef2c05709d6571781c115cf385ea7fc3474d81080f999478d74a1633
related: [kiro-ide-1-0-52-agent-hooks-v2-format-verification-gate, system-written-grants-file-as-specification, kiro-ide-kiro-hook-on-disk-format-verified-from-a-real-hook]
---

When uncertain about Kiro 1.0 hook file format, create a hook via the Kiro IDE UI (using the "Creating hooks in 1.0" flow) and examine the generated file in `.kiro/hooks/`. This yields canonical values for:
- `version` field (v1 or v2)
- `trigger` field names and values
- `action` shape (`{type:"command", command}` etc.)
- Matcher field structure
- Session-end/Stop trigger existence

**Why:** Documentation may be incomplete or out of sync with actual implementation. Reading what the tool itself writes is authoritative.

**How to apply:** When format questions arise, generate a minimal artifact via the IDE UI rather than guessing from docs. Examine the file it produces.
