---
id: P-4DWZ7L72
type: project
shape: Timeless
title: SonarCloud Taint Analysis — Context Collector Crashes Not Fixable Via Rule Disabling
created_at: 2026-07-15T13:40:10Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: c45d811cb0af4faa18349d24bb9edd2833bbbd6b1910a786fe5a154eb6e6828e
related: [sonarcloud-sonarjs-13-3-0-does-not-fix-crash, kiro-cli-wraps-mcp-servers-in-cmd-exe-undocumented-platform, kiro-cli-env-passing-limitation]
---

- Taint analysis is configured via Quality Profiles (sidebar → Quality Profiles → copy "Sonar way" → deactivate S51xx security rules)
- **Critical limitation:** crashes occur in the taint-engine *context collector* phase (runs during project analysis), not during rule evaluation
- Disabling rules in Quality Profiles won't prevent the context collector from running; the crash persists regardless
- Per SonarSource staff: taint-*engine* crashes (not rule-firing issues) require vendor support; disabling rules is not a workaround

**Why:** SonarSource documentation + community precedent confirm this is a known limitation; prevents time wasted on configuration-based workarounds for engine-level problems

**How to apply:** If SonarCloud taint analysis crashes, recognize it as a taint-engine issue requiring vendor support, not a user-configurable toggle — don't pursue the Quality Profile route
