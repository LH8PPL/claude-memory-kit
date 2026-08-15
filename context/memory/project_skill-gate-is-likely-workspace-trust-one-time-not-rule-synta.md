---
id: P-GWVaLVBE
type: project
title: SKILL gate is likely workspace-trust (one-time), not rule syntax — space form ruled out
created_at: 2026-06-27T14:17:55Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: 7e10c5b6f719ab3bb66d48fcef1e83cee67c9221e7aa8846f0f9ab9b73c7682a
related: [skill-gate-clicking-allow-persists-nothing-workspace-trust-i, skill-gate-docs-say-skill-name-space-kit-writes-skill-name-c, root-cause-skill-md-allowed-tools-frontmatter-triggers-the-a]
---

SKILL-GATE update (cut-gate-v041i, 2026-06-27): the space-form Skill(memory-write *) did NOT suppress the "Use skill /memory-write?" prompt — so the colon-vs-space SYNTAX was NOT the skill-gate cause (ruled out). Ground truth: v041i has NO record in ~/.claude.json — hasTrustDialogAccepted is unset, the folder is NOT yet trusted by CC. Per the skills doc (code.claude.com/docs/en/skills lines 123 + 364): project .claude/skills/ skill permissions "take effect AFTER you accept the workspace trust dialog for that folder." NEW HYPOTHESIS: the skill prompt is the WORKSPACE-TRUST / first-use-per-folder approval, NOT a rule-syntax problem — which is why neither colon nor space form helped. TEST IN PROGRESS: click "allow (shared)" on the first skill prompt (should write trust/approval), then state a SECOND preference and see if the skill prompt fires AGAIN. If the second capture is prompt-free → the gate is one-time per-folder trust acceptance (acceptable CC security model, document it). If it prompts again → genuinely per-invocation, unsuppressable by settings. Do NOT conclude until the second-preference result is observed.

**Why:** The space-form Skill rule didn't suppress the prompt, ruling out the syntax theory; the folder has no trust record, pointing at the documented workspace-trust prerequisite as the real skill-gate cause. Must confirm whether it clears after one approval.

**How to apply:** After clicking allow on the first skill prompt, state a second preference; if prompt-free, the skill gate is one-time per-folder trust (document as expected CC behavior, not a kit bug); if it re-prompts, escalate. Pair conclusion with Task 172.
