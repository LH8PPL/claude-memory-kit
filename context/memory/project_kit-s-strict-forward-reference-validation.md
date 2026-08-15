---
id: P-X3CWAU33
type: project
title: Kit's Strict Forward-Reference Validation
created_at: 2026-07-01T17:22:54Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: ac495efdb645c6517bc87786e6c5a9a5d6b28ee5758818c92e7c9ebf64944e85
related: [memory-fact-validation-task-reference-exemption, git-as-sole-evidence-in-gap-cases, kit-name-privacy-validator-for-auto-extract]
---

The memory-kit's validator enforces that all references to ADRs/decisions actually exist. Because the kit captures live session conversations, it catches forward-references (references to not-yet-existing ADRs) even in the kit's own use. This is self-validation through dogfooding.

**Why:** The strictness is intentional — it ensures documentation consistency by immediately surfacing gaps. When the kit references an ADR in conversation, the validator catches it if that ADR doesn't exist yet.

**How to apply:** When validator errors occur about missing ADRs, write the referenced ADR (or use the provisional pattern above). Don't suppress validation; it's helping enforce documentation completeness.
