---
id: P-3JNMR9QC
type: project
title: CMK Workspace Rename Invalidates Per-Workspace Permissions Hash
created_at: 2026-06-25T12:32:17Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: ea467817001b32c63c402a9e0366bed06df0228bb85d24e7e2a4c47615027525
related: [gate-check-g0-cli-version-verification, core-memory-kit-requires-vs-code-folder-trust, kiro-requires-full-restart-to-load-updated-hooks]
---

When a cmk-installed workspace folder is renamed, its absolute path changes, which invalidates the per-workspace permissions.yaml hash that was baked during `cmk install`. The old permissions hash will no longer match the new path.

**Solution:** After renaming, run `cmk install --ide <ide-name>` to re-stamp the per-workspace permissions.yaml under the new path hash. This operation is idempotent and fast — it only re-keys per-workspace configuration. The global agent (e.g., kiro-cli) is unaffected; only per-workspace permission bits need re-keying.

**Why:** Renaming without re-installing silently breaks the permission binding. Re-installing immediately after rename keeps the permissions hash in sync with the folder's absolute path.

**How to apply:** When renaming a cmk-installed workspace, immediately run `cmk install --ide <ide-name>` before running any workspace-aware operations.
