---
id: P-FZSCATHJ
type: project
title: v0.3.2 Scope Correction Dedup
created_at: 2026-06-15T12:28:50Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: 332e79401e1d2fc300080633a2b40efc5eddfe3679b258ec4135c1fdc6090de0
related: [v0-3-2-release-scope-expanded, v0-3-2-scope-locked-strict-task-order-discipline, task-141b-node-sqlite-migration-rejected-on-perf]
---

v0.3.2 scope CORRECTION (2026-06-15): the earlier "expanded scope" fact wrongly listed Task 134 (Poison_Guard catalog) and Task 154 (.gitattributes LF-pinning) as committed v0.3.2 work — BOTH already shipped in v0.3.1 (confirmed: 134 in CHANGELOG "security(134)", 154 = install.mjs buildGitattributesBlock + v0.3.1 CHANGELOG, D-126/D-145). Corrected committed v0.3.2 scope: Task 153 (FTS5 query sanitization — DONE this session, prepareFtsQuery), Task 152 (validate-index-completeness), Task 147 (cmk digest + standing context/DECISIONS.md). Conditional: Task 141b (node:sqlite migration), now gated on THREE spikes — perf bake-off, sqlite-vec loadExtension, AND node:sqlite-ships-FTS5 (openclaw #62328 signal, added from Task 153 research). Lesson: the dogfood memory + re-eval caught the duplicate-task error because the v0.3.1 CHANGELOG was checked against the proposed scope.

**Why:** Pulling already-shipped tasks back into a new version's scope is a real planning error — it would waste a re-implementation cycle or ship a confusing duplicate. The correction is the durable state; the earlier expanded-scope fact is now misleading and must not be the one a future session recalls.

**How to apply:** When scoping a release, cross-check every proposed task against the prior version's CHANGELOG + the actual src/ before committing it to the lane. For v0.3.2 specifically: 153 done, build 152 + 147, then run the three 141b spikes (FTS5-under-node:sqlite first as the fast-fail) before any 141b code.
