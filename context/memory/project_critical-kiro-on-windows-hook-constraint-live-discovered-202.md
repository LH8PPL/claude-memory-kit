---
id: P-N2PGMBaF
type: project
title: CRITICAL Kiro-on-Windows hook constraint (LIVE-DISCOVERED 2026-06-21, would neve
created_at: 2026-06-21T04:24:59Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: 54bafd0a848aff634e1d6f2258d2962d6d9b97798687c6dd1d2ebe0b58ac9a31
related: [solved-the-windows-kiro-hook-command-form-live-verified-2026, kiro-ide-hooks-live-test-wins-2026-06-21-the-user-ran-it-in, kiro-cli-popup-real-cause-cmk-is-npm-shim-not-exe-mcp-and-ho]
---

CRITICAL Kiro-on-Windows hook constraint (LIVE-DISCOVERED 2026-06-21, would never have surfaced from docs): Kiro on Windows runs hook 'runCommand' through WSL, NOT native Windows. Proven live: a hook with command 'bash C:/...' failed (WSL CreateProcessEntryCommon:505 execvpe /bin/bash failed 2); 'echo hello' worked (WSL builtin). WSL has NO node (wsl which node → not found) AND the npm 'cmk' shim is a bash script that calls node → 'cmk hook stop' from a Kiro hook FAILS with 'node: not found'. So the kit's Kiro IDE hooks CANNOT simply call 'cmk hook stop' on Windows — the command must work in WSL's environment. The agentStop hook DID auto-fire (good — IDE hooks are automatic, verified) but the command form is the problem. NOTE: WSL sees the Windows npm cmk at /mnt/host/c~/npm/cmk but it can't run (no node in WSL).

**Why:** This is the kind of cross-platform composition failure (the kit's binding cross-platform rule) that ONLY live-testing finds — the whole reason the user pushed for live tests. A Kiro hook command that works on macOS/Linux (native bash) breaks on Windows (WSL routing + no node). The kit must emit a hook command that runs in Kiro's actual execution environment per-platform.

**How to apply:** Solve the Kiro-hook command form before shipping: options — (a) point the hook at the Windows node+cmk via a wsl.exe-aware command or an absolute Windows node path WSL can exec via /mnt/host/...; (b) ship a self-contained hook script that bootstraps node; (c) detect WSL-routing and emit a cmd.exe/.bat form; (d) check if Kiro has a setting to run hooks in native Windows shell not WSL. MUST live-test the chosen form actually fires cmk end-to-end in a real Kiro Windows session. macOS/Linux likely fine (native cmk). This is platform-specific — the hook command is NOT one-size-fits-all.
