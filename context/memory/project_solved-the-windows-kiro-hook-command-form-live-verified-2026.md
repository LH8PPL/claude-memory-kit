---
id: P-PM2CD6CB
type: project
title: 'SOLVED — the Windows Kiro-hook command form (LIVE-VERIFIED 2026-06-21): ''cmd.exe'
created_at: 2026-06-21T04:28:54Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: b6f57974e1b608436e0977909b8d4d85ced26ed7cca9b5a0d1649dee8e072823
related: [kiro-ide-hooks-live-test-wins-2026-06-21-the-user-ran-it-in, critical-kiro-on-windows-hook-constraint-live-discovered-202, windows-kiro-hooks-execute-via-wsl-require-cmd-exe-c-prefix]
---

SOLVED — the Windows Kiro-hook command form (LIVE-VERIFIED 2026-06-21): 'cmd.exe /c cmk <args>' WORKS from a Kiro IDE hook on Windows. Proven: a .kiro.hook with command 'cmd.exe /c cmk --version' fired on agentStop and output '0.3.5' in the Kiro chat. This bypasses the WSL-routing problem (Kiro runs hook runCommand via WSL on Windows; WSL has no node so bare 'cmk'/'bash'/'node' fail) by forcing the Windows-native shell where node+cmk live. So the kit's Kiro IDE hooks emit: Windows → 'cmd.exe /c cmk hook <event>'; macOS/Linux → 'cmk hook <event>' (native, no WSL). This is a platform-commands.mjs concern (the binding cross-platform rule). The realcmd probe (cmd.exe /c cmk --version → 0.3.5) is the proof.

**Why:** This closes the only blocker found in the Kiro IDE live-test. The WSL/no-node problem (which only live-testing surfaced) is solved by cmd.exe /c forcing the Windows shell. Now the kit can emit a Kiro hook command that actually fires cmk on every platform.

**How to apply:** Update kiro-ide-hooks.mjs (50.K) to emit the platform-correct command via platform-commands.mjs: isWindows → 'cmd.exe /c cmk hook <event>', else → 'cmk hook <event>'. Same for the CLI agent-config hooks (50.L). The cmk hook bin still needs the STDIN payload shape — get it from a working cmd.exe probe (the probe.bat writes it). Live-RE-verify the real 'cmd.exe /c cmk hook stop' fires end-to-end (not just --version) before claiming done.
