---
id: P-A677aTMU
type: project
title: Task 167 shipped — live test overturned the grilled Q4 sync-drain (D-208)
created_at: 2026-06-26T09:47:48Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: fb66fb96f5cea5648985a44dabec5a5bd9946c568d34018445d8efb168c36a57
related: [task-167-testing-agent-run-unit-live-agent-loop-user-does-no, peer-systems-synchronize-consolidation-on-stop-hook-session, task-167-design-resolved-implementation-ready]
---

Task 167 shipped to main (PR #236, v0.4.1 lane) — the compaction-state deep module fixing the cron-liveness/stale-injection bug. KEY LESSON (D-208): the live test (npm run live-verify:now-roll, real claude --print) OVERTURNED a fully-grilled decision. Q4's grilled "drain synchronously at SessionStart" was built unit-green, but the live test proved a real Haiku roll (18-37s) can't fit the 30s SessionStart hook ceiling → reverted. The research confirms peers (claude-mem/mem0/Letta) compact at session END not START. The real fix is the cron-liveness heartbeat (167.A): a dead cron no longer suppresses the DETACHED roll, so now.md heals next-session and never compounds. Also: skill-review caught a dangling-promise bug (sync-drain 120s inner timeout vs 20s budget → process.exit kills mid-write, strands the buffer) that self-review's composition pass cleared as sound.

**Why:** The biggest meta-lesson of the Task 167 build: a confident 7-question grilling + a green unit suite still shipped an INFEASIBLE mechanism (synchronous SessionStart drain). Only the real claude --print live test caught it — the live-test-every-task rule + the lazy-framing rule applied to our OWN grilled decision. A grilled decision is not immune to being wrong; the live test is the primary source that can overturn it.

**How to apply:** When a design decision involves a real LLM call inside a hook with a ceiling, LIVE-TEST it before trusting the grilling — mocks hide real latency (18-37s Haiku vs a 30s ceiling). Prefer session-END (Stop hook, no user waiting) for synchronous compaction, session-START detached for the lazy floor. For Task 167 specifically: the cron-liveness heartbeat (gate on age not existence) is the load-bearing fix; the detached roll + that gate means now.md heals next-session and never compounds. The two-pass review (self + skill) catches different bugs — skill caught the dangling-promise self missed.
