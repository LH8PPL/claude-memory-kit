---
id: P-SD7WDA3Z
type: project
title: Hook-Boundary Implementation Gap (Privacy-Strip Example)
created_at: 2026-06-14T04:18:45Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 205ae50b7b55a54c8002c8589ead51dcb8714a75
related: [cut-gate-live-test-verification-workflow, writefact-silent-failure-mode-reindex-failure-swallowing, kit-shell-permission-command-trust-boundary]
---

- The `<private>` privacy-strip in `cmk remember`, `mk_remember`, and import was implemented only in the hook layer, not at the actual write boundary
- Result: `<private>` markers leaked to committed files; fixed in PR #179

**Why:** Single-point-of-enforcement (hook-only) misses actual file write operations; boundary violations slip through without file-verification checks

**How to apply:** For security/privacy features, verify implementation at both hook AND file-write boundary; use on-disk file verification to catch boundary gaps
