---
id: P-DZTLQFUD
type: project
shape: Absence
title: SonarCloud/SonarJS 13.3.0 Does Not Fix Crash
created_at: 2026-07-17T15:38:04Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 84c478f50894d56e7b3f8ef70b2af5b2c70079d8bd6c553155571783bf5a9ff6
related: [sonarcloud-agent-centric-development-beta-causes-crash, cmk-version-bumping-convention, sonarcloud-taint-analysis-context-collector-crashes-not-fixa]
---

SonarJS 13.3.0 shipped today. Verified that it does NOT fix the opendir `C:/proj/context` crash — identical gRPC stack signature persists across versions.

**Why:** Eliminates hypothesis that this is a known SonarJS bug; points to environmental/feature root cause instead

**How to apply:** Don't wait for upstream SonarJS fixes; focus investigation on SonarCloud features or project configuration
