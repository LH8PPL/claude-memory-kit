---
id: P-PU4FZPZW
type: project
title: Kit Versioning Uses Lane-Themed Releases, Not Strict Semver
created_at: 2026-06-13T12:48:37Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 9bc5878e41a7edea0adff602d116cc25fe2b4be7
related: [v0-3-5-patch-vs-v0-4-0-versioning-logic, v0-4-x-versioning-roadmap, versioning-policy-d-24-differentiators-per-release-level]
---

The kit versions releases by thematic "lane" rather than strict semantic versioning. Each lane ships one differentiator per minor version—e.g., v0.3.0 shipped the "within-paradigm polish" differentiator; v0.4.0 is reserved for the "BREADTH"/Kiro cross-agent expansion (D-127). Additive work within a lane increments patch, not minor. This follows the "one-differentiator-per-minor" rule: the differentiator ships at the minor boundary; subsequent polish within that lane is patch-level.

**Why:** Prevents confusion between strict semver (feature = minor bump) and the kit's versioning scheme, where a minor bump signals a paradigm/capability shift, and patches are polish within that shift. Ensures settled decisions (e.g., "v0.4.0 is Kiro") don't get accidentally clobbered by sequential numbering logic.

**How to apply:** When planning a release, identify which lane it belongs to (consult RELEASE-PLAN for existing lane assignments). If additive within an existing lane, use patch-level increment. Document the lane name and differentiator in RELEASE-PLAN to record the decision and prevent future re-litigation.
