---
id: P-7QBE6A6M
type: project
title: 'Kiro vs Claude Code integration: the CORE is shared (verified 2026-06-21), only '
created_at: 2026-06-21T10:40:49Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: 7dcba197257022561a3b3c4c9b5d4f6ac872bd5c84213323c1115737fae147cc
related: [claude-code-vs-kiro-hook-and-integration-differences, shared-core-thin-adapter-architecture-pattern, kiro-hook-environment-verified-live-2026-06-21-the-probe-cap]
---

Kiro vs Claude Code integration: the CORE is shared (verified 2026-06-21), only the thin ADAPTER differs. cmk hook stop (Kiro) and cmk-capture-turn (Claude Code) BOTH call the SAME captureTurn() from capture-turn.mjs; cmk hook agentSpawn and the SessionStart bin both call the SAME injectContext(). ZERO capture/inject LOGIC is reimplemented in the kiro-*.mjs files (grep confirmed: no transcript-write/extractTurnText/Poison_Guard/auto-extract logic there — only input translation). The Kiro-specific code is purely the ADAPTER: kiro-hook-bin.mjs translates Kiro's input model (argv event + env USER_PROMPT + cwd + transcript FILE) into the {assistant_message} payload the shared captureTurn expects. The differences that CAN'T be shared are real tool differences: Claude Code uses .claude/settings.json hooks + stdin JSON payload + ~/.claude/projects jsonl transcript + bare bin; Kiro uses .kiro/hooks/*.kiro.hook + argv/env/transcript-file + globalStorage json + cmd.exe-via-WSL. This is the tenet-T1 'shared agent-neutral core + thin per-agent adapter' design (D-180), confirmed in code.

**Why:** The user asked 'isn't the kiro integration code supposed to be the same as claude code integration code?' — the answer (verified in code): YES for the core (it IS the same, reused not reimplemented), NO for the adapter (Claude Code and Kiro are different programs with different hook config/input/transcript contracts). The thin adapter is the only divergence, and every difference maps to a real tool difference.

**How to apply:** When auditing cross-agent code for duplication: the core (captureTurn/injectContext/store/search/Poison_Guard) must be REUSED not copied (verified it is); per-agent files should be ONLY input-translation adapters. If capture/inject logic ever appears reimplemented in a per-agent file, that's the bug — route it back to the shared core.
