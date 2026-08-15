---
id: P-PMXS5a3D
type: project
title: Signal Portfolio for Learning Loop in Claude-Code IDE
created_at: 2026-07-01T14:45:41Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 35244188a627dddbd591c6d67480d90bed5da02ef05f78fd854305f634193590
related: [outcome-signal-portfolio-8-types-2-transferable, automatic-oracle-free-quadrant-is-the-real-design-target, ide-to-autonomous-spectrum-same-loop-richer-signals]
---

The learning loop has access to multiple signal types in an IDE/Claude-Code host, not just "usage signal":

**Shipping now:**
- contradiction / supersession → trust_score

**Available, not yet used:**
- Was a fact used in the answer? (strong, hard to detect)
- User corrected right after recall (real but failure-biased)
- User `cmk forget` or edited (explicit, clean)
- Recalled fact was re-searched (strong miss-signal; Task 180 pattern)
- Task outcome under `/goal` (strong, present today in Claude Code)
- Tool-result after acting on a fact (strong, objective)
- Time-to-resolution (weak, too many confounds)
- User re-stated same rule (friction, not success; Task 181)

Portfolio is better than one signal; aggregate gives right direction even if each is noisy.

**Why:** Claude claimed "nobody ships a usage signal" without verification. User pushed back ("did we actually look?") and suggested multiple signal types exist. Research shows the real design is a *portfolio* — different signals, different reliability, different availability per host.

**How to apply:** Before finalizing ADR-0017, verify whether mem0, letta, graphiti, memclaw track any of these signals. Design the portfolio honestly (good vs. weak vs. game-able). Each host (IDE vs. autonomous) has different signal availability — adapt weighting per host.
