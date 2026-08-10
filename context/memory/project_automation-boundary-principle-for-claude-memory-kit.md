---
id: P-L6J7QRDL
type: project
title: Automation Boundary Principle for claude-memory-kit
created_at: 2026-06-11T07:28:09Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 63b4eec34dbd09d3cb1db36f269891b3ebe70d57
related: [memory-review-discipline-before-commit, now-md-assistant-cap-precedent, the-kit-never-runs-git-on-the-user-s-behalf-settled-product]
---

The kit should automate everything in its domain (capture, indexing, recall, curation) and nothing in the user's domain. Specifically, memory facts must NOT auto-commit to git; the user must review before publication. Git commits represent authorship and publication — a tool that auto-commits in the user's voice is a liability.

**Why:** Every auto-committing tool eventually has the "it committed something I didn't want" problem. Memory systems have observer-effect dynamics — discussing the system changes it. The correct gate is human review before publication, not automation of the user's authorship surface.

**How to apply:** When designing new kit features, distinguish kit-controlled operations (fully automate) from user-controlled operations (add review gates). Keep the human at the publish gate. Document this boundary principle in design docs.
