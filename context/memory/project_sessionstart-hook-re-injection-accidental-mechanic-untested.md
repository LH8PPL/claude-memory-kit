---
id: P-XRWUWG5W
type: project
title: SessionStart Hook Re-Injection (Accidental Mechanic, Untested)
created_at: 2026-06-28T20:50:10Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 90252a68c09cc423db4eb68e432b09cfbf3f22d7aa8b97b083ea138e2885b283
related: [claude-code-2-1-x-needs-skill-name-wildcard-to-suppress-skil, manual-verification-gates-for-tasks-74-and-151, open-cmk-mcp-per-tool-prompt-systematic-investigation-pendin]
---

**What happens:** SessionStart hook at `settings-hooks.mjs:87` has no matcher — fires unconditionally on every SessionStart. Claude Code emits SessionStart with `source: "compact"` after compaction. Hook calls `cmk-inject-context`, re-injecting the snapshot.

**The issue:** The mechanic works, but it's unintended. Code never reads the `source` field; re-injection is accidental. Future changes adding a matcher could silently break it with no test to catch the breakage.

**Verification caveat:** Verified against hook docs + code, not live compaction. Before closing Task 74, trigger actual compaction and confirm snapshot reappears.

**Why:** Re-injection is de-facto working but fragile and undocumented. Future maintainers might unknowingly break it.

**How to apply:** Task 74 shrinks to verification + lock-in, not new feature. (a) Write a test proving snapshot present post-compaction. (b) Fix stale ADR ("we won't do PreCompact"). Fold into hardening, not own version.
