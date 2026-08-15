---
id: P-P3BT459T
type: project
shape: State
title: Vitest workers spawned from the Claude Code Bash tool inside VS Code can fail un
created_at: 2026-07-22T20:59:57Z
write_source: user-explicit
trust: high
recurrence_count: 1
source_file: user-explicit
source_line: 1
source_sha1: 3f6a80dba7f0b5b017e9888a2f0738fa02ed9312effd6985d784e7f0e4cc131a
related: [onnxruntime-node-postinstall-cdn-timeout, vitest-pool-corruption-transient-load-failures, vs-code-vitest-git-bash-environment-issue]
---

Vitest workers spawned from the Claude Code Bash tool inside VS Code can fail universally with 'TypeError: Cannot read properties of undefined (reading config)' — the Git Bash shell inherits VS Code extension-host env (ELECTRON_RUN_AS_NODE=1, VSCODE_ESM_ENTRYPOINT) which poisons node child processes. The identical npm test passes from PowerShell. Diagnosed 2026-07-22 during Task 233 (npm ci did NOT fix it; shell isolation did).

**Why:** Prevents a future session from re-diagnosing a full-suite red as a code problem when it is shell-env poisoning

**How to apply:** Run npm test from PowerShell (or strip ELECTRON_RUN_AS_NODE/VSCODE_* vars) when every vitest test fails with the config TypeError
