---
id: P-HNJMX3GN
type: feedback
title: Always check every memory file in all tiers at cut-gate
created_at: 2026-06-16T09:12:52Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: ca1c327a7f82cadd6c5f16c2874d5b743727dfd2c1a5c85ae06e8a4137c3ce1d
related: [g4-gate-upgraded-to-mandatory-full-sweep, three-tier-memory-architecture, use-c-temp-or-c-tmp-for-test-scratch-never-the-repo-or-home]
---

Cut-gate / scaffold-verification discipline: ALWAYS read EVERY memory file across ALL THREE tiers (user ~/.claude-memory-kit, project context/, local context.local/) plus the .locks logs — not just the named spot-check files (MEMORY.md/SOUL.md). A scaffold regression (leaked username, unrendered {{TODAY}}, malformed frontmatter, real path in a committed tier) can hide in a file the named gate checks skip. Check for: real username (public-repo leak), unrendered placeholders, well-formed frontmatter, example bullets marked (example), and that no real machine path lands in a committed (non-local) tier. The user 2026-06-16: "we always need to check all the memory files to see if we didnt break anything."

**Why:** The cut-gate's G4 only spot-checks MEMORY.md/SOUL.md for cruft; a scaffold bug (leaked path, broken placeholder, malformed frontmatter) could hide in a file the named checks skip, and on a public repo a username leak is a real cut-blocker. Reading every file across all three tiers is the thorough verification — the user wants this standing, not ad-hoc.

**How to apply:** At every cut-gate (and after any change to scaffold templates / install), enumerate and READ every file under the user tier, project context/, and context.local/, plus .locks logs. Verify: no real username, no {{TODAY}} or other unrendered placeholder, well-formed frontmatter, examples marked (example), no real machine path in a committed tier. Fold this into the guide's G4 as a mandated full sweep, not a spot-check.
