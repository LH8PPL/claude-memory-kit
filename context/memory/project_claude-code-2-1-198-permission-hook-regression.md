---
id: P-ENFBJUXW
type: project
shape: Timeless
title: Claude Code 2.1.198 Permission Hook Regression
created_at: 2026-07-02T19:33:12Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 4c3ad82a1545fe5e5ed74cdd7fe5a7965fb72af75af54f0486f0d839cb614fa3
related: [system-written-grants-file-as-specification, regression-isolation-a-b-test-old-config-in-new-environment, claude-code-2-1-x-needs-skill-name-wildcard-to-suppress-skil]
---

- **Problem**: `PermissionRequest` auto-approve hooks (with `Skill` matcher) auto-dismissed in earlier CC versions but now prompt in CC 2.1.198
- **Evidence**: v0.4.3 folder with byte-identical `settings.json` (2359 bytes, no `settings.local.json`) auto-dismissed in old CC; same folder prompts in CC 2.1.198
- **Root cause**: Claude Code environment change, not kit code or config version
- **Release status**: NOT a v0.4.4 blocker (kit code/shipped config unchanged and correct from v0.4.3)
- **Pattern**: continuation of D-209, D-211, D-213 (CC permission-handling churn)

**Why:** A/B test isolated the cause (identical config, new environment). Real blocker for users on CC 2.1.198 using auto-approve hooks.

**How to apply:** When prompts replace auto-dismiss, click "Yes" to let CC write `settings.local.json` — that file is the spec for 2.1.198's required form. Read it to determine the exact fix (matcher syntax, output fields, or new fields).
