---
id: P-TCKPLP3E
type: project
title: Cold-Start Test for Persona Architecture Transfer
created_at: 2026-06-14T20:11:12Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: b4854c8d5d4d686b9831894e9ef520ff5f1ac0ffcabed532bbafac9fac13e694
related: [e1-cold-open-test-persona-carries-unprompted, session-3-e1-cold-open-test-procedure, fresh-folder-verification-workflow-for-claude-memory-kit-rel]
---

To verify persona facts about backend architecture transfer to new projects, perform a fresh cold-start test:
1. Create fresh directory: `mkdir C:\Temp\<test-name>; cd C:\Temp\<test-name>`
2. Initialize: `git init; cmk install --with-semantic`
3. Open in VS Code; request: "Start a new Python backend — set up the structure"
4. Evaluate signals:
   - **Partial signal:** Layered architecture appears in framework options (routes, services, repositories mentioned explicitly)
   - **Full confirmation:** Generated scaffold creates `app/{api,services,repositories,schemas}/` directory structure

**Why:** Tests whether persona facts not only transfer to new projects but are actually applied in generation. Confirms memory drainage/promotion system works end-to-end, not just at storage level.

**How to apply:** Run this procedure after changes to persona facts to verify the change is working correctly before declaring success.
