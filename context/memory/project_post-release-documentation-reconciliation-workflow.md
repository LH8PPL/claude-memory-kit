---
id: P-NG5KC7R5
type: project
shape: State
title: Post-Release Documentation Reconciliation Workflow
created_at: 2026-07-12T18:00:13Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: f5c305fdb535583876811b6d6ddfdaeeb0fcafc6da8b1882f38f65e77f3245c7
related: [changelog-unreleased-auto-reset-during-release, documentation-drifts-at-event-boundaries-not-pr-moments, release-plan-md-authoritative-task-to-lane-map]
---

After publishing a release, systematically verify that no documentation version-latest claims are stale. Key documents to check:
- tasks.md "Current state" header (typically the lag point): update to reflect latest version and upcoming queue
- RELEASE-PLAN: verify SHIPPED marker is present for the released version
- CHANGELOG: confirm [Version] section is dated, [Unreleased] section is present (auto-reset by release mechanic)
- README: verify no version-latest claims
- Task bodies: check for version-specific trigger conditions

Typical result: 0–1 lags per release (tasks.md Current state header is the most common lag point).

**Why:** Drift between published release and documentation claims confuses users and corrupts versioning narrative. Post-release reconciliation ensures docs remain authoritative.

**How to apply:** Run this check immediately after publishing. Update any stale headers, commit changes, and verify CI is watching identified files. This is now part of the standard release process.
