---
id: P-LWJQU7a6
type: project
title: Cutgate Fresh Install Test Sequence
created_at: 2026-06-24T20:31:51Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: dd7dea072a71813e3f0f1ec84a9f27eac99b93f067e0db01031c750638d2b5cd
related: [kiro-cli-cut-gate-procedure, test-artifacts-can-contaminate-fresh-install-testing, testing-workflow-for-claude-memory-kit-fixes]
---

1. Rebuild the global kit
2. Backup `~/.kiro` and user tier config to a fresh run directory
3. Remove test artifacts (leftover `agents/cmk.json`, `chat.defaultAgent: cmk` pointer) to ensure genuinely fresh state
4. Run `cmk install --ide kiro` with no pre-existing config
5. Execute on-disk verification checks (KCG1-8)
6. Drive Session 1 live

**Why:** Tests that the kit ships and installs cleanly on a fresh system without test state contamination skewing results

**How to apply:** Follow this sequence for all cutgate fresh-install tests going forward; the artifact-cleanup step is critical to maintain isolation
