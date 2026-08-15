---
id: P-FCK9J9CM
type: project
title: RESUME v0.3.2 cut-gate in progress
created_at: 2026-06-16T11:47:09Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: d500a24547a61ebdf91e8a853c9b67052e66d94af0a1d271bdaedd13e6f22ea6
related: [v0-3-2-cut-gate-complete-e1-wedge-passed-ready-to-tag, v0-3-2-published-to-npm-with-provenance, resume-v0-5-0-tag-blocked-only-on-the-cursor-gate-everything]
---

RESUME BREADCRUMB (2026-06-16, v0.3.2 cut-gate in progress): main is at 0.3.2 UNCUT (release prep committed: CHANGELOG [0.3.2], package.json 0.3.2 — NO tag pushed yet, nothing published). v0.3.2 final scope = Task 153 (FTS5 query sanitization — the headline fix) + Task 152 (validate-index-completeness). Task 147 (cmk digest/DECISIONS.md) CODE is merged but the FEATURE is HELD for v0.3.3 (D-164) — un-framed from CHANGELOG/README because it's write-only for the AI; v0.3.3 ships it complete with Task 156 (AI-recall) + Task 155 (tombstone --include-tombstoned). CUT-GATE PROGRESS (docs/process/cut-gate.md, cut-gate14 + sandboxes): PASSED automatable — G0-G7 (install/skills/MCP/semantic), Session-1 capture (B1/B2/B3/B4/B9 all green, 19 facts + persona promote + 6 queued), §4 C1-C6 + FQ1 (FTS5 fix verified on CLI), §4c DJ1/DJ2(fixed lowercase-id idempotency bug, PR#194 merged)/DJ3, §7 partial (F-1/F-7/F-8/F-17/F-18). STILL NEEDED (manual, in-chat, the user's): M0-M3 (conversational MCP), W1 (recall skill fires), D1/D3 (Session-2 recall), E1 (Session-3 cold-open/wedge), R1 (console flash); plus rebuild+reinstall the 0.3.2 tarball (currently blocked by EBUSY locked DLL — close Claude Code on cut-gate14 first) and re-run mk_search probes after restart (MCP server is stale). THEN cut: git tag v0.3.2 && git push origin v0.3.2 → publish.yml. Cut-gate found+fixed real bugs this session: DJ2 idempotency (lowercase-a id regex), js-yaml advisory, F-7/CLI.md doc bug (get is live-only not tombstone-reading). NEXT after v0.3.2 = v0.3.3 (Task 156 + 155). Branding done (wordmark + OG image uploaded).

**Why:** A long multi-thread cut-gate session with high context-loss risk; if it compacts or VS Code restarts, the next session needs to know exactly where the cut stands — what passed, what's left, that main is uncut, and the next outward step — without re-deriving it from scratch. This is the kit's own amnesia-prevention applied to its own release.

**How to apply:** On resume: read this + the DECISION-LOG (D-159..D-164) + tasks.md (147 held, 153/152 done, 155/156 next) + RELEASE-PLAN v0.3.3 lane. The cut is NOT done — manual in-chat ★ checks (M0-M3/W1/D1/D3/E1/R1) + a rebuild+restart remain before the tag. Don't push the v0.3.2 tag until those pass.
