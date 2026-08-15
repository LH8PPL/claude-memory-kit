---
id: P-55ZLLX6T
type: project
title: 'Decision (the user, 2026-06-21): rework Kiro support PROPERLY before v0.4.0 ship'
created_at: 2026-06-20T21:05:05Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: 9f922fc0f78d138e1a8fe5a2a2d688dbd1d5fb2c642131d6e846d852f787753a
related: [decision-the-user-2026-06-21-the-kiro-rework-wires-both-ide, plan-the-user-2026-06-21-do-the-manual-kiro-live-capture-tes, kiro-ide-kiro-hook-on-disk-format-verified-from-a-real-hook]
---

Decision (the user, 2026-06-21): rework Kiro support PROPERLY before v0.4.0 ships — fix the 3 profile defects (default-agent registration + AGENTS.md instruction + Kiro-specific agent-config installer branch) + live-test on real kiro-cli before claiming 'automatic'. NOT ship-broken-and-fix-later. The default-agent question (force cmk as Kiro's chat.defaultAgent vs opt-in) is still OPEN — the user wants to know what real projects did first: AgentCore SETS it as default (full automatic); PILOT (aws-bash-hooks) + langfuse do NOT (manual --agent each session). Field is split: the automatic memory systems set default, the opt-in tools don't.

**Why:** The user chose correctness-now over ship-broken. The default-agent decision needs the 'what did others do' evidence before deciding — AgentCore (a memory system, our closest analog) sets it; the non-memory tools don't. That suggests a memory kit SHOULD set it, but it's invasive (every kiro-cli session uses cmk's agent), so present it as the AgentCore-precedented recommendation with an opt-out.

**How to apply:** Build the Kiro installer branch. Recommend: set cmk as default agent (AgentCore precedent = the automatic path) with a --no-default-agent opt-out for users who have their own default. Live-test #1 (default-agent makes hooks fire) + #4 (cmk capture runs from a Kiro stop hook) before README says 'automatic'. Two hook formats now verified: IDE .kiro.hook (when/then/runCommand) + CLI agent-config (hooks:{event:[{command,timeout_ms}]}).
