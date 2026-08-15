---
id: P-5J3RE6YQ
type: project
title: Post-D194 artifact update workflow for Kiro trust fix verification
created_at: 2026-06-22T20:19:35Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 271ce91a4003004a9926bd995aea6a045b9a79794d6b365b765f05a688a1d6c6
related: [d-194-fix-merged-to-main-pr-219-commit-96f57c9, fresh-folder-verification-workflow-for-claude-memory-kit-rel, d-197-end-to-end-live-re-test-workflow]
---

After PR #219 (D-194) merges and passes CI, rebuild and reinstall the artifact to activate the Kiro IDE trust fix in the test environment:
1. npm pack (rebuild artifact with new code)
2. Reinstall artifact in C:\Temp\kiro-gate (or existing gate directory)
3. Run cmk install --ide kiro (populates kiroAgent.trustedCommands in .vscode/settings.json)
4. Restart Kiro IDE
5. Verify: the Run/Reject prompt should no longer appear for hook executions (KH-trust gate test)

Note: C:\Temp\kiro-gate was installed before the D-194 fix, so it lacks the trusted-commands entries. The fresh artifact is required for KH-trust verification.

**Why:** The Kiro IDE trust system requires kiroAgent.trustedCommands to be pre-configured in .vscode/settings.json. The D-194 fix adds this during cmk install --ide kiro. Pre-D-194 artifacts cannot exercise this behavior.

**How to apply:** When D-194 merges and you resume the cut-gate from KG11/KH-trust, follow this rebuild sequence before running the KH-trust test to confirm the Kiro hook-trust fix works end-to-end.
