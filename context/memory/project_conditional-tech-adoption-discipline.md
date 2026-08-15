---
id: P-ZXaUQRaS
type: project
title: Conditional Tech Adoption Discipline
created_at: 2026-06-13T12:54:42Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 418167b9f6887351f91ed37536052ef9bffa34df
related: [141b-is-rejected-decision-rationale, research-inclusion-bar-for-sources-artifact, now-md-assistant-cap-precedent]
---

Before committing to a new library/approach (backend, embedder, etc.), run a measurement gate that proves it doesn't degrade the user-facing metric that matters most. Examples: D-109 (embedder quality via R@5), D-147 (storage perf vs better-sqlite3).

**Why:** Prevents trading UX/performance for technical elegance or convenience on faith. Forces explicit data-driven decisions.

**How to apply:** When evaluating a new tech, propose a bake-off (what to measure, what's the bar) before implementation. Document the gate in DECISION-LOG + tasks.md. Don't ship without data.
