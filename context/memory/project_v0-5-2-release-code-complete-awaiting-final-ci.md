---
id: P-4C9SFXJA
type: project
shape: Event
title: v0.5.2 Release — Code-Complete, Awaiting Final CI
created_at: 2026-07-13T13:58:05Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: a354acbfaeff4d1a9ee795d580a8e40de754a4ca873ba53ce37e09206cf26b37
related: [v0-5-2-release-complete, v0-3-1-release-final-workflow, v0-6-6-release-ready-for-tag]
---

- Code-complete as of 2026-07-13
- All three PRs merged to main
- Awaiting final ci.yml run (SonarQube advisory + ubuntu/macos/windows test matrix)
- Once green, cutover via `npm run release -- patch`

**Why:** Tracks readiness for npm release cutover; final step is CI confirmation.

**How to apply:** Check ci.yml green, then run npm run release when ready to publish v0.5.2.
