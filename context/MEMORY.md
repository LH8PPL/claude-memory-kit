<!-- Cap: 2500 chars · Last distilled: 2026-06-10 · Last health check: 2026-06-10 -->

# Working Memory

<!-- Your project's working scratchpad. Replace the example bullets with real state; empty sections are fine. -->

## Active Threads

<!-- Current work in progress. Drop bullets as work resolves. -->

- (P-UKKMK2XF) Dry-run fix verified: `mkdirSync`/`writeFile` are fully behind `if (!dryRun)`; the linux + darwin dry-run legs never had the bug (checked — they return before any write). Real-filesystem state door is pinned, not just the injected seam.
  <!-- source: review-promote, source_line: 1, sha1: 5e457bfb414df67205905aaadbb5020038c9a0e54eaba8b22e5ab03353d1f2f1, write: user-explicit, trust: high, at: 2026-08-10T20:41:42Z -->
- (P-a7X2VNJN) Windows temp-dir teardown causes local EPERM in cli-install.test.js; ubuntu CI passes, confirming no regression
  <!-- source: review-promote, source_line: 1, sha1: 907305fd96cb7991fcc928260cfc0236d7ec56a3bb8d71788574307cb875bdb4, write: user-explicit, trust: high, at: 2026-08-10T20:41:59Z -->
- (P-SETV7N3V) Per D-378, green workflow ≠ green commit; Sonar posts gate as check-run; waiting for Sonar/Coverage to pass
  <!-- source: review-promote, source_line: 1, sha1: 67f868f08d79c7ca525df7b80ceb5065bda948c11511d0d8da7c215ffa177927, write: user-explicit, trust: high, at: 2026-08-10T20:42:14Z -->
- (P-F2YB59a9) D-number ledger explicitly tracked in todos; claims resolved serially at merge points
  <!-- source: review-promote, source_line: 1, sha1: f3cfa8e6555de083c917950d8a7bcd895b86b50a446d09660dedfa5fe2e8f6a6, write: user-explicit, trust: high, at: 2026-08-10T20:42:14Z -->
- (P-ASU3N6A9) User wants full autopilot through release close; no mid-sequence prompts until final tag
  <!-- source: auto-extract-session, source_line: 1, sha1: 089ffa980f888af6c381bc5e9a651c774a730a592df24ca0270c43803652ecd4, write: auto-extract, trust: high, at: 2026-08-13T11:02:09Z -->
- (P-GLUEBADK) User retains tag command as final manual step (not automated)
  <!-- source: auto-extract-session, source_line: 1, sha1: a0fde7e786997f3b340ee84437ea058f4b411c58a53da4637ce722f5707e3ed2, write: auto-extract, trust: high, at: 2026-08-13T11:02:09Z -->

## Environment Notes

<!-- Tool versions, paths, URLs, env state. -->


## Pending Decisions

<!-- Things still to decide. Remove when resolved. -->

