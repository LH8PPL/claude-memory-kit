## 2026-08-09T07:47:58Z — auto-extract (medium-trust, pending review)
- (P-UKKMK2XF) Dry-run fix verified: `mkdirSync`/`writeFile` are fully behind `if (!dryRun)`; the linux + darwin dry-run legs never had the bug (checked — they return before any write). Real-filesystem state door is pinned, not just the injected seam.
  <!-- proposed_trust: medium, write: auto-extract, at: 2026-08-09T07:47:58Z -->
## 2026-08-10T09:34:25Z — auto-extract (medium-trust, pending review)
- (P-a7X2VNJN) Windows temp-dir teardown causes local EPERM in cli-install.test.js; ubuntu CI passes, confirming no regression
  <!-- proposed_trust: medium, write: auto-extract, at: 2026-08-10T09:34:25Z -->
## 2026-08-10T09:34:25Z — auto-extract (medium-trust, pending review)
- (P-SETV7N3V) Per D-378, green workflow ≠ green commit; Sonar posts gate as check-run; waiting for Sonar/Coverage to pass
  <!-- proposed_trust: medium, write: auto-extract, at: 2026-08-10T09:34:25Z -->
## 2026-08-10T09:34:25Z — auto-extract (medium-trust, pending review)
- (P-F2YB59a9) D-number ledger explicitly tracked in todos; claims resolved serially at merge points
  <!-- proposed_trust: medium, write: auto-extract, at: 2026-08-10T09:34:25Z -->
