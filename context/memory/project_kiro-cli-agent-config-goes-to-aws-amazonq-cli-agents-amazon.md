---
id: P-3Y6MCN2B
type: project
title: Kiro CLI agent-config goes to ~/.aws/amazonq/cli-agents/ (Amazon Q's real locati
created_at: 2026-06-21T10:56:13Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: a71eb344d7b82da904ae30e18632b0e926dcec460e4fa6df85fc4e54ea024e1e
related: [kiro-cli-rejects-bom-in-agent-config-ps-convertto-json-adds, test-gate-protocol-backup-real-paths-instead-of-env-var-sand, kg-guard-retest-failed-was-stale-artifact-not-fix]
---

Kiro CLI agent-config goes to ~/.aws/amazonq/cli-agents/ (Amazon Q's real location, NOT the kit's ~/.claude-memory-kit user tier). LESSON (2026-06-21): the live-test caught a real bug — the routing passed options.userTier (undefined in the real CLI) so installKiroCliAgent fell back to homedir() and wrote q_cli_default.json into the REAL ~/.aws during a live test. Fix: a MEMORY_KIT_AWS_DIR env var (mirroring MEMORY_KIT_USER_DIR) + an awsDir param overrides the ~/.aws base, so tests/sandboxes redirect away from the real home; production leaves it undefined → real ~/.aws (correct — that's where kiro-cli reads agents). The kit must NEVER write to the real ~/.aws in a test/live-check — always pass MEMORY_KIT_AWS_DIR to a sandbox. The stray file was cleaned.

**Why:** A user-tier write (the Kiro CLI agent at ~/.aws) needs the same sandbox-isolation as MEMORY_KIT_USER_DIR. The live-test rule (run against a sandbox that can't touch real state) caught this — the routing's undefined userTier fell through to the real home. This is the test-isolation discipline applied to a NEW user-tier location (~/.aws).

**How to apply:** Any module that writes to a user-tier/global location must accept an explicit base + honor a MEMORY_KIT_*_DIR env override; tests + live-checks MUST set it to a sandbox. installKiroCliAgent honors MEMORY_KIT_AWS_DIR. When live-testing cmk install --ide kiro, ALWAYS set MEMORY_KIT_AWS_DIR=<tmp> (+ MEMORY_KIT_USER_DIR) so the real ~/.aws is never touched.
