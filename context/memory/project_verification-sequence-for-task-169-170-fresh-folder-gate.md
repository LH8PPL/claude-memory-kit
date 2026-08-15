---
id: P-JL4LU2VZ
type: project
title: Verification Sequence for Task 169 & 170 (Fresh Folder Gate)
created_at: 2026-06-26T19:11:11Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: cee3903051030c4687a3ff78cc4dad98ac18a95d724d26c74a7a89d134423a00
related: [cmk-fix-verification-workflow-fresh-folder-v0-4-1, live-test-workflow-for-kiro-cli-project-fix, fresh-folder-verification-workflow-for-claude-memory-kit-rel]
---

After global `npm install -g` (EBUSY-warns but succeeds), validate both fixes in a clean slate:
- Create fresh folder: `mkdir C:\Temp\cut-gate-v041c && cd C:\Temp\cut-gate-v041c && git init`
- Run: `cmk install --with-semantic`
- Run: `cmk doctor`
- Markers to verify:
  - **Task 170 (semantic):** install output says **"Semantic recall ENABLED"** (not "NOT enabled"), despite EBUSY on vec0.dll
  - **Task 169 (prompt-free):** settings.json has both `Skill(memory-write)` + `Skill(memory-write:*)` entries
  - **Doctor:** 10 checks pass; HC-8 = embedder OK/hybrid; HC-10 = SKIP

**Why:** Proves 0.4.1 tarball contains both fixes live, working despite DLL lock; fresh folder isolates test from session state

**How to apply:** After global install succeeds, run this sequence before Session-1 no-prompt test to confirm both Task 169 + 170 in production
