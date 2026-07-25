---
id: P-QT3B3ZB7
legacy_id: "P-RES031CG"
type: project
title: RESUME — v0.3.1 cut-gate near-complete; PR #184 in CI, then tag
created_at: 2026-06-14T23:35:00Z
write_source: manual-edit
trust: high
source_file: resume-breadcrumb
source_line: 1
source_sha1: 0000000000000000000000000000000000000000
---

v0.3.1 CUT-GATE STATE (resume here):

MERGED to main (all in v0.3.1, NOT yet tagged):
- #178 repair-index, #179 private-write+SHA256, #180 private-title-trunc, #181 INDEX-observability, #182 INDEX-self-heal-pin, #183 RECALL FIX (D-153 v1+v2: structure/oblique questions reach memory; general-intent description + hint-reference; proven live).
- Dogfood memory + 2 deep-research docs (docs/research/2026-06-14-{recall-triggering,persona-promotion}-models-cross-system.md).
- Release commit (version 0.3.1, package.json bumped) is on main but UNTAGGED.

IN FLIGHT — PR #184 (branch fix-persona-review-autodrain, D-154):
- Persona auto-drain: resolvePersonaReviewQueue + autoDrainQueues wiring. Stops the stranded-persona-queue bug (medium-confidence cross-project traits never reached the persona). Auto-promote on weekly drain; NO manual command (the user's rule). Post-hoc revert via cmk forget.
- HEAD 858a8c9 = the ReDoS fix (Sonar flagged 2 super-linear regexes in the persona-queue parsers; rewrote with negated char classes). CI re-running.
- Gates already passed pre-ReDoS-push: suite 1900/1900, stress 5/5, integration + idempotency + REAL-DATA proven (the drain promoted 6 stranded candidates incl. the architecture philosophy into the real LESSONS.md/USER.md).
- NEXT: when #184 CI+Sonar green -> squash-merge -> pull main.

COLD-OPEN RE-TEST = DEFINITIVE PASS (the whole point):
- Fresh project + cmk install --with-semantic + "start a new Python backend": scaffolded the LAYERED structure (app/{routes,services,repositories,models,schemas}) + uv + async SQLAlchemy + type hints + ruff, persona APPLIED, memory-search skill fired. The wedge fully transfers now (was broken: built plain routers/ before the D-154 fix).

AFTER #184 MERGES -> the user runs `git tag v0.3.1 && git push origin v0.3.1` (their outward step; triggers publish.yml). That is the only remaining step to ship v0.3.1.

v0.4 follow-ups logged: Task 148 (auto-judged privacy), Task 149 (recall-architecture ADR), Task 150 (AI-judged memory-commit), Task 151 (persona-promotion redesign: recurrence-scored not phrasing-gated — the full version of D-154's down-payment). All design-first.

PROCESS LESSON this session (recorded): CHECK validator exit codes BEFORE pushing to public main (pushed 3x before verifying earlier; name-privacy + references caught leaks post-push). `node scripts/validate-X.mjs >/dev/null 2>&1; echo $?` before every push.
