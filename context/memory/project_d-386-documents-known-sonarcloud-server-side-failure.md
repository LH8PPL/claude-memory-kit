---
id: P-WGWVVRCJ
type: project
shape: State
title: D-386 Documents Known SonarCloud Server-Side Failure
created_at: 2026-07-21T15:57:15Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 40e96598087be6667660c04edd141c08b3d13a8c20f515f1f449250371ff7fb6
related: [multi-run-ci-diagnostics-separate-code-from-infrastructure-f, sonarcloud-d-341-known-server-side-crash, onnxruntime-node-postinstall-cdn-timeout]
---

D-386 is a diagnostic record documenting a SonarCloud server-side issue affecting this project. Symptoms: 500/504 errors at project-scoped endpoint (e.g., `?key=LH8PPL_core-memory-kit`); failures correlate with wall-clock, not code changes. Causally unrelated to commits. Status page shows "All Systems Operational," so root cause is either undeclared partial outage or wedged project state on SonarCloud's side.

**Why:** Inherited red CI status looks like a code problem to a future session. Recording D-386 prevents misdiagnosis and false investigation.

**How to apply:** When SonarCloud analysis fails on main, check D-386 first. If error matches (500 at project endpoint, timing-based), it's environmental and known. If different error or endpoint, it may be new code issue.
