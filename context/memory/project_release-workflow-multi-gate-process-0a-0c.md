---
id: P-5SACW7MP
type: project
title: Release Workflow Multi-Gate Process (§0a → §0c)
created_at: 2026-06-21T14:43:02Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: c4e80b2a06e3aaf109952c9200dc44a4a89f74054245ccb6ce43c4aa1350d4dd
related: [npm-pack-global-install-for-artifact-testing-0b, release-workflow-full-sequence-for-v0-4-3-and-future-cuts, release-workflow-tag-timing-after-gates]
---

claude-memory-kit uses sequential numbered gates to ensure safe releases:
- **§0a (commit)**: Commit version bumps (CHANGELOG.md, packages/cli/package.json) and push to main. Auto-captured memory files remain unstaged. No tag pushed yet.
- **§0b (build & test)**: npm pack → uninstall old global CLI → install new tarball → verify `cmk --version` shows 0.4.0 (gate G0).
- **§0c (backup)**: Back up ~/.claude-memory-kit and ~/.aws before running live tests.
- **Publish (final)**: Only after all gates pass, push git tag (e.g., `git tag v0.4.0 && git push origin v0.4.0`) to trigger publish.yml.

**Why:** Separating commit and tag ensures no publish occurs until the entire gate sequence succeeds. Clear rollback point if any gate fails.

**How to apply:** Follow gates in order. Test output at each step before advancing. Push tag only as final, deliberate action after §0c clears.
