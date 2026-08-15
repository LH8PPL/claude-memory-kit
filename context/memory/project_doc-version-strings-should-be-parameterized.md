---
id: P-JQ76A4W6
type: project
title: Doc Version Strings Should Be Parameterized
created_at: 2026-06-18T13:04:03Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: bfea3e4f2b28e1ab0971629ccbc9200ad342d3b993444a599e9f1fb4009cc27d
related: [social-card-assets-location, name-guard-flags-templated-patterns-in-frontmatter-metadata, tool-quirk-cmk-pack-uses-committed-tree-version]
---

Version references in guides (e.g. tarball version, package.json matches) should use placeholders like `<version>`, `*.tgz`, or "matches package.json" rather than hardcoded numbers. This prevents docs from going stale when versions change.

**Why:** Docs go stale; the tarball example in the guide had 0.3.2 but the actual install is 0.3.3. Parameterized docs are maintenance-free.

**How to apply:** When updating guides, use version-agnostic language instead of specific version numbers.
