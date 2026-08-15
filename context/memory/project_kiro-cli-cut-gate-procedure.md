---
id: P-aPBH9EMa
type: project
title: kiro-cli cut gate procedure
created_at: 2026-06-24T20:10:22Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: cf42708030f4516d76ec9c490153a69b846a1829bd3d357e2a1015a8a5b392dc
related: [test-artifacts-can-contaminate-fresh-install-testing, cutgate-fresh-install-test-sequence, kiro-gate-testing-ritual-0b-build-1-fresh-install-session-1]
---

Before shipping, run a structured testing gate:
1. **Backup first** — backup `~/.kiro` + user tier → fresh run directory (safe, reversible)
2. **Remove test leftovers** — delete `cmk.json` agent file and `chat.defaultAgent: cmk` pointer added during dev testing
3. **Fresh install test** — run `cmk install --ide kiro` to verify shipped code on a clean state
4. **On-disk checks (KCG1-8)** — verify all installed files and configuration
5. **Session 1 live** — user drives the first live session to validate UX end-to-end

**Why:** Test leftovers (esp. `cmk.json`) mask whether the shipped code works on a genuinely fresh install; backing up first makes it safe to clean before testing

**How to apply:** Before each release, follow this sequence in order; the backup ensures you can revert test state if needed
