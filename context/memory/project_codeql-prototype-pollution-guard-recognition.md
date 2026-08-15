---
id: P-3WXW2EK4
type: project
title: CodeQL Prototype-Pollution Guard Recognition
created_at: 2026-06-28T17:47:54Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: cec0d9e322812ca88556029ce780bbe4118809d92cbeca0341805a0a88628727
related: [codeql-alert-29-fix-in-loop-guard-requirement]
---

CodeQL's sanitizer for prototype-pollution alerts only recognizes **direct `===` guards** (e.g., `if (key === '__proto__')`) to validate input safety. Set-lookup patterns or other indirect validation trigger false-positive alerts even if functionally sound.

**Why:** PR #244 uses the direct `===` form per CodeQL's documented sanitizer. Previous attempts (#29, #37) with Set-lookup caused repeated re-flagging; took 3 iterations to discover the constraint.

**How to apply:** When opening CodeQL issues, check the query-help docs for recognized patterns before committing. For prototype-pollution alerts in this repo, use direct `===` checks for sanitizer recognition.
