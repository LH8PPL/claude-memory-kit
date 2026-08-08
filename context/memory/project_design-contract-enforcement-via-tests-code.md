---
id: P-6aVCa69L
aliases: [P-6aVCa69L]
type: project
shape: Relationship
title: Design Contract Enforcement via Tests + Code
created_at: 2026-08-06T05:38:58Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 923689c652d832c924dff7f7dd21c494d6e35a8a0b0e6c4a2af1a1a0212f350d
---

The project maintains design specifications (in design.md with numbered sections, e.g., §24.1.2) as enforceable contracts. Specifications are ratified — they represent decisions made after discussion and are enforced by corresponding test guards in the codebase. When code diverges from a spec, the standard approach is "contract wins": revert the code to match the ratified spec, restore any guards that were deleted, and flag for explicit ratification if that code change was intentional. Example: design.md §24.1.2 specifies "no Segoe UI Variable". A corresponding test guard enforces this. During integration, Variable was used; the fix was to revert the code to match design.md and restore the guard. If Variable should actually be ratified, the spec, code, and test must all be updated together after discussion.

**Why:** This prevents spec-code drift and makes design decisions durable and explicit. It catches unintentional regressions and makes intentional changes visible.

**How to apply:** When working on visual or design changes, check design.md for the ratified spec first. Preserve test guards that verify specs. If you need to change a spec, update the design doc, code, AND tests together and flag for explicit ratification.
