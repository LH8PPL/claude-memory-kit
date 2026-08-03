---
id: P-36ZKJBT5
type: project
shape: State
title: Release Workflow — Tag-Driven Automation via publish.yml
created_at: 2026-08-02T20:00:05Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: dabc279ba0369030718eba80b4ca9cad17d39d13afb4475d6f78dbabea9f3476
---

Releases are triggered by pushing a git tag (e.g., `git tag v0.6.4 && git push origin v0.6.4`).

The `publish.yml` GitHub Actions workflow then:
- Runs full test suite
- Publishes to npm with provenance
- Creates GitHub Release from the matching CHANGELOG section

Success indicators: npm package live, release created, exit code 0.

**Why:** Understanding the release automation sequence is essential for cutting and verifying releases.

**How to apply:** When releasing, push the git tag. Monitor publish.yml completion (check npm, GitHub Release page, provenance).
