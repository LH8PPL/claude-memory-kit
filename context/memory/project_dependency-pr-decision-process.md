---
id: P-aV37WG9C
type: project
title: Dependency PR Decision Process
created_at: 2026-06-28T12:30:39Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 1ca24f9173a0cbef269a9e1e576d9856b8c222efadff6e638371d88346bb2422
related: [cmk-version-bumping-convention, stress-testing-omitted-for-pure-read-cli-changes, recurring-dependency-advisory-maintenance-gap]
---

**Merge if:** CI green AND low-risk (patch/minor bumps, e.g., vitest, better-sqlite3, GitHub Actions)

**Decline if:** Major version bump with breaking changes AND no security CVE justification (e.g., js-yaml v4→v5)

**Action:** Configure Dependabot to ignore declined majors so it doesn't re-open the same PR repeatedly.

Rule: "Don't chase version currency. Security or clear value is the gate, not being current."

**Why:** Merging breaking changes for currency alone wastes time and risk. The hard gate is CI green + compelling value, not "latest version."

**How to apply:** When a major-version bump arrives, ask "CVE or compelling value?" If no, close it and configure Dependabot ignore. Don't re-triage the same decision later.
