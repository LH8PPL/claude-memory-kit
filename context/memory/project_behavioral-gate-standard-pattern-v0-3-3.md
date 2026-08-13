---
id: P-QBWYD2Q9
type: project
title: Behavioral Gate Standard Pattern (v0.3.3)
created_at: 2026-06-17T07:38:35Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 08d90f12efa90e796a3d521420138406d7b165c8df5a3b3ac74f360790aede04
related: [memory-kit-validation-gates-d1-w4-dj4-live-gate, dj4-verification-prompts-decisions-md-recall-gate, release-workflow-with-destructive-manual-steps]
---

All behavioral gates must follow a consistent, executable shape:
- **Copy-paste prompt**: exact user text to paste into Claude Code
- **Explicit PASS**: what tool Claude should invoke + what the answer must contain (e.g., "mk_search with scope:decisions" + shows retracted decision)
- **Explicit FAIL**: blocker condition with name + rationale (e.g., "recall directive not triggering" means the gate fails)

Examples:
- M0-M3 gates (conversational MCP, recall ladder): already concrete
- DJ4-live, F-7b-live: retrofitted to this pattern in this session

**Why:** Vague gates ("ask a history question") are not executable by humans running manual pre-release verification. Every gate must be runnable by someone without deep project context.

**How to apply:** At gate review time, validate all three parts (prompt, PASS, FAIL) are concrete. New gates should be drafted with all three parts from the start.
