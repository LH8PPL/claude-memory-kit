---
id: P-BT9BNCQS
type: project
title: Link-Out Convention for Design.md Evidence
created_at: 2026-06-29T13:48:15Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 2422eb3e6a461999d982b6ef0f7f01b039cabfe5a31a77e17eb3afe553884cff
related: [design-md-as-canonical-spine-d-228, kiro-cli-known-limitation-bug-5873-blocks-manual-mk-remember, kiro-agent-must-be-global-empirically-validated]
---

claude-memory-kit applies a "link-out, don't inline" policy:
- Deep evidence (benchmarks, research, cross-system studies) links to docs/research/ instead of inlining
- Architectural decisions link to docs/adr/, not inlined into design.md
- design.md is the canonical Spine; large evidence blocks belong elsewhere to prevent bloat
- Status: applied this session but not yet formalized as a binding rule (only exists in decision log D-228)

**Why:** Prevents recurring mistakes of inlining large evidence blocks into the Spine, which bloats the critical design.md file. Future sessions need explicit guidance.

**How to apply:** Formalize as a binding rule in DOCUMENTATION-MAP's doc-routing section (with pointer from CLAUDE.md's source-of-truth area) so all future sessions follow the convention
