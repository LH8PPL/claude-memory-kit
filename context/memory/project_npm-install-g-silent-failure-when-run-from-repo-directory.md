---
id: P-MALPGCPV
type: project
shape: Timeless
title: npm install -g Silent Failure When Run From Repo Directory
created_at: 2026-07-21T12:47:45Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 7112de52a7d739a8807dcf6ba01e0bafd6ce97434c75e0f1103108329d3a106c
related: [npm-install-g-silent-failure-from-repo-cwd, cut-gate-must-test-published-artifact-not-repo-code, global-cmk-artifact-version-and-template-sync]
---

Running `npm install -g …@latest` from inside the repo directory exits with success (exit 0) but leaves the old version installed. Running from a neutral working directory succeeds properly. The failure is only detectable by explicitly verifying the resulting version.

**Why:** Silent failure creates user experience bugs. Users following documentation showing repo-directory installs will silently get stale versions and encounter unexpected behavior. Undetected by standard install confirmation flows.

**How to apply:** Avoid global npm installs from inside project directories when feasible. If publishing install instructions involving global packages, test the repo-directory scenario and document it or recommend a neutral cwd. Always verify with explicit version checks after package-manager operations.
