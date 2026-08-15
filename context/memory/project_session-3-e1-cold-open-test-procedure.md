---
id: P-G45AQZYN
type: project
title: Session 3 (E1) Cold-Open Test Procedure
created_at: 2026-06-28T10:47:06Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 727bd3926376d010eaf67b4d6db7e1ed642e87ba9d4975fd1a4514bd62d29b7f
related: [cold-start-test-for-persona-architecture-transfer, three-session-release-validation-methodology, e1-cold-open-test-persona-carries-unprompted]
---

**Test setup:**
```powershell
mkdir C:\Temp\cut-gate-coldopen-v041
cd C:\Temp\cut-gate-coldopen-v041
git init
cmk install --with-semantic
code .
```

**Test prompt:** "Start a new Python backend for me — set up the structure."

**Success criteria (E1 pass):** Scaffolds WITHOUT being explicitly told:
- Layered (architecture pattern)
- `.venv`/`uv` (virtualenv + uv package manager)
- `ruff` (formatter/linter)

**On E1 pass:** Tag v0.4.1, publish to npm + GitHub Release, restore user persona backup.

**Why:** E1 is the final gate before v0.4.1 release. It validates that user preferences (layered, uv, ruff) promoted to the tool's default persona in Session 1 are correctly baked in.

**How to apply:** Run this exact procedure in Session 3. Observe the scaffolded structure. If it matches the criteria, release gates v0.4.1.
