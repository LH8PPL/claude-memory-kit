---
id: P-YP3XEYaP
type: project
title: 'Shipping Principle: Fix Core-Promise Gaps Before Release'
created_at: 2026-07-01T08:30:15Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 5d2d32753827804e8daae9a3b4b702b18699be7beecf086bee310c66f5aec5f3
related: [release-triage-broken-promises-vs-future-features, tag-ready-criterion-core-features-pass-known-issues-cleanly, v0-3-3-bug-semantic-backend-attempted-for-keyword-only-decis]
---

- **Core principle:** When a core/headline promise is broken AND the fix is small AND scope is verified, fix it before shipping — don't defer to the next release.
- **Example:** "Search must find the persona" is a kit-level promise, not a v0.4.3 detail. Shipping with broken search (#182–183 unfixed) is dishonest. The fix is small (paths align, parser already multi-section-capable), so fix before tagging v0.4.3, not defer to v0.4.4.

**Why:** Project opposes the lazy-framing move of shipping a product known to be broken against its headline claims. Honesty about capabilities vs. promises is foundational.

**How to apply:** Before each tag, check: is a core promise broken? Is the fix small + scoped? If both yes, fix before shipping. Defer only genuine new features/design work.
