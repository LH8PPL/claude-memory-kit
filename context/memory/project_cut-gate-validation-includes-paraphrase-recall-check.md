---
id: P-4PEW73GU
type: project
title: Cut-gate validation includes paraphrase-recall check
created_at: 2026-06-14T07:09:02Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 7f14760c170289aceba35bea29a2b96a44a0b599
related: [post-merge-clean-build-verification, release-gating-workflow-for-version-cuts, tarball-installation-requires-re-packing-after-main-merges]
---

CLI cut-gate re-run after merge includes at least two components: (1) standard CLI tests, (2) paraphrase-recall check. The paraphrase-recall check catches failures that keyword-mode validation may miss.

**Why:** Ensures comprehensive semantic validation of the merged build before considering work complete.

**How to apply:** When re-running cut-gate post-merge, expect both standard and paraphrase-based semantic checks.
