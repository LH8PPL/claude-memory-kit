---
id: P-P4JR23RD
type: project
title: Before/After Config Diff to Reveal Tool Behavior
created_at: 2026-06-26T20:30:44Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 084ee6ab50517906f759315cbb7a544b442b2f2f3e783a095ba1f732acfcfa3b
related: [system-written-grants-file-as-specification, two-sub-test-method-for-isolating-skill-permission-gating, claude-code-2-1-x-needs-skill-name-wildcard-to-suppress-skil]
---

Before a user-facing action (e.g., clicking "allow"), snapshot key config files (settings.json, settings.local.json). After the action, diff to see exactly what the tool wrote — which file changed, which form/format used, which values added. This is un-fakeable ground truth.

**Why:** Tool docs are often ambiguous or outdated; the tool's actual output is authoritative.

**How to apply:** Use when tool behavior is unclear or docs conflict with observation. Snapshots capture before-state; diffs reveal exact changes.
