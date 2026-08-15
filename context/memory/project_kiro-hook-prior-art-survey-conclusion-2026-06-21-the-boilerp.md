---
id: P-4aNa5TZB
type: project
title: Kiro hook prior-art survey conclusion (2026-06-21, the boilerplate article + kir
created_at: 2026-06-21T06:07:44Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: 652d6f1405d8fee5483f2bed8f877b225c9ee9bc5b14e2dc41294a6abf344a60
related: [kiro-ide-kiro-hook-on-disk-format-verified-from-a-real-hook, kiro-hook-environment-verified-live-2026-06-21-the-probe-cap, kiro-hook-authoritative-confirmations-2026-06-21-from-the-aw]
---

Kiro hook prior-art survey conclusion (2026-06-21, the boilerplate article + kiro-professional-toolkit + earlier survey): the ENTIRE published Kiro-hook ecosystem uses then:askAgent (LLM-prompt) hooks — NOBODY publishes then:runCommand (deterministic-script) hooks. So there is NO prior art for 'how a runCommand hook reads the turn content' — the kit's live PROBE (env+argv+cwd, no stdin JSON) is the authoritative source, not docs/repos. TWO useful new facts from the boilerplate article (awsdataarchitect/kiro-best-practices): (1) hooks require RESTARTING KIRO to activate (steering is immediate, hooks are not) — the kit must tell users to restart Kiro after install; (2) .kiro.hook confirmed fields: enabled, name, description, version:'1.0.0', when:{type,patterns?}, then:{type:askAgent|runCommand,...}. The kit is the FIRST to do deterministic runCommand memory capture on Kiro — which is exactly why live-testing was essential (no one to copy).

**Why:** Confirms the kit is doing something novel (deterministic runCommand capture) that no published Kiro project does — they all use askAgent. So the probe is the ground truth + the kit can't lean on examples for the runCommand input model. The restart-to-activate-hooks detail is a real install-UX requirement to document.

**How to apply:** Build the cmk hook bin from the PROBE findings (env USER_PROMPT + argv event + cwd project-root + transcript file), not from examples (none exist for runCommand). README/install must say 'restart Kiro after install to activate hooks' (per the boilerplate article + Kiro docs). The kit pioneers deterministic Kiro memory capture.
