---
id: P-67RCC5MJ
type: project
shape: State
title: CodeQL XSS Filter Regex for Script Tags
created_at: 2026-08-02T19:17:14Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 9330810ec5f02e54e014281016798b52f343c56793b2806c07cfeaf212f359ef
---

The anti-XSS filter for script-tag endings uses the regex `<\/script\b[^>]*>`. This pattern handles edge cases where whitespace and attributes appear in the HTML end tag (e.g., `</script\t\n bar>`), which is legal per the HTML spec. Earlier patterns that only handled uppercase and trailing whitespace were incomplete and could be bypassed.

Verification: Tested against 5 forms including CodeQL's exact edge-case input; viewer suite passes 52/52 test cases.

**Why:** CodeQL static security scanner flags XSS bypasses. Naïve filters missing whitespace variants can be circumvented. The HTML spec allows whitespace and attributes in end tags, so robust filters must account for them.

**How to apply:** Use this regex pattern for script-tag matching in XSS filters. If modifying the filter, re-run the viewer suite (52 test cases) to verify no bypasses are introduced.
