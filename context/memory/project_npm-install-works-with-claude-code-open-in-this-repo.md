---
id: P-ETG53B43
type: project
title: npm install works with Claude Code open in this repo
created_at: 2026-06-24T09:52:09Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 2b3fc602d7a2f867d0b1cd06c386200ec4079b0aae3e14a3ea50b61460b17298
related: [user-always-reinstalls-npm-while-claude-q7yrkuf6, npm-uninstall-ebusy-error-with-better-sqlite3-node-on-rebuil, windows-ebusy-on-npm-global-update]
---

- npm install/uninstall reliably works while Claude Code is still running
- User has successfully reinstalled packages mid-session without closing Claude Code across this project
- Contradicts typical better_sqlite3.node EBUSY locking issues
- Earlier caution about closing apps first was unnecessary in this environment

**Why:** User feedback + repeated successful pattern validate this as safe; file-locking concerns do not apply here

**How to apply:** Do not suggest closing Claude Code before npm operations; trust the user's established, working workflow
