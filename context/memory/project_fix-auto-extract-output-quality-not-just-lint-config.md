---
id: P-BaBYLP4N
type: project
title: Fix Auto-Extract Output Quality, Not Just Lint Config
created_at: 2026-06-23T08:08:34Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 78bf3e3c8a141487d77814656ba15af5e2f378c7ad88b5d1bae6938688652ef5
related: [md007-is-model-output-indent-not-provenance-format, lint-clean-memory-output-plan-and-progress, super-linter-results-and-markdownlint-json-fix]
---

**Option (b): Fix the source** — improve auto-extract to emit lint-clean markdown by construction (4-space sublists, auto-linked URLs instead of bare URLs). This eliminates the root cause (prose formatting rules don't fire on clean output).

**Rationale:** (b) attacks the cause, not the symptom. (a) config relaxation is the safety net for edge cases. The strongest approach is **both**: clean output by construction + scoped `.markdownlint.json` for robustness.

**Why:** The memory files don't fail because of the kit format; they fail because auto-extract prose is unpolished. Fixing the tool's output quality is more principled than configuring away linter rules.

**How to apply:** Prioritize improving auto-extract output quality; use scoped config as a safety net, not the primary fix.
