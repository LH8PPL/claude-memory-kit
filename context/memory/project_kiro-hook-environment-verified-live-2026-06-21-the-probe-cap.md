---
id: P-CJYGTQYR
type: project
title: Kiro hook ENVIRONMENT verified live (2026-06-21, the probe captured it before ha
created_at: 2026-06-21T04:42:56Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: fef2300d95f084e5c7bc33bb11d1d37ce79a4851745068cff73fd825838b6d1c
related: [kiro-vs-claude-code-integration-the-core-is-shared-verified, kiro-hook-prior-art-survey-conclusion-2026-06-21-the-boilerp, kiro-hook-authoritative-confirmations-2026-06-21-from-the-aw]
---

Kiro hook ENVIRONMENT verified live (2026-06-21, the probe captured it before hanging on a stdin read): Kiro passes hook context via ENV VARS + ARGV, NOT a stdin JSON payload like Claude Code. Confirmed from a real agentStop hook run: (1) cwd = the PROJECT ROOT (c:\Projects\Spec-Driven-Workshop) — so cmk hook knows the project via process.cwd(); (2) the event arrives via ARGV ('stop' — our arg), no hook_event_name env var; (3) env var USER_PROMPT exists (empty on agentStop, populated on promptSubmit — the inject trigger's prompt source); (4) CONTINUE_GLOBAL_DIR=...kiro.kiroagent\globalStorage (the transcript location, confirms the workspace-sessions path); (5) NO rich stdin JSON — the probe HUNG reading stdin (findstr '^'), strongly implying Kiro pipes nothing/empty to stdin for agentStop. So the cmk hook adapter for Kiro must read ENV (USER_PROMPT) + ARGV (event) + the transcript FILE (globalStorage workspace-sessions), NOT parse a Claude-Code-style stdin payload. The capture content comes from reading Kiro's session transcript, not from stdin.

**Why:** This is the load-bearing payload-shape question, answered live. Kiro's hook model (env+argv+transcript-file) is fundamentally DIFFERENT from Claude Code's (stdin JSON with assistant_response). The cmk hook bin must adapt per-agent: Claude Code reads stdin JSON; Kiro reads env+argv+transcript. Building it to expect a Kiro stdin payload would hang or capture nothing (the probe proved the hang).

**How to apply:** cmk hook <event> for Kiro: read process.argv for the event, process.cwd() for the project root, process.env.USER_PROMPT for the prompt (promptSubmit), and the Kiro transcript at globalStorage/kiro.kiroagent/workspace-sessions/<base64url(cwd)>/<latest>.json (.history) for the turn content to capture. Do NOT block on stdin. The capture path reads the transcript file (kiro-transcript.mjs already parses it), not a stdin payload. Re-probe with a NON-blocking script to confirm stdin is truly empty (the hang was findstr waiting for EOF).
