---
id: P-VTLX4QYR
type: project
title: v0.3.2 cut-gate complete E1 wedge passed ready to tag
created_at: 2026-06-16T13:06:57Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: 0420d85413c4b43fc3c38c664db96e7c777ac567032bd1733fc2794ec41955ff
related: [resume-v0-3-2-cut-gate-in-progress, v0-3-2-published-to-npm-with-provenance, v0-4-1-cut-gate-fully-passed-all-cli-sessions-1-3-green-e1-w]
---

v0.3.2 cut-gate COMPLETE — E1 cold-open (the wedge) PASSED live 2026-06-16. In a brand-new empty project (cut-gate-coldopen14, zero local history), the agent recalled the cross-project persona (mk_search/mk_get returned U-RFHSDC64 etc.) BEFORE scaffolding and shaped its AskUserQuestion options to the user's recorded conventions: Framework→FastAPI marked "Matches your recorded preference (routes thin → services → repos, Pydantic contracts)"; CLI option noted "still uv + ruff + src layout"; Persistence→"No, skip repos" annotated "per your 'repositories optional when no data persistence' rule" — recalling even the subtle repository-exception nuance stated THIS session. That's the wedge working: how does it know that? ALL cut-gate gates now green: G0-G7 (install/skills/MCP/semantic), Session-1 capture B1-B9, Session-2 recall D1/D3/W1 (strong), §4 C1-C6 + FQ1 (FTS5 fix), §4c DJ1-DJ3 (DJ2 idempotency fixed+verified), §7 CLI sweep F-1..F-19, §6 E1 cold-open. The cut-gate found+fixed real bugs this run: DJ2 lowercase-id idempotency (PR#194), js-yaml advisory (PR#188), F-7/CLI.md doc bug (get is live-only). v0.3.2 final scope = 153 (FTS5) + 152 (validate-index); 147 (digest/DECISIONS.md) CODE merged but feature HELD for v0.3.3 (D-164, write-only-for-AI). READY TO TAG: git tag v0.3.2 && git push origin v0.3.2 → publish.yml.

**Why:** The cold-open (E1) is the kit's single most important gate — the wedge that justifies the whole product. It passed live with the best-case result (persona transferred to a zero-history project, even the subtle repo-exception nuance). Recording that all gates passed + the bugs the cut-gate caught means the cut decision is fully traceable and a future session knows v0.3.2 was properly gated.

**How to apply:** v0.3.2 is cleared to tag: git tag v0.3.2 && git push origin v0.3.2 (the user's outward step) → publish.yml runs the suite, publishes to npm with provenance, creates the GitHub Release from the [0.3.2] CHANGELOG. Then verify: npm view version=0.3.2, provenance badge, GitHub Release. NEXT = v0.3.3 (Task 156 DECISIONS.md AI-recall + Task 155 tombstone recovery).
