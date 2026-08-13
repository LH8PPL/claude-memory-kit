---
id: P-4RGMH5E7
type: feedback
title: back up the user tier before a cut-gate never plain-delete
created_at: 2026-06-26T15:24:52Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: e53235286245d4f02d56c81c4400c03220acf91354fca2fcac0bd45bd234e640
related: [user-tier-memory-backup-before-testing, never-overwrite-backups, gate-preparation-tier-backups-and-dogfood-isolation]
---

Before a cut-gate (or any capture-from-zero test), BACK UP the user tier (~/.claude-memory-kit) — NEVER plain-delete it. The established pattern: MOVE it to a timestamped backup under C:\cut-gate-backups\ (e.g. user-tier_<stamp>), which leaves the live path absent (so the gate captures from zero) while preserving the old tier for restore. Same for a stray ~/context scaffold — back up, don't bin. The cut-gate doc Step 0b was updated from 'Remove-Item' to this Move-Item backup.

**Why:** The user: "lets not Remove-Item ~/.claude-memory-kit, lets do a backup like we did before." Memory is the kit's whole product — destroying the user's persona/cross-project tier for a test is the worst-case failure, and a real tier could be hiding in there. A move-to-backup is reversible; a delete is not. Precedent: prior gates archived gate-noise to C:\cut-gate-backups\ and the user keeps before-cut-gate backups.

**How to apply:** For any test that needs a clean user tier: Move-Item the existing ~/.claude-memory-kit to C:\cut-gate-backups\user-tier_<timestamp> (mkdir the parent first), don't Remove-Item. The move leaves the path absent for capture-from-zero; restore with Move-Item back afterward. Apply the same to a stray ~/context. Generalize: never plain-delete any memory tier — always back up first, it's reversible.
