---
id: P-YAEV66UK
type: project
title: 'BLOCKER: claude.exe Windows-incompatible after CC update — live spawn-smokes + live-verify can''t run here'
created_at: 2026-06-27T19:15:34Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: 5fe24d686da0705dcfe055520b45962b8fc2b2fe22ed9cbe2c6a8344df7fe9a0
related: [task-172-live-verified-from-packed-kit-no-popup-full-suite-s, stress-flake-self-induced-load-not-regression, stress-test-gating-rule-for-pr-approval]
---

BLOCKER (2026-06-27, environment): the live `claude --print` spawn-smokes (spawn-smoke-haiku / -compress-session / -auto-extract-rich / -weekly-curate) FAIL in this environment with "claude.exe is not compatible with the version of Windows you're running" — the Claude Code NATIVE BINARY is broken here after the CC update earlier today (`claude --version` from Bash also errors "native binary not installed"). This is NOT a kit bug and NOT live-Haiku jitter: (1) the full suite is 2375/0 GREEN with CMK_SKIP_LIVE_HAIKU=1; (2) Task 172's diff touches ZERO files in the compress/extract/haiku spawn path (verified git diff). So the 4 failures are purely the broken claude.exe, unrelated to Task 172. IMPLICATION: cannot run the live-Haiku gate OR the final live-verify (fresh folder, both popups gone) from THIS environment until the claude binary is fixed (reinstall CC / fix the Windows-compat issue). Task 172 CODE is complete + reviewed (self + code-review-excellence; the review found + fixed a real security finding — isKitSkill trusted tool_input.name regardless of tool_name, a defense-in-depth hole; fixed + 2 regression tests added; 16 approve-permission tests pass). The mechanism itself was ALREADY live-proven in v041l before the binary broke. NEXT: fix the claude.exe Windows-compat issue, then re-run npm test (expect 5/5) + live-verify Task 172 on a fresh folder from the packed artifact, then merge + the v0.4.1 cut-gate + tag.

**Why:** The 4 full-suite failures are the live claude --print spawn-smokes failing because the Claude Code native binary is Windows-incompatible after today's update — not a kit bug and not jitter (suite is green skipping live Haiku; the diff doesn't touch that path). This blocks the live-Haiku gate and the final live-verify until the binary is fixed; recording it honestly rather than dismissing it.

**How to apply:** Do NOT mark the live gate green. Fix the claude.exe Windows-compat issue (reinstall Claude Code), then re-run npm test (expect 5/5 once the binary works) and live-verify Task 172 on a fresh folder from the packed artifact (both popups gone). Task 172 code is review-complete; the mechanism was already live-proven in v041l. Merge + cut-gate + tag after the binary is fixed and verification passes.
