---
id: P-W7LKGN53
type: project
shape: State
title: 'BUG (live-probed 2026-07-20): concurrent scratchpad writes SILENTLY LOSE bullets'
created_at: 2026-07-20T08:38:47Z
write_source: user-explicit
trust: high
recurrence_count: 1
source_file: user-explicit
source_line: 1
source_sha1: 7177e5cfc1c1c3e39e94cb1fbfc29d8a2572c12b292a1ec0f10afb8b51bed826
related: [retraction-of-d-365-there-is-no-concurrent-write-data-loss-b, cut-blocker-mcp-mk-remember-silent-dataloss-kiro-cli-claude, definitive-kiro-cli-does-not-pass-mcp-json-env-to-stdio-serv]
---

BUG (live-probed 2026-07-20): concurrent scratchpad writes SILENTLY LOSE bullets. appendScratchpadBullet (scratchpad.mjs:362) does an UNGUARDED readFileSync -> mutate -> writeFileSync with no lock, no atomic rename, no compare-and-swap. Two processes read the same original, each inserts its own bullet, the second write clobbers the first. Measured on Windows with the real repo binary: 16 concurrent 'cmk remember' bare-bullet writes -> 8 of 16 bullets LOST, all 16 processes exit 0 reporting success, no leaked locks, file structurally intact (headings + markers fine). Reproduces deterministically at 16-way; 8-way was clean, so it is load-threshold dependent. Rich fact writes (--title, separate files per fact) are UNAFFECTED: 24/24 landed with zero loss.

**Why:** Worst failure shape: silent data loss with a success exit code. The kit's whole promise is durable memory. Any concurrent-agent scenario hits this - an ultracode/workflow fan-out where each subagent's Stop hook or mk_remember appends to one MEMORY.md, two Claude Code windows on one repo, or Claude + Kiro dual-agent (a shipped supported config). The .locks dir and lock-discipline.mjs exist to DETECT stale locks but the scratchpad write path never TAKES one.

**How to apply:** Fix in the write path, not the callers: guard appendScratchpadBullet (and the sibling read-modify-write sites in memory-write.mjs remove/replace at 471/496 and 580/615) with an exclusive lock (O_EXCL lockfile + the existing stale-lock detection) or a write-temp-then-atomic-rename with a content-hash CAS retry. Loss must become either a serialized success or a loud retry - never a silent exit 0. Regression test: N-way concurrent writes assert all N bullets present.
