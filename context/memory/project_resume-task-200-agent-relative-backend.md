---
id: P-BNPFDK7V
type: project
shape: State
title: Resume Task 200 agent-relative backend
created_at: 2026-07-05T13:39:36Z
write_source: user-explicit
trust: high
recurrence_count: 1
source_file: user-explicit
source_line: 1
source_sha1: f270654d3c23be88c904aeacfd6bc01fa0d780e85bb7ae1c0db808a5b058025a
related: [d-271-deep-research-headless-llm-invocation-patterns, multi-agent-llm-invocation-research-initiative, auto-extract-works-on-kiro-confirmed-by-direct-probe-the-not]
---

RESUME POINT — Task 200 (agent-relative LLM backend, D-270/D-271), branch task-200-agent-relative-backend (pushed). DONE + committed: (1) recursion guard CMK_BACKEND_SPAWN at dispatchKiroHook+dispatchCursorHook entry (both test-green); (2) KiroCliBackend (packages/cli/src/kiro-backend.mjs) LIVE-VERIFIED against real kiro-cli — kiro-cli chat --no-interactive --model claude-haiku-4.5 --trust-tools=, parse stdout strip-ANSI+leading'> ', reuses compressor kill-chain/timeout/HaikuFailed/HaikuTimeout, 0.01cr/1s, exit0; (3) README per-agent CLI prerequisite table (D-271 the user's honest-floor minimum). NEXT/PENDING: (a) the DEEP research the user demanded — re-clone EVERY relevant cross-agent project (claude-mem/Taskmaster/mimir/memex/EverOS first — the multi-agent installers) + read code+docs for HOW they invoke an LLM headlessly across Windows/mac/Linux; the user rejected my 2-search conclusion that cursor-agent has no Windows path (Linux/macOS installer only, Windows=WSL2 or unofficial patch gitcnd/cursor-agent-cli-windows + TomasHubelbauer/cursor-agent-windows). The user asked: workflow(fast,opt-in) vs methodical-myself — awaiting the answer; core research question = 'headless LLM: per-agent-CLI vs cloud-API-key vs agent-own-headless vs other, and the Windows story specifically'. (b) CursorAgentBackend (cli-cursor-backend.test.js RED-drafted: agent -p --output-format json + parseCursorJson) — GATED on the research + the Windows decision. (c) makeBackend({projectRoot}) factory keyed on doctor detectInstallKind, migrate the 7 HaikuViaAnthropicApi spawn sites. (d) doctor HC surfacing a dead backend (not silent no-op). (e) live-test.mjs agent-parametric. (f) design §16.50.x + docs walk + 2-pass review + PR. v0.4.5 STILL BLOCKED on Task 200. HaikuViaAnthropicApi is a MISNOMER (it's claude --print, no API key) — factory migrates, no 25-site rename. REQUIREMENT: Win+mac+Linux all, per agent that has an installer there.
