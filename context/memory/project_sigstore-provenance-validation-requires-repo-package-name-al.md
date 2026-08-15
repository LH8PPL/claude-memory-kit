---
id: P-JJP9JT5F
type: project
shape: Timeless
title: Sigstore Provenance Validation Requires Repo-Package Name Alignment
created_at: 2026-07-15T12:07:27Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: a8fa32e8c496528163184806eae41bc36c84a6e1c69064b2f960a5a0afa5ed0e
related: [sigstore-provenance-requires-github-repo-name-match-for-npm, v0-5-4-released-under-renamed-repo-identity, youtube-to-slide-foreign-format-fact-file-pre-existing-not-r]
---

npm publish with sigstore validation verifies that package.json `repository.url` matches the actual GitHub repo identity. Mismatch → E422 error on publish. **Workaround:** rename the GitHub repo first, repoint local remote, then re-run publish.

**Why:** This prevented v0.5.4 from publishing until the repo was actually renamed; retrying without fixing the root cause would fail indefinitely.

**How to apply:** If a future publish fails with E422 from sigstore, verify GitHub repo name matches package.json, rename if needed, then retry.
