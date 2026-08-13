---
id: P-J4D2RZFS
type: feedback
title: create a new gate folder on every cut-gate restart never reuse
created_at: 2026-06-26T17:03:10Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: a0d73ca5d2890fee04d73c59267e95aabc216c209d26066a7133ceaa90a8b3da
related: [re-pack-verify-workflow-for-cut-gate-testing, cmk-fix-verification-workflow-fresh-folder-v0-4-1, cc-update-does-not-fix-mcp-prompt-task-171-validated]
---

Cut-gate folder discipline: every time a bug is found mid-gate and the gate must restart, create a BRAND-NEW gate folder (e.g. cut-gate-v041, then cut-gate-v041b, cut-gate-v041c, ...). NEVER reuse a folder that already ran install/captures — it carries contaminated state (a manually-approved settings.local.json, captured facts, a stale settings.json) that masks whether the FIXED artifact is clean from zero. A fresh folder + a fresh `cmk install` is the honest test of the fix.

**Why:** The user: "every time we find a bug and need to start the cut gate again we need to create a new folder." A reused gate folder has leftover state (e.g. the settings.local.json Claude wrote when the user manually approved a skill, captured facts, a stale allow-list) that hides whether the rebuilt/fixed kit produces a clean prompt-free install from zero. The whole point of the gate is capture-from-zero honesty.

**How to apply:** On any cut-gate restart after a fix: mkdir a NEW folder (increment the suffix: cut-gate-vX, -vXb, -vXc...), git init, fresh cmk install, then test. Do NOT cmk install into an already-used gate folder. Pair with the re-pack of the fixed cmk (npm pack + reinstall global) so the new folder gets the FIXED artifact.
