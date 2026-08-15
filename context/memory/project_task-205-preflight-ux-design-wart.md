---
id: P-57TJa5ZM
type: project
shape: State
title: Task 205 Preflight UX Design Wart
created_at: 2026-07-12T12:00:16Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 4075c95e28636af57f8eaa3f374dbd5f52d6afe4630f733a64aadbeb6224e570
related: [task-205-preflight-fires-on-wrong-trigger-design-flaw, claude-memory-kit-dogfooding-setup-and-conflict-surface, cmk-install-auto-updates-managed-block-version-stamps]
---

The `cmk install` preflight prompt warns about a hazard (global upgrade breaking DLLs) that `cmk install` itself cannot cause. Fires on every interactive install (common, safe) to warn about upgrade hazards (rare). Matches the shipped spec and is not a correctness bug, but the design attaches the warning to the wrong trigger. Real scenario is narrow: users preparing to run `npm install -g` upgrade who also run `cmk install` around the same time. Normal answer is always `N` in typical install contexts. Design could be improved by narrowing trigger to upgrade detection, moving to `cmk doctor`, or requiring re-install signal.

**Why:** Explains the preflight's existence, why it seems noisy in practice, and clarifies the narrow real use case. Prevents future confusion if users complain the prompt is unnecessary—it's intentional but overly broad.

**How to apply:** When explaining the preflight, note it's a real safety guard for a specific scenario, packaged as a general check. Current behavior matches spec and is correct; design refinement would be nice-to-have, not urgent.
