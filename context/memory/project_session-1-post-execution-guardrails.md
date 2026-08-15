---
id: P-CFA7ZXAa
type: project
title: Session 1 Post-Execution Guardrails
created_at: 2026-06-14T09:02:08Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 8a9965da41975fc2ec1bef0fbc324bbe82f361fa18739af736de8254b554c301
related: [release-cut-gate-validation-pattern, doctor-is-reactive-only-memory-write-search-are-automatic, avoid-test-folder-contamination-during-agent-sessions]
---

After Session 1 completes, validate three health checks:
  - **★ R1:** no black `node` window flashes at SessionStart
  - **★ R2:** no "Allow this command?" / "Use skill?" prompts during capture
  - **★ B9:** `dir context\memory\project_*.md` shows rich auto-captured facts with Why/How sections (no "remember this" artifacts)

**Why:** Confirms Stop hook and auto-memory extraction system are functioning; validates that durable facts are captured with reasoning sections

**How to apply:** After Session 1 concludes, run directory check and inspect captured memory files; ensure they contain substantive facts with Why/How reasoning, not raw command echoes
