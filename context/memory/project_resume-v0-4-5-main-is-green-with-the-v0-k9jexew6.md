---
id: P-K9JEXEW6
type: project
shape: State
title: 'RESUME v0.4.5: main is GREEN with the v0.4.5 release commit (82a0baf, package.js'
created_at: 2026-07-06T12:06:49Z
write_source: user-explicit
trust: high
recurrence_count: 1
source_file: user-explicit
source_line: 1
source_sha1: eda1aa627adab1c699589ea2d05bdcf58472d43f0a32b05ecc44e07e2b1d1dc6
related: [resume-v0-5-0-release-commit-d-291-gate-ea7vxdtj, release-workflow-with-cut-gate-testing, plan-the-user-2026-06-21-do-the-manual-kiro-live-capture-tes]
---

RESUME v0.4.5: main is GREEN with the v0.4.5 release commit (82a0baf, package.json=0.4.5, CHANGELOG finalized, NO tag). Tasks 200+201+202 all merged (PRs #256/#257/#258). The v0.4.5 cut-gate was RUN on the real tarball (D-281): all CLI-deterministic gates PASS incl. BK1-BK4 (HC-11 present, --backend + fail-fast, config show, BK4 live-compression through BOTH kiro-cli AND cursor-agent). TWO things remain, both the USER's: (1) OPTIONAL live-SESSION half of the gate (MCP tools in a real conversation, cold-open wedge, spoken relays — D-84 flagged, not blocking for a patch); (2) push the v0.4.5 TAG (git tag v0.4.5 && git push origin v0.4.5 → publish.yml does npm+GitHub Release — the user's outward step, do NOT push a tag as the agent). Sandbox at C:/Temp/cmk-v045-gate. A stray stash@{0} (readme-design-assets work, NOT ours) is preserved on the stack + 3 untracked design-asset memory files in context/memory/ are from it (harmless, not mine to commit).
