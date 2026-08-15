---
id: P-AC75HR2B
type: project
title: Semantic config is shared agent-neutral setting in `context/settings.json`
created_at: 2026-06-21T18:09:06Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: ebde36cd3ce62fb8ea8060f8943cf21472834d750a265adcaf21f03bff8d62f8
related: [conservative-uninstall-scope-managed-surfaces-only-never-con, cmk-install-with-semantic-scaffolds-semantic-recall, kiro-configuration-structure-agents-md-not-claude]
---

- `default_mode: hybrid` lives in `context/settings.json` (shared brain, not per-agent)
- `cmk install --with-semantic` and `cmk install --with-semantic --ide kiro` set it identically
- Idempotent scaffold: adding a second agent without `--with-semantic` preserves existing `hybrid` mode (does not downgrade to `keyword`)
- Both Claude Code and Kiro reuse same semantic recall config; no per-agent semantic setting exists

**Why:** Semantic recall is a shared-brain feature. One config, one brain, both agents benefit. Idempotent setup prevents accidental loss of capability.

**How to apply:** Expect semantic config in `context/settings.json` at shared-brain level. Second agent install with `--with-semantic` is safe (idempotent) but unnecessary if already enabled. Verify composition test (KG8 gate) passes.
