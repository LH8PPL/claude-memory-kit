---
id: P-U344aDSB
type: feedback
title: Always monitor CI after opening a PR
created_at: 2026-06-15T15:03:13Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: 1155f0377ecc1f87a34a5ce10119dc13ae5a834c53d6d6456638a311efc0acc6
related: [sonarcloud-quality-gate-posts-as-github-check-runs-not-workf, v0-6-4-release-workflow-and-task-ownership, stress-gate-release-workflow]
---

After opening or pushing a PR, always monitor its CI to completion and report the result — don't open the PR and stop. The user's directive 2026-06-15: "always monitor CI."

**Why:** The user wants CI watched through to green/red as part of the PR workflow, not treated as a fire-and-forget hand-off. Surfaced when I offered to either monitor or pause after opening PR #185.

**How to apply:** After `gh pr create` or any push to a PR branch, poll `gh pr checks <N>` until all checks resolve; surface failures immediately with the failing job, and report the green result when all pass. Applies to every PR, every session.
