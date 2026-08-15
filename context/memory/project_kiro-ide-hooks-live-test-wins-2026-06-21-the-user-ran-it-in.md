---
id: P-AU9A6457
type: project
title: Kiro IDE hooks live-test WINS (2026-06-21, the user ran it in C:\Projects\Spec-D
created_at: 2026-06-21T04:26:41Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: d4617d783e6464ddbb44dd33fc6b12ba5c0b9e8434819af94b61df1d308e09cd
related: [solved-the-windows-kiro-hook-command-form-live-verified-2026, critical-kiro-on-windows-hook-constraint-live-discovered-202, windows-kiro-hooks-execute-via-wsl-require-cmd-exe-c-prefix]
---

Kiro IDE hooks live-test WINS (2026-06-21, the user ran it in C:\Projects\Spec-Driven-Workshop): (1) agentStop hooks AUTO-FIRE on turn-end with NO agent selection — confirmed: saying 'hello' and letting Kiro finish fired BOTH installed .kiro.hook files automatically. This validates the kit's IDE-hook capture approach (50.K) — automatic, no default-agent needed. (2) A runCommand hook with 'echo hello' SUCCEEDED and its stdout showed in the chat — so runCommand works + stdout surfaces. (3) The .kiro.hook file format the kit writes (50.K kiro-ide-hooks.mjs) is correct — Kiro loaded + ran both files. The ONLY open issue is the Windows command FORM (WSL routing + no node in WSL → bare 'cmk'/'bash'/'node' fail; testing 'cmd.exe /c cmk ...' as the Windows-native form). On macOS/Linux native cmk should work directly.

**Why:** The live test the user ran validated the core IDE-hook mechanism end-to-end: hooks auto-fire on agentStop, runCommand executes, the kit's .kiro.hook format loads. Only the per-platform command form (Windows WSL) needs solving — a contained, solvable problem, not an architecture flaw. This is exactly the live verification that turns 'should work per docs' into 'verified fires'.

**How to apply:** 50.K IDE-hook writer is validated for format + auto-fire. Finish: pick the Windows-working command form (likely cmd.exe /c cmk hook stop) once the realcmd probe confirms, make kiro-ide-hooks.mjs emit the per-platform command (native cmk on mac/linux, cmd.exe /c cmk on Windows-via-WSL), via platform-commands.mjs. Then wire the orchestrator + the cmk hook bin (still needs the STDIN payload shape — get it from the working probe).
