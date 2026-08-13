---
id: P-FB9LL5S6
type: project
title: CMK Fix Verification Workflow (Fresh Folder, v0.4.1)
created_at: 2026-06-26T16:48:10Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 35d5f6736dc0a7f02c9bef232681edb02201cc24e189dcd7a75999eba1fa5b80
related: [re-pack-verify-workflow-for-cut-gate-testing, verification-sequence-for-task-169-170-fresh-folder-gate, live-test-workflow-for-kiro-cli-project-fix]
---

**Re-pack cmk:**
cd C:\Projects\claude-memory-kit; git pull; cd packages\cli; npm pack; npm uninstall -g @lh8ppl/claude-memory-kit; npm install -g .\lh8ppl-claude-memory-kit-0.4.1.tgz; cmk --version (must say 0.4.1)

**Fresh test folder:**
mkdir C:\Temp\cut-gate-v041b; cd C:\Temp\cut-gate-v041b; git init; cmk install --with-semantic; cmk doctor

**Expected doctor output:** 0 fail, 10 checks, HC-10 SKIP

**Verification:** .claude/settings.json contains Skill(memory-write:*)

**Live test:** Open in Claude Code (code .), state a preference, verify no "Use skill?" prompt and no settings.local.json created

**Reason for fresh folder:** Old folder (cut-gate-v041) had manually-approved settings.local.json, contaminating the test of the kit's own allow-list.

**Why:** The `:*` fix to the allow-list needs end-to-end verification in a clean environment.

**How to apply:** Execute in sequence. Doctor output gates the live test. If doctor or settings.json inspection fails, debug before proceeding.
