---
id: P-JFS5DA2J
type: project
title: 'Diagnostic Test: `:*` Allow-List vs Workspace-Trust'
created_at: 2026-06-26T20:27:15Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 1fc294e31167dd1bb00ce606fc92a273fce7bd50df4817db9a05e8f4e0ba2ee7
related: [cmk-fix-verification-workflow-fresh-folder-v0-4-1, fresh-folder-verification-workflow-for-claude-memory-kit-rel, diagnostic-test-statement-for-skill-capture]
---

**Folder setup:** Back up user-tier `.claude-memory-kit` to timestamped directory. Create `C:\Temp\cut-gate-v041d`, run `git init && cmk install --with-semantic`, open in Claude Code.

**Test action:** State a preference ("always run ruff before committing") and observe what dialog appears:
- **Silent (skill runs, no approval prompt)** → the `:*` form works after workspace trust is accepted → kit is correct, revert the change
- **"Use skill /memory-write?" approval prompt** → the forms don't suppress the prompt → test the space form syntax (`Skill(memory-write *)`) next  
- **"Trust this workspace?" dialog** → that's the actual blocker, not a skill rule issue

**Why:** Determine root cause — is the allow-list rule broken (doesn't match `:*`/bare forms) or is workspace-trust the blocking gate?

**How to apply:** Run test, note exact dialog. Revert `:*` if trust is the gate, or switch to space syntax if skill rule is broken.
