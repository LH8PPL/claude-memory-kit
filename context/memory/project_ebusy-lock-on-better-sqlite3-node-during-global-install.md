---
id: P-THB4NE6Z
type: project
title: EBUSY Lock on better_sqlite3.node During Global Install
created_at: 2026-06-24T09:51:21Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: fa67952d6a0f01017f0c1502a01bd0de0a57cddb4f1d49fb76b290ce659cf0c4
related: [kg-guard-retest-failed-was-stale-artifact-not-fix, ebusy-workaround-for-global-package-reinstalls-native-bindin, testing-workflow-for-claude-memory-kit-fixes]
---

When installing `@lh8ppl/claude-memory-kit` globally, `better_sqlite3.node` may be locked by open Claude Code/Kiro windows. Install reports "success" but silently leaves old code in place.

**Workaround:**
1. Close Claude Code + Kiro windows (release DLL locks)
2. Run `npm uninstall -g @lh8ppl/claude-memory-kit` then fresh install
3. **Verify** (required — don't trust npm success):
   ```powershell
   Select-String "$(npm root -g)\@lh8ppl\claude-memory-kit\src\kiro-cli-agent.mjs" -Pattern "kiroRoot"
   ```
   Must print a match. If empty, close apps and retry.

**Why:** Prior session's install "succeeded" but left stale code due to EBUSY; npm output is misleading. The verify check prevents repeating this silent failure.

**How to apply:** Next global CLI rebuild: always close Claude Code/Kiro first, always run the Select-String verify. Don't trust npm success message alone.
