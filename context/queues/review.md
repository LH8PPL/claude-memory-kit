## 2026-08-09T07:47:58Z — auto-extract (medium-trust, pending review)
- (P-UKKMK2XF) Dry-run fix verified: `mkdirSync`/`writeFile` are fully behind `if (!dryRun)`; the linux + darwin dry-run legs never had the bug (checked — they return before any write). Real-filesystem state door is pinned, not just the injected seam.
  <!-- proposed_trust: medium, write: auto-extract, at: 2026-08-09T07:47:58Z -->
