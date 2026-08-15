---
id: P-XaPRJFWE
type: project
title: 'Kiro hook AUTHORITATIVE confirmations (2026-06-21, from the AWS builder article '
created_at: 2026-06-21T06:47:50Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: d76e2edb1b0153f9403d73bfb85c8aa1a2f1d4ef46c95df421d24cdfdbc4efe7
related: [kiro-hook-security-design-is-injection-safe, kiro-hook-prior-art-survey-conclusion-2026-06-21-the-boilerp, kiro-ide-hooks-live-test-wins-2026-06-21-the-user-ran-it-in]
---

Kiro hook AUTHORITATIVE confirmations (2026-06-21, from the AWS builder article 'Mastering Agent Hooks in Kiro' — confirms the probe findings against primary AWS doc): (1) $USER_PROMPT env var CONFIRMED — promptSubmit exposes the user's typed text in env var USER_PROMPT (exactly what the probe showed + what runKiroHook reads). (2) runCommand semantics CONFIRMED: exit 0 → stdout ADDED TO AGENT CONTEXT; non-zero exit → stderr sent to agent + BLOCKS the tool (for preToolUse). This is WHY the kit's hooks must always exit 0 — a non-zero would block. (3) agentStop = 'agent completes a turn' (the capture trigger) ✓. (4) Default timeout 60s, configurable, 0=disable. (5) Hooks live in .kiro/hooks/ + SHOULD be committed to git (the kit's .kiro.hook files travel with the repo — good). (6) SECURITY (the kit MUST heed): 'If you pass $USER_PROMPT to a runCommand, SANITIZE it first — treat all human input as dangerous.' (7) The article's #1 best practice is 'prefer runCommand over askAgent — never waste AI tokens on what the shell can handle' — so the kit's deterministic-capture approach is the RECOMMENDED pattern, not novel-risky.

**Why:** This AWS primary-source article confirms every probe finding (USER_PROMPT env, runCommand→stdout→context, agentStop, exit-0-or-block) and surfaces a security requirement: the kit must sanitize USER_PROMPT before using it in a command. It also validates the kit's whole approach (runCommand deterministic capture is THE recommended pattern).

**How to apply:** cmk hook is invoked as 'cmk hook promptSubmit' (no USER_PROMPT in the command line — the kit reads it from env INSIDE the node process, never interpolates it into a shell command, so the injection risk is naturally avoided — but Poison_Guard still screens captured content before any write, which covers it). Confirm the kit never string-interpolates USER_PROMPT into a shell command (it doesn't — the .kiro.hook command is the fixed 'cmd.exe /c cmk hook promptSubmit'). Document: hooks need a Kiro restart to activate; .kiro.hook files commit to git.
