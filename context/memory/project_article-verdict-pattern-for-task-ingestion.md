---
id: P-DUSJXHRY
type: project
title: Article Verdict Pattern for Task Ingestion
created_at: 2026-06-29T11:23:17Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 20cda04873b34d9531d637e5d467f3eaa5f35af7c6527d634cb40ba9b4aa1b53
related: [research-task-workflow-pattern, distinguish-code-gems-from-pitch-copy, commit-guardrail-blocks-ambiguous-include-exclude-instructio]
---

Articles are staged to tasks with verdicts that:
- Classify the source type (e.g., "tutorial", "reference")
- Identify its contribution to the target task and prior understanding
- Highlight genuinely useful refinements or insights
- Reference prior work (task IDs, benchmarks, experiments) for context
- Include honest caveats about scope ("Honest limit: covers X but not Y")
- Stay in staging until user approves batch commit

**Why:** Ensures each ingested article's relevance, scope, and relationship to prior work are clear; enables principled decisions about what to keep, revise, or discard

**How to apply:** When staging an article, write a verdict in this pattern before batching for commit
