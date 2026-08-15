---
id: P-4UG42PaQ
type: project
title: Two-Sub-Test Method for Isolating Skill Permission Gating
created_at: 2026-06-26T20:30:44Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: e31d4b2ce8a95c61d1505bb36f4b4fa69a66f0912b7f5491712698891a4d6e95
related: [claude-code-2-1-x-needs-skill-name-wildcard-to-suppress-skil, diagnostic-test-allow-list-vs-workspace-trust, diagnostic-test-statement-for-skill-capture]
---

When testing whether a kit's Skill() permission forms work in Claude Code: **(a) EMPTY state** — remove all Skill entries from settings.json, state preference, click allow, observe what CC writes (form, location, target file); **(b) KIT state** — restore kit's form, state preference, observe if prompt appears and what form is used. Comparing the two reveals whether kit's form works or needs adjustment.

**Why:** Kit behavior depends on what Claude Code actually writes, not docs. Sub-tests isolate tool initialization from kit correctness.

**How to apply:** In future tool integration work, use paired sub-tests to test configuration forms rather than testing them simultaneously.
