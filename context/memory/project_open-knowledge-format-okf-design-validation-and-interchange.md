---
id: P-ZE9MW3QP
type: project
title: Open Knowledge Format (OKF) — Design Validation and Interchange Target
created_at: 2026-06-15T11:09:34Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: d02444d9387ff209feac68ee6e653a7e4de8ffcf1516992149ac7b0fd7a6a704
related: [okf-v0-1-googlecloudplatform-knowledge-catalog-is-a-vendor-n]
---

Google Cloud's Open Knowledge Format independently converged on nearly identical design to claude-memory-kit:
- **Shared design**: markdown + YAML frontmatter, git-native, concept-per-file, `index.md` directory listing, `log.md` dated history, markdown links as relationship edges
- **Intentional divergence**: OKF uses path-as-ID + untyped taxonomy; kit uses SHA-256 content-addressing + 4-type taxonomy (for dedup and typed-trust routing)

**Decision**: OKF is NOT an adoption target (we retain content-addressing and type taxonomy). Instead, OKF is a **Google-backed design validation** and serves as the natural **export/interchange format** for two critical bottlenecks:
- Task 127 (team layer)
- Task 50 (cross-agent)

**Path**: `cmk export --okf` (~90% format overlap); slotted as design input (not active task) because OKF is v0.1 and exchange-scoped.

**Why:** External validation that kit's core thesis (git-native, minimal, human-readable) is correct; OKF provides a ready-made interchange standard at the team/cross-agent boundary without full redesign

**How to apply:** When designing Task 127 or 50 export layers, use OKF as reference format; assess whether adopting OKF as export target accelerates adoption without compromising kit's internal representation
