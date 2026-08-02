# Design — core-memory-kit v0.1.0

**Status**: Draft, section 1-3 of N · **Author**: Claude (Opus 4.7) + the maintainer · **Date started**: 2026-05-22

This document specifies **HOW** v0.1.0 is built.
The companion [`requirements.md`](requirements.md) specifies **WHAT** v0.1.0 must do.
Every section here cites the FRs it implements.

The design assumes [`requirements-revisions-proposed.md`](../archive/specs/v0.1.0/requirements-revisions-proposed.md) is approved (it is, per user 2026-05-22 — locked in tenets T7/T8, US-14/15, FR-28/29/30, NFR-9, OS-9..13, OQ-8).

---

## 1. Architecture overview

### 1.1 The three tiers (where memory lives)

```text
┌─────────────────────────────────────────────────────────────────────┐
│  USER TIER  ~/.core-memory-kit/                                    │
│  • USER.md         identity (1,375 char cap)                         │
│  • HABITS.md       cross-project working style (1,800 char cap)      │
│  • LESSONS.md      cross-project lessons (1,800 char cap) [NEW v0.1] │
│  • fragments/      typed per-fact archive + INDEX.md                 │
│  Loaded with LOWEST priority. Machine-local. NOT in any git repo.   │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────────┐
│  PROJECT TIER  <repo>/context/                                       │
│  • SOUL.md         project persona (1,800 char cap)                  │
│  • MEMORY.md       working state (2,500 char cap)                    │
│  • memory/         typed per-fact archive + INDEX.md                 │
│  • sessions/                                                         │
│      ├─ now.md     current session buffer (no cap, replaced each session) │
│      ├─ today-{YYYY-MM-DD}.md   Haiku-compressed daily summary       │
│      ├─ recent.md  rolling 7-day consolidation                       │
│      └─ archive.md older history (append-only)                       │
│  • transcripts/{YYYY-MM-DD}.md  verbatim capture (preserved forever) │
│  • .index/memory.db             SQLite+FTS5 read cache (gitignored)  │
│  Loaded with MIDDLE priority. Committed to git. Travels with clone.  │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────────┐
│  LOCAL TIER  <repo>/context.local/                                   │
│  • machine-paths.md  absolute paths for this machine (1,500 cap)     │
│  • overrides.md      machine-specific overrides (1,500 cap)          │
│  Loaded with HIGHEST priority (most-specific wins).                  │
│  Automatically added to .gitignore at install time.                  │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
                      Frozen snapshot injected
                      into Claude's context window
                      at session start (≤10KB total)
```

**Precedence model** (Git config semantics): first-match-wins at observation level, deep-merge at settings level. When two tiers have the same observation ID, the most-specific tier (highest priority) wins and the others are logged as `shadowed_by` in the debug output. See §6.

**User-tier path override**: the user tier path defaults to `~/.core-memory-kit/` but can be overridden via the `MEMORY_KIT_USER_DIR` environment variable. Use cases: testing against an isolated fixture, multi-account machines, encrypted home directories, ephemeral CI runners, **pointing the user tier at a synced folder (Dropbox/iCloud) or a git checkout for cross-machine portability**. When the env var is set and points to a non-existent directory, `cmk init-user-tier` creates it; otherwise the kit reads from the override path.

**Portability — two scopes, two transports (Task 72 / D-27/D-69).** The tiers don't all travel the same way, and that's deliberate:

- **Project memory follows the REPO.** `context/` is committed, so `git clone` carries it and teammates share it. Transport = git, automatic.
- **The persona follows the HUMAN, not the repo.** The user tier (`~/.core-memory-kit/` — USER/HABITS/LESSONS + `fragments/`) is machine-local and kept *out* of any project, because committing your working-style would leak it to everyone who clones (and the OS/git username differs across your own machines, so per-repo namespacing fails the exact cross-machine case). So persona portability is **per-human, not per-repo**:
  - **Built (72.1):** `cmk persona export <file>` packs the user tier into one OS-agnostic JSON bundle (allow-list: scratchpads + `settings.json` + `fragments/` + `queues/`; runtime `.locks/.index/.import-backups` excluded), and `cmk persona import <file>` applies it on another machine (overwrite + per-file backup + transactional rollback + reindex). Carry the bundle via your own private channel; content is already home-path-sanitized + Poison_Guard'd, so no usernames/secrets travel. Forward-slash bundle paths → Windows↔Mac round-trip. See [`persona-portability.mjs`](../packages/cli/src/persona-portability.mjs).
  - **Deferred (72.2, §16 candidate):** `cmk persona sync <your-private-git-url>` — make the user tier a git repo on *your own* remote with auto-pull@SessionStart + auto-push@curation (git handles transport + merge/conflict). The seamless-UX + conflict-resolution design is a deep-research candidate, so it lands after the explicit primitive.
  - **The trap to avoid:** never commit the persona into a project to make it portable — that breaks the team scenario (each person keeps their own persona; it's never shared).

**Implements**: FR-1, FR-4, FR-5, FR-6, FR-7 (T1, T2, T3, T8); Task 72 (T2 extended to the user tier).

### 1.2 Coexistence with Anthropic's Auto Memory (Option D)

```text
~/.claude/projects/<slug>/memory/         ← Anthropic's auto-memory
    MEMORY.md                                (machine-local, automatic)
    <topic>.md
        │
        │   Anthropic writes here automatically (its built-in writer)
        │   Loaded by Claude Code natively at session start
        │
        ▼
        Claude Code session context

<repo>/context/                            ← OUR memory
    SOUL.md / USER.md / MEMORY.md / etc.
        │
        │   Our hooks write here
        │   Our PreToolUse hook injects this FIRST as additionalContext
        │
        ▼
        Claude Code session context (placed before Anthropic's by hook timing)
```

**Both writers run. Both memories load.** Ours is injected first via our PreToolUse hook, so it appears earlier in the prompt and gets more attention.

**Semantic precedence**: ours is the **committed canonical version** (humans review it; it travels with git). Anthropic's is **machine-local supplementary capture**.

**Bridge command**: `cmk import-anthropic-memory` merges useful bullets from `~/.claude/projects/<slug>/memory/MEMORY.md` into `<repo>/context/MEMORY.md` on demand (with dedup via citation IDs).

**Implements**: ADR-0011 Option D.

### 1.3 The six layers (what gets built)

| Layer | What | Required? | Maps to FR(s) |
| --- | --- | --- | --- |
| **1** | Directory tree + `.gitignore` injection | Yes | FR-1, FR-4, FR-5 |
| **2** | Granular per-fact archive + INDEX | Yes | FR-1, FR-29 |
| **3** | Bounded scratchpads (SOUL/USER/MEMORY/HABITS/LESSONS) | Yes | FR-3 |
| **4** | Six lifecycle hooks + auto-extract subagent + `memory-write` skill | Recommended | FR-9, FR-10, FR-11 |
| **5** | Search: SQLite+FTS5 cache (5a, shipped) + a Layer-5b embedded vector backend (deferred, not yet shipped — §9.3.1) | Optional | FR-16, FR-17, FR-18 |
| **6** | Auto-curation: cron jobs for rolling-window compression | Optional | FR-19, FR-20, FR-21 |

Each layer is replaceable. Layer 1-3 is pure file ops. Layer 4 is what makes memory automatic. Layer 5-6 are optional power features.

**Implementation convention**: each tier's operations are exposed via single-export modules in [`packages/cli/src/`](../packages/cli/src/) (one boundary per task — `writeFact`, `reindex`, `forget`, `mergeFacts`, etc.). Internal helpers shared across those modules live in `packages/cli/src/{tier-paths,audit-log,frontmatter,result-shapes,fact-store}.mjs`. This split is **implementation detail; not part of the public user-facing surface**, but future task modules MUST import from the shared helpers rather than reimplement path resolution, YAML parsing, audit-logging, result-shape conventions, or the fact-archive walk. See [`CLAUDE.md`](../CLAUDE.md) "Shared modules" rule. Established post-Checkpoint-11 after the Layer-2 code-review pass surfaced cross-task drift (extracted 2026-05-24).

**`fact-store.mjs` — the canonical walk over the granular archive (Task 241, 2026-07-21).** The other four shared modules were extracted in 2026-05; the WALK was not, and by 2026-07 a measured clone audit (D-368) found it reimplemented in **14 sites** — four byte-identical listers under two names, two 14-line walk clones, and eight inline `readdir`-filter loops spelled three different ways (`entry.name === 'INDEX.md'`, `name === 'INDEX.md'`, `n !== 'INDEX.md'`). The consequence was concrete: a new skip rule had to be remembered in fourteen places, and that drift had already produced a bug once (INDEX.md unfiltered in `write-fact`'s dedup scan while every other walker excluded it). The module exposes a lister (`listMarkdownFiles` / `listFactFiles`), the tier selector (`tiersFor`), and three generators (`eachFactIn` / `eachFact` / `eachLiveFact`) so a caller supplies ONLY its predicate. **`eachLiveFact` is deliberately not the sole door** — `trust` and `write-fact` must still see tombstoned facts, and encoding that as a separate generator keeps the difference visible rather than hidden behind an options flag. Sites that share the mechanics but not the collection (the scratchpad walk, the `judgment_*` walk, an existence probe that short-circuits by design) take the primitive or stay put, each recorded in the module's header.

### 1.4 Data flow

**At session start** (one-time per session):

```text
SessionStart hook fires
    │
    ├─ Resolve 3-tier file paths
    │       local: <repo>/context.local/
    │       project: <repo>/context/
    │       user: ~/.core-memory-kit/
    │
    ├─ Read in priority order (local → project → user)
    │       SOUL.md, USER.md, HABITS.md
    │       MEMORY.md, LESSONS.md
    │       memory/INDEX.md + fragments/INDEX.md
    │       latest sessions/today-*.md
    │
    ├─ Concatenate into frozen snapshot block (≤ 10 KB total)
    │
    └─ Emit as `additionalContext` via hook output JSON
            │
            ▼
        Claude's context window (snapshot injected at top)

  ─── (Anthropic's auto-memory MEMORY.md also loads naturally) ───

  Session begins with both memories visible. Ours sits earlier.
```

**During each turn**:

```text
User prompt
    │
    ├─ UserPromptSubmit hook fires
    │       Captures prompt to context/transcripts/{date}.md
    │       Strips <private>…</private> content (replaced with [redacted])
    │       Optionally tags intent (question/decision/correction)
    │
    ├─ Claude responds (one or more turns with tool calls)
    │       PostToolUse hook fires on Write|Edit|MultiEdit only
    │           If tool output > 50 lines: append summary to sessions/now.md
    │           Async fire-and-forget
    │
    └─ Stop hook fires (end of assistant turn)
            │
            ├─ Append turn to context/transcripts/{date}.md
            │       Strip <private>, force-keep <retain>
            │
            └─ Spawn detached background process:
                    scripts/auto-extract-memory.sh <turn_temp_file>
                            │
                            ├─ Reads transcripts/{date}.md, MEMORY.md, INDEX.md
                            ├─ Invokes `claude --print` with extraction prompt
                            ├─ Sub-Claude judges: durable? Skip or save?
                            │     If save: writes via memory-write skill
                            │     If skip: log "skip: nothing durable"
                            └─ Logs structured JSON to sessions/{date}.extract.log
                                  {ts, success, error_category, observation_count, skipped_reason}
```

**At session end**:

```text
SessionEnd hook fires
    │
    ├─ Read sessions/now.md (live session buffer)
    │
    ├─ Invoke compressor (Haiku 4.5 default, pluggable interface)
    │       Compresses now.md → today-{date}.md
    │       Preserves citation IDs and headings (FR-20)
    │       Truncates now.md after successful compression
    │
    └─ Flush any pending memory writes to disk
```

**Asynchronous (cron)**:

```text
Daily   23:00  scripts/run-daily-distill.sh
                Extract durable facts from sessions/today-*.md into MEMORY.md/granular archive

Weekly  Sun 09:00  scripts/run-weekly-curate.sh
                Prune resolved Active Threads, merge duplicates, drop stale entries
                Roll oldest today-*.md (>7 days) into archive.md
                Generate recent.md from last 7 days
```

**Implements**: FR-7, FR-8, FR-9, FR-10, FR-12, FR-13, FR-19.

---

## 2. Storage schemas

### 2.1 Bounded scratchpad format

All scratchpad files (`SOUL.md`, `USER.md`, `HABITS.md`, `LESSONS.md`, `MEMORY.md`) share the same shape:

```markdown
<!--
Cap: 2500 chars.
Last distilled: 2026-05-22.
Last health check: 2026-05-22.
-->

# Working Memory

## Active Threads

- (P-S79MJHFN) we standardized on Python 3.13
  <!-- source: transcripts/2026-05-22.md, source_line: 142, sha1: abc123ef..., write: user-explicit, trust: high, at: 2026-05-22T14:30:00Z -->

- (P-WJCLLKH6) milvus pinned at v2.6.16 in milvus-deploy/docker-compose.yml
  <!-- source: transcripts/2026-05-21.md, source_line: 88, sha1: def456gh..., write: auto-extract, trust: medium, at: 2026-05-21T19:45:12Z -->

## Environment Notes

- ...

## Pending Decisions

- ...
```

**Key conventions**:

- **HTML comment frontmatter at top** for size cap, last-distilled, last-health-check. These comments are stripped from Claude's context per Anthropic's docs (saves tokens; humans still see them when viewing).
- **Three fixed sections** per file (Active Threads / Environment Notes / Pending Decisions for `MEMORY.md`; About / Preferences / Working Style for `USER.md`; etc.).
- **One bullet per fact**, ≤ 200 chars per bullet (the bullet text itself, not counting metadata).
- **Provenance frontmatter** in HTML comment immediately below the bullet. Required fields per Task 13: `source` (file path), `source_line` (positive integer), `sha1`, `write` (enum), `trust` (enum), `at` (ISO 8601 UTC). The 7th required field is `id` — recovered from the bullet line's `(P-XXX)` prefix, not duplicated in the comment. **Optional `shape`** (Task 66.1, §16.18): the 7-value temporal classification (`State`/`Event`/`Plan`/`Relationship`/`Preference`/`Absence`/`Timeless`, case-sensitive); when present it rides the TAIL of the comment (after `at`) so the canonical 6-field prefix stays byte-stable for pre-66 consumers; absence reads as `State`. The canonical writer/reader pair is [`packages/cli/src/provenance.mjs`](../packages/cli/src/provenance.mjs) (`writeBullet` / `readBullet` / `parseBulletProvenance`); don't roll your own. (Per T8, FR-29.)
- **Citation ID in parentheses at start of bullet**: `(P-S79MJHFN)`. (Per FR-14.)
- **Section sign delimiter `§`** is NOT used in our format (Hermes uses it; we use markdown bullets — simpler and git-diffable).

**Char cap enforcement**: counted via `wc -c` on the file. Includes everything (frontmatter, comments, bullets). When a write would push the file over cap, the `memory-write` skill **consolidates first** (merge similar bullets, drop stale entries older than 14 days with no current reference), then writes the new content. (Per FR-3.)

**Caps are configurable** via `<repo>/context/settings.json` (project tier) or `~/.core-memory-kit/settings.json` (user tier). Defaults match the values shown in the §1.1 tier diagram. Per-project override example:

```json
{
  "scratchpads": {
    "MEMORY.md": { "max_chars": 4000 },
    "SOUL.md":   { "max_chars": 2200 },
    "USER.md":   { "max_chars": 1375 }
  }
}
```

Hardcoded defaults in design.md are starting points; teams that distill more aggressively or want more room can tune without forking the kit. (Per Cursor spec convergence + Hermes Agent's 1,375-char USER.md cap derivation — both treat caps as parameters, not constants.)

**Implements**: FR-1, FR-3, FR-29 (T8).

### 2.2 Granular per-fact archive

`memory/<type>_<slug>.md` files. One fact per file. Frontmatter is YAML, not HTML comment:

```markdown
---
id: P-7K2X9Q4F
aliases: [P-7K2X9Q4F]          # Task 254: the fact's own id as an Obsidian alias, so
                               # `[[P-XXXX]]` resolves in a vault view (§9.6). Forward-only.
type: feedback
shape: Preference              # Task 66.1: temporal classification, default State (§16.18)
title: Webcam ROI is wider than expected
created_at: 2026-05-22T14:30:00Z
write_source: user-explicit
trust: high
recurrence_count: 1            # Task 151.1: capped-recurrence promotion signal (§20.1)
source_file: context/transcripts/2026-05-21.md
source_line: 142
source_sha1: abc123ef...
merged_from: null
related: [P-S79MJHFN]
tags: [video-pipeline, roi, calibration]
private: false                 # if true, excluded from SessionStart digest
---

# Webcam ROI is wider than expected

## Fact

`--roi 0,0,80,100` is not enough exclusion for Krish-Naik-style overlays where the webcam circle reaches ~70% of screen width. Use `--roi 0,0,72,100` minimum.

## Why

Krish Naik's setup has a wide circular webcam overlay (not the typical narrow rectangle). The 80% cutoff still leaves the right edge of the circle visible in the ROI, causing motion artifacts to confuse the stability detector.

## How to apply

- Default to `--roi 0,0,72,100` for any Krish-Naik-style video.
- For other talking-head videos, calibrate by running `--probe` first and checking `motion-heatmap.jpg`.

## Related observations

- See [[P-S79MJHFN]] for the broader auto-ROI design notes.
```

**Type taxonomy** (from claude-mem + Anthropic auto-memory pattern):

| Type | What it stores | Example slug |
| --- | --- | --- |
| `user_*` | Facts about the user | `user_role.md`, `user_hardware.md` |
| `feedback_*` | Corrections / preferences | `feedback_no_sre_framing.md` |
| `project_*` | Project decisions with rationale | `project_milvus_version.md` |
| `reference_*` | Pointers to external systems | `reference_grafana_dashboard.md` |

**Implements**: FR-1, FR-29.

### 2.3 INDEX.md (the pointer index)

`memory/INDEX.md` (and `fragments/INDEX.md` for the user tier) is the **pointer file**, not content-direct. Per the Claude Code leak: Anthropic's `MEMORY.md` is also a pointer index. Two reasons:

1. **Token budget**: first 200 lines / ~25 KB load at session start (per Anthropic's pattern). The pointer index uses ~150 chars per line × 200 lines = ~30 KB max if everything is pointed at. Content-direct would blow this immediately.
2. **Discoverability**: Claude scans the index to know what's available, then reads specific topic files on demand.

```markdown
# Granular memory index — project tier

## Files

- (P-S79MJHFN) [feedback] [Webcam ROI is wider than expected](feedback_webcam_roi.md) — `--roi 0,0,80,100` not enough
- (P-WJCLLKH6) [project] [Milvus version pinned at v2.6.16](project_milvus_version.md) — v2.6+ Woodpecker WAL needs manual flush
- (P-34GZDKAW) [user] [Wiki for research and study](user_use_case_wiki_research.md) — informs density/quality tradeoffs
```

**Format per line**: `- ({id}) [type] [title](filename.md) — short hook`. Pointer + one-line summary. Stable IDs survive INDEX rebuilds.

**Implements**: FR-1, FR-7.

---

## 3. Citation IDs (content-addressed)

### 3.1 Format

```text
<tier_prefix>-<base32(SHA-256(canonical_text))[:8]>
```

Where:

- `<tier_prefix>` is `U` (user), `P` (project), or `L` (local).
- `canonical_text` is the bullet's text after canonicalization (§3.2).
- `SHA-256(...)` produces a 32-byte hash.
- `base32(...)` uses a **kit-custom 32-char alphabet** that excludes all six ambiguous chars `0`, `O`, `1`, `l`, `I`, `8`. Length: 8 chars = 40 bits = ~10⁻⁶ collision probability per pair at 10⁶ entries.

**Alphabet** (frozen as of Task 5, PR #5): `"2345679ABCDEFGHJKLMNPQRSTUVWXYZa"` — 7 unambiguous digits (`2,3,4,5,6,7,9`) + 24 unambiguous uppercase letters (A–Z minus `I`, `O`) + lowercase `a` to reach 32 chars. RFC 4648's base32 alphabet minus `I,O` yields only 30 chars, which would not preserve 5-bit-per-char encoding; the lowercase `a` is the minimal deviation that satisfies both the no-ambiguous-chars rule and the base32 bit-width requirement.

**Examples**:

| Bullet text | Canonical text | Hash → base32 → ID |
| --- | --- | --- |
| `We standardized on Python 3.13` | `we standardized on python 3.13` | `7K2X9Q4F` → `P-7K2X9Q4F` |
| `Milvus is pinned at v2.6.16` | `milvus is pinned at v2.6.16` | `WJCLLKH6` → `P-WJCLLKH6` |
| `User runs macOS 14 Sonoma` | `user runs macos 14 sonoma` | `34GZDKAW` → `U-34GZDKAW` |

**Session anchors are different** — they use BibTeX-style human-mnemonic IDs:

```text
S-2026Q2-001   ← session 1 of Q2 2026
S-2026Q2-002
S-2026Q2-003
```

Sessions are temporal markers, not content; mnemonic IDs are more useful for humans browsing the archive.

### 3.2 Canonical text rules

Input to SHA-256 is `canonicalize(bullet_text)`:

1. **Trim** leading/trailing whitespace.
2. **Collapse whitespace**: any run of `\s+` (including newlines) → single space.
3. **Lowercase**: ASCII lowercase. (Non-ASCII characters pass through unchanged.)
4. **Strip citation backrefs**: remove `(P-XXXXXXXX)`, `(U-XXXXXXXX)`, `(L-XXXXXXXX)` patterns if present.
5. **Strip leading bullet marker**: remove `^[-*+]\s+` if present.
6. **Strip trailing punctuation**: `.`, `,`, `;` at end.
7. **Strip frontmatter HTML comments**: `<!--.*?-->` removed before hashing.

The function MUST be deterministic and identical across all writers (auto-extract sub-Claude, memory-write skill, manual edits). The kit ships a single shared `canonicalize()` implementation in `cmk` Node binary AND in Python (for cron scripts).

### 3.3 Generation algorithm

```typescript
function generateId(tier: 'U' | 'P' | 'L', bullet_text: string): string {
  const canonical = canonicalize(bullet_text);
  const hash = sha256(canonical);                    // 32 bytes
  const base32 = encodeBase32NoAmbiguous(hash);      // ~52 chars
  const id_chars = base32.substring(0, 8);
  return `${tier}-${id_chars}`;
}
```

Implementation lives in `cmk` CLI's shared library (`@lh8ppl/cmk-canonicalize` package, MIT) so external tools (e.g. personal-wiki ingest) can compute the same IDs deterministically.

### 3.4 Consolidation / merge semantics

When the weekly curator merges bullets `A` (`#P-AAAAAAAA`) and `B` (`#P-BBBBBBBB`) into `C` (new merged text):

1. Compute `C`'s canonical text.
2. Compute `C`'s ID: `P-<hash(C)>`.
3. In `C`'s frontmatter, record `merged_from: [P-AAAAAAAA, P-BBBBBBBB]`.
4. In the granular archive, the original files `A.md` and `B.md` are **moved** (not deleted) to `memory/archive/superseded/`, with frontmatter `superseded_by: P-CCCCCCCC` added.
5. Search results favor `C` (live version) but `mk_get(P-AAAAAAAA)` still resolves — it returns A's content plus a "merged into C: P-CCCCCCCC" annotation.

This mirrors DOI deprecation: old IDs never die; they point to the new one.

**Note on transitivity**: `merged_from` records only direct parents. A chain — A+B → C₁; C₁+D → C₂ — gives `C₂.merged_from = [C₁, D]`, not `[A, B, D]`. The full lineage is walkable via successive `resolveFact()` calls. Decided this way for storage simplicity; a flat-transitive list can be derived on demand if a tool needs it.

### 3.5 Why this scheme

- **Natural dedup**: identical text → identical ID. Re-capturing the same fact produces no duplicate.
- **Consolidation-stable**: merged bullets get new IDs deterministically; original IDs are preserved via `merged_from`.
- **Cross-machine portable**: no clock, no counter, no central authority. Two machines mint the same ID for the same canonical text.
- **Tier-namespaced**: `P-X` and `U-X` cannot collide even if hashes coincide.
- **Readable**: base32 (no ambiguous chars) survives copy-paste, voice dictation, URL embedding.

**Implements**: FR-14, ADR-0007.

---

## 4. Provenance frontmatter

Every bullet in a scratchpad file and every fact in the granular archive carries provenance metadata. Required fields:

| Field | Type | What it means |
| --- | --- | --- |
| `id` | string | Citation ID from §3 (e.g. `P-S79MJHFN`) |
| `source_file` | string | Path to the source transcript/session |
| `source_line` | int | Line in source (1-indexed) |
| `source_sha1` | string | SHA-256 of source at capture time (detects drift). Field name kept for on-disk back-compat; algorithm is SHA-256 since the kit-wide fingerprint migration (D-149). |
| `write_source` | enum | `user-explicit` / `auto-extract` / `compressor` / `manual-edit` / `imported` |
| `trust` | enum | `high` / `medium` / `low` |
| `created_at` | ISO 8601 UTC | timestamp at write time |

Optional fields: `merged_from` (for consolidation), `superseded_by` (when replaced), `deleted_at` (for tombstoned facts — see §6.5), `expires_at` (a DECLARED validity end, Task 66.3 — strict ISO date/datetime, the first moment the fact no longer holds; enforced by the read-time search filter + the weekly-curate sweep, see §16.18), `shape` (temporal classification, Task 66.1 — written explicitly with a `State` default on every new fact; absence on pre-66 facts also reads as `State`; see §16.18).

**Trust default** by `write_source`: `user-explicit` and `manual-edit` → `high`; `auto-extract` and `imported` → `medium`; `compressor` → `low`. Manual override via `cmk trust <id> <high|medium|low>`.

**Placement**: HTML comment immediately below each bullet (comments are stripped from Claude's context per verified Anthropic docs, so metadata is invisible to model, visible to humans/tools).

**Canonical serializer/parser**: all reads and writes of this frontmatter (per-fact YAML AND per-bullet HTML-comment provenance, once Layer 3 lands) MUST go through [`packages/cli/src/frontmatter.mjs`](../packages/cli/src/frontmatter.mjs) — the single js-yaml–backed `serialize`/`parse` pair. Pre-PR-2 each module had its own naive parser; values with `\n` / `:` silently corrupted. Don't roll your own. See §1.3 + [`CLAUDE.md`](../CLAUDE.md) "Shared modules" rule.

**The input boundary — what `parse` tolerates, and why it is the ONE place that decides (Task 257, D-403).** A fact file is not always written by the kit: a user hand-edits one, an editor re-saves it, a script rewrites it. The parser therefore owns two byte-level tolerances, both learned from a live bug where a perfectly good fact **silently ceased to exist while sitting untouched in its tier** — invisible to reindex, recall, INDEX/MAP, the edge builder and every fact walk, with the only trace a `skipped — no YAML frontmatter` warning nobody was reading:

| Tolerance | Producer | Precedent |
| --- | --- | --- |
| **CRLF** line endings around the `---` fences | a Windows clone with `autocrlf=true` | D-126 (cut-gate9 H1 — clone reindex found 0 facts) |
| a leading **UTF-8 BOM** (U+FEFF / `EF BB BF`) | a Windows editor; Windows PowerShell 5.1 `Set-Content -Encoding utf8` | D-403 (found by Task 248's live test) |

Two invariants make the BOM fix total rather than partial, and both are contract, not implementation detail:

1. **`parse` strips before the match and returns stripped text on EVERY branch** — the frontmatter branch, the no-frontmatter branch, and both parseError branches. A caller can never receive a BOM back and re-persist it.
2. **`format` never emits a leading BOM**, including one a caller put in the body itself. Together with (1), a BOM'd file **heals on its next legitimate rewrite** (trust override, redact, merge, supersede) rather than needing a repair pass.

The strip delegates to `read-json.mjs`'s `stripBom` — the ONE canonical BOM helper — so the kit has a single BOM policy: exactly **one** leading BOM, matching every other kit BOM site (§13.2, the hook-stdin read, the agent-config reads). Two deliberate NON-changes: content sha1s stay over the **RAW** file bytes (adding or removing a BOM IS a file change and must invalidate a change-detection key, not read as "unchanged"), and `canonicalize()` is left alone — it is **already** BOM-insensitive on the Node side (JS `\s` includes U+FEFF per ECMA-262 WhiteSpace, so the collapse + trim stages absorb it), so a BOM'd fact and its clean twin derive the same id and dedupe against each other. That property is pinned by test rather than assumed. **Cross-implementation divergence — FOUND then RESOLVED (2026-07-27, Task 257 / D-404).**

- **Found (the finding, preserved):** the Python twin's `\s` does NOT match U+FEFF (it is category `Cf`, not whitespace, in the Unicode database Python's `re` follows), so `cmk_canonicalize.generate_id` returned a **different id** than the Node twin for BOM-prefixed input — measured `P-95ZT9JAH` (Python) vs `P-S79MJHFN` (Node) for `"<U+FEFF>Hello world"`. A silent cross-implementation id fork, invisible to the parity harness because **no vector carried a BOM**.
- **Resolved:** **Node is the reference implementation** — its BOM-insensitivity is shipped behavior, so Python moved to match it. `python/cmk_canonicalize/__init__.py` now folds U+FEFF as whitespace via a shared `_WS = r"[\s\ufeff]"` class used by the bullet-marker and whitespace-collapse regexes. **Fold, not a leading strip:** Node does not special-case the leading position — it treats U+FEFF as whitespace in *every* `\s` — so a strip-the-first-BOM shim would still have diverged on mid-string (`"foo<U+FEFF>bar"` → `"foo bar"`), trailing, and bullet-marker-adjacent (`"-<U+FEFF>hello"` → `"hello"`) inputs. Folding is the only choice that keeps every other behavior identical. `str.strip()` and the trailing-punctuation regex are deliberately untouched: the collapse stage has already turned every U+FEFF into a plain space before they run, so widening them would be a provable no-op on a byte-exact contract.
- **Pinned:** seven BOM vectors added to [`fixtures/canonicalize-vectors.json`](../fixtures/canonicalize-vectors.json) (38 → 45), including the two that distinguish fold-from-strip. `scripts/parity-check.mjs` reports byte-identical Node ≡ Python across all 45.
- **Residual, still open, NOT changed:** the two `\s` classes still disagree in the *other* direction — Python's `\s` matches **U+001C–U+001F and U+0085 (NEL)**, JavaScript's does not (measured). No vector covers those, so the contract is untested there. Named rather than silently widened: changing it is a contract decision, not an implementation detail.

**The scratchpad readers do not go through this parser** (bullets carry HTML-comment provenance, not YAML), so each strips independently at its own READ boundary — same rule, different reader. There are two, and both are load-bearing:

- `parseObservationsFromScratchpad` (index-rebuild) — a BOM'd first line blinded the `^##` heading match, silently degrading that section's `heading_path` to the bare filename.
- `readTierBlock` (inject-context) — the more serious one. A bare read sent the BOM **verbatim into the injected session snapshot** (a raw U+FEFF in the model's context), and because `truncateTierToBudget` splits sections on `/^##\s/` and `hasRealContent` tests `/^#{1,6}\s/`, a BOM'd `## ` heading was **not recognised as a section boundary**: the section fell into the always-kept preamble and became **un-droppable**, inverting the §20.3 value-ordered eviction — a low-trust section surviving while a high-trust one is evicted to make room for it. Stripping at the read fixes all three downstream readers at once, which is why the strip belongs there and not in three regexes.

**One strip everywhere — the contract.** Every reader tolerates exactly ONE leading BOM, because that is what `parse` tolerates. A reader that strips MORE than the kit does is not being generous, it is lying: `memory-recovery`'s `classifyFactId` briefly did `parse(stripBom(text))`, so a 2-BOM file classified as *valid* and the recovery pass walked past it as healthy while reindex, recall, INDEX/MAP and the edge builder still could not see it — invisible forever **and** never flagged. Classification now uses the same `parse` contract as everything else, so a ≥2-BOM file is `not-derivable` → quarantined with its **original bytes intact** → named in the report. Visible-and-flagged beats invisible-and-silent, and the user keeps every byte either way.

**Implements**: FR-29, T8.

---

## 5. Hooks — 5 active + 1 setup

### 5.1 Verbatim hooks.json

**Manifest file location**: `<plugin-root>/hooks/hooks.json` — per Anthropic's official plugin docs at [code.claude.com/docs/en/plugins](https://code.claude.com/docs/en/plugins) ("Plugin structure overview" section). The `.claude-plugin/` subdirectory holds **only** `plugin.json`; `hooks/`, `skills/`, `agents/`, `commands/`, etc. all live at the plugin root. Anthropic's docs explicitly call out the `.claude-plugin/hooks/` placement as a "Common mistake" in a Warning callout.

> **Historical note (2026-05-26):** an earlier draft of this section placed `hooks.json` under `plugin/.claude-plugin/hooks/`. That path does not load in Claude Code 2.1.140 — the canonical Anthropic layout puts `hooks/` at the plugin root, NOT under `.claude-plugin/`. The mismatch was caught by the working-product live test (see [`docs/journey/2026-05-26-live-test-findings.md`](../docs/journey/2026-05-26-live-test-findings.md)). The earlier mistake came from verifying against two third-party plugins (claude-mem, claude-remember) instead of Anthropic's primary docs — both third-party plugins had the right layout (`plugin/hooks/hooks.json`), but the verification chain stopped at convergent secondary sources without checking the upstream Anthropic docs once.

Command pattern: `node "${CLAUDE_PLUGIN_ROOT}/bin/cmk-<verb>.mjs"` (kit-unique prefix dodges Anthropic bug [#29724](https://github.com/anthropics/claude-code/issues/29724)).

> **Original pattern (pre-2026-05-31)**: `bash "${CLAUDE_PLUGIN_ROOT}/bin/cmk-<verb>"` — the hooks shipped as bash scripts that `exec node` on their `.mjs` twin (claude-mem / claude-remember precedent; POSIX exec-bit isn't preserved on Windows checkouts, so `bash "<script>"` ran them regardless of the `+x` bit).
>
> **Implementation pivot 2026-05-31 (Task 62 — node-only hooks)**: switched the command to invoke the `.mjs` directly via `node`. **Why:** the kit must run on Windows/macOS/Linux on **node alone**, like Claude Code itself — the bash form required a POSIX shell (Git Bash or WSL) on Windows, and on a machine whose default `bash.exe` points at Docker Desktop's bash-less distro it failed outright. The primary-source check (Anthropic's [plugins-reference](https://code.claude.com/docs/en/plugins-reference): path vars are *"substituted inline … in hook commands"*) confirmed Claude Code expands `${CLAUDE_PLUGIN_ROOT}` itself before the command runs, so the substituted `node "C:\…\x.mjs"` runs under any shell on any OS — no bash. The extensionless bash wrappers + `auto-extract-memory.sh` were retired; `cmk-observe-edit.mjs` absorbed its wrapper's hook-envelope contract (emit `{"continue": true}` first, then the fire-and-forget append — `async: true` already makes it non-blocking, so the bash detach pattern was unnecessary). The npm route (Route A) was already node-only (bare PATH-resolved bin names, no bash); this aligns the plugin route (Route B) with it.

```json
{
  "hooks": {
    "Setup": [{ "hooks": [{ "type": "command", "command": "node \"${CLAUDE_PLUGIN_ROOT}/bin/cmk-version-check.mjs\"", "timeout": 30 }] }],
    "SessionStart": [{ "hooks": [{ "type": "command", "command": "node \"${CLAUDE_PLUGIN_ROOT}/bin/cmk-inject-context.mjs\"", "timeout": 30 }] }],
    "UserPromptSubmit": [{ "hooks": [{ "type": "command", "command": "node \"${CLAUDE_PLUGIN_ROOT}/bin/cmk-capture-prompt.mjs\"", "timeout": 10 }] }],
    "PostToolUse": [{ "matcher": "Write|Edit|MultiEdit", "hooks": [{ "type": "command", "command": "node \"${CLAUDE_PLUGIN_ROOT}/bin/cmk-observe-edit.mjs\"", "async": true, "timeout": 120 }] }],
    "Stop": [{ "hooks": [{ "type": "command", "command": "node \"${CLAUDE_PLUGIN_ROOT}/bin/cmk-capture-turn.mjs\"", "timeout": 30 }] }],
    "SessionEnd": [{ "hooks": [{ "type": "command", "command": "node \"${CLAUDE_PLUGIN_ROOT}/bin/cmk-compress-session.mjs\"", "timeout": 60 }] }]
  }
}
```

**Hook timeouts compose with subprocess timeouts.** The `timeout` values above are the OUTER ceiling enforced by Claude Code (which SIGKILLs the parent on expiry without running cleanup). For hooks that spawn `claude --print` internally, the INNER subprocess timeout must be tight enough that the catch + finally + log-write all run before the outer fires. See **§8.5 "Subprocess timeout policy + cleanup contract"** for the composition rule and the caller-side values (auto-extract 25s under 30s Stop; compress-session 50s under 60s SessionEnd).

### 5.2 Hook responsibilities

| Hook | Timeout | Async | Purpose | Source informing the choice |
| --- | --- | --- | --- | --- |
| Setup | 30s | no | Version-check on plugin install; print repair command if mismatch | claude-mem `Setup` |
| SessionStart | 30s | no | Read 3-tier snapshot, emit as `additionalContext` | claude-remember `session-start-hook.sh` |
| UserPromptSubmit | 10s | no | Strip `<private>`, force-keep `<retain>`, append to transcripts | Our design |
| PostToolUse (Write/Edit/MultiEdit) | 120s | yes | If tool output > 50 lines, append summary to `sessions/now.md` | claude-remember `post-tool-hook.sh` |
| Stop | 30s | no | Append turn to transcripts; spawn detached auto-extract | Our v0.0.1 carried forward |
| SessionEnd | 60s | no | Haiku-compress `now.md` → `today-{date}.md`, truncate `now.md` | claude-remember NDC pattern |

### 5.2.1 `stop_hook_active` recursion guard (observed payload field — NOT in the documented Stop input schema)

> **Documentation-status correction (2026-07-29, D-410):** this field is OBSERVED in live Stop-hook payloads and our guard relies on it — but it is absent from (or unconfirmed in) Anthropic's documented Stop input schema (checked at code.claude.com/docs/en/hooks; the awrshift name-twin relies on the same undocumented field). The guard FAILS OPEN: if the field vanishes, `payload?.stop_hook_active === true` is simply never true and capture proceeds normally — no crash, no block. Watch trigger: if hook-recursion symptoms ever appear, re-verify this field against the then-current docs first.

The Stop hook MUST short-circuit when invoked via a previous hook's auto-continuation (the `stop_hook_active` flag in the hook input JSON). Pattern:

```bash
# In bin/cmk-capture-turn (Stop hook handler):
hook_input=$(cat)
if [[ "$(echo "$hook_input" | jq -r '.stop_hook_active // false')" == "true" ]]; then
  echo '{"continue": true}' >&2     # No-op; let session end normally
  exit 0
fi
```

**Why**: without this guard, a Stop hook that calls back into Claude (or whose detached subprocess triggers another Stop indirectly) can loop. Verified pattern from Anthropic Claude Code hook spec — `stop_hook_active: true` indicates the Stop hook is firing as a result of a previous Stop hook's `decision: "block"` response.

This guard is a **bullet point in the implementation**, not a separate hook entry — same `cmk-capture-turn` handler, just an early-return check at the top.

**Project-root resolution in the capture bins (Task 246).** Every capture-hook entry bin (`cmk-capture-prompt` / `-capture-turn` / `-observe-edit`, both the CLI and plugin families) resolves its project root through [`resolveHookProjectRoot`](../packages/cli/src/tier-paths.mjs) — **never bare `process.cwd()`**. Precedence: `CLAUDE_PROJECT_DIR` (Claude Code sets it per hook) → `CMK_PROJECT_DIR` (the kit sets it when a parent bin spawns a detached child, so the child inherits the parent's answer) → walk UP to the nearest `context/`-bearing ancestor, stopping at `$HOME` (the shared `discoverRootUpward`, same the MCP server trusts) → `resolve(cwd)` as the last resort. **Why it exists:** the bins used to pass bare `process.cwd()`, so whenever the agent's cwd was a SUBDIRECTORY of the project (an `npm pack` from `packages/cli`, say), the automatic capture forked a fresh, unread `context/` tier THERE — while `cmk doctor` stayed green because every check reads the ROOT tier. The entry bin resolves ONCE and threads the result to its detached workers via `CMK_PROJECT_DIR`, so the whole capture chain lands in one place. Proven by a live subprocess test (`tests/cli-hook-root-resolution.test.js`): the real bin, run with a subdirectory cwd, writes to the root tier and forks no stray. The **detection** side — a `doctor` check that flags a stray tier from any OTHER cause — is deferred to Task 248 (defense-in-depth; the source is fixed here).

### 5.3 Coexistence injection order (Option D)

Our SessionStart hook fires before Anthropic's auto-memory loads naturally. Both end up in Claude's context window; ours sits earlier (gets more attention). The output is `additionalContext` JSON per Anthropic's hook protocol — placed in the system prompt before user-message processing.

**Implements**: FR-9, ADR-0006, ADR-0011 Option D.

---

## 6. Auto-extract subagent + `memory-write` skill

### 6.0 Mental model — auto-extract is the default; user phrases are an override

The whole point of the memory system is that **Claude takes notes naturally**, the way a colleague taking minutes in a meeting doesn't need the speaker to say "please write that down." Putting the trigger on the user is broken UX — it makes the human do both the work of *deciding what's durable* AND *cueing the capture*. At that point the AI is a scribe, not an assistant.

The kit therefore has **two memory-write paths that compose**:

| Path | When it fires | Who decides what to save | Role |
| --- | --- | --- | --- |
| **Auto-extract subagent** (§6.1, §6.4) | After every assistant turn, via the Stop hook | The sub-Claude (Haiku), applying the six writing triggers in §6.4 | **The default — primary mechanism** |
| **`memory-write` phrase trigger** (§6.3) | User explicitly says "remember this" / "from now on" / etc. | The user, explicitly | **An override — explicit emphasis** |

The phrase trigger is **not the primary path**. It exists for the cases where the user wants immediate, explicit capture (e.g., dictating a critical decision and wanting confirmation it landed). The primary path is silent and automatic.

This matters when reading the rest of §6: when you see "memory-write skill" mentioned, default-assume it's being invoked by the auto-extract subagent — not by the user. Phrase-triggered invocation is the secondary case.

### 6.1 Auto-extract invocation (tightened per claude-remember pattern)

Spawned detached by the Stop hook. Reads the just-captured turn from a temp file, invokes `claude --print` headlessly with a fact-extraction prompt.

**Tool allowlist (tightened from v0.0.1)**: only `Read`. Drop `Edit` and `Bash(wc *)`. Per claude-remember's verified `--allowedTools ""` pattern (zero tools), the sub-Claude only needs to read existing state; writes happen via the `memory-write` skill invocation.

```bash
claude --print \
  --model claude-haiku-4-5-20251001 \
  --add-dir "$REPO_ROOT" \
  --allowed-tools "Read" \
  --mcp-config '{"mcpServers":{}}' \
  --strict-mcp-config \
  --max-turns 1 \
  --output-format text \
  2>&1
```

**Strict isolation** matches claude-remember exactly: no MCP, single response, no tool sprawl.

**Concurrency-safe**: lock file at `context/.locks/auto-extract.lock` via `set -o noclobber` (claude-remember verified pattern).

**Structured logging — NDJSON across eight log files** (per Hightower CCA-F harness pattern, refined per ChatGPT/Kiro convergence):

| Log file | What gets written | One-line schema (NDJSON) |
| --- | --- | --- |
| `context/sessions/{date}.extract.log` | Auto-extract invocations | `{ts, success, error_category, observation_count, skipped_reason, duration_ms}` |
| `context/.locks/audit.log` | Memory writes (add/replace/remove/tombstone/merge) by skill or CLI | canonical schema v1 — see [`packages/cli/src/audit-log.mjs`](../packages/cli/src/audit-log.mjs) |
| `context/sessions/{date}.compress.log` | Compression runs (session-end + lazy + daily/weekly) | `{ts, scope, input_bytes, output_bytes, model_id, cost_usd, duration_ms}` |
| `context/.locks/network-blocks.log` | Any sandbox/network denial during compressor or MCP runs | `{ts, host, port, reason, hook_or_tool}` |
| `context/.locks/shadowed_by.log` | 3-tier merge shadowing events (§7.1) | `{ts, id, winner_tier, shadowed_tiers[], source_file}` |
| `context/.locks/recall.log` | Which memory ids SURFACED each turn (Task 190, ADR-0017 Phase 1a — the learn-loop attribution primitive; written by inject + `search`, read by Tasks 191/192) | `{session, ts, source, ids[], query?}` — ids + query only, never fact bodies. Production `search` entries carry `session: null` (no hook payload at the CLI/MCP callers); 191/192 join inject↔search by timestamp window. Kit-projects only: the writer is gated on `context/` existing. Rotation posture: same as audit.log — §16.13's candidate covers both. |
| `context/.locks/trust-signals.log` | Every trust-Δ decision through the FEEDBACK-SCREEN (Task 193, ADR-0017 Phase 1d) — applied deltas AND refusals (rate-limit / burst-hold quarantine); doubles as the screen's own rate/burst state | `{ts, id, event, applied, reason?, trust_score?}` — the screen reads today's entries to decide; a quarantined batch is visible here (the "surface in log" half). Rotation: §16.13's candidate covers it. |
| `context/.locks/expectations.log` | Pre-registered expectations (Task 191, ADR-0017 Phase 1b) — `PREDICTION:` lines captured from each turn by the Stop hook, resolved HIT/MISS by Task 192's signals; event-sourced (a resolution APPENDS, the reader folds by id) | `{id, ts, session, text, status}` then `{id, ts, status:'resolved', verdict, observed}` — the study's no-pre-registration-no-claim rule made mechanical. Rotation: section 16.13's candidate. |

One JSON object per line, append-only. Parseable for analytics (`jq`, DuckDB, `cmk view`). Files rotate daily; old logs roll into `context/sessions/archive/` on the weekly curate run.

Example auto-extract line:

```json
{"ts":"2026-05-23T14:30:00Z","success":true,"error_category":null,"observation_count":1,"skipped_reason":null,"duration_ms":1842}
```

**`error_category` values** in `extract.log` + `compress.log`: see [`packages/cli/src/result-shapes.mjs`](../packages/cli/src/result-shapes.mjs) `ERROR_CATEGORIES`. `haiku_timeout` (subprocess exceeded caller-supplied `timeoutMs` per **§8.5**) is distinct from `haiku_failed` (non-zero exit / spawn ENOENT) so analytics can separate "Anthropic API was slow" from "the call rejected / config broken".

Example audit-log line (canonical schema v1, per [`audit-log.mjs`](../packages/cli/src/audit-log.mjs)):

```json
{"ts":"2026-05-24T14:30:00Z","schema":1,"action":"tombstoned","tier":"P","id":"P-S79MJHFN","reasonCode":"user-requested","reasonText":"no longer relevant","paths":{"before":"…/feedback_x.md","archive":"…/archive/tombstones/P-S79MJHFN.md"},"extra":{"deletedBy":"user-explicit","scratchpadEdits":[{"path":"…/MEMORY.md","removed":1}]}}
```

All audit-log writes go through `appendAuditEntry(tierRoot, entry)` in [`audit-log.mjs`](../packages/cli/src/audit-log.mjs) — single canonical writer; do not append to `audit.log` directly. See §1.3 + [`CLAUDE.md`](../CLAUDE.md) "Shared modules" rule.

### 6.2 Auto-extract decision: where does the write go?

**[CHANGE absorbed from comparison]** Per ChatGPT's spec and Kiro's confidence-scoring pattern, the auto-extract sub-Claude routes writes by trust:

```text
For each candidate fact:
  determine trust based on:
    - <retain> tag present?           → high (force-keep)
    - explicit user signal ("remember this", etc.)? → high
    - clear pattern match (Hermes 6 triggers)?     → medium
    - implicit/weak signal?           → low (discard, log skip)

  IF trust = high:
    write directly to context/MEMORY.md via memory-write skill (or context/memory/<type>_<slug>.md if typed)

  IF trust = medium:
    write to context/queues/review.md (NOT MEMORY.md)
    User reviews periodically via `cmk queue review`; promotes or discards

  IF trust = low:
    discard. Log "skip: nothing durable" to extract.log
```

This adds a **review queue file** (`context/queues/review.md`) as an explicit staging area for medium-confidence auto-extracts. User has a chance to bless/discard before items become canonical memory.

### 6.3 The `memory-write` skill

The skill that does the actual write to disk. Invoked by **two callers**, in this priority order:

1. **The auto-extract subagent** (the primary caller — fires after every turn; see §6.0)
2. **The user explicitly** via phrase trigger (the override caller — "remember this", "from now on", etc.; see FR-11)

Both callers go through the same skill, so the validation / dedup / cap-enforcement logic is centralized.

Three actions:

| Action | When | Behavior |
| --- | --- | --- |
| `add` | Either caller produces a new durable fact | Compute canonical text → derive ID → dedup check → cap check → write bullet + provenance |
| `replace` | User says "update memory: X is now Y" (or auto-extract detects an update) | Substring match → swap → recompute ID → record `superseded_by` on old |
| `remove` | User says "forget about X" (or `cmk forget <id>`) | Substring match → confirm with user → **move to tombstones (per §6.5), NOT silent delete** |

Cap enforcement workflow at >95%: consolidate similar bullets / drop stale entries > 14 days old with no recent reference, THEN add new. Per FR-3.

**Implementation note**: the skill's `SKILL.md` file declares phrase triggers in its `description` field — that's what makes Claude Code's harness auto-invoke it on user prompts containing those phrases. **The auto-extract subagent invokes the skill programmatically** (not via phrase match), bypassing the trigger system entirely. Both paths land at the same skill code.

### 6.4b Extraction fallback — capture never reaches zero (Task 242, D-369)

Auto-extract used to return `observation_count: 0, candidates: []` on **any** LLM failure, dropping the turn whole. Measured on the kit's own dogfood logs: **6 of 6** extractions ended `haiku_timeout` in one session → zero captures, silently (the only evidence is NDJSON nobody reads). Normal days invert the ratio, so the loop is **starved, not broken** — and the sessions richest in durable findings are exactly the ones that starve it.

**Trigger: ANY non-success outcome**, including an unrecognized category. Of 295 historical failures only 166 were `haiku_timeout`; `concurrent_run` (82) and `haiku_failed` (47) are the rest, so a timeout-only fallback would leave ~44% still capturing nothing.

**Mechanism** (`extract-fallback.mjs`): a deterministic, LLM-free pass over the USER's turn only (the assistant's turn is inference, not ground truth — the D-122 self-poisoning lesson). Keeps a line only if it carries a durable-statement signal, is not a question/command, and is **not kit-operational**.

**The mission-context-only constraint (binding).** The fallback is dumber than the LLM path and would otherwise capture whatever durable-looking prose is present — on a kit-debugging session, almost entirely kit-failure noise. Kit bugs, timeouts, hook errors and our own debugging are **build artifacts** whose home is the DECISION-LOG and tasks.md, never a tier injected into every future session. Default is **exclude-on-doubt**: a missed capture is recoverable (the LLM pass re-attempts the turn), a poisoned tier is not.

**Routing + provenance.** Candidates route **by trust exactly like the LLM path** — medium goes to the review queue (`routeMedium`), never straight into the hot index; a dumber extractor must not get *less* scrutiny. Writes carry their own `write: auto-extract-fallback` provenance (registered in `VALID_WRITE_SOURCES`) so a keyword heuristic is distinguishable on disk from both a real extraction and something the user said. Poison_Guard still screens every write. Door 5: `extract.log` records `fallback_candidates` / `fallback_written` / `fallback_rejections`.

### 6.4 Six writing triggers (Hermes-verified pattern) + bi-turn extraction

The auto-extract prompt instructs the sub-Claude to save when EITHER the user turn OR the assistant turn reveals one of these triggers:

1. **User corrections** — "Don't do that again." "Use this instead."
2. **Discovered preferences** — pattern recognition across turns
3. **Environment facts** — tool versions, paths, configurations
4. **Project conventions** — discovered through code inspection
5. **Completed complex workflows** — 5+ tool calls; consider saving the approach
6. **Tool quirks and workarounds** — non-obvious findings

And to skip: conversational chatter, trivial info, raw data dumps, session-specific ephemera, info already in MEMORY.md (check INDEX).

These are verbatim from Hermes Agent's writing-triggers pattern (Glukhov 2026-05-01, verified).

#### Bi-turn input (2026-05-26 amendment)

Earlier drafts read only the assistant turn. The working-product live test (see [`docs/journey/2026-05-26-live-test-findings.md`](../docs/journey/2026-05-26-live-test-findings.md)) surfaced the failure mode: a user dictating preferences to a terse acknowledging assistant ("Got it.") produces zero captures, because the assistant turn carries no durable content even though the user just stated four facts.

**Input shape**: Task 21's capture-turn writes the temp file as (DEDUP_CONTEXT added by Task 132 / D-122, 2026-06-11):

```text
DEDUP_CONTEXT:
<the last now.md entry as it stood BEFORE this turn was appended — may be empty>

USER_TURN:
<sanitized user prompt body>

ASSISTANT_TURN:
<sanitized assistant turn body>
```

The user portion comes from the just-written transcript entry capture-prompt produced on UserPromptSubmit. If no preceding user entry exists (system-initiated turns), the USER_TURN section is empty and only the assistant turn is examined.

**The dedup snapshot rides the turn file (Task 132, D-122).** The original design had the extractor read "the last now.md entry" itself at run time — but capture-turn appends the current turn to now.md BEFORE spawning the extractor, so the extractor was shown the very turn it was extracting under "do not re-emit facts already here," and Haiku obeyed: `nothing_durable` on every organic turn since Task 87 wired now.md as the conversation buffer. capture-turn now snapshots the dedup context pre-append and passes it in the turn file; the extractor NEVER reads now.md (a missing DEDUP_CONTEXT marker means no dedup section, never a re-read). Embedded line-start section markers inside the snapshot are neutralized with a `· ` prefix so quoted turn-file syntax in conversation can't hijack the parse.

**Origin-tagged output**: Haiku is instructed to label every candidate with its origin:

```text
TRUST_HIGH user: <text>          — user clearly stated this
TRUST_MEDIUM user: <text>
TRUST_LOW user: <text>           — rarely emit
TRUST_HIGH assistant: <text>     — assistant inferred this confidently
TRUST_MEDIUM assistant: <text>
TRUST_LOW assistant: <text>      — rarely emit
SKIP                             — emit alone if nothing in either turn is durable
```

**Trust-routing precedence**:

- **User-origin** candidates: use Haiku's trust assessment as-is. The user is the authority on facts about themselves; if Haiku marks it HIGH, it lands in MEMORY.md.
- **Assistant-origin** candidates: **demote one trust level** before routing. `HIGH → MEDIUM`, `MEDIUM → LOW`, `LOW → discarded`. Assistant observations are inferences, not attestations — demotion forces them through the review queue (`context/queues/review.md`) for user confirmation before they become canonical memory. This pairs with Task 25's `cmk queue review` resolver.

**`<retain>` override** (existing behavior from §6.6): a candidate whose text overlaps with a `<retain>...</retain>` segment (in EITHER turn) is force-promoted to `HIGH` regardless of origin or demotion. The override beats demotion — explicit user signal trumps automatic skepticism.

**Within-call dedup**: when the user states a fact and the assistant restates it, Haiku may emit two candidates for the same canonical text. Group candidates by `generateId(canonicalize(text))`; keep the higher-trust candidate per group. Because user-origin facts aren't demoted, they typically win ties — which is the intended outcome (user attestation > assistant echo). Dedup is literal canonical-ID-match; semantically-similar phrasings with different canonical forms are handled by Task 25's conflict queue at write time, not here.

**Implementation order** inside `runAutoExtract` (per `packages/cli/src/auto-extract.mjs`):

1. Parse Haiku response → `[{trust, origin, text}]`
2. `applyOriginDemotion` (assistant-origin trust drops one level; `LOW` → `discarded`)
3. `applyRetainOverride` (matched candidates force-promote to `HIGH`)
4. `dedupByCanonicalId` (group by `generateId('P', text)`, keep highest trust)
5. Route each: `HIGH` → MEMORY.md, `MEDIUM` → queues/review.md, `LOW` / `discarded` → drop + log

Origin is in-memory metadata only — it is NOT persisted to scratchpad provenance (provenance carries `write: auto-extract` regardless).

#### Rich fact synthesis (Task 103) — native-parity capture on the immune path

**Why.** Claude Code's native Auto Memory is winner-take-all with the kit's *explicit* `cmk remember` path: when the agent saves to native, the kit's `context/memory/` rich fact files don't get written (D-74; [research note](../docs/research/2026-06-06-native-auto-memory-coexistence-investigation.md)). The Stop-hook auto-extract is **immune** (it reads the conversation, not the agent's tool choice) but historically wrote only **terse `MEMORY.md` bullets** — so the rich Why/How tier was the one thing native could take. Task 103 moves rich capture onto the immune path: auto-extract now synthesizes **rich fact files** for durable project KNOWLEDGE, so a fresh-but-rich record lands regardless of which memory tool the agent reaches for. The bar is **native-parity-then-better** — native now writes structured Why/How fact files, so ours must be at least as structured/useful.

**Third output type.** The SAME Haiku pass (no second LLM call) now emits THREE output kinds — the terse `TRUST_` lines (above), the cross-project `PERSONA CANDIDATE` lines (§6.4 inline-persona / Task 61), and a fenced **rich-fact block** for durable project knowledge:

```text
BEGIN_FACT
type: project
title: <short Title-Case headline>
body: <what is true; multi-line markdown breakdown when the knowledge has parts>
why: <rationale a future session needs>
how: <how the next session applies it>
END_FACT
```

- **Rich vs terse split.** Triggers **3–6** (setup/config, project conventions, completed workflows, tool quirks) → a `BEGIN_FACT` block. Triggers **1–2** (corrections, discovered preferences) + active threads → stay terse `TRUST_` bullets. The prompt instructs: emit each fact as EITHER a rich block OR a terse line — **never both**.
- **Parsing** (`parseRichFacts` in `auto-extract.mjs`, exported + unit-tested): a field's value continues across lines until the next recognized key (`type`/`title`/`body`/`why`/`how`) or `END_FACT` — so `body` holds a multi-line structured breakdown. A missing `END_FACT` closes at the next `BEGIN_FACT` (no swallow). A block missing `title` OR `body` is skipped (writeFact requires both); `type` defaults to `project`. Live Haiku formats multi-line bodies as a YAML block scalar (`body: |` + indent) — the parser strips the indicator + dedents (`cleanFieldValue`).
- **Routing** (`routeRichFact`): straight to the fact store via `writeFact({tier:'P', writeSource:'auto-extract', trust:'medium', …})`, body built by the shared [`rich-fact.mjs`](../packages/cli/src/rich-fact.mjs) helper the explicit `cmk remember` path uses (identical on-disk shape). `writeFact` already runs home-path sanitization + Poison_Guard + schema + `INDEX`/reindex.
- **trust:medium, NOT high.** Auto-extract is a Haiku *synthesis* = proposal-grade; explicit `cmk remember` stays `trust:high`. A later explicit capture **supersedes** the auto-extracted medium fact.
- **Direct-to-fact-store — deliberate deviation from "medium → review queue."** Terse medium-trust bullets queue for review; rich facts do NOT. The point is *automatic* native-parity capture (native writes its files with no approval step). The fact store is searchable-but-not-full-trust-injected, `writeFact` screens every write, and explicit-high supersedes — so direct-write is safe and is what parity requires.
- **Isolation + XOR safety net.** Each `routeRichFact` is wrapped in try/catch — a Poison_Guard/schema/collision rejection (or throw) must not take down terse routing or the persona pass (same isolation as the inline-persona pass). If Haiku emits both a rich block and a terse line for the same fact, the rich block wins: a terse candidate whose canonical id matches a rich fact's `body` is dropped before terse routing.
- **Composition with §19 graduation/cap.** Rich facts land in `context/memory/` (the graduation *target*), NOT the capped `MEMORY.md` scratchpad — so this *reduces* scratchpad write-lock pressure and adds no new cap interaction.
- **Observability (Door 4).** The `extract.log` entry carries `rich_facts_written`; `observation_count` includes successful rich writes; the result's `richFacts[]` records each `{written: 'fact'|'fact-duplicate'|'rejected', rejected_category?}`.

**Implementation order** (extends the 5-step list above): after step 4 (`dedupByCanonicalId`), `parseRichFacts(outputText)` runs + drops colliding terse candidates; rich facts route after the terse loop, isolated per fact.

### 6.5 Tombstone discipline for deletions

**[CHANGE absorbed from comparison]** Per ChatGPT's explicit `tombstones/` directory and Kiro's `deleted_at` field — when a user says "forget about X" and we delete a bullet, we DON'T silently delete the file or strip the bullet without trace. Instead:

```text
1. User invokes `forget about X` (or `cmk forget P-S79MJHFN`)
2. memory-write skill (with `remove` action) finds the matching bullet/fact
3. Confirms with user (the only action that confirms)
4. Moves the original to context/memory/archive/tombstones/<id>.md
   With added frontmatter:
     deleted_at: 2026-05-23T14:30:00Z
     deleted_reason: "user said: forget about X"
     deleted_by: user-explicit
5. Removes the bullet from MEMORY.md (or wherever it lived)
6. Reindexes the project tier in-band (Task 110): the orphan-prune drops the
   unlinked fact's index rows + re-reads the scrubbed scratchpad, so the fact
   stops surfacing in `cmk search` immediately — no manual `cmk reindex` (§9.2.1)
```

Future `mk_get(P-S79MJHFN)` still resolves — returns the tombstoned content with a clear "deleted on YYYY-MM-DD" annotation. Audit trail preserved. Truly destructive operations (`cmk purge --hard`) require explicit user invocation outside the normal "forget" flow.

This mirrors the design of git revert (don't rewrite history) more than git rebase (rewrite). For memory, we want the audit trail more than the cleanliness.

**The compliance scrub + hard purge (Task 96, ADR-0022) — the two verbs past the tombstone.** `cmk redact <id> --pattern <secret>` removes a leaked span from EVERY app-layer copy along the kit's actual dual-write graph — the live fact (frontmatter-aware: the `[redacted: reason date]` marker contains `[`+`:`, so title/field replacement goes parse→replace→re-serialize through frontmatter.mjs, never a raw byte-splice that corrupts the YAML), the tombstoned/superseded archive copies, the dual-written scratchpad bullet (span-replaced in place, the line survives; the per-tier pad list derives from `SCRATCHPADS_BY_TIER` so the L-tier pads — incl. `context.local/private.md`, where the sensitivity screen routes secret-adjacent facts — are covered), the committed `DECISIONS.md` journal entry (title + Why dual-write; span-scrubbed within this fact's `<!-- decision:<id> -->` marker span — the journal is append-only against *deletion*, not against redaction, per the retract-marking precedent), and the INDEX + FTS rows (in-band reindex, the forget/D-85 no-follow-up pattern). A **title-borne secret contaminates the FILENAME too** (writeFact derives it as `<type>_<slugifyFact(title)>.md` — the 2026-07-16 live-test finding): when the title was scrubbed on a LIVE fact and the basename is actually contaminated (it contains the pattern's slug form, or equals the writeFact-canonical name of the leaked title — the latter catches a secret the 60-char slug cap truncated mid-token; a non-canonical filename with a truncated secret slug is the documented residual limit, surfaced via `renameSkipped` when no clean target name exists), the file is renamed to the scrubbed title's slug (id-suffixed on collision); archive copies are id-named and never renamed (resolveFact depends on it). Audit-log **path echoes** (the original created-entry's `paths.after`) are scrubbed **JSON-aware** (parse each NDJSON line → replace inside string values → re-stringify, so a pattern containing `"`/`\` is caught in its escaped on-disk form and structure can't corrupt; bounded re-apply if a lock-free concurrent append lands mid-rewrite), covering both the literal pattern and its slug form; neither the redact entry (no `before` path) nor the purge entry (no path at all) ever records a secret-slug path — and purge, which has no pattern, scrubs the removed *filenames* from historical entries instead. The fact survives; the audit entry never carries the secret (pattern identified by LENGTH only). Per-fact scope is explicit: occurrences of the same pattern in other facts, other journal entries, and non-bullet scratchpad lines are counted and REPORTED (`remainingElsewhere`), never silently scrubbed. `cmk purge --hard <id> --yes` is the irreversible escalation: live + every archive copy + bullet lines + the journal entry + index rows gone, NO tombstone, audit kept. Both are **CLI-only by contract — never MCP tools** (this section's separate-destructive-path rule; pinned by cli-redact.test.js down to the import level), and on the committed P tier both print the ADR-0022 git advisory (U/L tiers get a "not committed — rotate anyway" note instead): rotate first, then optionally the documented one-time `filter-repo` team operation — **span-level `--replace-text` after a redact (the fact file survives), path-scoped `--invert-paths` on exactly the purged file(s) after a purge, never the whole `context/` tier** (SECURITY.md runbook) — **the kit never rewrites git history** (D-27: force-push breaks the portable-clone niche).

### 6.6 Privacy tag handling

`<private>...</private>` content is **stripped at hook level** (UserPromptSubmit, Stop) before any disk write. The content NEVER touches disk in any form. Placeholder `[private content redacted]` appears in transcripts/captures.

`<retain>...</retain>` content is **force-saved** by the auto-extract sub-Claude even if it wouldn't otherwise pass the durable-fact filter. The `<retain>` tags themselves are stripped from saved content.

**Per-fact `private: true` frontmatter flag** (complementary to inline tags): any fact in the granular archive may carry `private: true` in its YAML frontmatter. Effect:

- The fact still exists on disk and is searchable via `cmk search` (returns title only, body redacted).
- The fact is **excluded from the SessionStart digest** — never auto-loaded into Claude's context window.
- The fact is **excluded from cross-project promotion** (`cmk lessons promote` refuses with a clear error).
- Claude can still retrieve the body explicitly via `mk_get(P-XXXXXXXX)` if needed, but only with an audit-logged tool call.

Use cases that `<private>` inline tags don't cover: an entire fact about a sensitive system, a private project decision, a personal preference you want recorded but not always-injected. The two mechanisms compose: `<private>` is for "this passage in a longer fact is sensitive"; `private: true` is for "this whole fact is sensitive at the digest layer".

Per Cursor spec convergence (their `FR-052`).

(v0.1.x candidate: add `<ephemeral>` tag for session-only content auto-extract should always skip. Per ChatGPT/Google A spec convergence.)

### 6.7 Poison_Guard — secret + injection filter (before any commit-eligible write)

Auto-extract runs against captured turns that may contain secrets pasted by the user (API keys, tokens, passwords) or prompt-injection phrases scraped from web content the user shared. Because the project tier (`<repo>/context/`) is **committed to git**, a single leaked secret in `MEMORY.md` is a real exposure event.

**Poison_Guard** is a pre-write regex filter applied inside the `memory-write` skill — before any write to a project-tier or user-tier file. **Pipeline position (Task 231 / D-337):** on the two shared write boundaries (`memoryWrite`'s `add` action + `writeFact`) the guard screens the privacy-stripped, **PRE-mask** text — `sanitizePrivacyTags` → `checkPoisonGuard` → `maskPii` — because the §6.10 L1 mask strips invisible/zero-width/bidi codepoints and would otherwise destroy the guard's evidence (the invisible-unicode screen was unreachable under the default privacy screen until this ordering was pinned; see §6.10's contract note, incl. the shared codepoint catalog + the accepted keyword-adjacent-path sharpening):

```text
Patterns rejected (write fails with category='poison_guard'):

  Secrets (case-insensitive):
    /(?i)(aws_secret|aws_access_key_id)[\s:=]+[A-Z0-9/+=]{16,}/
    /(?i)(api[_-]?key|secret|password|passwd|token|bearer)[\s:=]+["']?[A-Za-z0-9_\-/+=]{20,}/
    /-----BEGIN (RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/
    /ghp_[A-Za-z0-9]{36}/                       (GitHub personal access token)
    /sk-(ant-|proj-)?[A-Za-z0-9_\-]{40,}/       (OpenAI / Anthropic style keys)
    /xox[bps]-[A-Za-z0-9-]{10,}/                (Slack tokens)
    // Task 134 — fixed-prefix provider tokens (zero-FP by construction):
    /gh[ousr]_[A-Za-z0-9]{36}/                  (GitHub oauth/user/server/refresh)
    /github_pat_[A-Za-z0-9]{22}_[A-Za-z0-9]{59}/ (GitHub fine-grained PAT)
    /[sr]k_live_[A-Za-z0-9]{24,}/               (Stripe live / restricted-live)
    /AIza[A-Za-z0-9_-]{35}\b/                    (Google API key)
    /glpat-[A-Za-z0-9_-]{20,}/                  (GitLab PAT)
    /npm_[A-Za-z0-9]{36}/                        (npm access token)
    /hf_[A-Za-z0-9]{34,}/                        (Hugging Face token)

  Prompt-injection / role-override (case-insensitive):
    /(?i)ignore (all |any |previous |prior )?(instructions?|prompts?|rules?)/
    /(?i)you are now (a |an |the )?[A-Za-z]/
    /(?i)<\/?system>|<\/?assistant>/            (fake role tags)
    /(?i)disregard the above/
```

**Behavior on match**:

1. The write is **rejected** (no bullet added, no fact file written).
2. Logged to `context/.locks/poison-guard.log` (NDJSON): `{ts, pattern_id, source_file, source_line, action: "rejected", redacted_excerpt: "...***..."}`. The matched text itself is **redacted** in the log — only a pattern ID + truncated/masked excerpt is recorded.
3. The auto-extract sub-Claude logs `error_category: "poison_guard"` in `extract.log` so analytics can track frequency.
4. **No notification to the user** by default (avoid notification fatigue). `cmk doctor` surfaces a count via "N writes blocked by Poison_Guard this week".

**Tunable via** `context/settings.json`: users can extend the pattern list (additive, never replacement) or set `poison_guard.strict: true` to also reject `low`-trust writes that score >50% on a softer heuristic. Default is the conservative regex list above.

**Why discoverability-only, not perfect prevention**: per user-locked decision on the discoverability defense model — the threat model is "accidental commit", not "active adversary in your repo". Regex catches the high-frequency mistakes; secret-scanners (gitleaks, trufflehog) are the second line of defense, not us.

#### 6.7.1 The side doors — `screenBeforeCommittedWrite` (Task 216, D-320)

The §6.7 chokepoint covered the DIRECT write path (`writeFact` / `memoryWrite` — auto-extract, `cmk remember`, MCP tools). But LLM-GENERATED and EXTERNALLY-SOURCED content reaches committed/durable tiers through **side doors** that skipped it: a secret pasted in conversation could survive Haiku summarization or transcript promotion **verbatim** into a git-committed file. `screenBeforeCommittedWrite(text, {projectRoot, source, ts})` ([`poison-guard.mjs`](../packages/cli/src/poison-guard.mjs)) is the one shared helper those sites call: it runs `checkPoisonGuard`, best-effort logs the redacted rejection (when `projectRoot` is given), and returns the verdict — **the caller decides what "rejected" means for its shape**:

| Site | On a hit | Why that shape |
| --- | --- | --- |
| weekly-curate INPUT (aged day files, pre-Haiku) | skip before the compress call; sources kept | a secret in a source reproduces in the summary on EVERY weekly retry — catching it pre-call turns the retry loop from a Haiku bill into a regex pass (`:input` log tag) |
| weekly-curate → `archive.md` append (Haiku output) | skip the write AND keep the source day files | self-healing: next week re-archives once the source is fixed; nothing lost |
| daily-distill per-day INPUT (pre-Haiku) | skip the day before its compress call (clean days proceed) | same nightly-re-bill argument; the day stays visible in the poison-guard log until the source is fixed |
| daily-distill → per-day `.distilled.md` banking (Haiku output) | don't bank the day (clean days proceed) | the day re-distills next run; the poisoned text never reaches `recent.md` |
| daily-distill → assembled `recent.md` (backstop) | keep the OLD `recent.md`, skip the write; an EMPTY assembly (poisoned-only / all-empty run) also never truncates a good `recent.md` | covers LEGACY artifacts banked before the screen existed; an empty clobber would stamp a fresh mtime that MASKS HC-10 |
| transcript promote → committed `{date}.md` (**secrets-only** scope) | **withhold** (marker + watermark advance; §6.10) | a secret is permanent — a defer would starve the promote slots + re-bill the judge. Scope is `secrets` because a transcript is a verbatim RECORD never injected into context (read-side defense = the inject-time re-scan); full-catalog injection patterns would routinely withhold transcripts of any repo that DISCUSSES prompt injection |
| persona-review queue (`queues/persona-review.md`) | drop the entry; REDACTED user-tier audit entry (`poison-guard-rejected`) | the queue bypasses `memoryWrite`; no project-scoped log at a user-tier site. A recurring poisoned candidate re-audits once per weekly pass (accepted — a durable seen-set would be an ADR-0002 sidecar for negligible noise) |
| `overrideTrust` on a trust INCREASE | reject with `category: poison_guard`, nothing mutated | content screened at write-time under an OLDER catalog must re-pass the CURRENT one before being blessed upward; decreases stay allowed |

`lessonsPromote` needs no gate: its user-tier write routes through `promoteCandidatesToUserTier` → `memoryWrite`, which re-screens with the current catalog on the new write. All sites except the transcript tier screen the FULL catalog (secrets + injection) — `recent.md`/`archive.md`/queue content can reach injected context, transcripts cannot.

### 6.8 Conflict queue (companion to the review queue)

The review queue (§6.2) handles medium-trust *new* writes awaiting blessing. A separate concern: what happens when an auto-extract or user statement **contradicts an existing high-trust fact**?

Example: `MEMORY.md` has `(P-S79MJHFN) we standardized on Python 3.13` (trust: high, user-explicit). Later, auto-extract captures "we're moving to Python 3.14 for the websockets fix" from a turn — same canonical topic, different content.

**Conflict detection**: the `memory-write` skill, before writing, runs a similarity check against existing observations on the same heading_path. Threshold depends on the backend:

- **Semantic backend** (FTS5 + optional vector, v0.1.x): similarity > **0.85** → conflict. Semantic similarity correlates with "different ways of saying the same thing".
- **Substring fallback** (token-Jaccard, v0.1 default when Layer 5 is not installed): similarity > **0.5** → conflict. Jaccard under-reports semantic similarity ("Python 3.13" vs "Python 3.14" scores ~0.71 lexically despite being a clear semantic conflict); the 0.5 threshold was calibrated empirically by Task 25 against representative kit conflicts. Both thresholds are caller-overridable.

If similarity-and-content-differs → **conflict**.

**Routing**:

```text
IF new_write.trust < existing_obs.trust:
  Write to context/queues/conflicts.md (NOT MEMORY.md, NOT review.md)
  Append entry:
    - (proposed: P-NEW) "<new bullet text>"
      conflicts_with: P-S79MJHFN
      detected_at: <ISO>
      resolution: pending

IF new_write.trust >= existing_obs.trust:
  Mark existing as superseded_by: P-NEW
  Write new as canonical
  Both stay in archive (per §3.4 consolidation rules)
```

User resolves via `cmk queue conflicts`: review each conflict; choose `keep-old`, `keep-new`, `skip`, or `merge-both`.

**`merge-both` semantics** (Task 25b — Layer-3 scratchpad merger; `mergeScratchpadBullets` in `conflict-queue.mjs`):

1. Combine the two bullet texts with ` | ` separator: `<textA> | <textB>` (identical texts collapse to a single bullet).
2. Generate a fresh canonical ID via `generateId(tier, combinedText)` per the kit's content-addressed convention.
3. Auto-discover the section from idA's location (the new bullet lands in the same heading as the originals it supersedes).
4. Pick the higher of the two originals' trust as the merged bullet's trust.
5. Write the new bullet with the CANONICAL provenance comment via the shared `writeBullet` builder: `source: merge-both, source_line: 1, sha1: <sha1(combinedText)>, write: merged, trust: <max>, at: <ISO>`. _(Original plan pre-2026-06-11: a hand-rolled `merged_from: [idA, idB], merged_at: <ISO>` comment — it had no `write:` key, so the first reindex after a merge resolution hit the NOT-NULL `observations.write_source` constraint and search degraded to the stale index — Task 138 / D-125. The `merged_from` trail moved to the audit entry, step 7.)_
6. Mutate both originals' provenance comments to inject `superseded_by: <newId>` — lighter than `forget`/tombstone; the bullets stay in MEMORY.md but read as derived-from.
7. Audit-log entry with `reasonCode: CURATED_MERGE`, `extra: {decision: 'merge-both', merged_from: [idA, idB], merged_trust}`.

Stayed at Layer 3 (scratchpad bullets) rather than calling Task 10's `mergeFacts` (Layer 2 per-fact files) — the conflict-queue's proposed bullet was routed to `queues/conflicts.md` without being materialized as a fact file, so cross-layer composition wasn't viable. This was the 5th composition-verification instance in CLAUDE.md, closed by Task 25b.

**Why separate from the review queue**: conflicts are higher-stakes than fresh medium-trust facts — they imply existing memory is wrong. Different queue, different UX, different urgency. Per ChatGPT spec convergence + user-locked decision on the every-observation provenance principle (conflicts must surface explicitly, not silently overwrite).

**Implements**: FR-10, FR-11, FR-12, FR-13, FR-15, NFR-9.

### 6.9 Lock-file discipline + stale recovery

**Tail-appended 2026-05-26** (Task 23.10 retroactive) after the post-PR-31 class-2 audit (PR-B). PR-A's subprocess timeout closed the dominant lock-leak path (Claude Code's outer hook ceiling killing the parent mid-Haiku); this section covers the residual cases + the user-facing recovery path.

#### Lock-file inventory (class-2 audit, PR-B)

Greps across `packages/cli/src/` for true mutex locks (`acquireLock` / `noclobber` / `wx` flag) surfaced **one production lock**:

| Site | Path | Purpose | Cleanup contract |
| --- | --- | --- | --- |
| `auto-extract.mjs` `acquireLock(lockPath)` | `<projectRoot>/context/.locks/auto-extract.lock` | Prevent two concurrent auto-extract subagents racing on the same project (each Stop hook fire would otherwise spawn its own) | `try { … } finally { releaseLock(lockPath); }` in `runAutoExtract` — releases on every normal exit AND PR-A's timeout path (the inner timeout fires → catch routes the HaikuTimeoutError → finally releases the lock BEFORE the outer hook ceiling kills the parent) |

State-marker files under `.locks/` (`last-haiku-call.ts` cooldown mtime, `audit.log`, `poison-guard.log`, `network-blocks.log`, `shadowed_by.log`) are NOT locks — they're append-only NDJSON or mtime-tracked timestamps. The HC-9 scanner ignores them by extension match (only `*.lock` is treated as a true lock).

#### The residual leak case

After PR-A, the lock-leak window narrows to cases where the parent process dies *without running its finally block*:

- External `kill -9` (user manually killing a hung process, OS OOM, container shutdown).
- Hardware failure (laptop sleep-fail, power loss mid-Haiku).
- Parent uncaught exception that bypasses the try/finally (rare — `runAutoExtract`'s top-level try wraps the entire flow, but a synchronous throw before the try wrapper would leak).

In any of these, `auto-extract.lock` stays on disk holding the dead pid. The existing in-band stale-recovery in `acquireLock` ([packages/cli/src/auto-extract.mjs](../packages/cli/src/auto-extract.mjs)) handles the next-invocation case: if the holder pid no longer responds to `process.kill(pid, 0)`, the recovery path unlinks the stale lock and reacquires once. But that requires *another* auto-extract invocation to happen — until then, auto-extract is silently disabled.

#### HC-9 stale-lock detection

[`packages/cli/src/lock-discipline.mjs`](../packages/cli/src/lock-discipline.mjs) `detectStaleLocks(projectRoot, {userDir})` scans `*.lock` files under `<projectRoot>/context/.locks/` (and `<userDir>/.locks/` if supplied), parses the pid inside each, probes liveness via `process.kill(pid, 0)`, and returns a structured report:

```text
[
  {
    path: '/abs/.../context/.locks/auto-extract.lock',
    pid: 99999,
    holderAlive: false,
    stale: true,
    reason: 'pid 99999 no longer alive (holder process died without releasing lock)',
    recoveryCommand: 'rm "/abs/.../context/.locks/auto-extract.lock"',
  },
  …
]
```

Held-by-live-process locks return `stale: false` (no recoveryCommand emitted). Unparseable lock contents (empty file, non-numeric, corrupted mid-write) return `stale: true` with `pid: null` and a copy-paste recovery command.

Consumed by:

- **`cmk doctor` HC-9** (when Task 37 ships the diagnostic verb): surfaces stale locks in the report with the recoveryCommand for each.
- **`auto-extract.mjs` stale-recovery path**: imports `pidIsAlive` from this module — same probe, no inlined drift.

#### PID-reuse limitation (documented, not fixed in v0.1)

`pidIsAlive(pid)` returns true if the pid exists, regardless of whether it's the *original* holder. On long-running systems, the OS may have reused the pid for an unrelated process by the time auto-extract checks staleness. Worst case: HC-9 reports a stale lock as held-alive, suppressing the user-facing recovery hint.

Hardening (deferred to v0.1.x): write `{pid, started_at}` JSON to the lock file instead of bare pid; on liveness check, compare against the OS-reported start time of the holding pid. Per-OS APIs (`/proc/<pid>/stat`, macOS `ps -o lstart`, Windows `Get-Process | Select StartTime`) make this a more substantial fix; deferred until it bites in practice.

#### Composition with PR-A's subprocess timeout

The two PRs compose to bound the leak window:

- **PR-A inner timeout (25s auto-extract / 50s compress-session)** runs the catch + finally + log-write *before* the outer hook ceiling fires. Closes the dominant leak path (Anthropic API slowness).
- **PR-B HC-9 + stale recovery** catches the residual cases. Even if a lock leaks somehow, `cmk doctor` HC-9 reports it with a one-command recovery, and the next auto-extract invocation's stale-recovery path cleans it automatically.

**Implements**: Task 23.10. Cross-references: §6.1 (`.locks/` directory layout); §14 (HC-9 in the health-check table); [`HEALTH-CHECKS.md`](../HEALTH-CHECKS.md) (user-facing HC-9 self-repair).

### 6.10 Auto-judged privacy screen — L1 patterns + L3 Haiku judge, tier-routing as the quarantine (Task 148, ADR-0019)

The committed tiers travel with `git clone` — which makes a PII leak (a real name, an email,
a health detail appearing in tool output or conversation) strictly worse here than in any
DB-backed system. §6.6's `<private>` tag is user-prospective (useless for content the user
never wrapped) and §6.7's Poison_Guard is secrets/injection-shaped (PII is not pattern-shaped).
The v0.5.0 cold-open cut-gate proved the class live: `uv init` echoed the maintainer's
git-config name + email into tool output, which the transcript captured verbatim into a
would-be-committed file. Full prior art:
[research note](../docs/research/2026-07-07-auto-judged-privacy-prior-art.md);
decision: [ADR-0019](../docs/adr/0019-auto-judged-privacy-screen.md). The mechanism is
**two layers at two write-boundaries, isolate-don't-delete**:

**L1 — deterministic PII pattern layer** ([`pii-patterns.mjs`](../packages/cli/src/pii-patterns.mjs)) —
sync, on every commit-eligible write (transcript entries, `now.md` appends, fact bodies,
scratchpad bullets, `cmk remember`):

- Categories: `EMAIL`, `PHONE`, `HOME_PATH` (the §6.6 home-path→`~` abstraction, generalized
  to every write site), `USERNAME` (the home-dir username appearing bare, e.g. in `ls -la`
  output). Secrets stay §6.7's (REJECT posture); the PII class **MASKS** — incidental, not
  adversarial.
- **Covered shapes, and the named residuals (Task 252 audit).** `EMAIL` matches unicode local
  parts and domains in **both normalization forms** — composed (NFC `ñ`) and **decomposed
  (NFD, `n` + U+0303, the form macOS hands out in `ls`/`git` output that lands in a
  transcript)**; the pattern classes carry `\p{M}` for exactly that, because an ASCII-only
  class left `añez@x.com` masked as `añ«EMAIL»` and `\p{L}` alone repeated the half-mask on
  the decomposed form. Also covered: dotted/plus/percent local parts and multi-label
  subdomains. NOT covered: a quoted local part (`"john doe"@x.com` — legal, essentially
  nonexistent, and quote-span matching over-matches prose). `PHONE` requires a `+` prefix or
  separators — `nnn.nnn.nnnn` and `+CC-NN-NNNNNNN` included; bare E.164 (`+972541234567`)
  stays out deliberately, because a `+` before a long digit run also describes a unified-diff
  added line the transcript tier carries verbatim. Two `PHONE` false positives are **accepted
  in the masking direction and pinned by tests** rather than assumed away: a standalone 3-3-4
  dotted triple (`100.200.3000`) and a `+NNN NNN NNNNNNN` triple are shape-identical to the
  real forms, so no signal distinguishes them; what IS fixed is half-matching the head of a
  longer dotted run. `USERNAME` and `HOME_PATH` are both case-insensitive (the same login
  shows up as `some.user` in `ls` output and `Some.User` in a path). **Over-match is a
  correctness bug in the other direction** on a module that runs over every transcript entry:
  non-address `@` text (decorators, npm scopes, `pkg@1.2.3`, `logo@2x.png`, the `git@`/`hg@`
  SSH service handle) is byte-identical — while a PERSONAL login in a remote
  (`alice.dev@myserver.example.com`) still masks, and so does a real address merely *wearing*
  a file extension (`exports/john.doe@corp.com.csv`: the asset-filename exemption asks whether
  the extension-stripped stem is still a whole address, rather than trusting the suffix). The
  mask is **content-blind by design**: an address inside a code span or fenced block masks
  like any other — the screen has no parser, and the safe direction for a privacy layer is to
  redact a code example rather than reason about context and be wrong. The cheap keyword
  pre-filter is a **gate, not a hint**: a pattern whose trigger character is missing there
  never runs at all, so patterns live in ONE registry where each entry carries a bare sample
  the suite loops over — a gate-dead pattern fails the suite instead of shipping as a silent
  no-op.
- **Masks in place BEFORE content-hash/dedup/disk** (memclaw's ordering — hash and dedup see
  redacted text, so mask-then-store is race-free). Stable placeholders: `«EMAIL»`, `«PHONE»`,
  `~`-substitution for paths/usernames.
- **…but AFTER the §6.7 Poison_Guard screen (Task 231 / D-337 — the sanitize→screen→mask
  contract).** The write-path order on the two shared write boundaries (`memoryWrite`'s
  `add` action + `writeFact`) is: `sanitizePrivacyTags` → `checkPoisonGuard` → `maskPii`.
  The guard runs after the `<private>` strip (user-marked-private content is removed by
  explicit request — never reject content that won't land; the C5 cut-gate contract) and
  BEFORE the mask, because maskPii strips invisible/zero-width/bidi codepoints — running it
  first destroyed the guard's evidence and made the Task-70.4 invisible-unicode screen
  unreachable under the default privacy screen (the D-337 composition bug: §6.7 and this
  section each stated their own ordering; neither owned the guard↔mask cross-invariant).
  The invisible-codepoint catalog is now ONE exported list (poison-guard.mjs), which this
  layer's strip-set derives from — the two modules had drifted (the mask knew U+2062–64,
  the guard didn't; the same no-owner shape one level down). **Known consequence, accepted
  deliberately:** the guard now sees PRE-sanitized paths, so a POSIX path directly after a
  credential keyword (`password: /home/<20+ chars>`) rejects where it previously slipped
  through as `~`-sanitized — correct-conservative for a security screen; non-credential
  home paths mask and write as before. **Scope note:** `memoryWrite`'s internal `replace`
  action guards raw text but runs NO privacy-strip/mask at all (no CLI/MCP verb reaches
  it; callers are kit-internal — anti-pattern + persona supersede). Pinned by
  `tests/cli-screen-then-mask.test.js` (real-binary + both module boundaries, both
  directions).
- Findings carry **category + offsets, never the matched text**; each mask appends an entry
  to `context/.locks/redactions.log` (NDJSON, gitignored — the recovery surface, below).
- Engineering bounds (hermes/gitleaks discipline): keyword pre-filter before expensive
  regexes; bounded scan size (`MAX_SCAN_CHARS`); invisible-Unicode/bidi set-intersection on
  the RAW string before any normalization; bounded regex filler (no catastrophic backtracking).

**L3 — async Haiku sensitivity judge** — rides the existing detached auto-extract child
(§6.4); zero new hot-path cost. Catches what patterns cannot: names, health details,
addresses in prose. Instructions adapted from Anthropic's official PII-purifier prompt —
returns the FULL redacted text (LLMs are unreliable at character offsets, reliable at
rewrite), keeps the obfuscation defense (spaced/newline-split PII), and follows the
conservative posture ("when in doubt, redact"). An NER middle layer was considered and
rejected (ADR-0019 — domain-brittle, heavy dep).

**Boundary 1 — the transcript tier: live-buffer → judge → promote.**

```text
UserPromptSubmit ─┐                                   (gitignored)
                  ├─ L1 mask ──> transcripts/{date}.live.md
Stop (capture-turn)┘                     │
                                         v  detached child, per turn
                              pending entries > promote watermark
                                         │  L3 judge (one batched Haiku call)
                                         v
                              transcripts/{date}.md  (committed — SCREENED text only)
                              .locks/transcript-promote.state  (watermark)
```

- Both capture hooks append to the **gitignored** `{date}.live.md`; every intra-session read
  that used to read the committed transcript (`readLastUserTurnFromTranscript`, the tool-block
  assembly) reads the live buffer — same content, same format, zero behavior change.
- The child promotes all entries past the watermark in ONE batched judge call, appends the
  screened text to the committed `{date}.md`, then advances the watermark (marker-after —
  crash-safe; a crash re-promotes, and the committed append is idempotent per entry timestamp).
- **Fail-closed:** judge timeout/absence → entries stay in the live buffer; the next turn's
  child (or SessionEnd's compress-session top-up) retries the backlog. Haiku permanently
  unavailable degrades transcripts to machine-local — exactly native Claude Code behavior,
  an honest degrade, never an unscreened commit.
- **Secret hit → WITHHOLD, not defer (Task 216, D-320).** The PII judge screens names/emails,
  not secrets; a Poison_Guard hit on the judged batch (§6.7.1) is a PERMANENT condition — a
  defer would re-judge (and re-bill) the same batch every run and starve the
  `PROMOTE_MAX_FILES_PER_RUN` slots (oldest-first; the D-298 starvation class). Instead the
  batch is **withheld**: a content-free marker (`<!-- batch withheld: poison-guard
  <pattern_id> (live-buffer bytes A..B) -->`) is appended to the committed file, the
  watermark advances past the batch, and the raw text stays in the gitignored live buffer as
  the local audit trail. The offset-stamped marker makes the withhold idempotent across a
  crash between marker-append and watermark-write. Result action: `withheld`.
- `--scope transcripts` search sees promoted entries (the raw tier is the last-resort rung;
  a seconds-order lag is acceptable). The live buffer is never indexed.

**Boundary 2 — the fact path: the sensitivity axis.** The auto-extract classifier (§6.4)
emits per candidate `SENSITIVITY: commit | local-only | drop` (Option A, settled at D-150
slotting): `commit` (default) → the normal route; `local-only` (useful but sensitive) →
`context.local/private.md` (gitignored scratchpad, L-tier ids); `drop` → not written,
logged as `skipped_reason: sensitivity_drop` in extract.log (Door 5). The explicit path
(`cmk remember` / `mk_remember`) gets **L1 only** — deliberate user-authored text; `<private>`
(§6.6) remains the surgical override.

**Boundary 3 — the sessions middle tier (`now.md` → `today-{date}.md`).** The committed
`today-{date}.md` is a Haiku *summary* of `now.md`, so the L3 transcript judge never sees it.
Three guards keep it screened: (1) `now.md` receives the already-L1-masked turn text (its
content is conversational prose only — tool output, the incident's vector, goes to the L3-screened
transcript, never `now.md`); (2) the `compress-session` prompt carries a **privacy instruction**
— keep personal names / addresses / health details / other personal identifiers out of the
summary, replacing a name with `«NAME»` (the name defense L1 patterns cannot provide, using the
Haiku call that already runs — no extra call, no ceiling cost); (3) the compressed OUTPUT is
**L1-masked** before it lands in the committed `today-{date}.md`, catching any structured PII
(email/phone/username) the summary echoed. The `privacy.screen: off` kill-switch reverts all three.

**Recovery — `context/.locks/redactions.log`** (NDJSON, gitignored, machine-local): every
L1/L3 redaction records `{ts, source_file, category|judge, placeholder, original}` — the ONE
place the original text survives, never committed, so a false positive is locally recoverable
(hermes' "snapshot-blocked but live-file-preserved" pattern applied at the tier boundary; the
field has no release path at all — ADR-0019). `cmk doctor`'s memory-health section surfaces
the count.

**Config:** `context/settings.json` → `privacy.screen: "on" | "off"` (default on) — the
kill-switch convention. `off` disables L1 masking + reverts the transcript to the direct
committed append (pre-148 behavior, for users who explicitly prefer verbatim committed
transcripts over screening).

**Composition invariants** (registered with the §17.7 validators): the judge call's timeout
composes inside the child's existing internal budget (never the hook ceiling — the child is
detached, §8.5); the promote watermark follows the §16.13/D-266 marker-after discipline;
the live-buffer gitignore lines ship in the scaffold's `.gitignore.fragment` (validate-template
asserts them).

**Deliberate residual (named, not silent):** `now.md` gets L1 only — its content is text-only
(tool output, the incident's actual vector, never reaches it) and the compress prompt carries
a no-verbatim-PII instruction; full L3 treatment of the sessions middle tier re-opens on the
first observed name-class leak in a `today-*.md` (a D-248-style named trigger).

---

## 7. 3-tier scope merging

### 7.1 Resolution algorithm at session start

The SessionStart hook (`cmk-inject-context`) resolves and merges the three tiers:

```text
1. Discover tier paths
   local_dir   = <repo>/context.local/         (if exists)
   project_dir = <repo>/context/               (walks up from cwd)
   user_dir    = ~/.core-memory-kit/         (if exists)

2. Read settings.json from each tier (deep-merge: local > project > user)
   Scalars override; arrays concatenate-and-dedup by ID.

3. Read observation files
   For each canonical file (MEMORY.md, USER.md, SOUL.md, HABITS.md, LESSONS.md):
     Read bullets from any tier where present.
     Resolve duplicate IDs: most-specific tier wins.
     Log shadowed copies to context/.locks/shadowed_by.log:
       "P-S79MJHFN in project shadows same ID in user (line 12)"

4. Concatenate into frozen snapshot (≤10 KB total), with per-tier budgets enforced first
   Order: local → project → user (highest priority first in prompt)

5. Prepend the AUTHORITATIVE-MEMORY preamble (Task 75.0) when the snapshot
   is non-empty (see §7.1.2)

6. Emit as additionalContext JSON via hook output protocol
```

#### 7.1.1 Per-tier byte budgets (2026-05-26 amendment)

> **Update (D-61, 2026-06-04):** the per-file caps below are now **inject (load) caps only**, not write caps — writes always succeed and files grow on disk; overflow graduates to the searchable store. The tail-order truncation here is superseded by importance-aware selection. See **§19** for the load-cap-not-write-cap architecture; this section's budgets/coordination rule still govern the inject slice.

The earlier draft of §7.1 specified only a total snapshot cap (10 KB) and a tier-priority drop order on overflow. Live-test scenario 4 (see [`docs/journey/2026-05-26-live-test-findings-scenarios-3-7.md`](../docs/journey/2026-05-26-live-test-findings-scenarios-3-7.md)) surfaced the failure mode this creates: **the default install + a single auto-extract bullet already exceeds 10 KB**, and the lowest-priority tier (user) gets dropped on every session — even in fresh installs with only seed content present. The user tier's value prop is undercut by cap pressure from day 1.

Root cause: per-file caps (Task 12 / design §2.1) and the snapshot cap (this section) were specified independently. Per-file caps don't add to a coherent total; the snapshot cap was set without budgeting how much of it each tier deserves.

**Fix (PR-25 first pass, then PR-B coordination): per-tier byte budgets coordinated with per-file caps.**

Per-tier budget = EXACT SUM of per-file caps in that tier. Snapshot cap = sum of all per-tier budgets + small headroom for inter-tier markers.

| Tier | Budget (bytes) | = sum of per-file caps |
| --- | --- | --- |
| **L** (local) | 3,000 | machine-paths.md 1500 + overrides.md 1500 |
| **P** (project) | 4,300 | SOUL.md 1800 + MEMORY.md 2500 |
| **U** (user) | 4,975 | USER.md 1375 + HABITS.md 1800 + LESSONS.md 1800 |
| **Σ per-tier budgets** | **12,275** | |
| **Snapshot cap** (`DEFAULT_CAP_BYTES`) | **13,000** | Σ + 725-byte headroom for inter-tier markers |

#### Snapshot cap coordination rule (binding)

**The snapshot cap MUST be ≥ sum of all per-file caps across all tiers. Per-tier budget MUST equal the sum of per-file caps in that tier.** These are not three independent numbers — they are derived from one source-of-truth (the per-file caps in Task 12/14). Changing any per-file cap requires updating both the per-tier budget and (if total exceeds snapshot cap) the snapshot cap itself.

Why this rule is non-optional: when per-file caps and snapshot cap are specified independently, files at their LEGAL caps blow the snapshot. The lowest-priority tier gets dropped on every session — even in fresh installs with only seed content present. PR-25's user-tier truncation finding was the surface; PR-B (this amendment) is the structural fix. See [`docs/journey/2026-05-26-user-tier-cap-fix.md`](../docs/journey/2026-05-26-user-tier-cap-fix.md) for the "separately-correct-jointly-broken" pattern this rule prevents.

**Enforced at build time** by [`scripts/validate-template.mjs`](../scripts/validate-template.mjs):

- `Σ per-file caps across all tiers ≤ DEFAULT_CAP_BYTES` — fails the test suite if not
- `Σ per-file caps in tier T == TIER_BUDGETS[T]` for each T ∈ {L, P, U} — fails if drift
- `Σ per-file caps + authoritative-memory preamble reserve ≤ DEFAULT_CAP_BYTES` (Task 75.0, §7.1.2) — the JOINT check; without it the preamble-size test and the Σ-caps check each pass while composing past the cap

Lint runs on every `npm test` invocation. PR-14's seed-trust × consolidator bug and PR-22's auto-extract-reads-assistant-only bug were the same shape; this rule + the build-time check prevent the next instance.

**Truncation algorithm** (per-tier, then total):

```text
For each tier in priority order [L, P, U]:
  if bytes(tier_block) > tier_budget:
    drop whole sections from the END of the tier block until bytes ≤ budget
    log NDJSON: {ts, tier, pre_bytes, post_bytes, sections_dropped}
                              ↑ event type: tier_truncated_to_budget

After per-tier truncation, total bytes = sum(kept_tiers) — should be ≤ snapshot_cap.
If sum still exceeds snapshot_cap (configuration error — sum of budgets > cap):
  drop whole tier blocks from the tail (legacy behavior; old dropped_tiers event).
```

**Section-granular truncation** (not bullet- or byte-granular) is intentional. Each tier scratchpad has 3 fixed sections per design §2.1; dropping whole sections preserves the structural shape Claude's session-start prompt expects to see. A half-truncated section with a stray `##` heading and missing bullets is worse than no section at all — Claude reads it as "this section is empty" and may draw the wrong inference.

#### Meta-lesson: per-file caps and snapshot cap must be coordinated

This bug was structurally inevitable given how the spec was originally written. Per-file caps from Task 12 (total 12,275) exceeded the snapshot cap (originally 10 KB). Any user who filled their scratchpads up to cap WOULD trigger truncation. PR-25's first pass tightened user-tier seeds + introduced per-tier budgets but kept the snapshot cap at 10 KB; PR-B raised the cap to 13,000 and aligned per-tier budgets to per-file caps. The coordination rule above is the load-bearing invariant going forward.

Same shape as PR-14's seed-trust+at vs consolidator bug AND PR-22's auto-extract-reads-assistant-only bug. Three instances of the separately-correct-jointly-broken pattern; the CLAUDE.md "Composition verification" rule + this design.md coordination rule + the build-time check in validate-template.mjs are the three artifacts that prevent the next instance.

#### 7.1.2 Authoritative-memory preamble (Task 75.0, 2026-06-09)

Every **non-empty** snapshot opens with a fixed, code-generated preamble (`AUTHORITATIVE_MEMORY_PREAMBLE` in [`inject-context.mjs`](../packages/cli/src/inject-context.mjs)) that tells the agent the injected memory is **authoritative**: a 4-level ground-truth ranking (terminal/tool output → THIS snapshot + `cmk search` → official docs → training knowledge) plus the key line *"When injected memory contradicts your assumptions, injected memory wins. … never treat a question as novel when the answer is already in your prompt."* Adapted near-verbatim from memory-os Layer 07 (D-64/D-73): injecting memory is insufficient — without the instruction the agent re-derives from code what the snapshot already answers (the D-40 cold-open failure).

Design constraints:

- **Code-generated, not template-scaffolded** — always present, never consolidated/evicted/graduated, and existing installs pick it up on upgrade (avoids the Task-73 stale-template class). The scaffolded `CLAUDE.md` carries a one-line reinforcement ("Authority rule") for new installs; the preamble is the upgrade-proof carrier.
- **Composition with the cap table above (binding):** the preamble + its 2 joining newlines must fit the 725-byte headroom (Σ budgets 12,275 + preamble ≤ 13,000) — i.e. preamble ≤ 723 bytes; the boundary test pins ≤ 700 (currently 611), and `validate-template.mjs` assertion 3 enforces the JOINT invariant (Σ caps + preamble reserve ≤ cap) structurally on every `npm test`, so a future budget raise can't compose past the cap through the preamble seam. `injectContext` subtracts the preamble reserve from the cap handed to the truncation step, so custom `capBytes` values stay honored exactly; Door-4 truncation events still report the CALLER's capBytes, not the internally-reduced value. Known edge (accepted): custom caps below ~1.3 KB yield an empty snapshot slightly earlier than pre-75.0 (the reserve is taken before the drop step) — sane caps are unaffected.
- **Empty snapshot stays empty** — no preamble without memory behind it (downstream tooling relies on `additionalContext === ''` for the nothing-to-inject case).

The instruction-first lever is deliberately ahead of the Layer-5b backend (Task 65): per D-64, the framing is the bigger recall lever than the search backend. The remaining Task-75 halves (75.1 recall skill, 75.2 prompt hint) land after Task 65 so they wrap the full hybrid ladder.

#### 7.1.4 Work-state labelling — the stale-replay guard (Task 234, D-364)

The preamble (§7.1.2) tells the model *"injected memory wins"* and *"lead with memory — never re-derive"*. That authority is correct for **durable knowledge** and wrong for **transient work-state**: an `Active Threads` bullet naming a task that shipped days ago is a snapshot of intent, not a standing instruction. Without a distinction the preamble licenses **re-running finished work** — the failure ECC hit in production (their #1534: a post-compaction replay of an `ARGUMENTS=`-bearing slash command duplicated issues/branches/tasks).

**Mechanism.** `annotateWorkStateHeadings(body)` appends a single caveat line under each heading in `WORK_STATE_SECTIONS` (`Active Threads`, `Pending Decisions`):

```text
## Active Threads
_(work-state as last captured — may already be done; verify before acting, never re-run)_
```

**Three properties, each load-bearing:**

1. **Labelling, not deletion.** Work-state is genuinely useful for resumption; the fix is to mark it, not drop it. The durable-fact authority language in §7.1.2 is unchanged — weakening it would trade this failure for the D-40/D-153 *under-fire* class (the model re-deriving what memory already answers), which is no win.
2. **Annotated IN PLACE, not prepended.** The caveat rides the heading so it is read AT the bullets it governs — and so it costs the body above it zero bytes. A prepended block pushed the first real fact from ~78 to 346 bytes deep and broke the Task-18 "real fact near the top of the body" contract; that boundary test caught the first cut.
3. **Reserve counted with the SAME regex that annotates.** `workStateReserve` is `matchCount × (len + 2)`, where the count comes from `countWorkStateHeadings()` using `workStateHeadingRe()` — the identical matcher. An earlier cut reserved a fixed 2 slots and a 3-heading body overflowed the cap (4021 bytes on 4000, violating §7.1.2). Deriving the reserve from the same source as the effect is the structural fix; *"I reserved enough"* is the assumption that failed.

Idempotent (a negative lookahead skips an already-annotated heading) and CRLF-preserving.

#### 7.1.3 Reserved volatile lines — the temporal mention (66.4) + the memory-commit proposal (150)

Two bounded, per-session-volatile one-liners may ride between the preamble and the tier body, each following the SAME cap contract as the preamble (its byte length + 2 joining newlines is RESERVED out of the cap handed to truncation, so caller `capBytes` stays exact for the tier blocks; absent = zero bytes, snapshot byte-identical to pre-feature):

1. **The temporal-supersede mention** (Task 66.4, D-259) — built from `temporal_supersede` audit entries within 7 days (positioned 64KB tail read via the shared `readAuditTail`), naming the newest ≤2 closed facts: the "state updates were resolved" heads-up (D-215 posture).
2. **The memory-commit proposal** (Task 150, ADR-0018) — when the project is a git repo AND `git --no-optional-locks status --porcelain -uall -- context/` (bounded spawnSync, **400ms** timeout, silent degrade) reports uncommitted committed-tier files, a model-facing line asks Claude to OFFER the user a one-tap commit; the kit never runs a git write itself (`--no-optional-locks` makes even the index-refresh side-write impossible — the no-auto-git reconciliation: the user's yes executes an ordinary agent-run git command under the host permission model). `context.local/` never counts (gitignored by design); non-git projects skip at the `.git` existence gate with zero spawn cost (`.git` as a FILE — worktrees/submodules — counts). **Timeout composition (NFR-1, the skill-review I1 class):** the whole hook budgets 500ms and a warm `git status` measured ~450ms on a modest repo — the 400ms leash means a slow git yields silence, never a blown hook budget; a project whose root is a SUBDIRECTORY of a repo (no own `.git`) also degrades to silence (accepted — status-quo behavior; walk-up is the upgrade if ever demanded).

Both are MODEL-facing (they ride `additionalContext`) and both degrade to `''` on any read/spawn failure — the snapshot is the cargo, the lines are decoration.

**Template-sizing edge (DECIDED trade-off, skill-review I4 — the numbers):** at MAXED legal per-file caps, Σ budgets 12,275 + preamble reserve 613 leaves only **112 bytes** of the 13,000 default cap — less than one volatile line (~250–350B each), so a user whose scratchpads sit at their legal caps gets a lowest-value tier-section drop (graceful, logged to truncation.log per Door 4) on sessions where a volatile line fires. Accepted because: the lines are occasional (a supersede within 7d / uncommitted memory), the drop is value-ordered + observable, and shaving tier budgets to pre-reserve worst-case volatile space would cost EVERY session capacity for a sometimes-line. **Re-open trigger (D-248): truncation.log events attributable to volatile reserves showing up in live use at legal caps** — then register a `MAX_VOLATILE_RESERVE` in validate-template's joint invariant and shave the tier budgets explicitly.

### 7.2 `cmk config --show-origin` debug command

Mirrors `git config --show-origin`. Resolves the source of any setting or observation:

```text
$ cmk config --show-origin USER.preferred_editor
local    <repo>/context.local/overrides.md:5    "neovim"
project  <repo>/context/SOUL.md:18              "vscode"     (shadowed by local)
user     ~/.core-memory-kit/USER.md:7         "vim"        (shadowed by project)
```

Direnv lesson: without `--show-origin`, users rage-quit when settings appear from nowhere.

**Implements**: FR-7, FR-13, ADR-0003.

---

## 8. Rolling-window compression

### 8.0 The two-track mental model (what happens to memory over time)

Memory ages along **two independent tracks** — conflating them is the usual confusion ("why is MEMORY.md empty / why does it grow"). Full synthesis + cross-system comparison: [`docs/research/2026-06-01-memory-lifecycle-and-competitive-position.md`](../docs/research/2026-06-01-memory-lifecycle-and-competitive-position.md).

- **Track A — the session diary (this §8).** Time-ordered "what happened when." Progressive compression: `now.md → today-{date}.md → recent.md (7d) → archive.md (forever)`. Nothing deleted; each stage denser than the last.
- **Track B — the durable fact store (§2.2 + §3).** "What's true." `MEMORY.md` is the byte-capped HOT index; durable facts **graduate** out of it into granular `context/memory/*.md` fact files (the permanent brain, INDEX'd). MEMORY.md stays small via cap + stale-drop (>14d unreferenced) + graduation.

**What neither track solves: currency.** Track A handles volume, Track B handles durability — but "is this fact still TRUE now?" (Postgres-then-SQLite) needs **temporal validity** → [§16.18](#1618-temporal-awareness--fact-shapes--validity-windows--mode-aware-retrieval). NB: `expires_at` was a defined-but-unenforced provenance field until Task 66.3 (v0.4.4) shipped its enforcement — read-time search filter + the weekly-curate expiry sweep (§16.18 shipped-block).

### 8.1 The four-layer pipeline

```text
sessions/now.md
  │  Live appends from PostToolUse + Stop hooks
  │
  │  At SessionEnd: Haiku compresses now.md → today-{date}.md (one-shot per session)
  │  Truncate now.md after success.
  │  ALSO at SessionStart (lazy fallback, Task 105/D-75): if now.md still holds
  │  prior-session content (the prior session didn't cleanly close — Claude Code
  │  fires SessionEnd only on a clean window-close, NOT new-chat-same-window),
  │  the detached lazy worker rolls it → today-{date}.md. So the roll never
  │  depends on a clean exit; now.md can't grow unbounded.
  ▼
sessions/today-{YYYY-MM-DD}.md
  │
  │  Daily cron at 23:00:
  │    Re-compress today-*.md (last 7 days) into fresh sessions/recent.md
  ▼
sessions/recent.md
  │
  │  Weekly cron at Sun 09:00:
  │    Move today-*.md files older than 7 days into archive.md
  │    Rebuild recent.md from current week's files
  ▼
sessions/archive.md     (append-only)
```

### 8.2 Cooldowns (verified from claude-remember `save-session.sh`)

| Operation | Cooldown | Source |
| --- | --- | --- |
| PostToolUse → `now.md` append | none (file I/O is cheap) | Our design |
| Haiku compression (any `claude --print` call) | **120 seconds minimum** between calls | claude-remember `save-session.sh` |
| Daily distill (today-*.md → recent.md) | 24h (cron-scheduled) | Our design |
| Weekly curate (today-*.md > 7d → archive.md) | 7d (cron-scheduled) | Our design |

Tracked via `context/.locks/last-haiku-call.ts` timestamp file.

### 8.2.1 Lazy compression fallback (no-cron environments)

Cron is the default scheduler for daily/weekly compression, but in environments where cron isn't available (corporate Windows without Task Scheduler access, restricted CI runners, ephemeral dev containers) we fall back to **lazy-on-read** compression triggered by the SessionStart hook:

```text
At SessionStart, after snapshot assembly:
  IF today-{date}.md older than 24h AND no recent.md OR recent.md > 7d stale:
    Spawn detached `cmk compress --lazy` subprocess (non-blocking)
    Subprocess does the daily/weekly rollup work cron would have done
    Logs to context/.locks/lazy-compress.log
  Snapshot for THIS session uses whatever state existed at hook fire time
  (next session gets the freshly compressed state)
```

**Trigger condition**: missing scheduled output, not "user invoked compress". Cheap (one mtime + one stat check) so safe to run every session start.

**Why "lazy" not "synchronous"**: blocking SessionStart on Haiku compression would violate NFR-1's 500ms budget. Detached fire-and-forget keeps session start fast; the user pays the compression cost ambiently between sessions.

**Per HC-6**: `cmk doctor` detects no-cron mode and reports "running lazy compression — install cron for tighter schedules". Non-fatal.

### 8.2.2 `lazy-compress.mjs` module shape (Task 35)

**Tail-appended 2026-05-28** during Task 35 implementation. §8.2.1 documents the lazy-fallback policy at a high level; this section adds the implementation contract.

Public boundary:

```js
detectStaleness({projectRoot, now, dailyTtlMs?, weeklyTtlMs?})
  → {action: 'fresh' | 'stale-now' | 'stale-daily' | 'stale-weekly' | 'cron-active' | 'no-context-dir', reason}

async runLazyCompress({projectRoot, backend, now, cooldownMs?, dailyTtlMs?, weeklyTtlMs?})
  → {action: 'compressed' | 'distilled' | 'curated' | 'skipped' | 'error', verdict, delegatedTo, ...}
```

**`stale-now` (Task 105/D-75):** the now→today roll was historically SessionEnd-only (§8.1), and Claude Code fires SessionEnd only on a clean window-close — so a never-cleanly-closed session left `now.md` growing unbounded with no `today-*.md`/`recent.md` built. `detectStaleness` now returns `stale-now` (highest precedence after cron/no-context-dir) when `now.md` carries content, and `runLazyCompress` dispatches it to **`compressSession`** (the same roll the SessionEnd hook runs). At SessionStart `now.md` can only hold PRIOR-session turns (this session's captures haven't fired), so non-empty ⇒ stale. The roll is detached (a Haiku call can't run inline in the 500ms SessionStart budget), so THIS session injects pre-roll state and the next session gets the rolled state — the standard lazy tradeoff. The today→recent + weekly levels cascade on subsequent SessionStarts once `now.md` is drained (one-verdict-one-cycle). The 120s cooldown composes: `runLazyCompress` gates up front and passes `cooldownMs:0` to the inner `compressSession`, so a clean SessionEnd immediately followed by a reopen doesn't double-roll (and now.md is already empty anyway). Unlike `now.md`, MEMORY.md graduation already has a reactive-on-write path (Task 94), so it never grew unbounded — the now→today roll was the unique gap.

Composition:

- **`detectStaleness`** is the cheap SessionStart-side check (called inline from `inject-context.mjs`; runs in <5ms — one stat + one existsSync per layer). It returns the work-needed verdict; the SessionStart hook then detaches `cmk compress --lazy` if non-fresh AND non-cron-active.
- **`runLazyCompress`** is the actual work — composes on `dailyDistill` (Task 33) when only daily is stale OR `weeklyCurate` (Task 34) when weekly is stale. The verdict drives which path runs.
- **Cron-detection sentinel**: `<projectRoot>/context/.locks/cron-registered` is a marker file written by `registerCron` (Task 33/34) and removed by `unregisterCron`. When present, `detectStaleness` returns `'cron-active'` — `cmk compress --lazy` becomes a no-op (the cron will handle staleness on its own schedule).
- **Staleness thresholds**: `dailyTtlMs` defaults to 24h (matches daily-distill's 23:00 cadence + grace window); `weeklyTtlMs` defaults to 7d (matches weekly-curate's Sun cadence + grace). User can override via env vars (v0.1.x candidate) or function args (current shape).
- **`inject-context.mjs` integration**: after snapshot assembly, calls `detectStaleness` synchronously. If non-fresh + non-cron-active, spawns `cmk compress --lazy` via `child_process.spawn` with `detached: true` + `stdio: 'ignore'` + `unref()`. The detached child's lifecycle is decoupled from the SessionStart hook — the hook returns its 500ms budget cleanly while the child runs in the background. The child writes to `<projectRoot>/context/.locks/lazy-compress.log` (NDJSON).
- **Composition with shared cooldown**: `runLazyCompress` honors the 120s cooldown via the shared `cooldown.mjs` marker — same as `dailyDistill` / `weeklyCurate`. If multiple SessionStart fires happen within 120s (rapid-reopen scenario), only one Haiku call actually runs; the others see `skipped: cooldown`.

### 8.2.6 `PreCompact` — the THIRD now-to-today roll trigger (Task 235 / D-376)

**The premise, stated precisely.** It is NOT that context is lost at compaction. `capture-turn` appends every completed turn to `now.md`, so the buffer is already durable on disk before `PreCompact` fires — compaction discards the CONTEXT WINDOW, not the file. The real gap is that the now-to-today roll had only two triggers, and **neither fires during a long session**:

| Trigger | When it fires | Why it misses a marathon session |
| --- | --- | --- |
| `SessionEnd` (§8.1) | clean window-close only | Claude Code fires `SessionEnd` ONLY on a clean close — a long session that is killed, crashes, or is left open never gets one (the Task-105/D-75 class; the v0.4.0 dogfood grew `now.md` to 410 KB exactly this way) |
| SessionStart-lazy (§8.2.2) | start of the NEXT session | too late to help the session that is compacting right now |

`PreCompact` is the only roll trigger that fires **during** the session, and a compaction is a reliable signal that the session IS a long one. That is the whole value: bound `now.md` and consolidate the buffer at the moment we know it matters.

**Composition — why NOT `runLazyCompress`.** It looks like the natural reuse, but its `cron-active` gate is a SessionStart concern ("a cron ran recently; it will handle staleness eventually"). Eventually is 23:00. A compaction at 14:00 on a cron-registered repo would do **nothing at all**. So `precompact.mjs` composes DIRECTLY on `compressSession` — the same roll `SessionEnd` runs, cron-independent. Reuse the pipeline, not the gate.

**The never-block contract (primary-source verified 2026-07-20, code.claude.com/docs/en/hooks).** A `PreCompact` hook CAN block compaction — a `decision: block` response or exit 2 — and its default timeout is **600 s**. The kit uses NEITHER. Blocking a user's compaction to bank memory would hold their session hostage; the posture is fail-open everywhere. The bin emits no `decision` on any path and always exits 0, and `tests/cli-precompact.test.js` pins that both ways (valid payload AND garbage payload).

**Why the work is detached.** Nothing here is urgent (the buffer is already on disk), so an inline LLM compress would buy nothing and cost 20-80 s of visible latency at EVERY compaction (the §8.2.5 / D-179 latency measurements). The hook gates cheaply (one `existsSync` + one small read + the cooldown stat), spawns `cmk-precompact-worker` detached, and returns — the same two-bin posture as `capture-turn` → `auto-extract` and `inject-context` → `compress-lazy`. Live-measured 2026-07-20: hook returned in **270 ms**; the worker's real Haiku roll took **9.2 s** behind it.

**Double-fire (PreCompact then SessionEnd) — the two guards are NOT interchangeable.** An earlier draft of this section claimed they were; skill-review falsified it (2026-07-20) by tracing when the marker is actually written:

| Case | Cooldown marker | Atomic claim (§16.27) |
| --- | --- | --- |
| **Sequential** — a compaction, then a session-end seconds later | ✅ hot (`touchCooldownMarker` fires on `compressSession`'s SUCCESS path) | ✅ buffer already drained |
| **Concurrent** — two rollers whose gate-checks both land before either finishes its Haiku call | ❌ **zero protection** — the marker is only touched *after* a successful compress, so both read "not in cooldown" | ✅ **the only guard** — one `renameSync` on `now.md` wins; the loser gets ENOENT, treats it as an empty buffer, and returns skipped BEFORE calling the backend |

So the cooldown is a **budget** guard, not a concurrency guard, and `claimNowBuffer`'s atomic rename is the mutex — the same one `compressSession` already relies on for the SessionEnd-vs-SessionStart-lazy race, reused rather than duplicated. Pinned by the concurrent test in `tests/cli-precompact.test.js` (two un-awaited `runPreCompact` calls → exactly one backend call, one day file). Live-verified for the sequential case: a second fire logged `spawned:false, reason:empty-buffer` and the day file stayed byte-identical.

**Per-agent availability (the Task-50 seam).** `preCompact` is an abstract event in `agent-profiles.mjs`; only Claude Code maps it (`preCompact: 'PreCompact'`), because Kiro, Cursor and Codex expose no compaction event. Unmapped agents simply do not wire the leg — the same way Kiro/Codex do not map `sessionEnd` and only Cursor maps `preShell`. Each agent doc names the gap honestly.

**Cross-references:** §8.1 (the SessionEnd pipeline this parallels), §8.2.2 (the lazy roll whose cron gate is deliberately NOT reused), §8.2.5 (the bounded compress input this inherits), §16.27 (the claim-rename that makes a concurrent capture-turn append safe against the detached roll), §8.5 (timeout composition — the ceiling-free budget the worker takes). _Implements: Task 235; D-364 (the ECC study), D-376 (the sharpened premise)._

### 8.2.3 `compaction-state.mjs` deep module (Task 167, v0.4.1) — SUPERSEDES the §8.2.2 `detectStaleness` gating

**Tail-appended 2026-06-25 (D-206/D-207).** The §8.2.2 design above shipped a real bug: `detectStaleness` short-circuits to `cron-active` on the mere EXISTENCE of the `cron-registered` sentinel (§8.2.2 bullet 3), ABOVE the `stale-now` check — so a registered-but-never-fired cron (laptop asleep at 23:00) disabled the lazy roll, and `now.md` grew to 410 KB un-rolled (the v0.4.0 dogfood; the injected snapshot froze 5 days stale). **The §8.2.2 sentinel-presence gate is the part being replaced; the artifact-derived `stale-now`/`stale-daily`/`stale-weekly` logic is KEPT verbatim (it was never the broken part).**

**The fix is a deep module (`compaction-state.mjs`) that owns the whole verdict.** Resolved via a 7-question design grilling + the marker-vs-derive research + the EverOS/OpenWolf peer-CODE sweep (research notes 2026-06-25):

- **Interface — two methods (Q3):**

  ```js
  isCompactionNeeded({projectRoot, now, dailyTtlMs?, weeklyTtlMs?})
    → {verdict: 'fresh' | 'stale-now' | 'stale-daily' | 'stale-weekly' | 'cron-active' | 'no-context-dir',
       cronStale: boolean, heartbeatAge: number|null}

  recordCronHeartbeat({projectRoot, now})   // the ONLY writer; cron bins call on each fire
  ```

  `isCompactionNeeded` absorbs `detectStaleness`; the rich return lets the lazy roll read `.verdict` and `cmk doctor` HC-10 read `.cronStale`/`.heartbeatAge` from ONE source (no standalone `isCronAlive` — a 3rd predicate would be a 2nd place the freshness rule is read, which drifts — the exact bug class this fixes).

- **Marker-vs-derive = HYBRID (Q2; the GNU make "Empty Target Files" rule: derive when the work's product carries the signal; stamp only "a run happened"):** DERIVE `now`/`daily`/`weekly` from the existing artifacts (`now.md` content, `recent.md` mtime, `today-*.md` dates — NO new marker; a 2nd source would drift from the artifacts it mirrors, violating ADR-0002). STAMP cron-liveness with ONE anacron-style `cron-heartbeat` the cron bins write per fire, gated on AGE (`now − heartbeat.mtime < ~2× cron interval`), NOT existence. Retire the `cron-registered` sentinel + `cronSentinelPath`. _Peer-validated: OpenWolf's `last_heartbeat`-by-age + EverOS's in-process APScheduler both schedule reliably only because they have an always-on process the kit lacks → the kit derives + stamps-per-fire._

- **Correctness > startup speed (Q4 — "we're in the memory business"): PRINCIPLE holds, MECHANISM revised by the live test (2026-06-26).** The grilling's Q4 first proposed a SYNCHRONOUS SessionStart drain. **The live test (real `claude --print`) proved it infeasible:** a real now→today Haiku roll takes 18–37 s but the SessionStart hook ceiling is 30 s, so the sync drain reliably timed out and fell back to the detached path anyway. The event-driven peers (claude-mem/mem0/Letta) compact synchronously at session **END** (the Stop hook, no user waiting), not start — the kit already has that via the SessionEnd `compress-session` hook. **So the now→today roll stays on the DETACHED SessionStart path (the §8.2.2 mechanism) + the SessionEnd hook; the correctness guarantee comes from 167.A (the cron-liveness gate stops a dead cron suppressing the detached roll) — now.md heals next session and, with the gate fixed, NEVER compounds.** The `runSyncDrainIfNeeded` built on 2026-06-26 was reverted; verified end-to-end by `npm run live-verify:now-roll`.

- **Cooldown (Q5):** touch the marker on SUCCESS only (a failed Haiku call must be free to retry — today every caller touches on success AND failure, blocking the next needed compress 120s). The stale-content sync-drain BYPASSES the cooldown (it's a cost guard; correctness wins); the routine opportunistic compress still respects it.

- **Detectability (Q7):** a REQUIRED WARN line in `lazy-compress.log` on the stale-skip/heal path (the audit trail — free, automatic) + an OPTIONAL `cmk doctor` HC-10 (a dev/diagnostic nice-to-have reading the same rich return; informational, never "run X to fix" — the heal is automatic).

Composes with Task 106 (the rename-race — a sync catch-up must keep the atomic `now.md → now.md.compressing-{ts}` rename) and §6 (rolling-window). See `tasks.md` Task 167 (167.A–F) for the build breakdown.

`subcommands.mjs` wiring:

- `cmk compress --lazy` invokes `runLazyCompress` (no other compress sub-verb exists in v0.1.0; the parent `compress` verb takes `--lazy` as the only documented flag).
- Help shows `--lazy` as the required flag for v0.1.0; bare `cmk compress` emits help + exits 0 (Task 35 doesn't add a non-lazy compress path; that's where the Layer-2 `cmk roll` Task 39 sits).

**Test contract** (tasks.md 35.4):

1. SessionStart with `recent.md` mtime 8d old → `cmk compress --lazy` spawned; SessionStart still returns within 500ms.
2. SessionStart with fresh `recent.md` (mtime <24h) → no spawn.
3. `cmk compress --lazy` runs `dailyDistill` work when only daily is stale; runs `weeklyCurate` work when weekly is stale.
4. With `.locks/cron-registered` sentinel present → `detectStaleness` returns `'cron-active'`; lazy detector exits skipped + logs.

**Implements**: FR-19; Task 35 (Layer 6 lazy fallback). Cross-references: §1.4 (data flow), §8.1 (four-layer pipeline), §8.2 (cooldown), §8.6 (daily-distill composition), §8.7 (weekly-curate composition).

### 8.2.3 Bug 2 — stale snapshot after a major event (the fact-currency gap at SessionStart) (Task 158 / D-166)

**The symptom.** After v0.3.2 shipped + published, a fresh session's injected SessionStart snapshot still said *"v0.3.1 shipped / v0.3.2 deferred."* The user found it ("what happens if I start a new session?"). A new session, reading its own memory to learn project state, would conclude an OLDER version was current — the single failure mode the whole kit exists to prevent, turned on itself.

**The real root cause (corrected from the bug's first framing).** The snapshot is NOT built from `recent.md`. Per `inject-context.mjs` `plannedFilesForTier`, the project tier injects `SOUL.md` + `MEMORY.md` + the **latest `today-*.md`** only (`recent.md`/`archive.md` are deeper archive, never injected). The stale string lived in **`MEMORY.md`'s Decisions section + `today-2026-06-15.md`** — both still asserting "v0.3.2 deferred" because **nothing superseded that fact when the contradicting event (the ship) happened.** Auto-extract *adds* new facts; it does not proactively mark an existing fact stale when a later fact contradicts it. So the old line kept being injected. (Note: the 2026-06-16 interim fix appended an authoritative block to `recent.md` — but since `recent.md` isn't injected, that never reached the snapshot; what actually fixed it was the later auto-extract overwriting `MEMORY.md`. The interim fix worked by luck, not mechanism — itself evidence the framing was off.)

So Bug 2 is **not a compression-lag bug** — it is a specific, high-visibility instance of the **§8.0 currency gap** (the Postgres→SQLite problem): two contradictory facts on one topic coexist, and recall surfaces the stale one. The general answer is §16.18 (temporal validity — a v0.2 build). But the snapshot is the one surface where a *cheap, immediate* guard is worth shipping now, because it's the highest-leverage place a stale fact does damage (it frames the entire next session).

**The options considered (and why the carve-out was rejected):**

- **Option A — eager supersede-on-major-event.** When a "major event" fact is captured (a version ship, a settled decision that contradicts a live one), mark the contradicted MEMORY.md bullet superseded in the same write. This IS the right general fix — but it needs semantic contradiction-detection to know WHICH bullet to supersede, which is exactly **Task 95** (the mem0-style ADD/UPDATE/DELETE/NONE pass; D-73), itself sequenced **after Task 66** (validity windows) per the memsearch/MemPalace dive (the assert-vs-validity-window check needs the windows to exist first).
- **Option B — freshest-source-wins at snapshot assembly.** Prefer the most-recent-by-`at:` bullet when two injected sources contradict. A heuristic that still needs A's "same topic" detection to be safe; without it, mis-fires.
- **Option C — a deterministic "project status" pin** computed from `package.json` version + `CHANGELOG` instead of from memory. **Considered and REJECTED.** It would fix only the version line, by a mechanism **no researched memory system uses** — the prior art (Chandra's "Beyond the Log", §16.18) treats *current status* as a **Current-State temporal-validity fact** ("what is X right now?" → boost `status: ongoing`), NOT a computed field. Special-casing version state as a computed pin is a carve-out that routes around the real model; convergence across the research says this is a currency problem, not a config-injection problem.

**DECISION (D-166): Bug 2 is a true instance of the fact-currency gap; defer it to the Task 66 → Task 95 chain.** Version state ("v0.3.2 deferred" → "v0.3.2 shipped") is the SAME shape as Task 95's own headline example ("moved Postgres→SQLite as a supersede, not a contradicting ADD"). Task 66 (validity windows: close the old `State` fact, open the new) + Task 95 (the batched contradiction-resolve, latest-value) fix the WHOLE class — version state and every other Current-State staleness — generally and correctly. We do NOT ship a special-cased v0.3.3 fix: the 2026-06-16 interim hand-fix (rewriting the stale MEMORY.md/`recent.md` lines) corrected the live snapshot, and the narrow residual window (a major event between the event and the next capture/curate) is acceptable until 66→95 land. Sequencing is research-confirmed: **66 before 95.** _Per the user's call 2026-06-16 (after a full Task-95/§16.18 doc + research check). Relates Task 66 (validity windows), Task 95 (re-curation / contradiction-resolve, D-62/D-73), §16.18 (temporal validity), the "Beyond the Log" research note (Current-State boost), the §8.0 currency gap._

### 8.2.4 Decision-journal auto-sync — DECISIONS.md stays current with no command (Task 159 / D-169)

**The gap.** Task 147 BUILT the append-only journal writer (`syncDecisionsJournal`, §19.4 / D-161) but wired it to exactly ONE trigger: the manual `cmk digest` command. So `context/DECISIONS.md` only existed if a human ran `cmk digest` — the exact "a feature isn't done until it's automatic" anti-pattern D-164 names, lived on the kit's own repo (a probe sync appended 459 lines of decisions captured since the last manual digest). The v0.3.3 cut-gate surfaced it (the user: *"why do I need to manually build the journal?"*).

**The mechanism (deterministic-on-hook, NOT an LLM Scribe).** squad — the source project the journal was taken from (D-161) — keeps its `decisions.md` current with an inbox drop-box + a dedicated **LLM "Scribe" agent** that merges at a session-end ceremony. The kit does BETTER: its journal is **deterministically derivable from the already-captured typed `type:project` facts** (squad needs an LLM because its decisions are unstructured prose; the kit's are structured facts), so it just runs the deterministic `syncDecisionsJournal` (~175ms, pure file I/O, no Haiku/network) on a hook. squad's session-end TIMING insight, without squad's LLM mechanism.

**Two placements (primary + fallback):**

1. **Primary — the detached session-end path** (`runSessionEndTasks`, §8.1 / Task 86b). A 4th SEQUENTIAL local-I/O step beside the Task-94.3 graduation sweep — the exact template: pure file I/O, `<<1s`, no hook-ceiling risk, wrapped so a synchronous throw can't reject into the hook. DISJOINT inputs/outputs from compress (sessions/ tree) + persona (user-tier) + graduation (persona scratchpads) — nothing else in the block touches `DECISIONS.md`, so no lock contention. Session-end is the natural "this session's decisions landed → render them" boundary. `summarizeSessionEnd` gains a 4th diagnostic line (`journal (written: …, appended: …)`).

2. **Fallback — the SessionStart lazy path** (`runLazyCompress`, §8.2.2), for sessions that never cleanly closed (Claude Code fires SessionEnd only on a clean window-close — the Task-105/D-75 class, where the primary sync never ran). `syncDecisionsJournal` runs **unconditionally at the top of `runLazyCompress`**, before any compress gate.

**Why a separate `isJournalStale` boolean, NOT a new `detectStaleness` verdict (the composition call — divergence from the Task 159 first-draft).** The task entry first proposed adding a `journal-stale` verdict to `detectStaleness`. That is the **separately-correct-jointly-broken** class: `detectStaleness` returns exactly ONE verdict and `runLazyCompress` dispatches to exactly ONE compress stage, but the journal sync is **independent of the compress pipeline** — a compress-fresh (or cron-active) session can still have new un-journaled decisions. A single `journal-stale` verdict would therefore *suppress* compress work (or be suppressed by it). So journal-staleness is its OWN boolean (`isJournalStale(projectRoot)` — stale ⇔ a `project_*.md` decision fact exists AND `DECISIONS.md` is missing or older than `context/memory/INDEX.md`, the O(1) freshness proxy `write-fact` rewrites on every fact write — vs stat-every-fact, which measured ~130ms on a 307-fact corpus and would blow the 500ms SessionStart budget), used in `inject-context.mjs` as an **additional** spawn trigger OR-ed with the compress-stale verdicts, never replacing them. Cron-active + a stale journal SHOULD spawn (cron handles compress, NOT the journal — the registered crons are `daily-distill` + `weekly-curate` only); compress still skips on cron-active inside `runLazyCompress` while the unconditional journal sync runs. The journal sync does NOT touch the 120s Haiku cooldown — that gate is for the LLM compress passes only.

**Implements**: completes D-164 ("automatic" for the journal) + Task 147's scoped-but-never-wired "made automatic" intent; unblocks the cut-gate DJ5 stage. Cross-references: §8.1 (session-end), §8.2.2 (lazy-compress), §19.4 (the journal writer), D-161 (append-only model), D-169 (the gap + decision).

### 8.2.5 Bound the compaction INPUT — the compress-session timeout-spiral fix (Task 161 / D-173)

**Tail-appended 2026-06-18.** DESIGN-FIRST decision; the implementation contract lands with the Task-161 code.

**The problem (the spiral).** `compressSession` (§8.5) reads the **whole** `now.md` buffer and passes it straight to `backend.compress()` with `timeoutMs: 50_000`. `input_bytes` is measured but **never gated** — there is no input cap, pre-trim, chunking, or shrink-and-retry. As `now.md` grows, the `claude --print` Haiku call gets slower; when it crosses 50s it errors `haiku_timeout`, the buffer is left UNTOUCHED (fail-safe), and the roll retries only at the next SessionStart (`detectStaleness`→`stale-now`) — by which point the buffer is **bigger** → **slower** → times out **again**. A compounding degradation spiral that re-instances the Task-105/D-75 unbounded-`now.md` class behind a wall-clock timeout. The same `HaikuViaAnthropicApi.compress` path (same 50s budget) backs `daily-distill` and `weekly-curate`, so the fix must cover the **whole compression family**, not just the now→today roll (cut-gate-16 §7 F-4: `daily-distill` also timed out).

**The grounded data** (the kit's OWN dogfood `context/sessions/*.compress.log`): real compressions span 21s–50s+; **5 historical `haiku_timeout` failures**; `now.md` inputs of 166 / 334 / 405 / 470 KB all timed out at 50s; a fresh ~10 KB buffer took **71s then 89s** at cut-gate-16 on the exact invocation (correct output, just slow). **The compression LOGIC is fine; `claude --print` latency vs the fixed budget on an UNBOUNDED input is the failure.**

**The decision (D-173): BOUND THE INPUT; do NOT touch the timeout.** Settled by a 19-system cross-system survey ([research note](../docs/research/2026-06-18-session-buffer-compaction-under-latency-growth.md), all freshly re-cloned 2026-06-18). **17 of 19 systems bound their compaction input before the LLM call**; the only 2 that don't are exactly the kit's own precedents — `claude-remember` (still unbounded, survives on a 120s timeout + daily-delta staging — the candidate-(d) "raise the timeout" approach, used as a *primary* fix by no one) and `claude-mem` (which has SINCE moved to per-turn). The kit inherited the antipattern and never added the bound the rest of the field treats as table-stakes. The provenance is direct: the **origin research note already specified the guard** — *"if Haiku compression latency routinely > 3 s p95 → drop the rolling window"* ([2026-05-21-claude-ai-deep-research-option-b.md](../docs/research/2026-05-21-claude-ai-deep-research-option-b.md), line 437) — a 3s budget written at design time, never wired in; we are now at 21–89s. **Task 161 closes a guard the original design called for and the build dropped.**

**The four input-bounding families the field converges on** (research note §"The convergent lesson"), and which the kit adopts:

| Family | Field examples | Adopt for the kit? |
| --- | --- | --- |
| 1. Structural buffer cap | MemoryOS `deque(maxlen)`, MemOS `MAX_BUFFER_SIZE=10MB`, Letta `message_buffer_limit=60`, caura-memclaw `MAX_INGEST_WRITES_PER_SESSION=10` | **Subsumed** — the at-seam cap (A) bounds every call, so a separate mid-session buffer cap (B) is optional, not load-bearing |
| 2. Deterministic pre-truncate/chunk before the model | memsearch `MAX_PROMPT_CHARS=80_000`, mempalace `CHUNK_SIZE`/`TruncationDetected`, graphiti `truncate_at_sentence`, TencentDB emergency `truncate-in-place` | **Yes** — the hard input cap (mechanism A), at the shared compress-call seam |
| 3. Partial / windowed compaction (compress oldest, keep recent verbatim) | Letta `PARTIAL_EVICT` 30/70, OpenHands `keep_first=2`, langmem/LightMem `get_dialated_windows(N=5)`, squad inbox-deltas | **Yes** — keep-recent-verbatim (mechanism C), paired with A |
| 4. Batch-size cap (≤N units per pass) | TencentDB `Max tool pairs per L1 batch = 20` | folds into mechanism A (the cap bounds the per-call input) |

**The product-design framing (the decisive lens — checked 2026-06-18 against the kit AS A WHOLE, not just this bug).** A first draft proposed a four-mechanism stack bolted onto `now.md`. Reading the kit's OWN code + tenets reshaped it into something native to the kit's architecture:

1. **The spiral is at the COMPRESS-CALL SEAM, not one file.** Three lifecycle verbs call `backend.compress({input, timeoutMs: 50_000})` with no input bound: `compressSession` (now→today, [compress-session.mjs:329](../packages/cli/src/compress-session.mjs)), `dailyDistill` (the 7-day `today-*.md` concat via `readBuffer`, [daily-distill.mjs](../packages/cli/src/daily-distill.mjs) — VERIFIED to have the identical unbounded shape), and `weeklyCurate`. A `now.md`-only cap just MOVES the spiral to `today-*.md` (the user's catch, confirmed in code). So the bound lives at the **shared compress-call seam** and all three verbs inherit it — the kit's deep-module/one-surface discipline (CLAUDE.md "deep modules").
2. **Trimming the oldest is SAFE because `now.md`/`today-*.md` are DERIVED buffers over DURABLE tiers.** The full raw turn is written to `context/transcripts/{date}.md` FIRST (capture-turn), and the compressed tiers (`recent.md`/`archive.md`) are the durable downstream — `now.md` is explicitly derived (§8.2.2 `stale-now`; the capture-turn comment: *"the transcript is the durable record; a missing now.md entry only means this turn isn't in the next session summary"*). So dropping `now.md`'s oldest slice loses NOTHING — the generic "where does the overflow go?" worry dissolves on the kit's own layout. (memsearch sidesteps it the same way: old files age out of its recent-window but stay on disk.)
3. **Partial-evict ADVANCES the kit's faithfulness goal (§8 Task-84 grounding rule), it doesn't just cut latency.** The Hard Rules already say *"grounded in the input, never carry forward, omit if unsure."* Keeping the RECENT turns verbatim and summarizing only the OLDEST slice is *strictly more faithful* — zero hallucination risk on the freshest, most-relevant content; only the older tail is summarized (and that sub-summary inherits the same Hard Rules). Coherent with, not bolted onto, the anti-hallucination design.
4. **Input-side only → the ≤10 KB frozen-snapshot budget (§7) is untouched.** Output is already `maxOutputBytes`-capped; bounding the INPUT changes neither the output size nor the snapshot. No snapshot-budget interaction to compose. (This retired the first draft's "raw turns might bloat the snapshot" worry — the snapshot injects the *compressed* today, not raw turns.)
5. **Reuse the kit's OWN cap precedent.** capture-turn already enforces `NOW_MD_ASSISTANT_CAP` (truncates an oversized assistant turn before it lands). The kit already bounds one dimension; this extends the same instinct to the compress-call input — an internal precedent, not an imported foreign mechanism.

**The adopted mechanism set** (sized in bytes/turns against measured Haiku latency, NOT tokens-against-a-context-window — the buffers are compressed offline, never fed to a live inference, so the field's token-pressure *trigger* does not apply; only the input-bounding *mechanics* do):

- **CORE = A+C, at one shared seam — `boundCompressionInput(input, { keepRecent })`.** A pure helper the three verbs call immediately before `backend.compress()`. It keeps the most-recent slice **verbatim** (C — partial-evict, snapped to a turn/day delimiter: `## <ts> —` in `now.md`, `## <date>` in the daily concat) and bounds the total to `COMPRESS_INPUT_CAP_BYTES` (A — hard cap; the OLDER overflow beyond the cap is summarized-or-dropped, safe per framing-point 2). One function, three call sites; `input_bytes` is already measured, so the gate is nearly free. **Placement decision: a shared helper the verbs call, NOT inside `CompressorBackend.compress` (§8.3)** — because "what counts as recent" is verb-specific (a turn boundary for the session roll vs a day boundary for the daily distill), so the policy belongs with the verb's knowledge; the backend stays a dumb transport. The cap value is pinned at implementation against fresh latency measurement (the dogfood ceiling: inputs ≥166 KB timed out at 50s ⇒ the cap lands well below that, with headroom).
- **D (priority is GATED on an open question — `minimum_progress` floor + shrink-and-retry on `haiku_timeout`, OpenHands `minimum_progress=0.1`, `context_scaling=0.8`×5).** D retries with a further-shrunk input instead of fail-and-grow. **Whether D is core or optional depends on a question the data has NOT settled: is the Haiku latency INPUT-SIZE-driven or ENVIRONMENTAL?** The cut-gate-16 data shows BOTH — big inputs (166–470 KB) timed out (size-driven, A fixes it) AND a **~10 KB buffer took 71–89 s** (NOT size-driven — `claude --print` was just slow). **If latency is environmental/variable, A is NOT sufficient** — a correctly-capped small input can still time out on a slow-Haiku moment, the buffer restores, and it never drains until Haiku is fast again. **That is exactly D's case.** So D is **not safely deferrable on the current evidence.** **Decision: RESOLVE THE QUESTION AT IMPLEMENTATION** — measure real Haiku latency vs input size on the dogfood corpus. If size-driven ⇒ A suffices, D is optional. If noisy/environmental ⇒ **D ships WITH A as part of the core** (at minimum a single bounded retry so a transient slow call makes progress next attempt rather than re-failing on the same input). Until measured, treat D as **core-pending**, not deferred.
- **B (mid-session drain, DROPPED — and the REASON is in the code, not hand-waving).** The first draft made a PostToolUse-triggered mid-session compaction the structural core, to stop `now.md` growing unbounded. **But reading `compress-session.mjs` shows `now.md` is ALREADY fully drained on every successful compress:** `claimNowBuffer` **renames the whole `now.md` away** (`renameSync(nowPath, rollingPath)`), compresses it, writes the summary to `today-*.md`, and discards the rolling file — `now.md` → empty. It's all-or-nothing: the buffer either drains completely (success) or is restored to retry (timeout). So `now.md`'s unbounded growth is NOT a missing-mid-session-drain problem — it is purely *"the all-or-nothing compress keeps TIMING OUT, so the existing drain never runs."* **Once A+C make the compress SUCCEED (bounded input → no timeout), the claim-rename that already exists drains `now.md` to empty again — there is no residual growth for B to solve.** A separate mid-session hook would be a moving part in the hot append path that fixes a problem the existing drain already handles the moment compresses stop failing (the most mature analog, memsearch, has no such hook either). **Decision: B DROPPED for v0.3.4.** Reconsider only if live data shows `now.md` bloats EVEN WHEN compresses succeed (it shouldn't — the drain is total).

**Where it fires.** Keep the SessionStart-lazy roll (§8.2.2) and the SessionEnd roll (§8.1) AS-IS — they don't change shape, they just now feed a *bounded* input through `boundCompressionInput`. (The first draft proposed ADDING a new bounded SessionEnd drain; with the seam-bound in place that's redundant — the existing SessionEnd `compressSession` already runs there and now bounds its own input. **Composition note (§8.5 / D-42):** because the input is bounded, the existing concurrent SessionEnd `compressSession`+`autoPersona` pair stays safely under the 60s ceiling — the bound makes the *current* placement reliable, no new drain needed.)

**Family coverage (binding — cut-gate-16 §7 F-4).** All three verbs call `boundCompressionInput` before `backend.compress`: `compressSession`, `dailyDistill` (verified same unbounded shape today), `weeklyCurate`. The daily/weekly inputs are summaries-of-summaries, so the same recent-verbatim + cap generalizes (keep recent days/summaries, cap+summarize the older tail). One seam fixes all three.

**Rejected:** candidate (d) "raise/adapt the timeout" — used as a primary fix by zero of the 19 systems; it moves the latency cliff, doesn't remove it, and the spiral re-appears at the new threshold (claude-remember's 120s is the living proof — bigger budget, same unbounded shape). Also rejected: abolishing the buffer for mem0/claude-mem-style per-turn compression — the kit's offline batch rollup is a deliberate cost choice (cheap Haiku batch vs per-turn LLM cost), and the kit's *auto-extract* already IS the per-turn layer; `compress-session` is the batch layer, so we bound it, not delete it.

**Cross-references:** §8.5 (timeout/hook-ceiling composition — the budget this composes with), §8.2.2 (lazy-compress — the SessionStart roll, unchanged shape, now bounded input), §8.1 (SessionEnd pipeline + the D-42 concurrent budget — the bound makes the current placement reliable), §8.3 (`CompressorBackend` — the dumb transport the verbs wrap with `boundCompressionInput`, NOT where the policy lives), Task 84 (the faithfulness/grounding Hard Rules that partial-evict advances + the OpenHands shrink-retry note for D), Task 105 / D-75 (the unbounded-`now.md` class this re-instances), §7 (the ≤10 KB frozen snapshot — untouched, this is input-side only). _Implements: Task 161; the [19-system research note](../docs/research/2026-06-18-session-buffer-compaction-under-latency-growth.md); D-173. Product-design framing checked against the kit as a whole 2026-06-18 (the user's "according to our research AND our kit's own design, as a product")._

### 8.3 CompressorBackend interface (pluggable for v0.2)

v0.1 ships one implementation. Interface defined now for v0.2 forward-compatibility (ADR-0008):

```typescript
interface CompressorBackend {
  compress(opts: {
    input: string;
    maxOutputBytes: number;
    preserveCitationIds: boolean;
    instructions?: string;
    // Subprocess timeout (design §8.5). Caller-supplied; the
    // implementation MUST honor it by rejecting with a
    // HaikuTimeoutError on expiry. Default behavior when omitted
    // is no timeout (backwards-compatible for existing test
    // fixtures); production callers MUST pass an explicit value.
    timeoutMs?: number;
    // Grace window between SIGTERM and SIGKILL escalation in the
    // kill chain. Default 2000ms.
    killGraceMs?: number;
  }): Promise<CompressorResult>;

  modelId(): string;
  estimatedCostPerCall(inputBytes: number): number;
}

interface CompressorResult {
  outputText: string;
  inputTokens: number;
  outputTokens: number;
  costUSD: number;
  preservedIds: string[];
}

// Custom error class for timeout-path rejections — carries the
// `category: 'haiku_timeout'` field that callers route on (see §8.5).
class HaikuTimeoutError extends Error {
  category: 'haiku_timeout';
  timeoutMs: number;
}

// v0.1 implementation:
class HaikuViaAnthropicApi implements CompressorBackend {
  modelId() { return "claude-haiku-4-5-20251001"; }
  // ... invokes `claude --print --model haiku` via subprocess
}
```

v0.2 candidates per ADR-0008: `BedrockHaiku` (AWS), `LocalLlama` (air-gapped, KVzip-style). Backend selection via `cmk config set compressor.backend <id>`.

### 8.4 Compression prompt (preserves IDs and headings)

```text
You are a memory compressor for core-memory-kit. Output exactly the
following Markdown structure:

## Decisions
- <≤80 chars>. cites: [#P-XXXXXXXX, ...]

## Open Questions
- <≤80 chars>

## Active Threads
- <≤80 chars>

Hard rules:
1. Every bullet must be grounded in the INPUT below. Do not infer or guess
   any fact not explicitly stated. Do not carry forward earlier summaries.
   If unsure, omit it.
2. Preserve any citation ID matching /#[ULP]-[A-Z0-9]{6,8}/ verbatim.
3. Total output ≤ <maxOutputBytes> bytes.
4. If a section has no entries, omit the heading.
5. Never invent new IDs.

INPUT:
<the rolling-window transcript>
```

Section structure adapted from Anthropic Claude Code's verified 9-section auto-compact pattern (per leaked source). Trimmed to **3 sections** since we're compressing memory, not full sessions.

**Faithfulness/grounding rule (Task 84, 2026-06-02):** Hard rule #1 is a general anti-hallucination guard. live-test-6's R3 recall test surfaced the Haiku compressor **inventing a fact the buffer never contained** — it wrote *"Building Claude agent Flask application"* for a project that was always FastAPI, and kept a superseded early-stage file (`app.py` after the project moved to `app/main.py`). That hallucinated summary is injected at SessionStart, so the next session reads a snapshot that **contradicts** the (correct) granular fact memory → the agent distrusts memory and re-derives the answer, defeating the whole point of recall. The original Hard rules protected citation IDs (`never invent new IDs`) but said **nothing about content faithfulness** — nothing forbade emitting facts absent from the buffer. The fix is deliberately **example-free**: naming specific categories to preserve ("framework / port / path") would only guard the one scenario that surfaced it and re-anchor the model on those types (rejected per D-36 — The user: *"this will only work for that scenario … we are suppose to be working on a general solution"*). One general rule — *grounded in the input, never infer, never carry forward, omit if unsure* — covers every invented-fact class. The phrasing is also **domain-neutral** (no "code" assumption): the kit serves non-coding work too, so the rule and the recall instructions say "re-derive" / "from scratch", not "re-read the code". **The same rule is mirrored across all THREE compression layers** — `compress-session` (grounded in the session buffer), `daily-distill` and `weekly-curate` (grounded in the daily summaries). The third layer (`weekly-curate` → `archive.md`) was found by a full read-through of every LLM prompt, NOT by the live test — the live-test-6 Flask hallucination only exercised the first two layers, but the weekly consolidator has the same power to invent facts, so it gets the same guard (D-36: a grep-for-symptoms audit misses prompts phrased differently; read every guardrail in full). The remaining half of Task 84 — **stale-stage supersession** (the compressor refreshing rather than accumulating superseded state) — is tracked separately in Task 84(b).

**Original schema (pre-Task-83):** 4 sections — Decisions / Open Questions / **Files Touched** / Active Threads. **Task 83 (2026-06-02) dropped "Files Touched"**: the live-test-5 live test showed it accumulating as a file-write LOG across compressions (seven un-deduped `## Files Touched` blocks made up ~50% of the injected SessionStart snapshot, burying the persona). A log of file operations is transient, low-signal, and doesn't belong in durable working memory — it degraded recall (the model re-read code instead of trusting the noisy snapshot). Removed from both `compress-session` + `daily-distill` prompts. The other three sections carry the durable signal.

**Implements**: FR-19, FR-20, FR-21, ADR-0008.

### 8.5 Subprocess timeout policy + cleanup contract

**Tail-appended 2026-05-26** (Task 23.9 retroactive) after the post-PR-31 audit surfaced that `HaikuViaAnthropicApi.compress()` had no inner timeout — relying entirely on Claude Code's hook ceiling to kill a hung subprocess, which killed the parent WITHOUT running the catch + finally + log-write paths.

#### The composition gap

Two layers were nominally bounding the subprocess invocation:

1. **Outer ceiling** — Claude Code's hook timeout per [`plugin/hooks/hooks.json`](../plugin/hooks/hooks.json): Stop = 30s, SessionEnd = 60s, others smaller. When this fires, Claude Code SIGKILLs the parent process with no cooperative cleanup.
2. **Inner timeout** — *nothing*. `compress()` awaited `child.on('close', …)` indefinitely.

The composition was broken: if the subprocess hung, the parent waited until the outer ceiling killed it — at which point the in-process try/catch + finally + NDJSON log-write never ran. Concrete consequences observed in the diagnosis:

- Auto-extract (Stop hook, detached child): `auto-extract.lock` file stayed held until the detached node child was manually killed. Next Stop hook fire saw the held lock and returned `concurrent_run` forever.
- Compress-session (SessionEnd, in-process): no `compress.log` entry written, cooldown marker not touched. User had zero visibility that anything happened.

This is the **composition-verification rule** from CLAUDE.md — inner and outer bounds must compose. The class-1 audit (PR-A) found this is the only production-runtime spawn-call in the kit with the gap; [`packages/cli/src/capture-turn.mjs`](../packages/cli/src/capture-turn.mjs)'s detached node spawn is correctly fire-and-forget (cannot have a parent-side timeout) and relies on the inner timeout being honored by the spawned child via its OWN call to `HaikuViaAnthropicApi.compress`.

#### The contract

Every `CompressorBackend` implementation (HaikuViaAnthropicApi v0.1; BedrockHaiku / LocalLlama v0.2) MUST honor a caller-supplied `timeoutMs` parameter on `compress()`. On timeout, the implementation must:

1. **Send SIGTERM** to the subprocess.
2. **Wait `killGraceMs`** (default 2000ms) for graceful exit.
3. **Send SIGKILL** if still alive. Wait an additional 1s for the OS to deliver the `exit` event.
4. **Reject the Promise** with a `HaikuTimeoutError` carrying `category: 'haiku_timeout'` and the originally-supplied `timeoutMs`.
5. **Clean up** any subprocess-owned filesystem state (the MCP-config sandbox tempfile in HaikuViaAnthropicApi's case) regardless of timeout vs. clean-exit path.

The Promise-rejection happens IMMEDIATELY when the timer fires — the caller does not wait for the kill chain to complete. The kill chain runs in the background to clean up the OS-level subprocess.

The kill chain is exposed as `terminateSubprocess(child, { killGraceMs })` for separate testability — both the in-process kill-chain logic (mocked spawn that never closes) and the OS-level kill behavior (real-binary spawn-smoke against the `tests/fixtures/hang-forever.mjs` fixture) get pinned independently.

#### Caller-side timeoutMs values

Selected per the composition-verification rule: tight enough that the catch + finally + log-write all complete BEFORE the outer hook ceiling fires.

| Caller | timeoutMs | Outer hook ceiling | Headroom |
| --- | --- | --- | --- |
| [`runAutoExtract`](../packages/cli/src/auto-extract.mjs) (Stop hook → detached child) | 25,000 | 30s (Stop) | 5s for catch + finally + extract.log write + lock release |
| [`compressSession`](../packages/cli/src/compress-session.mjs) (SessionEnd, in-process) | 50,000 | 60s (SessionEnd) | 10s for catch + compress.log write + return path |
| [`autoPersona`](../packages/cli/src/auto-persona.mjs) (SessionEnd, `transcript` source) | 50,000 | 60s (SessionEnd) | runs CONCURRENTLY with `compressSession` under the one ceiling — see the Task 86b / D-42 composition below |
| [`runPersonaGenerate`](../packages/cli/src/subcommands.mjs) (CLI) + [`weeklyCurate`](../packages/cli/src/weekly-curate.mjs) — `autoPersona` (`facts` source) | 120,000 | **none** (one-shot CLI / cron child) | n/a — no outer ceiling, so the inner bound is the only constraint; sized generously for the whole-project facts sweep (heavier than a session summary). The composition rule cuts the OTHER way here: with no ceiling, a *too-tight* inner bound is the bug (Task 111 / F-2 / D-92) |

Headroom is sized generously because catch/finally on Windows can include filesystem operations whose latency varies with disk state. The 5s lower bound for the Stop hook path is the binding constraint — auto-extract has more cleanup work (lock file, sandbox tempfile, NDJSON write) than compress-session.

**The composition rule is two-sided (Task 111 / F-2):** an inner timeout must not EXCEED an outer hook ceiling (the SessionEnd rows — 50<60), but a caller with NO outer ceiling (the explicit `cmk persona generate`, the `weekly-curate` cron child) must not inherit a ceiling-sized bound either — 50s was sized for the 60s hook, and copying it to the ceiling-free CLI made the command fail on a real corpus. The ceiling-free `facts` callers get 120s. Independently, the `facts` corpus is byte-capped at `PERSONA_CORPUS_BYTES` (60KB, whole-facts-only) so even the generous bound can't run unbounded — the `transcript` source was already window-capped (`TRANSCRIPT_WINDOW_BYTES` = 40KB); Task 111 closed the same gap for the `facts` source.

#### Two Haiku calls under ONE ceiling — the SessionEnd composition (Task 86b / D-42)

**Tail-appended 2026-06-03.** Task 86b added a SECOND `claude --print` call inside the SessionEnd hook — the dedicated `autoPersona` classifier (D-41) runs alongside `compressSession`. Both carry the same 50,000ms inner `timeoutMs`. Naively chaining them is a **composition bug**: `50s + 50s = 100s` worst-case sequential wall-clock blows the 60s SessionEnd ceiling, so the OS SIGKILLs the parent mid-`autoPersona` — dropping `{"continue": true}` AND risking a half-written **user-tier** INDEX (HC-5 corruption, shared across every project). Each call is correct against the ceiling alone (50 < 60); only their sequential *composition* is broken — the same separately-correct-jointly-broken class this whole section exists for.

**Resolution: run them CONCURRENTLY, not sequentially.** [`session-end-tasks.mjs`](../packages/cli/src/session-end-tasks.mjs) `runSessionEndTasks()` fires both via `Promise.allSettled`, so the wall-clock is `max(50s, 50s) ≈ 50s` — back under the 60s ceiling with the same 10s headroom as the single-call case. This is safe because the two passes are **independent** (verified, not assumed):

| | `compressSession` | `autoPersona` |
| --- | --- | --- |
| Reads | `sessions/now.md` (session buffer) | `context/memory/*.md` fact corpus (written per-turn by auto-extract, NOT by compress) |
| Writes | `sessions/today-*.md`, `compress.log`, truncates `now.md` | user-tier scratchpads (USER/HABITS/LESSONS), `audit.log`, review queue |
| Locks | none on the persona tree | none on the session tree |

Disjoint inputs, disjoint outputs, no shared lock → no race. Each pass gets its OWN `HaikuViaAnthropicApi` instance (a `makeBackend` factory) so there is zero shared mutable state across the concurrent calls. `autoPersona` is invoked with `cooldownMs: 0` because the concurrent `compressSession` touches the shared 120s Haiku cooldown marker, which would otherwise gate persona out at SessionEnd. `allSettled` (not `all`) keeps both best-effort: a failure in one never discards the other's result and never rejects up into the hook (a thrown SessionEnd hook blocks the user from closing their terminal).

**Why concurrent-in-hook over the originally-planned detached spawn (D-41 → D-42 pivot):** a detached child would dodge the ceiling but (1) re-introduces the [Task 81](tasks.md) Windows console-flash class, (2) gives no completion guarantee before a cold-open in the next project — the persona must be on disk when project-B opens — and (3) adds an untestable detached-bin surface. Concurrency gets the ceiling-fit without any of those costs. Deterministic concurrency proof (event-ordering, not wall-clock) in [`tests/cli-session-end-tasks.test.js`](../tests/cli-session-end-tasks.test.js).

#### error_category disambiguation in logs

`extract.log` and `compress.log` entries now distinguish `haiku_timeout` from `haiku_failed`:

- **`haiku_failed`**: subprocess exited non-zero, or `spawn()` itself failed (ENOENT, EINVAL). Often actionable (flag rename, missing binary, auth failure).
- **`haiku_timeout`**: subprocess was alive but didn't return within `timeoutMs`. Usually transient (slow Anthropic API). Retries naturally on the next hook invocation.

Both are recorded in [`ERROR_CATEGORIES`](../packages/cli/src/result-shapes.mjs).

#### What this PR-A does NOT yet cover

The class-1 audit also surfaced a door-5 (observability) gap in [`capture-turn.mjs`](../packages/cli/src/capture-turn.mjs) — its `spawn-failed` catch returns a result struct but writes no log entry. Deferred to PR-D's broader observability sweep where the right log-surface design (new file? `phase` discriminator in extract.log? extension of audit.log purpose?) can be decided in context.

**Implements**: Task 23.9. Cross-references: §5.1 (hook ceilings), §6.1 (log schema with `haiku_timeout`), §8.3 (CompressorBackend interface gains `timeoutMs` parameter).

#### Detached children run in `tmpdir()`, never the working tree (Task 253c, 2026-07-28)

**The rule:** every `detached: true` + `unref()` spawn in the kit sets `cwd: tmpdir()`. A fire-and-forget child outlives its parent by design, and a live process holds an OS handle on its working directory — on Windows that handle blocks a later delete / move / rename of the directory it sits in. Pinning the cwd to the OS temp dir removes the kit's own children from that race entirely. Named technique borrowed from [obsidian-mind](../docs/research/2026-07-21-repo-obsidian-mind.md)'s detached re-index spawn (borrow candidate 6); it lands squarely on this project's documented Windows spawn-layer pain, of which the kit's own `EPERM`-at-teardown cleanups are an instance.

**Nothing depends on the inherited cwd — verified per site, both directions.** The project root travels by `argv` and/or `CMK_PROJECT_DIR`, and every path a child touches is absolute:

| Detached spawn site | Descriptor (the Door-3 seam) | How the child gets its root |
| --- | --- | --- |
| `capture-turn.mjs` → `cmk-auto-extract` (Stop hook) | `autoExtractSpawnDescriptor` | `CMK_PROJECT_DIR` env; both argv paths absolute |
| `inject-context.mjs` → `cmk-compress-lazy` (SessionStart, both branches incl. the `shell:true` corrupt-install fallback) | `lazyCompressSpawnDescriptor` | `CMK_PROJECT_DIR` env (`argv[2] ?? env ?? cwd` in the bin) |
| `cmk-precompact.mjs` (npm + plugin twins) → `cmk-precompact-worker` | `precompactWorkerSpawnDescriptor` | `argv[2]` **and** `CMK_PROJECT_DIR` env |

**The guard that makes it safe:** each child's last-resort root fallback is `process.cwd()`, so moving cwd to tmpdir *without* handing over a root would make it scaffold a memory tree in the temp dir. Every descriptor therefore pins tmpdir **only when a non-empty `projectRoot` is present** and otherwise inherits, exactly as before.

**Structural note:** the precompact shape moved OUT of the two bins into `precompact.mjs` as one shared descriptor. The npm and plugin bins are twins that each carried their own copy of the options object — which is how twins drift; a test now pins that both spawn through the shared descriptor. `validate-spawn-discipline` is unaffected: these are detached fire-and-forget sites and keep their documented `// spawn-discipline: ignore` markers.

### 8.6 Daily distill + cron registration architecture (Layer 6)

**Tail-appended 2026-05-28** during Task 33 implementation. The pipeline shape was already documented in §1.4 + §8.1 + FR-19; this section adds the implementation-level architecture: which modules, which API contracts, which scheduler primitives, and the Node-vs-Python language decision.

#### 8.6.1 `daily-distill.mjs` module

Public boundary:

```js
async dailyDistill({projectRoot, backend, now, cooldownMs?, maxOutputBytes?})
  → {action: 'distilled' | 'skipped' | 'error', ...}
```

Composition:

- **Reads**: walks `<projectRoot>/context/sessions/today-{YYYY-MM-DD}.md` for the last 7 days (filtered by date math against `now`, NOT mtime — robust to fs clock drift)
- **Sends to Haiku**: combined buffer through the `CompressorBackend` interface from §8.3 (same backend type that compress-session and auto-extract use; pluggable for v0.2)
- **Honors §8.2 cooldown**: routes through the shared [`cooldown.mjs`](../packages/cli/src/cooldown.mjs) module (Task 28 B2 split this out of `compress-session.mjs`); `isCooldownActive` gate before Haiku call, `touchCooldownMarker` after (success + error paths — fail-loud over re-cost)
- **Composes timeout**: passes `timeoutMs: 50_000` to backend.compress() per §8.5 — cron isn't under a Claude Code hook ceiling, but the inner timeout still prevents a hung Haiku from blocking the next cron tick
- **Writes**: `<projectRoot>/context/sessions/recent.md` (full overwrite — single-writer; atomic-rename hardening is a v0.1.x consideration if cron + `cmk roll` ever overlap)
- **Logs**: NDJSON to `<projectRoot>/context/sessions/{date}.distill.log` with the same schema family as compress.log / extract.log

#### 8.6.2 `register-crons.mjs` cross-platform shape

Per-platform mapping:

| Platform | Mechanism | Idempotency primitive |
| --- | --- | --- |
| Linux | `crontab` edit | `crontab -l \| (grep -v cmk-daily ; echo "0 23 * * * ...") \| crontab -` — the grep filter ensures the entry exists exactly once regardless of how many times the registration runs |
| macOS | launchd plist | Write `~/Library/LaunchAgents/com.cmk.daily-distill.plist` (overwrite-on-existing is idempotent), then `launchctl bootstrap gui/$UID <plist>` (or `bootout` + `bootstrap` for true re-load) |
| Windows | Task Scheduler | `schtasks /Create /TN cmk-daily-distill /SC DAILY /ST 23:00 /TR "node <path>" /F` — the `/F` flag forces overwrite if the task already exists |

`--dry-run` flag prints the platform-detected command without executing — used by tests + by users who want to inspect before granting host permissions.

`--unregister` flag removes the entry on each platform (`crontab -l | grep -v cmk-daily | crontab -`, `launchctl bootout` + `rm`, `schtasks /Delete /F`).

#### 8.6.3 Node-vs-Python language decision

Pre-2026-05-28 plan: `python scripts/register-crons.py`. Python was the assumed language because the predecessor product (claude-remember) used Python.

Pivoted to Node.js 2026-05-28 (the user + Claude joint decision). Rationale:

1. **No new toolchain**: the kit is already Node-only. Python means new install dep + new test infra (pytest) + new platform concerns (Python install paths differ across OSes).
2. **Existing kit pattern**: `register-crons` shells out to platform-native scheduler commands via `child_process.spawnSync`. The kit's other modules (compressor.mjs, capture-turn.mjs, auto-extract.mjs) already do this with shell:true on Windows for the `.cmd` shim case.
3. **Single-language deploy**: v0.1.0 ships as one npm package; `npm install -g @lh8ppl/core-memory-kit` is the whole install. Adding Python would force users to install Python too (or bundle it — much larger artifact).
4. **Test surface fits**: vitest tests can spawn the script with `--dry-run` and assert output. No pytest infrastructure needed.

The Python option is preserved in [`tasks.md`](../specs/tasks.md) Task 33.2 alongside the Node pivot so future contributors see the decision history.

#### 8.6.4 Composition with §8.2 cooldown + §16.13 audit-log rotation

- The 120s cooldown gate (§8.2) is shared with auto-extract + compress-session via `cooldown.mjs`. A `cron`-fired distill that happens to land within 120s of a hook-fired Haiku call legitimately skips with `skipped_reason: 'cooldown'` and retries on the next tick — same envelope as the SessionEnd cooldown semantics.
- §16.13 (audit-log rotation v0.1.x candidate) lives in `register-crons.mjs` as an additional registered job. v0.1.0 ships ONLY the daily distill; v0.1.x extends `register-crons` with the rotation job once the audit log accumulates enough entries to need it.

**Implements**: FR-19; Task 33 (Layer 6 daily distill cron). Cross-references: §1.4 (data flow includes Daily 23:00 cron), §8.1 (four-layer pipeline), §8.2 (cooldown), §8.5 (timeout composition), §16.13 (audit-log rotation v0.1.x).

### 8.7 Weekly curate architecture (Layer 6 — Task 34)

**Tail-appended 2026-05-28** during Task 34 implementation. Companion to §8.6 (daily distill); same architectural envelope, different cadence + responsibility.

#### 8.7.1 `weekly-curate.mjs` module

Public boundary:

```js
async weeklyCurate({projectRoot, backend, now, cooldownMs?, archiveMaxBytes?, recentMaxBytes?, skipRecentRebuild?})
  → {action: 'curated' | 'skipped' | 'error', archivedDays?, currentDays?, ...}
```

Responsibilities:

1. **Rotate**: move every `<projectRoot>/context/sessions/today-{YYYY-MM-DD}.md` with date < `now - 7 days` into `<projectRoot>/context/sessions/archive.md` (APPEND, not overwrite).
2. **Compress**: pass the OLD-files buffer to Haiku via the CompressorBackend interface (§8.3); prompt asks for `## Week of YYYY-MM-DD` (ISO Monday) section headers + bullet-level dedup hints.
3. **Dedup deterministically**: after Haiku returns, run a `canonicalize`-based pass that detects exact-after-canonical-equal bullets across days. Merge duplicates into a single bullet with an HTML-comment `<!-- merged_from: ['YYYY-MM-DD', ...] -->` appended (one comment per merged bullet). This is the v0.1.0 reading of "merge via task 10" — Task 10's `mergeFacts` is for per-fact files, not scratchpad bullets; the kit reuses the `canonicalize` + `generateId` primitive (Task 5's shared infrastructure that Task 10 itself uses) at the bullet text level. Looser semantic-similarity dedup remains Haiku's responsibility in the prompt.
4. **Delete**: remove the OLD `today-*.md` files. The in-repo memory model commits these files to git, so `git log` is the audit trail; no `.done.md` rename needed (the kit deliberately diverges from claude-remember's `.done.md` pattern, which existed because their `~/.claude-remember/` storage isn't git-tracked).
5. **Rebuild recent.md**: after archive update, call `dailyDistill({projectRoot, backend, now, cooldownMs: 0, ...})` inline to refresh `recent.md` from the CURRENT week's files only. `cooldownMs: 0` overrides the shared 120s gate because both Haiku calls belong to a single curate cycle, not two independent invocations. Skippable via `skipRecentRebuild` for tests.
6. **Audit + cooldown**: NDJSON entry to `<projectRoot>/context/sessions/{date}.curate.log` (same schema family as compress/extract/distill); touch `cooldown.mjs` marker on success + error.

Idempotency: a second run with no OLD files present returns `action: 'skipped', reason: 'no-old-files'` and does not re-touch archive.md. Tests pin this contract.

#### 8.7.2 Composition with daily-distill

Weekly-curate REUSES `dailyDistill()` rather than duplicating the recent.md rebuild logic — the same code path that runs nightly also runs as the post-archive step. The composition is:

- `dailyDistill(cooldownMs=120_000)` — nightly cron, gated by the shared cooldown
- `weeklyCurate()` → archive step (Haiku call #1) → `dailyDistill(cooldownMs=0)` (Haiku call #2, same cycle)
- Both touch the shared cooldown marker via `cooldown.mjs`

This composition was flagged as a v0.1.0 invariant to verify (Composition verification rule, CLAUDE.md): the inner dailyDistill call must NOT skip on the cooldown that the curate cycle's own archive step just touched. The `cooldownMs: 0` override handles this — explicit + tested.

#### 8.7.3 archive.md format

```markdown
## Week of 2026-05-18

- <consolidated bullet 1>
- <consolidated bullet 2 with merge>
  <!-- merged_from: ['2026-05-18', '2026-05-19', '2026-05-20'] -->

## Week of 2026-05-25
...
```

ISO week start = Monday. Bullets within a week appear in chronological source order. The `merged_from` comment is on its own line immediately following the bullet (matches the kit's existing 2-line bullet+comment convention from §4 / `provenance.mjs`).

#### 8.7.4 Cooldown table extension

§8.2's cooldown table already lists weekly-curate at 7d cron cadence. The 7d cadence is HOST-SCHEDULER-managed (cron / launchd / Task Scheduler); the kit's shared 120s Haiku cooldown applies to each Haiku call within the cycle, not to the cycle itself.

**Implements**: FR-19, FR-21; Task 34 (Layer 6 weekly curate). Cross-references: §1.4 (data flow includes Sun 09:00 cron), §8.1 (four-layer pipeline → archive.md), §8.2 (cooldown), §8.6 (daily-distill composition).

---

## 9. Search layer (Layer 5 — optional)

### 9.1 SQLite + FTS5 schema

Read-cache at `<repo>/context/.index/memory.db`. Regenerable; never source of truth (T1). Schema borrowed from claude-mem's module-segmented pattern (verified via their `src/services/sqlite/` listing — `Sessions.ts`, `Observations.ts`, `Timeline.ts`, `SessionStore.ts`, `PendingMessageStore.ts` as separate concerns).

```sql
CREATE TABLE observations (
  id TEXT PRIMARY KEY,               -- e.g. 'P-S79MJHFN'
  tier TEXT NOT NULL CHECK(tier IN ('U','P','L')),
  source_file TEXT NOT NULL,
  source_line INTEGER NOT NULL,
  source_sha1 TEXT NOT NULL,
  heading_path TEXT,                 -- 'MEMORY.md > Active Threads'
  body TEXT NOT NULL,
  write_source TEXT NOT NULL,
  trust TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  superseded_by TEXT REFERENCES observations(id),
  deleted_at INTEGER                 -- nullable; set when tombstoned (§6.5)
);

CREATE INDEX idx_observations_tier ON observations(tier);
CREATE INDEX idx_observations_trust ON observations(trust);
CREATE INDEX idx_observations_created_at ON observations(created_at);
CREATE INDEX idx_observations_deleted ON observations(deleted_at) WHERE deleted_at IS NOT NULL;

CREATE VIRTUAL TABLE observations_fts USING fts5(
  body, heading_path, write_source,
  content='observations',
  content_rowid='rowid',
  tokenize='porter unicode61'
);

-- FTS5 external-content sync triggers (sqlite.org/fts5 §4.4.3).
-- The standard "DELETE FROM fts WHERE rowid = old.rowid" trigger
-- does NOT work for external-content FTS5 (content='observations') —
-- FTS5 needs the deleted content to remove it from the index, but
-- the row is already gone by the time an AFTER DELETE trigger runs.
-- The 'delete' sentinel command lets the trigger pass the old
-- content explicitly so FTS5 can compute the delete without
-- re-reading the source row. UPDATE = delete-old + insert-new for
-- the same reason. Caught in Task 28 implementation against
-- better-sqlite3 12.x; design correction reflected here.
CREATE TRIGGER obs_after_insert AFTER INSERT ON observations BEGIN
  INSERT INTO observations_fts(rowid, body, heading_path, write_source)
  VALUES (new.rowid, new.body, new.heading_path, new.write_source);
END;
CREATE TRIGGER obs_after_update AFTER UPDATE ON observations BEGIN
  INSERT INTO observations_fts(observations_fts, rowid, body, heading_path, write_source)
  VALUES ('delete', old.rowid, old.body, old.heading_path, old.write_source);
  INSERT INTO observations_fts(rowid, body, heading_path, write_source)
  VALUES (new.rowid, new.body, new.heading_path, new.write_source);
END;
CREATE TRIGGER obs_after_delete AFTER DELETE ON observations BEGIN
  INSERT INTO observations_fts(observations_fts, rowid, body, heading_path, write_source)
  VALUES ('delete', old.rowid, old.body, old.heading_path, old.write_source);
END;

-- File-watcher checkpoint
CREATE TABLE files (
  path TEXT PRIMARY KEY,
  mtime INTEGER NOT NULL,
  sha1 TEXT NOT NULL,
  indexed_at INTEGER NOT NULL
);

PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
```

WAL mode allows many readers + one writer concurrently.

### 9.2 Reindex strategy (hybrid)

| Trigger | Strategy |
| --- | --- |
| Boot (`cmk reindex --boot`) | Walk markdown, compare mtime+sha1, re-index only changed files, **and prune index rows for source files that no longer exist** (Task 110) |
| Runtime (file-watcher) | `inotify`/`fswatch`/`chokidar` watches `context/`, debounce 500ms, re-index on FS event (`unlink` → drop that file's rows) |
| Recovery (`cmk reindex --full`) | Drop DB, rebuild from markdown |

> **Fingerprint algorithm (D-149).** The `files`-table diff key (column `sha1`, name kept for back-compat) is a **SHA-256** content fingerprint since the kit-wide migration — routed through the single `content-hash.mjs` `hashContent()` helper along with every other fingerprint site (provenance `source_sha1`, transcript-chunk dedup, conflict-merge keys). These digests are non-cryptographic (change-detection + dedup), not security primitives. **Upgrade behavior:** on the first boot after the algorithm change every existing checkpoint mismatches once and self-heals via this same "digest changed → re-index" path — no manual action, no data loss.

#### 9.2.1 Mutations auto-propagate to search — no manual reindex (Task 110 / F-7 / D-84)

The regular user never runs `cmk reindex` (D-85: the conversation is the interface; the CLI is Claude's substrate). So every mutation must reach `cmk search` automatically:

- **`boot` is a full sync (add / update / DELETE).** Earlier, `reindexBoot` only added/updated files that still existed — a fact `cmk forget` moved to `archive/tombstones/` left its observation rows behind, so the forgotten fact kept surfacing in `cmk search` until a manual `reindex --full`. `reindexBoot` now also **prunes orphans**: any `files`-checkpoint row whose source vanished is deleted along with its observations (the FTS5 delete trigger fires per row). Because **every** index reader (`cmk search`, `get`, `timeline`, `cite`, `recent-activity`) lazy-calls `reindexBoot` before reading, this makes the whole class — forget, queue-discard, supersede-archive, manual file deletion — self-heal on the next read with no command.
- **`forget` also reindexes in-band.** After tombstoning + scrubbing scratchpad bullets, `forget()` opens the project index and runs `reindexBoot` (orphan-pruning the just-unlinked file + re-reading the scrubbed scratchpads) so the index is correct the instant `forget` returns — not just on the next search. Both `cmk forget` (CLI) and `mk_forget` (MCP) call the same `forget()`, so both surfaces get it. Best-effort: the on-disk tombstone is authoritative, so an index error never fails the forget (the lazy path self-heals).
- **In-place edits + adds were never broken.** `cmk trust` rewrites the fact file (content change → mtime/sha1 diff → re-indexed); `cmk lessons promote` adds a user-tier file (picked up as a new source). These already self-heal via the existing lazy `reindexBoot`; only deletions needed the orphan-prune. (Locked by an audit test exercising the real `overrideTrust` → `reindexBoot` chain.)

**Boundary — forget vs. `--include-tombstoned` (§9.3):** the prune removes a forgotten fact's index row entirely (its source moved to `archive/tombstones/`, which is never walked by `listObservationSources`). So a forgotten fact does NOT reappear in `cmk search --include-tombstoned` — that flag surfaces rows whose `deleted_at` column is set *in the index*, which forget's move-to-archive doesn't feed. This is deliberate: "forget" means gone-from-search. The tombstoned content is still recoverable via `cmk get <id>` / `resolveFact` (which read the tombstone file directly, not the index), so the audit trail is preserved without keeping the fact searchable. (Before Task 110, forget left the row as a *live* observation — `deleted_at` null — so it surfaced in *default* search: the actual bug, not a working `--include-tombstoned`.)

**Deletion is a cascade, not a single op — the derived-surface half (Task 210 / D-308).** §9.2.1 makes the *index* self-heal on the next read; but a fact's content also lives in the **distilled summaries** (`recent.md`, `archive.md`, the banked per-day `today-*.distilled.md` artifacts), and a summary distilled *before* a forget still repeats the deleted content — the index cascade doesn't reach it. The Always-On agents survey (arXiv 2606.30306, 435 works coded) names **deletion propagation** the field's least-implemented invariant precisely here: "deletion is a cascade through the derivation graph, not a single operation." The kit closes it two ways. **Forward (write-time, `daily-distill`):** before a freshly-distilled day is banked AND again when `recent.md` is re-assembled, [`screenTombstonedContent`](../packages/cli/src/deletion-propagation.mjs) **span-replaces** an already-tombstoned fact's distinctive content or citation id with `[deleted]` (counted in the distill NDJSON log via `tombstone_dropped`, never silent; `tombstone_screen_truncated` when the archive exceeds the bound). Span-level, NOT whole-line — a distilled bullet routinely consolidates several facts, so dropping the line would take live facts + their citations with it (skill-review Blocking); the removed span is marked, the surrounding live content survives, mirroring Task 96 redact's scrub-the-span-keep-the-record posture. The assembly re-screen means a forget *after* a day was banked still propagates to `recent.md` on the next run. **Report (read-time, HC-12):** [`checkDeletionPropagation`](../packages/cli/src/deletion-propagation.mjs) verifies, for every tombstoned fact, that it's gone from the index AND from the existing DERIVED summaries (`recent.md`/`archive.md`/`today-*.distilled.md` — NOT the raw `today-*.md` session buffers, which are a source tier no scrub reaches and which age out via the roll), and FAILs naming the exact survivor's file + id (surface-aware recovery: `cmk reindex` for an index survival, `cmk redact`/a re-distill for a summary survival — the *scrub* of a legacy summary composes with Task 96's redact, deliberately report-first here rather than auto-editing distilled prose). A `[redacted: …]` marker (Task 96) is never used as a needle — it's boilerplate a batch scrub shares, so matching on it would false-flag every co-scrubbed fact. The check follows the survey's **AOEP two-sided discipline**: an obligation side (a forgotten fact is verifiably absent) AND a **negative-invariant** side (an empty history is LABELED vacuous, so a no-deletion system never reads as "verified"). Scope is the tombstone set on the P tier, bounded (`DEFAULT_MAX_FACTS`) with the truncation surfaced honestly on both exits — `consolidate()`'s hard-dropped L/M bullets leave no tombstone to check against, which is lifecycle-map **G2** (Task 91.2), a distinct write-side gap this check doesn't paper over.

#### 9.2.2 Same id in two source files → id-keyed write with archive-beats-scratchpad precedence (Bug 1 / D-165)

A single fact legitimately lives in **two** indexed source files at once: the hot `MEMORY.md` Active-Threads bullet (the working copy) AND its granular `context/memory/<type>_*.md` archive file — both carry the **same content-addressed id** (`cmk remember` dual-writes them). But `observations.id` is a global `PRIMARY KEY`. The original `replaceObservationsForFile` deleted by `source_file` then plain-`INSERT`ed, so when reindex processed the *second* source holding that id, the INSERT hit `UNIQUE constraint failed: observations.id` and aborted the **whole** reindex. (Self-inflicted by the kit's architecture: it's the only researched system that combined a rolling-window scratchpad with a stable-id per-fact archive — see the [2026-06-16 research note](../docs/research/2026-06-16-index-uniqueness-id-vs-file-scoped-delete.md); three markdown-first analogs — TencentDB, basic-memory, memweave — all key replacement on the id, never a composite `(id, file)` key.)

**The rule:** the write is keyed on the **id**, not the file, with deterministic precedence so the surviving row is independent of source walk order:

- A **`fact`**-kind source (the granular archive — the canonical Why/How home) does an explicit `DELETE FROM observations WHERE id = ?` **then** `INSERT` — it always wins the id, overwriting any scratchpad row already present.
- A **`scratchpad`**-kind source does `INSERT … ON CONFLICT(id) DO NOTHING` — it only lands when no row exists yet; it never overwrites a fact row.

Whichever source is walked first, the **archive** row is the one that survives, so `cmk get`/`cmk search` provenance deterministically points at the granular file (with its full Why/How), and a fact present in both places collapses to exactly one searchable row.

**FTS5 correctness (the self-review catch):** the fact path uses an **explicit DELETE-by-id**, NOT `INSERT OR REPLACE`. `observations_fts` is an external-content FTS5 table whose only safe delete is the `obs_after_delete` trigger firing the `'delete'` sentinel with the OLD row's column values (the external-content sync pattern documented at sqlite.org/fts5 section 4.4.3, implemented in `index-db.mjs`). `INSERT OR REPLACE` reuses the conflicting row's rowid, leaving the old scratchpad body **orphaned** in the FTS index (it keeps `MATCH`-ing with no backing observation — silent stale-hit corruption). The explicit DELETE fires the sentinel cleanly, then the plain INSERT re-indexes — the same delete-then-insert pattern every other kit writer uses against this table. Pinned by a Door-4 orphan-guard test (`MATCH 'scratchpad'` → 0, `ftsCount == obsCount`).

#### 9.2.3 Which scratchpads the indexer walks — EVERY canonical scratchpad, seeds excluded (Tasks 182 + 183 / D-247)

`listObservationSources` (and the runtime chokidar watcher) enumerate the search-index source files. Two rules, both fixed in v0.4.3 after the cold-open exposed them:

- **Every canonical scratchpad per tier is a source, not just `MEMORY.md` (Task 182).** The walker iterates **`SCRATCHPADS_BY_TIER[tier]`** — the same allow-list the writer/cap layer uses (`P: {SOUL.md, MEMORY.md}`, `L: {machine-paths.md, overrides.md}`, `U: {USER.md, HABITS.md, LESSONS.md}`). Before this it hardcoded `<tier>/MEMORY.md`, so the project-tier `SOUL.md` and the **entire user-tier persona** (`USER`/`HABITS`/`LESSONS.md` — where `cmk lessons promote` writes) were **never indexed**: a promoted persona rule was injected but **unsearchable**, even in the same session (the index source and the promote target didn't overlap). The bug hid because same-project search still found the *original* project-tier fact; only a fresh project's `cmk search` (the Session-3 cold-open) — where the persona is the sole cross-project copy — exposed it. **The watcher and the source-list must stay in lockstep** (both iterate `SCRATCHPADS_BY_TIER`) or a live `lessons promote` into `HABITS.md` would be indexed on full reindex but not watched (the caller-map-rule composition gap). _Consequence — the local tier (`machine-paths.md`/`overrides.md`) is now searchable in-project too (review finding I1, ACCEPTED): local is a co-equal fillable tier, a real machine-path fact SHOULD be findable (own data, never leaves the machine), and a fresh local tier stays clean via the seed filter below._
- **Scaffold `(example)` seed bullets are NOT indexed (Task 183).** Every scaffolded placeholder bullet carries the **all-zero content sha1** sentinel (`SEED_SENTINEL_SHA1`; real facts always have a real hash). The scratchpad parser skips them via the shared `isSeedProvenance` (provenance.mjs) — else a fresh install's `cmk search` would return only misleading placeholders (the "deprecate /api/v1" example). Mirrors the inject path's existing seed filter; the two agree on the sha1 sentinel (unifying inject's broader `OR (example)-text` check is a deferred v0.4.x follow-up). _Live-proven on a fresh 0.4.3 install: the cold-open's first `mk_search` returned 12 real `U/`-tier persona facts, 0 example bullets._

### 9.3 Hybrid search (`cmk search`)

```text
cmk search "<query>" [--mode keyword|semantic|hybrid] [--min-trust low|medium|high]
                     [--tier U|P|L] [--since YYYY-MM-DD] [--limit N]
                     [--include-tombstoned]    # default: exclude deleted
```

Two backends:

- **Keyword (always available)**: FTS5 BM25. ~100ms for 10k bullets.
- **Semantic (optional, Layer 5b — SHIPPED, Task 65/ADR-0015)**: sqlite-vec inside the kit's index + a local ONNX embedder (`Xenova/bge-base-en-v1.5`, optional `@huggingface/transformers` install). Sub-second after the one-time model warm-up.
- **Hybrid (default when both available)**: reciprocal-rank fusion (0.5 keyword, 0.5 semantic).

Returns: `[{id, snippet, source_file, source_line, tier, trust, date, heading, score}]`. Trust visible so users can filter via `--min-trust`. Tier visible so MCP-tool callers can route on tier without re-querying. `source_file` + `source_line` are separate fields (not a colon-joined string) so callers don't need to split; the kit's existing `${file}:${line}` formatter (used in `cmk` CLI output) composes both on display. **`date` + `heading` (Task 227, D-326):** every hit carries the WHEN + WHERE halves of a complete citation — facts derive `date` from `created_at` and expose their `heading_path`; transcript-scope hits derive `date` from the day-file name (undated files like `recent.md` carry null — their sections have their own date headings). The CLI prints the date as its own column; recall answers can say "decided 2026-06-20".

**Ranking learns (Task 194, v0.5.3):** the facts-scope keyword rank is a **confidence-gated trust blend** — `bm25 × (1 + λ·(trust_score − 0.5))`, applied only when the fact carries ≥ 3 applied outcome signals; judgments never blend; hybrid inherits via RRF; inject is untouched. Full mechanics + rationale: §20.7 (+ the §20.3 amendment).

**The query STATE-VIEW gate (Task 211, v0.5.3 — A-TMA's retrieval-level mechanism; the §16.18 4-view cut):** a rule-based classifier (`query-state-view.mjs` — hint catalogs + negation guard, zero LLM) tags each facts-scope query current/historical/transition/neutral. Historical/transition auto-include expired rows (no flag — a history question must reach the history) and strip the consumed hint words from the FTS query; historical buckets the labeled rows FIRST (a stable deterministic partition — composes with, never touches, the Task-194 blend); current/neutral are byte-identical to the pre-211 pipeline (including a caller's explicit `--include-expired`). The detected view rides the envelope (`state_view` + a one-line note) only when it changed retrieval. `--state-view`/`state_view` are overrides only.

**Results carry their temporal STATE (Task 209, v0.5.3 — A-TMA's QA-level mechanism, arXiv 2607.01935):** a non-current row gains a `state` field (`superseded` / `expired` / `retracted`) projected DETERMINISTICALLY from already-known metadata (`superseded_by` / `expires_at` / `deleted_at` — `state-label.mjs::projectStateLabel`, pure, no LLM), and a fixed label prefixes the CLI snippet; a one-line reading instruction ("unlabeled = current…") rides the envelope ONLY when a labeled row is present. Same projection on `cmk get`/`mk_get` (shared read-core) and on the SNAPSHOT (a scratchpad bullet whose provenance carries `superseded_by:` injects with the `[superseded — kept for history]` prefix — pure string scan before the provenance strip, no DB on the hot path). LABELS, never RE-RANKS (§20.3 intact); the common case (current) stays unlabeled — zero noise, byte-identical snapshots when nothing is stateful. A-TMA's Case Study 1 is the evidence: identical retrieved evidence flips from wrong to correct answer on labels + the instruction alone. The bank/retrieval/QA failure taxonomy lives in HEALTH-CHECKS.md ("When recall goes wrong").

**Implements**: FR-16, FR-17, FR-18, FR-30, NFR-9.

#### 9.3.1 Layer 5b backend — RESOLVED 2026-06-10 (ADR-0015): sqlite-vec + optional local ONNX embedder

> **RESOLUTION (Task 65, [ADR-0015](../docs/adr/0015-semantic-backend-sqlite-vec-plus-local-onnx-embedder.md), D-109):** the bake-off ran on the Task-99 benchmark and the decision is **`sqlite-vec` inside the kit's existing SQLite index + `Xenova/bge-base-en-v1.5` via the OPTIONAL `@huggingface/transformers` embedder** — R@5 **0.941** / paraphrase **1.000** vs the 0.529/0.300 agentic-keyword bar; bge-m3 (5× the weight) measured WORSE (0.765). Implementation: [`semantic-backend.mjs`](../packages/cli/src/semantic-backend.mjs) — content-addressed embedding cache, model-derived dims, sync `semanticBackend` seam preserved (the async boundary lives in `prepareSemanticBackend`). The embedder stays optional (~258 MB with onnxruntime): absent → actionable hint, keyword unaffected; `CMK_DISABLE_SEMANTIC=1` force-disables; Task 46 ships the install opt-in. The deferral analysis below is preserved as the decision trail.
>
> **Embed batching (P-5VJJUEES, 2026-07-07 — memory bound).** `syncSemanticIndex` embeds uncached bodies through `planEmbedBatches`, which bounds each ONNX forward pass by BOTH item-count (`EMBED_BATCH_SIZE=16`) AND total chars (`EMBED_BATCH_CHARS=8000`), and hard-truncates any single over-budget body. transformers.js pads a batch to its longest sequence and allocates the attention tensor (`batch × maxSeqLen²`) off-heap, so an unbounded batch over a large corpus with a long fact allocated ~9 GB in one call (froze a machine twice). A count-mismatch fails closed (→ FTS); empty bodies are skipped. Companion: the `syncIndex` seam on `prepareSemanticBackend` — a hot loop (temporalSweep's per-fact finder) syncs the index ONCE, then passes `syncIndex:false` to embed only the per-fact query, turning O(corpus)-per-fact into O(corpus)-once + O(query)-per-fact. Bodies have no upstream length cap, so both bounds are load-bearing (the old "≤1500 by construction" assumption is false — the dogfood corpus has a 5157-char fact).
>
> **Original pick:** `memsearch + Milvus` (the §9.3 "Semantic" line above). **Status (historical): reconsider before any Layer-5b build.**
>
> **Update (Task 120, v0.2.4):** the premature `memsearch + Milvus` *scaffolding* — doctor HC-1/HC-7, the `milvus-deploy` template files, the nightly-index cron, and the "install memsearch" SETUP docs — was **REMOVED**. It shipped and showed up in `cmk doctor`, wrongly implying the kit used a backend it never did. **The deferral below STANDS** (no backend chosen yet); the `semanticBackend` DI seam + `reciprocalRankFusion` are KEPT as the drop-in point. Task 120 removed the dead scaffolding, not the open decision.
>
> Two independent evidence sources now argue `memsearch + Milvus` is the **wrong weight class** for what the kit is (single-user, local, per-project markdown):
> 1. **the user's personal-wiki search decision record** (`C:/Projects/personal-wiki/docs/search-architecture.md`, 2026-05-31) — same profile as the kit; explicitly **rejected Milvus as "overkill for <10K docs, requires a server"** and chose **Chroma** (pure-Python, embedded, metadata filtering) for filtered-semantic + kept **qmd** (Node, MCP-native, GGUF embeddinggemma) for pure-semantic.
> 2. **Our own research base** ([`docs/research/2026-05-21-claude-ai-deep-research-option-b.md`](../docs/research/2026-05-21-claude-ai-deep-research-option-b.md)) — the markdown-memory consensus is **SQLite FTS5** (claude-mem, Noema, knowledge-base-server). Projects that add semantic split into **light embedded** (`sqlite-vec` / sqliteai's `sqlite-memory` = hybrid vector+FTS5 in ONE SQLite extension, local llama.cpp embeddings) vs **heavy server** (memsearch+Milvus). `doobidoo/mcp-memory-service` offers SQLite-vec OR Milvus as a *choice*.
>
> This also collides with the kit's hardened **node-only / no-server ethos** (Task 62 — D-23): bolting Milvus (Docker/K8s) back on for search would reintroduce exactly the heavyweight platform dependency we just removed.
>
> **Candidate shortlist, lightest → heaviest:**
> 1. **`sqlite-vec`** — vector similarity *inside the kit's existing SQLite index*; no server, no second process; hybrid FTS5+vector in one place (sqlite-memory pattern). **Best architectural fit** (we already run SQLite). Cost: a local embedding model (sentence-transformers / a small GGUF; **note — Anthropic has NO embeddings API**, so Claude can't supply vectors).
> 2. **`qmd`** (Node, markdown-native, MCP-native, zero-server) — easiest bolt-on (register its own MCP server, or wire behind the `semanticBackend` seam in [`search.mjs`](../packages/cli/src/search.mjs)). Cost: separate index + **file/chunk granularity ≠ our per-bullet granularity**; ~1.6 GB model.
> 3. **Chroma** (pure-Python, embedded, filtering) — but Python dep + separate index; our FTS5 already does the metadata filtering Chroma's filtering would add, so we need *less* than the wiki did.
> 4. **memsearch + Milvus** (the original pick) — most "designed-for-agent-memory" but needs a server; the outlier in weight.
>
> **Decision deferred to Layer-5b build (post-v0.2, post-friend-validation).** Recommended evaluation: a **bake-off** — ~30–50 memory-shaped facts + ~10 queries (incl. synonym/paraphrase queries where keyword *should* miss and semantic *should* hit), indexed into FTS5 + sqlite-vec + qmd + Chroma; compare recall@5 + latency. The kit already exposes the `semanticBackend` DI seam + `reciprocalRankFusion`, so any winner drops in without re-plumbing. See DECISION-LOG (2026-05-31 search thread).

---

### 9.4 The recall ladder + the expand rung (`cmk expand` / `mk_expand` — Task 226, D-326; shipped v0.6.0)

The recall LADDER is the tiered discipline the memory-search skill enforces: **index search →
expand → (timeline) → full bodies → last-resort transcript drill**, stop at the shallowest rung
that answers. Task 226 built the middle rung the ladder implied but lacked: **expand** returns a
hit's SOURCE-FILE neighborhood — the enclosing heading section (sibling bullets, the surrounding
day-file entry) — where `mk_timeline` returns created_at-adjacent observations (a different axis:
file-adjacent vs time-adjacent).

Mechanism (`read-core.mjs::expandObservation`, shared CLI/MCP per ADR-0014): accepts BOTH hit-id
shapes the search surface returns — a fact/scratchpad observation id (row lookup → `source_file` +
`source_line`, tier-aware base-dir resolution with a traversal guard) and a transcript-chunk id
(`T:<file>:<line>`, parsed directly). Reads the source file, extracts the enclosing heading
section (nearest heading at-or-above the anchor line, down to the next same-or-higher-level
heading), and bounds it to **`EXPAND_MAX_CHARS` = 4000** — an oversized section returns a
line-aligned window grown outward from the anchor, flagged `truncated`, hard-clamped even when a
single anchor line exceeds the cap (at-cap/over-cap test pair in tests/cli-expand.test.js).
Transcript-chunk anchors sit on their section's HEADING line (chunkTranscript stamps every window
of a section with the heading line), so a T:-id expansion is head-anchored by construction.
Read-only. **The unscreened-surface boundary is ENFORCED, not descriptive** (the skill-review's
Blocking find, D-356): a T: id is free-form model-suppliable input, and "never indexed" alone
would not stop a crafted path at `context/.locks/redactions.log` (every redaction's plaintext
original), the raw `imported/` floor, `*.live.md`, or `now.md` — all inside the traversal guard's
base. The T: branch therefore gates on the transcript-chunk INDEX (`SELECT 1 FROM
transcript_chunks WHERE source_file = ?`): only a source the indexer actually indexed is
expandable, and transcript-index.mjs's exclusion set is exactly the unscreened surface (§22.1 /
design §6.10; regression-locked with planted-secret fixtures). Registered as the 12th MCP tool
(`mk_expand`), Kiro-auto-approved, parity-mapped to `cmk expand`.

### 9.5 The relational axis — `edges` table + `cmk links` / `mk_links` (Task 232, ADR-0023 ACTIVATE slice; D-392)

The **fourth adjacency axis** beside `expand` (source-file), `timeline` (created_at), and
`--scope decisions` (evolution): **relational**. The kit already WROTE two edge kinds it never
traversed — `related:` frontmatter (+ `[[slug]]` body wikilinks) and the `superseded_by` FK — so
backlinks ("what points AT this fact") and supersession chains ("what replaced what, in order")
were genuinely unanswerable, and the model had no reinforcement loop to write MORE edges (a
write-only capability). Task 232 ACTIVATES them; the DEFER/REJECT halves of ADR-0023 (LLM edge
derivation, graph-DB / typed-KG shapes) stay out of scope behind their named triggers.

**The `edges` table** (`index-db.mjs` schema, populated by [`graph-index.mjs`](../packages/cli/src/graph-index.mjs)::`rebuildEdges`):
`edges(src, dst, type, dst_resolved)` — `type` ∈ `related` (frontmatter) | `link` (`[[slug]]`
body wikilink) | `superseded_by` (the supersession FK) | `cites` (a body anchor citation —
§9.5.1). `src` is always a kit id; `dst` is the
target's id when a `related`/`link` slug resolves against the corpus slug→id map, else the raw
slug with `dst_resolved = 0` (a dangling link stays visible on the `out` side without polluting
backlink-by-id queries). **Rebuilt from the markdown exactly like the FTS mirror** (ADR-0002 —
markdown stays the only source of truth): a full reindex drops + rebuilds it byte-stable, a boot
reindex refreshes it when any fact changed (or once, lazily, to migrate a pre-232 index). Zero
LLM, zero drift, no third index class. **Wholesale rebuild, not incremental** — slug resolution
is cross-file (a new fact can resolve a link another fact wrote earlier), so a per-file update
could leave a stale dangling flag. `superseded_by` edges come from BOTH the indexed
`observations.superseded_by` column AND the `archive/superseded/<id>.md` files (a superseded fact
is MOVED there, taking its backward pointer out of the top-level walk — without reading those the
chain is unwalkable, since the live successor carries no backward pointer). The
`~30-line D-nnn/Task-nnn co-occurrence byproduct` the ADR floated was **skipped** (D-392): a fact↔fact
co-occurrence over a shared anchor is O(n²) within an anchor group (50 facts on one D-nnn → 1,225
edges), past "clean + deterministic ~30 lines", and FTS exact-token search already answers "what
else mentions D-109" perfectly (D-107) — so the edge type would add cost without adding an
answer flat search lacks.

**The query surface** (`read-core.mjs::buildLinks`, shared CLI/MCP per ADR-0014 —
`cmk links <id> [--depth N --direction in|out|both]` + `mk_links`, the 13th MCP tool,
Kiro-auto-approved, parity-mapped): out-links + backlinks via a depth-bounded recursive CTE over
`edges`, and the **supersession chain** via a second recursive CTE walked in BOTH directions over
`superseded_by` (returned oldest→newest, `null` unless the fact actually participates). `related`
is now also surfaced on `mk_get`/`cmk get` output (the depth-1 out-neighbourhood — invisible
pre-232). And the Task-209 superseded state label is upgraded to NAME its successor —
`[superseded by P-XXXX]` (`state-label.mjs::stateLabelText`), on `cmk search` output and the
injected snapshot alike — so a reader walks straight to the current fact.

#### 9.5.1 Anchor co-citation edges — the `cites` type (Task 256, ADR-0023 ACTIVATE slice; D-400)

**Original plan (pre-2026-07-23, D-392):** the `~30-line D-nnn/Task-nnn co-occurrence byproduct`
the ADR floated was **skipped** — a fact↔fact co-occurrence over a shared anchor is O(n²) within an
anchor group (50 facts on one D-nnn → 1,225 edges), past "clean + deterministic ~30 lines" (the
skip paragraph above stands as the decision trail).

**Revisit 2026-07-23 (D-400), with new evidence:** the user's live finding that the Obsidian vault
graph (§9.6) underwhelms — because only ~5% of facts carry `related:`, while fact BODIES densely
cite the structured anchors the kit itself defines (`D-nnn`, `Task nnn`, `ADR-nnnn`, `FR-nn`/`NFR-nn`,
and bare `[PUL]-XXXXXXXX` fact ids) and nothing parsed that lattice. The 232 skip does **not** bind
because 256's shape is the **CAPPED STAR**, not all-pairs: each anchor is ONE hub node, each citing
fact ONE spoke, so a 50-fact group costs 50 edges (linear) — answering 232's O(n²) objection rather
than overruling it. Still the deterministic ADOPT shape (parsed from markdown, byte-stable rebuild,
zero LLM); the DEFER slice (LLM derivation) is untouched behind its benchmark trigger.

**The `cites` edges** ([`graph-index.mjs`](../packages/cli/src/graph-index.mjs)::`extractAnchors` +
`computeCitations`, emitted inside `rebuildEdges`). Code fences + inline code are stripped first
(`stripCode`) so a literal `D-361` example never mints an edge. Boundary-correct: `D-361x` (glued
suffix) does NOT match; `Task 232's` (possessive) DOES. Two node kinds share the type, disambiguated
by an `anchor:` prefix:

- a **doc-anchor** (D/Task/ADR/FR/NFR) is a NON-FILE node → `dst = anchor:D-361`, `dst_resolved = 0`.
  The prefix keeps it unambiguously distinct from a fact id in `cmk links` output and keeps
  backlink-by-id queries (`dst_resolved = 1`) from ever matching it.
- a cited **fact id** is a real node → `dst =` the bare id, `dst_resolved = 1` when that fact exists
  in the corpus, else `0` (a direct fact→fact edge, exactly like a `link`).

**Two noise guards, on the doc-anchor hubs ONLY** (a fact-id citation is a direct edge — always
relational signal, never a corpus-wide stopword — so it is exempt from both; named constants in
`graph-index.mjs`):

- `MIN_ANCHOR_CITERS = 2` — a doc-anchor cited by fewer distinct facts forms no co-citation cluster
  (a lone leaf that clutters the graph without densifying it); skipped.
- `ANCHOR_DF_CEILING_RATIO = 0.5` — a doc-anchor cited by MORE than this fraction of the whole corpus
  is a degenerate stopword hub; skipped (the obsidian-mind cluster-detector precedent: a token in
  >half the corpus is noise). The effective ceiling is `Math.max(MIN_ANCHOR_CITERS, floor(N × 0.5))` —
  behavior-identical for N ≥ 4 (the floor is already ≥ 2) but it un-breaks a 2-or-3-fact corpus, where
  `floor(N × 0.5) = 1 < 2` would otherwise make `df ≥ 2 && df ≤ 1` vacuously false and forbid ALL
  doc-anchor edges. Boundary tests pin both at/over their thresholds (validate-budget-pairs), incl.
  the N = 2/3/4 corpus sizes.

**Extraction covers the corpus's real citation shapes, not just the bare singular** (review finding):
the plural `Tasks 28-35` and range `Task 28-35` forms emit their **endpoints only** (`Task-28` +
`Task-35` — the interior isn't literally cited, so expanding it would fabricate edges); the
slash-continuation shorthand `FR-28/29/30` emits `FR-28`/`FR-29`/`FR-30` (bare trailing numbers
inherit the prefix); and `D-40/D-153` (each part carrying its own prefix) yields both via a re-scan.
Negatives still reject: `v0.6.3`, `D-361x` (glued suffix).

**The links / get asymmetry is deliberate.** A fact's `cites` edges ARE surfaced by `cmk links`
(`--direction out` lists a fact's out-neighbourhood, including its `anchor:` cites nodes — `links` is
the graph surface) but are NOT surfaced in `cmk get`/`mk_get`'s `related` list (`relatedRefsFor`
filters `type IN ('related','link')` only — `get` stays the clean fact-content surface). Anchor
citations are graph structure, not fact metadata.

**Query + render:** `cmk links D-361` / `mk_links {id:"D-361"}` answers "what cites D-361" in one
call — `buildLinks` normalizes an anchor token (or fact id) to its node via `anchorNodeForToken`,
returns the citers as backlinks (an anchor is a graph sink → `out` empty). A bad token gets the
schema-error shape, never a crash. `MAP.md` (§9.6) gains a `## Cited anchors` section rendering each
qualifying anchor as a browsable hub (`- **D-361** ← [[fact_a]], [[fact_b]]`), built from the SAME
`computeCitations` the edges table uses (map + queryable graph never drift), byte-stable
(`compareCodeUnits`, never `localeCompare`).

### 9.6 The Obsidian vault view — a generated map note + forward id aliases (Task 254; D-397 companion to Task 255)

The memory tier is already markdown + frontmatter, so Obsidian opens `context/memory/` as a
vault (search, backlinks, graph) for free. What does NOT resolve on its own: the kit's own edges.
Fact files are `<type>_<slug>.md`, but the edges the kit writes reference the bare `<slug>`
(`related:`, `[[slug]]` body links) or an id (`superseded_by`) — none of which Obsidian resolves
to a `<type>_<slug>.md` file. Two zero-migration touches bridge that **without rewriting any of the
~2,000 committed fact files** (the Task 254 hard constraint — a mass rewrite is a migration with
guardrail implications, deliberately out of scope):

1. **`MAP.md` — a generated vault map note** ([`vault-map.mjs`](../packages/cli/src/vault-map.mjs)::`buildVaultMap`,
   written by [`reindex.mjs`](../packages/cli/src/reindex.mjs) beside `INDEX.md`). It renders every
   fact as a resolvable `[[<type>_<slug>]]` wikilink (the filename basename Obsidian DOES resolve),
   grouped by type, with each fact's relation set (`related:` ∪ body `[[slug]]`, resolved slug→
   filename — the SAME union `graph-index.mjs` surfaces) and its supersession (`superseded_by` id →
   live successor filename, else the bare `[[id]]`) rendered as links. This lights up the WHOLE
   corpus graph — including facts written long before Obsidian was installed — from one generated
   note, a **pure EXPORT-FORMAT over the same markdown reindex already walks** (no new logic, no DB,
   zero LLM). Built from reindex's existing per-tier walk (no second file read), best-effort (a
   map-render hiccup never fails the reindex that a capture depends on), and **byte-stable** (two
   rebuilds over the same corpus are identical — clean diffs, exactly like `INDEX.md`).
   `MAP.md` joins `INDEX.md` in [`fact-store.mjs`](../packages/cli/src/fact-store.mjs)'s
   `listMarkdownFiles` default exclude, so no fact walk mistakes it for a fact.
2. **Forward-only id aliases** ([`write-fact.mjs`](../packages/cli/src/write-fact.mjs)): every NEW
   fact carries `aliases: [<id>]`, so an `[[P-XXXX]]` id reference (the kit's cross-reference
   currency — fact bodies, `superseded_by`, the map) resolves to its file in Obsidian. Purely
   additive frontmatter; no kit reader consumes `aliases`.

**Committed, like `INDEX.md`** (the precedent — a human-browsable derived view that travels with the
repo so a teammate opens the vault graph-lit on clone), not gitignored like `.index/` — a deliberate
call flagged for ratification (the churn/size class is identical to the already-committed `INDEX.md`;
markdown stays the only source of truth either way per ADR-0002, so a gitignore flip is a one-liner
if the churn is judged not worth the travels-with-clone win). **Committed vs. own-viewer scope:** the
map is the CHEAP companion (D-397) — it tests whether users look at their memory; the kit-specific
rendering Obsidian can't do (trust tiers, supersession semantics, doctor status, conflict queues,
the recall fire-rate) is Task 255's own viewer. **`related` wikilink-property export (shape b) was
NOT adopted** — it would couple the Obsidian export format into `graph-index.relatedSlugs` (an
edges-table-parser touch) and depends on Obsidian 1.4+ property-link behavior not verifiable against
primary source in-sandbox; the map already renders `related` as links without that risk.

## 10. MCP server (Layer 4b — optional)

**Eleven tools as of Task 108b (2026-06-08, [ADR-0014](../docs/adr/0014-unify-cli-mcp-shared-core.md)).** The MCP surface now reaches **full parity** with the `cmk` CLI over shared cores (`remember-core.mjs` / `read-core.mjs`); a `validate-cli-mcp-parity` guard ([`scripts/validate-cli-mcp-parity.mjs`](../scripts/validate-cli-mcp-parity.mjs), wired into `npm test`) fails the build on drift. `cmk install` registers the server in `.mcp.json` + allowlists `mcp__cmk__*`, so the model drives every memory op prompt-free (D-85; R2/D-80 resolved — see §16.57).

_Read / capture (the original six — FR-26 + `recent_activity` from Basic Memory's verified surface):_

| Tool | Purpose | Response size |
| --- | --- | --- |
| `mk_search(query, mode?, tier?, since?, limit?, min_trust?)` | BM25 + optional vector hybrid | ~50-100 tokens/result |
| `mk_get(ids[])` | Full body + provenance + relations | ~500-1000 tokens/result |
| `mk_timeline(anchor, depth_before?, depth_after?)` | Sequential context around an ID or timestamp | varies |
| `mk_links(id, depth?, direction?)` | Relational adjacency — backlinks, out-links, supersession chain (Task 232) | varies |
| `mk_cite(id)` | Canonical Markdown citation link `[#P-S79MJHFN](memkit://obs/P-S79MJHFN)` | trivial |
| `mk_remember(text, why?, how?, type?, title?, links?, tier?, cites?)` | Explicit save — a rich Why/How fact file when `why`/`how`/`title`/`type` are given (shared `rememberRich` core), else a terse bullet | `{id, written_to, accepted}` |
| `mk_recent_activity(window?: "1h"\|"24h"\|"7d", limit?)` | Recent memory mutations | List of recent observation changes |

_Mutate (added in 108b — confirm-token on the destructive op):_

| Tool | Purpose | Notes |
| --- | --- | --- |
| `mk_trust(id, level)` | Override a fact's trust (low/medium/high) | reversible; audited |
| `mk_lessons_promote(id, to?)` | Promote a project-tier fact to the user tier | sanitized + secret-screened + audited |
| `mk_forget(id, reason?, confirm?)` | Tombstone a fact | **DESTRUCTIVE → two-step**: first call previews + returns a content-derived `confirm_token` (sha256(id+body) prefix); a second call with that token executes |
| `mk_queue_list(queue?)` | List pending review / conflict entries | **pure read** (does not rewrite the queue) |
| `mk_queue_resolve(queue, id, action)` | Resolve one queued entry by id | review: `promote`/`discard`; conflicts: `keep-old`/`keep-new` (merge-both → `cmk queue conflicts`) |

Every MCP tool has a matching `cmk` verb and vice-versa (the CLI gained `get`/`timeline`/`cite`/`recent-activity` in 108b); the guard enforces the symmetry.

### 10.1 Transport — stdio (per MCP spec)

Per [MCP 2025-06-18 transport spec](https://modelcontextprotocol.io/specification/2025-06-18/basic/transports): *"Clients SHOULD support stdio whenever possible."* For a local memory tool that runs as a subprocess of Claude Code, **stdio is the correct standard** and what every comparable project does (claude-mem, Basic Memory, Hermes, Cursor's design).

```text
Claude Code (client)                 cmk-mcp (server subprocess)
       │                                       │
       ├─ spawn `cmk mcp serve` ───────────────►
       │                                       │
       ├─ write JSON-RPC ──► stdin ────────────►
       │                                       │
       ◄─────────── stdout ◄── write JSON-RPC ─┤
       │                                       │
       ◄─────────── stderr ◄── optional logs ──┤
       │                                       │
       └─ close stdin, terminate ──────────────►
```

**Why not Streamable HTTP**: HTTP-style transports are for remote/networked MCP servers (multi-client, cross-machine, web-app-style). Our server is local-only, single-client, subprocess-style — stdio fits the use case exactly and avoids DNS rebinding, port allocation, and auth-token concerns.

**Implementation notes**:

- The MCP server is registered in `.mcp.json` (per-project) or the user's global Claude Code config; the command is `cmk mcp serve` (no port, no host).
- `stdout` is reserved for valid MCP JSON-RPC messages only. ALL logging goes to `stderr` (or to `context/sessions/{date}.mcp.log`).
- Messages are newline-delimited; never embedded newlines inside a single message (per spec).

### 10.2 Security

Per NFR-6 (verified):

- Path traversal validation on every read/write
- Canonicalize paths via `path.resolve()` (Node) / `pathlib.Path.resolve()` (Python); reject any path outside `<repo>/context/`, `<repo>/context.local/`, or `~/.core-memory-kit/`
- Per Kiro's stricter pattern: validate that paths start with the expected prefix; reject URL-encoded traversal (`%2e%2e%2f`)
- Network egress is impossible by transport choice — stdio has no listening socket. No DNS rebinding, no bind-address concerns.

### 10.3 When to use each mechanism

**Original (v0.1.0) — kept for the decision trail.** This was the proven hook+skill model: writes flow through the phrase-triggered skill (which shells out to `cmk remember`); MCP is read-only retrieval.

| Mechanism | When | Visibility to Claude |
| --- | --- | --- |
| Hooks | Involuntary lifecycle (capture on Stop, inject on SessionStart) | Hidden |
| `memory-write` skill | User-explicit triggers ("remember this") — auto-triggered by phrase | Visible, auto-invokes |
| MCP tools | Explicit retrieval Claude calls during reasoning | Visible, Claude chooses |

**Revision 2026-06-07 (v0.2.3, [ADR-0014](../docs/adr/0014-unify-cli-mcp-shared-core.md); executes the v0.2 refactor ADR-0006 deferred).** The cut-gate proved the shelled write path fragile — it silently corrupts backtick content (D-81) and trips a permission prompt (R2/D-80) — and D-85 showed every *voiced* intent (write as well as read) needs a Claude-mediated tool. So **MCP graduates from retrieval-only to the full memory *action* surface**, and the skill becomes a thin phrase-trigger *over* the MCP tools rather than a separate shell-write path:

| Mechanism | When | Visibility to Claude |
| --- | --- | --- |
| Hooks | Involuntary lifecycle (capture on Stop, inject on SessionStart) | Hidden |
| `memory-write` skill | Phrase convenience ("remember this") — triggers the MCP write tool | Visible, auto-invokes |
| **MCP tools** | **Explicit retrieval AND writes/mutations Claude calls during reasoning** (read + `remember`/`forget`/`trust`/`lessons promote`/`queue`) | Visible, Claude chooses |
| `cmk` CLI | Power-user + scripting + hook substrate; full memory surface + lifecycle/host verbs | n/a (not the regular user's surface — D-85) |

Both surfaces are thin adapters over one in-process memory-op core (ADR-0014); a `validate-cli-mcp-parity` guard keeps them in lockstep.

**Implements**: FR-26 (+ ADR-0014 for the write-parity extension).

---

## 11. Anthropic Auto Memory coexistence (Option D)

### 11.1 What we do

- **Do NOT disable** Anthropic's auto-memory. It writes to `~/.claude/projects/<slug>/memory/` per its own schedule.
- **Our SessionStart hook (primary) and PreToolUse hook (fallback) inject our `context/` snapshot first** as `additionalContext`. Ours sits earlier in the prompt → gets more attention.
- **Both memories load**. Session-start token cost: ~10 KB ours + ~10-25 KB Anthropic = ~20-35 KB. Within budget.
- **Ours is canonical** — committed to git, reviewed by humans, citation IDs stable, full provenance.
- **Theirs is supplementary** — machine-local capture with no audit trail.

### 11.2 `cmk import-anthropic-memory` command

Manual bridge for users who want to fold useful bullets from Anthropic's local capture into ours:

```bash
cmk import-anthropic-memory [--dry-run]
```

1. Read `~/.claude/projects/<current-slug>/memory/MEMORY.md`.
2. For each bullet: compute our canonical ID via `canonicalize()`. If ID already exists in our `context/MEMORY.md` → skip (dedup).
3. Else propose to add to our MEMORY.md as `write_source: imported`, `trust: medium`.
4. Print proposed additions; ask user to confirm (or `--dry-run` skips this).
5. Apply confirmed additions.

Explicit user action only. Never automatic.

### 11.3 Alternative: read Anthropic's session JSONL directly

claude-remember's verified pattern (per primary-source examination): they read Anthropic's session JSONL at `~/.claude/projects/<slug>/<session-id>.jsonl` directly. They never write their own transcript.

We don't adopt this in v0.1 (we want our own canonical transcripts/), but as a v0.2 optimization: if Anthropic's JSONL is reliable enough, we could drop our `transcripts/` and read theirs. Single source of truth, less storage.

**Implements**: ADR-0011 Option D.

---

## 12. `cmk` CLI

Single Node binary, ships with the kit. Subcommands:

| Subcommand | What it does |
| --- | --- |
| `cmk install` | Cross-OS one-shot install (scaffold + hook wiring + `.mcp.json` MCP-server registration) — the sole installer since the `install.sh` / `install.ps1` scripts were retired 2026-06-08 |
| `cmk init-user-tier` | Scaffold `~/.core-memory-kit/` once per machine |
| `cmk search "<query>" [flags]` | Per §9.3 — hybrid keyword + semantic |
| `cmk reindex [--boot \| --full]` | Rebuild SQLite cache from markdown |
| `cmk doctor` | Run HC-1..HC-14 health checks; route to self-repair |
| `cmk config <get\|set\|--show-origin> <key>` | Settings access (§7.2) |
| `cmk view [--port N]` | Local markdown viewer at `127.0.0.1:37778` |
| `cmk import-anthropic-memory [--dry-run]` | Per §11.2 |
| `cmk trust <id> <high\|medium\|low>` | Manual trust override |
| `cmk lessons promote <id>` | Move a project-tier observation to `~/.core-memory-kit/LESSONS.md` |
| `cmk queue review` | **[CHANGE]** Interactive review of `context/queues/review.md` (medium-trust auto-extracts). Promote / discard each |
| `cmk forget <id-or-query>` | Tombstone a fact per §6.5 |
| `cmk purge --hard <id>` | Permanent deletion (requires confirmation; rare) |
| `cmk roll [--scope now\|today\|recent]` | Manual force-roll of the rolling-window pipeline without ending the session. Same internals as the SessionEnd hook but user-invokable. (Per Cursor spec convergence — `FR-013`.) |
| `cmk repair` | Idempotent self-repair (re-install hooks, reset stale locks) |
| `cmk version` | Print kit version + check for updates |

CLI implemented in Node; ships as `@lh8ppl/core-memory-kit` npm package + standalone binary via `pkg`.

**Implements**: FR-22, FR-23.

---

## 13. Installation paths

Per OQ-2 + verified plugin format from claude-mem (`plugin/.claude-plugin/plugin.json`):

> **Updated 2026-06-08 (decision-trail):** the original `bash install.sh` + `pwsh install.ps1` shell-script paths + the per-OS `INSTALL-{windows,macos,linux}.md` manual-copy guides were early-architecture artifacts, **retired** in favor of the npm `cmk install` entry point (which does strictly more — scaffold + hook wiring + `.mcp.json` registration — and is CI-verified cross-OS). See [ADR-0005](../docs/adr/0005-three-install-paths.md) (Status: Superseded). The two live paths are below.

| Path | Audience | Mechanism |
| --- | --- | --- |
| `npm install -g @lh8ppl/core-memory-kit` + `cmk install` | Cross-OS (Windows / macOS / Linux) | Node-distributed; scaffolds `template/`, wires the 8 hooks into `.claude/settings.json`, registers the MCP server in `.mcp.json` |
| Claude Code plugin (`/plugin install core-memory-kit` + `/core-memory-kit:bootstrap`) | Claude Code users (no terminal) | Plugin manifest in `plugin/.claude-plugin/plugin.json`; `bootstrap` skill scaffolds per-project files |

Both paths produce **identical scaffolded state** in the target project. Tested via CI matrix on Windows 10/11, macOS 14+, Ubuntu 22.04+ (per NFR-3).

**Retired paths (history):** `bash install.sh`, `pwsh install.ps1`, manual copy per `INSTALL-*.md` — deleted 2026-06-08; `cmk install` supersedes all three.

### 13.1 CLAUDE.md loader block (idempotent install marker)

The install paths above MUST inject the kit's CLAUDE.md content inside an idempotent delimited block, never as a free-floating paste:

```markdown
<!-- core-memory-kit:start v0.1.0 -->
## Memory routing (core-memory-kit)

[kit-provided CLAUDE.md content here — session-start reads, health-check rules, etc.]

<!-- core-memory-kit:end -->
```

**Behavior**:

- On `cmk install` (any path), if delimiters are absent → append the block at the bottom of the project's existing CLAUDE.md (or create CLAUDE.md if missing).
- If delimiters are present with a matching or older version → replace the block contents in place. Preserve everything outside the delimiters verbatim (the user's hand-written instructions).
- If delimiters are present with a newer version → no-op + warn. User downgrade requires `cmk install --force`.
- On `cmk uninstall` → strip the block + delimiters. Everything outside is untouched.
- **Duplicate blocks FOLD (Task 220, D-322).** If the file somehow carries MORE THAN ONE managed block (a manual copy-paste, a kept-both-sides merge resolution), install folds them all into the single refreshed block at the first block's position — user bytes between/around the duplicates are preserved in order — and uninstall strips EVERY block, not just the first. Version comparison runs against the NEWEST version across all blocks (a stale duplicate can't let an older kit clobber a newer scaffold). `findManagedBlock` exposes `duplicateCount` and HC-9 FAILs on it with `cmk install` as the recovery. Duplicates fold EVEN on the downgrade-blocked path (to the newest existing block's content, never the refused older content) — otherwise HC-9's recovery advice would loop in the merge-imported-newer-duplicate scenario. The same global-fold applies to the agent instruction-file blocks (`install-agent.mjs` — Kiro steering / Cursor `.mdc` / AGENTS.md), where the blank-gap collapse runs only when a duplicate was actually folded (a single-block refresh stays byte-idempotent outside the markers).
- **KIT-OWNED scaffold REFRESHES on install; user memory never does (Task 230, D-343).** `installTier`'s skip-if-exists rule is the contract for the USER-DATA tiers only (`context/`, `context.local/`, the user tier — an edited MEMORY.md/USER.md/fact file is never clobbered). **Original contract (Tasks 69–229): the same skip applied to `.claude/skills/` ("a hand-edited skill survives a re-install"). PIVOTED by Task 230:** that memory-safety rule over-applied to kit-authored code — a kit update that changed a shipped skill never propagated to an existing install (the v0.5.4 rename left every update-in-place project firing recall on the dead `[claude-memory-kit]` hint, HC-9 green over it — the D-343 find). Skills now refresh to the current template on every install (`overwrite: true`; byte-identical files are skipped, so re-install stays idempotent), reported via the result's `refreshed` array AND the human-facing install line — never silent. **Two guards from the skill review:** (1) the refresh is DOWNGRADE-gated exactly like the managed block — if the project's marker is NEWER than the installing binary, an un-forced install leaves the skills alone (`--force` opts in), so an older global cli on another machine can't quietly downgrade a newer scaffold; (2) both compares are EOL-normalized (the D-126 class — a Windows autocrlf CRLF checkout of an identical skill is neither drift nor a rewrite-flap), and the gitattributes fragment pins `eol=lf` on `.claude/skills/**/*.md` going forward. **HC-9 closes the detection half:** when the marker version EXACTLY equals the binary (not on the benign-downgrade pass), it content-compares the kit-owned scaffold against the installed binary's template (`kitOwnedScaffoldDrift`, install.mjs) and FAILs naming the drifted file(s) with `cmk install` as the recovery — the marker only proves install ran at this version, not that every kit-owned file matches (the exact false-green D-343 hit). A MISSING skill is not drift (a `skipClaudeFiles` Kiro/Cursor project legitimately has none). **The kit-owned class covers `.claude/skills/` AND `.claude/commands/`** (Task 175 added the `/tour` slash-command scaffold to the same refresh + HC-9 drift-compare treatment).

**Why this pattern**: matches `direnv`/`asdf`/`fzf`/`nvm` shell-init conventions. Lets users safely re-run `cmk install` to refresh the kit without losing their own CLAUDE.md edits. Per Kiro's spec convergence on installer idempotency.

### 13.2 Install-time memory RECOVERY — stray tiers + malformed fact files (Task 248, v0.6.3)

`cmk install` — including every re-install / upgrade run — carries a **recovery pass** that repairs pre-existing damage two earlier bugs left on disk. It is deliberately part of the INSTALL FLOW, not a `doctor` check: the fix has to happen without the user running anything (the D-169 automatic-path criterion), and `doctor` is a command users don't run (U-U5PPSG7Y). The user's framing when the original doctor-only entry was reframed (P-3PWCGWZH): *"doctor should only be part of the fix, not the actual fix."* HC-13 (§14; full row in [HEALTH-CHECKS.md](../HEALTH-CHECKS.md)) is that part — an **advisory WARN, never a FAIL** — the backstop for a stray arriving by some other route, and the standing reminder for the husk that remains.

Implementation: [`packages/cli/src/memory-recovery.mjs`](../packages/cli/src/memory-recovery.mjs), one public boundary per concern (`scanStrayTiers` for the detection HC-13 shares, `recoverMemory` for the pass, `formatRecoveryReport` for the rendering).

**Class 1 — orphaned tiers (D-389).** Before v0.6.2, the capture-hook bins passed a bare `process.cwd()` as `projectRoot`, so an agent whose cwd was a SUBDIRECTORY forked a fresh, unread `context/` tier there (this repo accrued two, holding 6 stranded facts). Task 246 fixed the source; those tiers are now frozen and safe, but invisible.

- **Scan.** A pruned walk below the project root, bounded at **`MAX_SCAN_DEPTH = 4`** — the maximum number of INTERMEDIATE directories between the root and the tier, so `a/b/c/d/context` is found and `a/b/c/d/e/context` is not. A stray tier is created at the agent's cwd, and the realistic deep cwd is a monorepo package or a folder inside it (`packages/cli/src` = 3); this repo's two real strays were at 1 and 2. The walk skips `node_modules/`, every dot-directory, and the usual build/vendor/template trees, so a run is a handful of `readdir` calls — cheap enough for every install AND every `doctor`. **The unit is load-bearing and was wrong once:** an earlier boundary made the documented 4 find only 3, and nothing caught it because only the OVER-cap side had a test. Both sides are now pinned and the budget is registered in `validate-budget-pairs` (§17.10).
- **Discriminator (two questions, not one).** A candidate counts as a REAL stray only when it holds **live state** — a fact file, an INDEX.md that lists entries, a non-empty `sessions/now.md`, or another populated surface — AND its parent directory is **not a project in its own right**. The second half is not optional: a nested REAL repo, or the fat-finger case of running `cmk install` from a folder that holds several installed projects, presents a tier full of live state that is indistinguishable from a stray *when viewed from inside the tier*. The evidence has to come from the parent, and two markers settle it — a **`.git` entry** (dir OR file, so worktrees and submodules count: this directory is its own repository, so its `context/` travels with its own clone) or an **agent instruction file carrying the kit's `core-memory-kit:start` managed block** (positive proof it ran `cmk install` for itself). A neighbour is skipped by `scanStrayTiers` itself, so it is invisible to recovery AND to HC-13 — it is not "a stray we decline to fix", it is not a stray. This check **fails SAFE, not fail-open**: if it cannot tell, it assumes neighbour, because the cost of a false neighbour is one un-recovered stray the user can still move by hand, while the cost of a false stray is copying a live project's memory elsewhere and telling the user to delete the original. A `template/`-shaped scaffold has no live state and is likewise never touched.
- **Relocation is FAITHFUL (P-9W7XDMCA).** Fact files are copied **byte-identically**: `id` and `created_at` survive exactly. Re-capturing the content instead would re-date history and re-key the content-addressed id — a different fact wearing the same words.
- **Collision-safe.** A destination filename that already exists, or a fact id already present anywhere in the root tier, is SKIPPED and reported. Never overwrite, never dedupe-by-rewrite. The census covers the live fact dir plus **both** tombstone locations and the superseded archive — `<factDir>/archive/{tombstones,superseded,quarantine}/` AND `<tierRoot>/archive/tombstones/`, which is where `forget` puts a retired **scratchpad bullet** (a different directory, one level up — missing it let a forgotten bullet come back as a fact file). The archive half is load-bearing: copying a stray twin of a tombstone back into `memory/` would silently **resurrect a forget**, which would be a worse outcome than the stranding this fixes.
- **Non-fact surfaces are NOT merged.** `MEMORY.md` bullets, session logs, transcripts and queue entries are COUNTED in the report and left in place for the user to review — a scratchpad merge is a content decision, not a relocation.
- **The kit never deletes.** The husk is left exactly as found and a **platform-correct** delete hint (`platform-commands.mjs`) is printed. Deleting a memory path is the user's step, always (ADR-0018, D-192/D-193).
- **Idempotent + quiet.** Because recovery COPIES, a second run finds every fact already at root and collision-skips it. The report prints only what the run ACTIONED, so a re-install over an already-recovered husk says nothing at all — the standing reminder is HC-13's job, not install's.

**Class 2 — malformed / id-less fact files (D-394).** `index-rebuild` skips a fact file whose frontmatter has no valid `id` ("invalid or missing id") **without checkpointing it**, so the file is re-read and re-skipped on every boot — a quiet per-read cost and a fact invisible to recall. The same pass fixes it, over the root tiers and over each stray's files on their way out:

- **Derivable → repaired.** The kit's ids are content-addressed (§3.1), so a missing id is recomputable from the body the file already holds: `generateId(tier, body)`, written back through the kit's own machinery. The edit is **textual, never a YAML round-trip** — an insertion after the opening `---` when there is no `id:` LINE at all, or a one-line swap that keeps the old value as a QUOTED `legacy_id` (so a citation of the old id still greps to the file, and a numeric legacy id round-trips as a string). Every other byte and the EOL style are preserved; the BOM deliberately is not (below).
  - **INSERT vs SWAP is decided by the LINE, not the parsed value.** `id:` with an empty value and `id: null` both parse to `null` exactly like a missing id, so keying off the value appended a SECOND `id:` line — a duplicate YAML key, which made the file unparseable, which the next run then quarantined. Corrupt, then evict, on the most likely wild shape there is.
  - **THE UNIVERSAL GUARD.** A textual edit against YAML the code does not fully model cannot be trusted on inspection, so the OUTPUT is verified before any write: the repaired text must re-parse, carry exactly the derived id, and still hold the same body. On failure the ORIGINAL bytes are kept and routed through the normal not-derivable → quarantine path — so an unanticipated shape costs the user a **recoverable original**, never a mangled file. This is deliberately a guard rather than another special case: the empty-`id:` bug was ONE unhandled shape, and the next one would have shipped the identical corrupt-then-evict outcome. Reference shapes it correctly rejects: a block-scalar `id: |` whose continuation lines cannot be spliced.
  - **The BOM is stripped on the repair write.** Normally this pass preserves every byte it does not own, but `frontmatter.parse`'s `^---` anchor does not tolerate a leading U+FEFF, so a BOM'd fact file is invisible to reindex, recall and every fact walk. Repairing the id while leaving the BOM would let the report claim "now indexed and recallable" about a file that still is not — so the pass, which already owns the rewrite, removes the one byte sequence standing between the fix and its own claim. (A BOM'd file with an ALREADY-VALID id is out of this pass's scope and stays invisible — the general `parse()` BOM tolerance is a separate, wider fix.) **Update (Task 257, D-403): that wider fix shipped** — `frontmatter.parse` now strips a leading BOM kit-wide (§4, "The input boundary"), so a BOM'd file with a valid id is no longer invisible and no longer depends on this pass noticing it. This repair path is unchanged and still correct: its strip is what keeps the **textual** id splice (which never goes through `parse`) BOM-aware, and dropping the BOM on a file it is already rewriting is the same heal-on-rewrite rule §4 now states as a contract. The local `stripBom` copy this module carried was replaced by the canonical `read-json.mjs` import in the same change.
- **Not derivable → QUARANTINED.** Unparseable frontmatter, or no body to hash, moves bytes-intact to **`<factDir>/archive/quarantine/`** and is reported. Never deleted, never silently dropped. It lives under `archive/` rather than a new top-level `memory/quarantine/` because `archive/tombstones/` + `archive/superseded/` are already the tier's "not a live fact, still kept" area, `template/project/memory/archive/` already scaffolds the parent, every fact walk skips subdirectories, and `redact.mjs` already walks the fact dir recursively — so a quarantined file stays inside a leak scrub's reach.
- A stray's malformed file is repaired **on its way out** — the copy written to the root tier carries the repaired id while the husk file is left byte-untouched, because we never rewrite a tier the user is about to delete.

**FAIL-OPEN is the governing constraint.** This runs on the install path, the highest-stakes code in the kit. `recoverMemory` never throws, its outcome never joins `install()`'s `errors` (so it can never set the exit code), and any failure degrades to one warning line with the install completing exactly as it would today. Zero LLM calls, zero new dependencies.

**Observability (Door 5).** Every mutation appends an audit entry: `stray-tier-recovered` (with the husk path and the landing path), `fact-id-repaired` (with `extra.previousId`), `fact-quarantined`. All best-effort — the bytes are already where they belong before the log is touched.

**Implements**: FR-22, FR-23, FR-24.

---

## 14. Failure modes + health checks

Fourteen yes/no checks, run on demand by `cmk doctor`. Each has a documented self-repair path; the authoritative per-check table is [HEALTH-CHECKS.md](../HEALTH-CHECKS.md) — the rows below cover HC-1..HC-9 and are kept for their design rationale, while HC-10 (compaction liveness, Task 167), HC-11 (backend CLI, Task 200), HC-12 (deletion propagation, Task 210), HC-13 (stray tiers, Task 248) and HC-14 (active kit health warnings, Task 250) live there. (The two memsearch checks — formerly HC-1 "installed" + HC-7 "reachable" — were **removed in Task 120**; the remaining five from requirements.md renumbered to HC-1..HC-5, plus HC-6 native-memory detection per ADR-0011, HC-7 stale-lock detection per PR-B's class-2 lock audit, and HC-8 native-binding health per Task 141a / D-129. The cross-platform-emission audit lives in `validate-platform-commands.mjs`, not a runtime doctor check.)

| ID | Check | Repair if failed |
| --- | --- | --- |
| HC-1 | Stop + SessionStart hooks registered | `cmk repair --hooks` re-installs from template |
| HC-2 | MEMORY.md distill is fresh (≤2 days) | Manual `cmk daily-distill` |
| HC-3 | Transcripts firing (≤3 days) | Root cause: project not primary cwd in Claude Code. Fix: reopen project as primary |
| HC-4 | INDEX.md matches `context/memory/` files | `cmk reindex` rebuilds |
| HC-5 | Cron jobs registered with host scheduler | `cmk register-crons` (idempotent — registers daily-distill + weekly-curate via Task 33's Node implementation; design §8.6.3 documents the Python → Node pivot) |
| **HC-6** | Native Anthropic Auto Memory status detected | **Inspect `~/.claude/projects/<slug>/memory/` existence + contents. Log result to `context/.locks/native-memory-status.log` as `{active: true \| false \| unknown, last_modified: <ISO>, file_count: N}`. Non-fatal — informational only, lets users see whether their kit is supplementing or substituting Anthropic's. Per Kiro's spec-pattern of explicit detection + audit logging.** |
| **HC-7** | **Stale lock files under `context/.locks/` + `<userDir>/.locks/`** | **Per-stale-lock recoveryCommand emitted in the report (e.g. `rm "<path>"`). Library: [`packages/cli/src/lock-discipline.mjs`](../packages/cli/src/lock-discipline.mjs) `detectStaleLocks(projectRoot, {userDir})`. Closes the residual leak window left after PR-A's subprocess timeout (external SIGKILL / OS OOM / hardware failure — see §6.9 for the composition). Non-fatal — `cmk doctor` reports + the next auto-extract invocation's in-band stale-recovery also handles it.** |

| **HC-8** | **Native bindings present (npm 12 readiness, Task 141a / D-129)** | **`require('better-sqlite3')` must load its `.node` binding; when `search.default_mode` is `hybrid`/`semantic` the embedder import is probed too (the probe distinguishes not-installed from installed-but-binding-broken — the semantic-backend loader collapses both). Fail emits the exact global remediation (`npm install -g @lh8ppl/core-memory-kit --allow-scripts=better-sqlite3` / `npm install -g @huggingface/transformers --allow-scripts=onnxruntime-node`) with `requiresInstall: true`. The PRIMARY UX is upstream: `cmk install` runs the same probe and asks to fix inline (the user's 2026-06-12 install-time-ask steer); HC-8 is the backstop. Library: [`packages/cli/src/native-binding.mjs`](../packages/cli/src/native-binding.mjs). Verified against the npm v12 changelog + npm config docs 2026-06-12: the `allow-scripts` config is the documented path for global installs; project-level `npm approve-scripts` does not apply to `-g`.** |
| **HC-9 (stale-global half, Task 245 / D-388)** | **Installed binary vs the npm registry's published `latest`** | **`checkPublishedLatest` (version-drift.mjs): a plain registry-metadata GET (the same request `npm view` makes) with `UPDATE_CHECK_TIMEOUT_MS` = 2500 ms; ANY failure (offline / HTTP / payload / timeout) degrades to `{checked:false}` silently — a health check must never fail because the machine is offline. Skipped under `CI` (the install-matrix runs doctor on every PR; a registry hiccup must not flake a gate), `VITEST` (the doctor suite would otherwise hit the real registry dozens of times per local run; a test opts in by injecting a fake fetcher, which bypasses the gate), and `CMK_SKIP_UPDATE_CHECK=1` (the user's out). Escalates HC-9 `pass`→`warn` and `skip`→`warn` (the fact is about the BINARY, not the project) but NEVER touches `fail` — a real drift failure's message + recovery must not be replaced by the softer nag. `warn` is advisory: surfaced with its repair command, never the exit code. Closes the D-382 class cause-independently: whatever makes an `npm i -g` quietly no-op, the next doctor says the binary is behind.** |

**Critical rule** (per design §14, 2026-05-28 amendment): any repair requiring `pip install` / `npm install` / system-level changes MUST ASK the user first. Previously cited as "NFR-9" — NFR-9 is actually "Memory poisoning defense baseline" per [`requirements-revisions-proposed.md:125`](../archive/specs/v0.1.0/requirements-revisions-proposed.md). The ask-before-install rule has no FR/NFR backing today; promoting it to a proper requirements entry is a v0.1.x cleanup.

**Implements**: FR-22, all NFRs.

---

## 15. Trade-offs explicitly accepted

Decisions made knowing the cost — for the audit trail:

1. **Provenance frontmatter on every bullet (~150 bytes/bullet).** Full audit trail, uniform schema. Per T8/FR-29.
2. **180-line CLAUDE.md template** even though Bijit Ghosh's article recommends 80-120. User explicitly chose to test. Refactor in v0.1.x if adherence empirically degrades.
3. **Token budget ~20-35 KB at session start** (ours + Anthropic's under Option D). Higher than ideal but well within Claude's 200K context.
4. **Per-project isolation requires explicit promotion for cross-project facts.** `LESSONS.md` (user tier) and `cmk lessons promote` cover this. Cross-project search deferred to v0.2.
5. **6 MCP tools instead of 5.** <!-- validate-docs: ignore --> `recent_activity` added after Basic Memory primary-source examination showed it's a common query. _(Historical: the count at that decision; the live surface is larger now.)_
6. **Markdown-as-source / SQLite-as-cache requires regeneration on schema changes.** Acceptable — simpler than DB-as-source-of-truth.
7. **PreToolUse hook kept as fallback** for snapshot injection. Slight redundancy with SessionStart; defense-in-depth.
8. **Haiku 4.5 for auto-extract**, not Sonnet/Opus. Cost: $1/$5 per MTok. Quality difference small enough that Haiku is the right call.
9. **[CHANGE] Tombstones, not silent deletes.** Bigger archive, more files. Accepted because audit trail beats cleanliness for memory (mirrors git revert philosophy).
10. **[CHANGE] Review queue introduces a second-step workflow** for medium-trust auto-extracts. Users have to explicitly bless via `cmk queue review`. Friction accepted for safer auto-capture.

---

## 16. v0.1 → v0.2 forward-compatibility

Seams designed into v0.1 to enable v0.2 features without rewrite:

### 16.1 CompressorBackend interface (defined §8.3)

v0.1 ships `HaikuViaAnthropicApi`. v0.2 adds `BedrockHaiku` + `LocalLlama`. Per ADR-0008.

### 16.2 External memory provider plugin slot (Hermes pattern verified)

Per primary-source examination of `plugins/memory/__init__.py + 8 subdirs` in NousResearch/hermes-agent:

```text
v0.2 layout:
plugins/memory/
├── __init__.{py,ts}           ← dispatcher
├── honcho/
├── mem0/
├── hindsight/
└── ...
```

Activated via `cmk config set memory.provider <name>`. Implements `prefetch_all` + `sync_all` interface mirroring Hermes. Per ADR's roadmap and the user-locked Q1 answer (keep ours v0.1; plug-ins v0.2 after testing).

### 16.3 Cross-project search seam

`~/.core-memory-kit/registry.json` lists registered projects' `context/` paths. `cmk register-project <path>` and `cmk search --all-projects "<query>"`. The user-tier `LESSONS.md` is the interim v0.1 solution.

### 16.4 Web viewer rich UI

v0.1 ships minimal static markdown viewer at port 37778. v0.2 candidates: searchable timeline, observation-graph visualization, edit-in-place. Per OS-3.

### 16.5 Companion skills (claude-mem inspiration)

v0.1 ships `memory-write` + `bootstrap` only. v0.3+ candidates: `make-plan`, `pathfinder`, `weekly-digests`, `learn-codebase`. Per OS-2 + Hightower CCA-F harness patterns.

### 16.6 IDE / cross-agent adapters

v0.1 is Claude Code only. v0.2 candidates: `cursor-hooks/`, `.windsurf/`, `.codex-plugin/` adapter dirs. Per T6 + OS-1.

### 16.7 `<ephemeral>` tag

v0.1.x patch candidate. Third tag alongside `<private>` and `<retain>` for session-only content auto-extract should always skip. Per ChatGPT + Google Antigravity spec convergence.

### 16.8 `cmk transcripts extract` subcommand

v0.1.x or v0.2 candidate. Fell out of the bootstrap-test experiment on 2026-05-23 (see [`docs/research/2026-05-23-bootstrap-test.md`](../docs/research/2026-05-23-bootstrap-test.md)): we wrote `scripts/extract-session-transcript.mjs` as a kit-dev utility to convert harness session jsonls (`~/.claude/projects/<slug>/<uuid>.jsonl`) into clean human-readable markdown, and realized this is useful for kit *users* too.

Concrete shape:

```bash
cmk transcripts extract --session <uuid>           # one session
cmk transcripts extract --slug <slug> --all        # every session for a slug
cmk transcripts extract --since YYYY-MM-DD         # all recent sessions
```

Companion to `cmk import-anthropic-memory` (Task 32) which imports from Anthropic's `MEMORY.md` — this is the dual, importing from raw jsonl session logs. Useful when a user installs the kit on a project with months of conversation history they want to mine for durable facts.

The extractor logic already exists at `scripts/extract-session-transcript.mjs`; promoting it to a `cmk` subcommand means wrapping it with arg parsing + a discovery layer that walks `~/.claude/projects/`.

### 16.9 Guided-comment templates for memory-relevant files (à la OpenClaw)

v0.1.x candidate. Inspired by [OpenClaw's template patterns](https://docs.openclaw.ai/concepts/memory) examined on 2026-05-24: their `SOUL.md` template opens with `"You're not a chatbot. You're becoming someone"` and includes inline coaching like `"Skip the 'Great question!'"`. Worth absorbing the **style of guidance**, NOT the file list.

**Scope (deliberate)**: enrich the existing memory-relevant seed templates. Do not import OpenClaw's agent-orchestration files (`IDENTITY.md` / `TOOLS.md` / `AGENTS.md` / `HEARTBEAT.md`) — those define how the agent works, which is Anthropic's territory, not ours. The kit is a memory system for Claude Code, not an agent framework.

Files in scope for enrichment:

- `template/project/SOUL.md.template` — project persona / disposition
- `template/project/MEMORY.md.template` — working scratchpad
- `template/local/machine-paths.md.template` + `template/local/overrides.md.template` — local-tier memory
- `template/user/USER.md.template` — user profile / preferences
- `template/user/HABITS.md.template` — cross-project working style
- `template/user/LESSONS.md.template` — cross-project lessons
- `template/user/fragments/INDEX.md.template` — user-tier index

Each template should include 200-400 chars of inline coaching above the section headings: what belongs in this file, what good content looks like, what to avoid. Models for the coaching voice: the journey log's "Working-style preferences for future-Claude" section + the kit's own [`CLAUDE.md`](../CLAUDE.md).

Outcome: a user running `cmk install` gets templates that teach them what to write, not just where to write it. Reduces activation energy + carries calibration the bootstrap-test (see [`docs/research/2026-05-23-bootstrap-test.md`](../docs/research/2026-05-23-bootstrap-test.md)) showed transfers behavior, not just knowledge.

Files **explicitly NOT** in scope (out-of-scope by product boundary, not by oversight):

- Agent-identity templates (`IDENTITY.md`) — Claude is Anthropic's
- Tool-definition templates (`TOOLS.md`) — Claude Code defines its own
- Operating-instruction templates for the agent (`AGENTS.md`) — outside memory
- Periodic-task primitives (`HEARTBEAT.md`) — see §16.12 below

### 16.10 `docs/journey/` template scaffold

v0.1.x candidate. The bootstrap-test demonstrated that a narrative journey log captures things the spec stack can't (the *why*, the specific incidents, the working-style anchors). The kit could ship an empty scaffold at install time.

Concrete shape:

- New install tier `template/docs/` parallels `template/{project,local,user}/`
- `cmk install` copies `template/docs/journey/journey-log.md.template` → `<target>/docs/journey/{vX.Y.Z}-build-log.md`
- The scaffold file is heavily commented with section-by-section guidance (similar to the OpenClaw template approach in §16.9)
- Cost: minor install.mjs change (add a fourth tier), plus the scaffold file content

A draft of the scaffold lives at `template/docs/journey/journey-log.md.template` for inspection. Promoting it to an install tier becomes a v0.1.x task.

### 16.11 "See it in action" README section

v0.1.x candidate. Low-cost README addition. The kit's own repository demonstrates the patterns it teaches:

- `CLAUDE.md` at root — working-style + binding rules + skill agency
- `docs/journey/build-log.md` — full narrative (~600 lines)
- `docs/BOOTSTRAP.md` — canonical session-handoff prompt template
- `specs/glossary.md` — domain-term dispute-resolution doc
- `SOURCES.md` — verification-status legend (✓ / ~ / ✗)
- `docs/research/` — primary-source examination notes

A "See it in action" section in the README (just a pointer list, no new content) lets new kit users browse the kit's own setup as a worked example. Especially valuable because `cmk install` only seeds empty placeholders — users have to figure out what to put in them, and a reference implementation drops the activation energy.

Cost: ~50 lines of README. No code change.

### 16.12 HEARTBEAT-pattern primitive (OpenClaw-style) — REJECTED, out of scope

**Decision (2026-05-24, the user)**: this pattern is out of scope for the kit. Recorded here as a considered-and-rejected entry so future contributors don't re-propose it.

OpenClaw's `HEARTBEAT.md` is *"empty by default; user adds tasks; the agent runs them periodically"* — a lightweight scheduling primitive for the **agent** to run during sessions. It's agent-orchestration territory: telling the agent what to do periodically.

Our kit doesn't orchestrate the agent. We give Claude memory; Anthropic decides what Claude does. We already have two scheduling layers in the right scope:

- **Cron** (Layer 6) — OS-level periodic tasks for memory maintenance (daily distill, weekly curate)
- **Lazy compression fallback** (§8.2.1) — SessionStart-triggered when cron isn't available

A HEARTBEAT-style mechanism would compete with both AND step outside our product boundary. Rejected.

If a future user wants periodic in-session checks, the right tool is Claude Code's own hooks (PreToolUse, PostToolUse, etc.) — not a kit-managed file. The kit shouldn't try to be both a memory system and an agent-task scheduler.

### 16.13 Audit-log rotation

v0.1.x candidate (surfaced by the Layer-2 code-review pass, 2026-05-24). The canonical `<tierRoot>/.locks/audit.log` (see §6.1, [`audit-log.mjs`](../packages/cli/src/audit-log.mjs)) grows unbounded. For long-lived user-tier installs (which accumulate writes across all projects), this becomes real over months.

Right home: Task 33 (daily-distill cron). Concrete shape:

- Threshold: rotate when `audit.log` size > N MB OR age > M days (configurable, defaults `5 MB / 90 days`)
- Rotated files: `<tierRoot>/.locks/archive/audit-YYYY-MM-DD.log` (one rotation file per cycle)
- Schema-version awareness: keep the `schema: 1` field intact so future readers can mix old + new entries

No code change needed in v0.1 itself — the existing writers append; rotation is a separate concern that runs out-of-band. Surface this as a v0.1.x patch once we've actually accumulated enough log entries to make it relevant.

_Scope extension (2026-07-06, Task 190):_ `context/.locks/recall.log` (the learn-loop attribution log, §"Structured logging" table) shares this exact posture — append-only, no runtime rotation, grows slower than audit.log (~1 line per session-start + 1 per search). When this candidate ships, it covers both files with the same threshold/archive shape.

### 16.14 Mermaid-style symbolic short-term memory

v0.2 candidate. Inspired by [TencentDB Agent Memory](https://github.com/Tencent/TencentDB-Agent-Memory) (research note: [`docs/research/2026-05-24-tencentdb-agent-memory.md`](../docs/research/2026-05-24-tencentdb-agent-memory.md)). Distinct concept from our rolling-window compression (§7) — that operates on closed sessions; this operates on open ones.

**The problem.** Long-running agent sessions (50+ tool calls, verbose outputs) bloat context. Compression doesn't help inside an active session; you need a way to keep the working state addressable without keeping every tool output verbatim.

**Tencent's approach.**

- Tool outputs offloaded to disk at `refs/*.md` under the data directory
- State transitions encoded as **Mermaid syntax** inside a lightweight "task canvas"
- Agent reasons over the symbol graph in context, then `greps` a `node_id` to pull raw text on demand

**Reported impact** (Tencent self-reported, see research note §"Reported benchmarks"): 61% token reduction on WideSearch, 33% on SWE-bench, both on 50-task continuous sessions.

**Investigation needed.** Whether Claude Code's PostToolUse hook can capture tool outputs and offload them in real time without disrupting normal tool flow. If yes, the kit can host this as a separate add-on subcommand (e.g. `cmk task-canvas`) that maintains a per-session symbolic state file in `<projectRoot>/context.local/scratchpads/task-canvas.md`.

**Divergence from Tencent's specific form.** We wouldn't tie this to Mermaid; the representation should be format-agnostic ("compact symbolic representation," with Mermaid as one option alongside DOT, bullet lists, or any structured format). Same orthogonality discipline as §1.1 (storage tiers ≠ specific filesystem layout).

### 16.15 L2 "scenario" layer between granular facts and persona

v0.2 candidate (lower priority). Inspired by TencentDB's 4-tier pyramid (research note §"The 4-tier semantic pyramid"). Their tiers: L0 raw conversation → L1 atomic facts → **L2 scenario summaries** → L3 persona.

**Our current shape.** Granular archive (≈ L1) → scratchpads (≈ L3). The `MEMORY.md` "Active Threads" section informally covers some of what L2 would do — grouping related facts into mid-level summaries — but it's a scratchpad section, not a separate retrieval tier.

**Why it might matter.** Tencent's retrieval is deterministic drill-down: query the persona first, descend to scenarios, then to atoms, only loading raw conversation when needed. An explicit L2 tier could improve our drill-down ergonomics (the MCP server's `mk_search` could return scenario-level results by default with a deeper-detail flag).

**Why it's lower priority.** Our scratchpad structure covers most of what L2 would do. The current concern is whether the user tier gets populated at all (see §16.16); mid-level retrieval ergonomics are a follow-on optimization, not a prerequisite.

**Revisit timing.** After §16.16 auto-persona ships and we see whether mid-level groupings emerge naturally from the auto-extract subagent's behavior.

### 16.16 Auto-persona generation (the user-prioritized 2026-05-24)

**v0.1.0 in-scope** (promoted from v0.1.x candidate on 2026-05-24, immediately after Task 14's seed-template work landed). Implemented as [Task 45](tasks.md) (appended at the tasks.md tail to avoid renumbering 24+ existing tasks; depends on Task 23 / consumes its output; must ship before the v0.1.0 release tag). Replaces hand-curated user-tier files (`USER.md`, `HABITS.md`, `LESSONS.md`) with auto-generated content driven by the auto-extract subagent (Task 23).

**Promotion rationale.** Shipping with hand-curated user-tier means shipping with a structurally broken third of the value proposition on day one. Hand-curation is a known failure mode; "v0.1.x patch" assumes users stick around long enough to receive it — they won't, if their first experience is empty `USER.md` / `HABITS.md` / `LESSONS.md`. The auto-persona path closes the loop: user uses kit → auto-extract captures durable facts → auto-persona synthesizes them into user-tier scratchpads → user benefits from cross-project memory automatically. Removing any link in that chain breaks the value prop.

**Why this matters (the failure mode it fixes).** The 3-tier scope (user / project / local) only delivers value if all three tiers actually fill up. The project + local tiers fill organically via the auto-extract subagent. The user tier was specced as hand-curated, which is exactly the same failure-mode pattern the kit was built to fix everywhere else: don't make the user do work the system should do automatically. The user's direct feedback (2026-05-24, captured verbatim in [`docs/research/2026-05-24-tencentdb-agent-memory.md`](../docs/research/2026-05-24-tencentdb-agent-memory.md)):

> *"i dont like the hand-curated user-tier files, i know that i myself will not fill them up if i have to do it manually as a user/developer using our kit, it's too much of a hassle."*

If users won't hand-curate, the user-tier files stay empty, the cross-project layer provides no value, and the 3-tier benefit collapses to project + local. Auto-persona is the structural fix.

**Inspired by.** Tencent's auto-persona-every-50-memories pattern (research note §"Retrieval defaults"). Same principle as our memory-write trigger-phrase critique (don't require user phrases for capture; the system extracts automatically).

**Proposed shape.**

- New subcommand: `cmk persona generate` (manual trigger) + automatic invocation from the auto-extract subagent (Task 23) every N captured facts (default: 50, configurable)
- Reads the granular archive (project + user tier facts via `cmk search` and direct `<userDir>/memory/` reads)
- Synthesizes current user-profile state via the same CompressorBackend used elsewhere (Haiku default per §8.3)
- Output: candidate updates to `USER.md` / `HABITS.md` / `LESSONS.md`
- Two modes:
  - **Stage**: write to `<userDir>/queues/persona-review.md` for user confirmation (default)
  - **Auto-apply**: write directly to user-tier files with audit log entry (opt-in via `--auto`)

**Open questions for the v0.1.x design pass.**

- Cross-project vs single-project persona generation. User-tier is by definition cross-project; how does the auto-extract subagent in project P access facts from project Q? Likely via `cmk search --tier U` reading directly from `<userDir>/memory/`.
- Conflict resolution. What happens when the proposed persona update contradicts an existing hand-curated entry? Default: stage in `queues/persona-review.md`, don't overwrite (consistent with §6.2 conflict queue).
- Trust level. Auto-persona entries get `provenance.trust = medium` (system-derived, not user-attested). Hand-curated entries stay `high`. Confirmed-from-queue entries get promoted to `high`.

**Glossary entry pending.** Add `[[Auto-persona]]` to [`specs/glossary.md`](glossary.md) when the v0.1.x task gets formally specced.

### 16.17 Empirical benchmarks methodology

**v0.2 priority — required before public claims about kit effectiveness.**

**The gap.** Tencent has published benchmarks (research note §"Reported benchmarks"); we have none. v0.1.0 can ship as "infrastructure ready, not yet measured" — but v0.2's narrative needs evidence.

**Methodology shape (from Tencent's approach + our scope).**

- **Long-horizon coding tasks**: 5 multi-session refactors. Run each with and without the kit installed. Measure session-start time-to-orientation, total tokens per session, task completion rate, and end-state correctness.
- **Cross-session recall**: 10 facts established in session 1 (mix of decisions, preferences, project state). Test in session 2 whether the kit-equipped agent correctly retrieves them when relevant. Compare to no-kit baseline.
- **Decision consistency**: 5 design decisions made in session 1. Test in session 2 whether follow-up decisions stay consistent with the prior choices.
- **Session 1 → session N**: extend the recall + consistency tests across 5+ sessions to measure decay behavior.

**Reference target** (Tencent's reported numbers, see research note):

| Benchmark | Their baseline | Their with-plugin | Pass-rate Δ | Token Δ |
| --- | --- | --- | --- | --- |
| WideSearch | 33% | 50% | +51.52% | −61.38% |
| SWE-bench | 58.4% | 64.2% | +9.93% | −33.09% |
| AA-LCR | 44.0% | 47.5% | +7.95% | −30.98% |
| PersonaMem | 48% | 76% | +59% | (not reported) |

Not direct comparables — they're integration-specific (OpenClaw + Hermes) and self-reported. But the methodology (continuous long-horizon sessions, baseline-vs-with-plugin, pass-rate + token cost) is the right shape.

**Harness architecture (port from GBrain).** GBrain's `gbrain eval longmemeval` harness (research note: [`docs/research/2026-05-24-gbrain-architecture.md`](../docs/research/2026-05-24-gbrain-architecture.md), Pattern 3) is the right shape to mirror. Six properties worth copying directly:

1. **Hermetic by default.** When the benchmark CLI is invoked, the kit's normal `connectEngine()` is skipped — The user's actual brain is never touched. Tests stub the LLM client so the full pipeline runs without an API key. Critical property: the benchmark must NEVER mutate user-facing state.
2. **Reset-in-place between questions.** Sequential 500-question benchmark uses ONE in-memory state. Between questions: clear all content tables/files (enumerated at runtime) except a `PRESERVE` allow-list (config, locks, infrastructure). Avoids snapshot/restore complexity. For our markdown-based kit: between-question reset wipes `<sandbox>/context/{memory,scratchpads,transcripts}/` while preserving the manifest + `.locks/` state.
3. **Resume-from-path.** `--resume-from <hypothesis.jsonl>` reads a previous run's output, skips question IDs already processed, appends new ones. Recovery path for mid-run aborts (rate-limit, cost-cap, OS interrupt). Production-grade benchmark UX.
4. **Mode flags.** `--retrieval-only` (skip LLM, score retrieval alone), `--keyword-only` (skip vector path), `--expansion` (query rewriting on/off), `--mode conservative|balanced|tokenmax`. Lets the same harness produce comparable scores across configuration variations.
5. **By-category aggregation with floor enforcement.** `--by-type` emits per-question-type pass rates as the last JSONL line. `--by-type-floor 0.45` exits non-zero if any bucket falls below the floor. Catches the "average looks good but one category collapsed" failure mode that a single aggregate hides.
6. **Methodology-disclosure stamps.** When extra preprocessing is enabled (e.g. an intent classifier in front of retrieval), the output gets stamped with a method id like `extractor=haiku-preprocess-v1`. Honest comparison vs. baseline — downstream readers see the preprocessing step is in the pipeline. Our equivalent: stamp non-baseline runs so when we cite numbers we can name the configuration.

**Tasks to add when scoping v0.2:**

- Benchmark harness, mirroring the six properties above (separate sub-directory `benchmarks/` so it doesn't bloat the v0.1 test surface)
- Task suite curation (5 refactors + 10-fact recall + 5-decision consistency + decay-across-sessions)
- Baseline measurement protocol (no-kit runs)
- With-kit measurement protocol (kit installed, all subagents active)
- Results publication (`docs/benchmarks/v0.2/` + README narrative section)

**Honest acknowledgement to v0.1.0 users.** Until v0.2 ships benchmarks, the README's effectiveness claims must say "expected behavior, not measured." The kit is structurally sound (architecture-first decision per §1.4); the empirical case follows.

### 16.19 Competitive deep-dive conclusions — skills delivery, storage/search, security defense-in-depth (2026-06-01)

Source-level dive of Hermes / memsearch / gstack / claude-mem / antigravity / Honcho (cloned + read). Full analysis: research notes [`how-products-implement-skills`](../docs/research/2026-06-01-how-products-implement-skills.md) + [`deep-dive-product-memory-implementations`](../docs/research/2026-06-01-deep-dive-product-memory-implementations.md); settled in [DECISION-LOG D-28 + D-29](../docs/journey/DECISION-LOG.md). HOW decisions that land here:

- **Skills are the delivery mechanism (Task 69).** Memory guidance ships as a Claude Code **skill** that routes through `cmk remember` (safe path: Poison_Guard + sanitization), `allowed-tools: Bash(cmk*) Read`, NEVER hand-edits — the universal pattern (Hermes refuses hand-edits; gstack/memsearch call the CLI). `cmk install` scaffolds skills into `<project>/.claude/skills/` (route-equivalence with the plugin). The scaffolded `CLAUDE.md` block slims to facts + a skill pointer — no product injects a procedure into the user's CLAUDE.md (Anthropic docs: <200 lines, procedures→skills).
- **Storage/search (Task 65): keep markdown-truth + FTS5-first + optional vector** (claude-mem validates; Hermes `session_search` is SQLite FTS not vector). Layer-5b backend lean: **`sqlite-vec` + ONNX `bge-m3`** (cross-platform, local, no API); **reject Milvus** (`milvus-lite` excludes win32). Chunk by `##` headings, ≤1500 chars, clean-before-embed.
- **Security defense-in-depth (Tasks 70/71) — amplified by committed-to-git memory (supply-chain vector).** Poison_Guard at WRITE is not enough: re-scan at inject (`[BLOCKED]`), fence recalled memory as non-authoritative, scrub spoofed system-notes (Hermes scans write+inject+output); add invisible-Unicode patterns (70.4); detect+refuse external hand-edits with `.bak` backup (71).
- **Don't-adopt:** Milvus (Windows-hostile), Honcho (AGPL + async-worker service; its reasoning-first user-modeling is a v0.3+ persona direction), GBrain entity-graph — all wrong weight class for a local-first markdown kit.

### 16.18 Temporal awareness — fact shapes + validity windows + mode-aware retrieval

v0.2 candidate. Inspired by Indranil Chandra's "Beyond the Log: Time-Aware Blueprint for AI Agent Memory" (research note: [`docs/research/2026-05-24-beyond-the-log-time-aware-memory.md`](../docs/research/2026-05-24-beyond-the-log-time-aware-memory.md)).

**The gap diagnosed.** Our current temporal model is: timestamps on every bullet + 14-day staleness drop for `trust: medium` in the consolidator (Task 12) + `superseded_by` ID references for merged facts (Task 10). This handles permanence + decay but NOT *current-validity*. Two contradictory facts on the same topic can coexist for up to 14 days; `cmk search "current status of X"` cannot reliably surface the most-recent valid version. Chandra calls this **temporal blindness**: vector embeddings capture topic similarity but not temporal coordinates, so older + newer facts on the same subject both match a "what is the current X?" query — sometimes the older one scores higher.

**Proposed v0.2 absorbs (three layers, ordered by cost):**

1. **`shape:` field on provenance** (smallest absorb; v0.2 entry point). Optional initially, defaulting to `State`. Seven values from Chandra's taxonomy: `State` (ongoing condition), `Event` (happened once), `Plan` (future-dated), `Relationship` (relation between entities), `Preference` (personalization), `Absence` (negative fact — "user does NOT do X"), `Timeless` (always true). Implementation: extend `provenance.mjs` (Task 13) field validation; extend YAML frontmatter on per-fact files; update auto-extract subagent (Task 23) to classify. Pays off the day it ships — even without retrieval changes, `Absence` becomes distinguishable from `Preference` (currently both expressed as bullet text with implicit negation that topic-similarity search can't see). **✅ SHIPPED — Task 66.1 (v0.4.4 lane, 2026-07-02):** all three surfaces live — `write-fact.mjs` (strict enum validation; written explicitly with the `State` default so new files self-describe; absence on pre-66 facts reads as `State`), `provenance.mjs` bullets (optional, rides the comment TAIL after `at` so the canonical 6-field prefix stays byte-stable), auto-extract (BEGIN_FACT `shape:` + a shape guide in the prompt; the LLM boundary is TOLERANT — casing normalized, invalid → omitted so a Haiku typo can't kill a capture). `mergeFacts()` inherits shape from the primary parent (same fallback as `type`) — a merge never resets classification.

2. **Validity windows on `State`-shape facts.** Add `started_at` and `ended_at` to provenance for `shape: State` facts. When `mergeFacts()` (Task 10) detects a `state_key` match with `ended_at: null`, atomically close the old (`ended_at = merge_ts`, add `status: "completed"`) and create the new (`status: "ongoing"`, `ended_at: null`). The existing `superseded_by` reference stays as a backward-compat link; the new fields make point-in-time queries (`cmk search "X as of 2026-03-15"`) fall out for free. Compose with our existing audit-log + tombstone discipline — nothing is deleted; the timeline of validity windows IS the audit trail. **✅ SHIPPED — Task 66.2 (v0.4.4 lane, 2026-07-02; D-259):** `validity-window.mjs::resolveTemporalSupersede` — the close boundary is the NEWER fact's `created_at` (EVENT-TIME decides, never the wall clock and never the LLM); the older fact is annotated (`ended_at`/`status: completed`/`superseded_by`) and moved to `archive/superseded/` (the SAME lifecycle merge-facts uses — old ids never die, as-of history stays readable); the supersession dampens the closed fact's `trust_score` (the 151.8 passive signal); direction-guarded + idempotent (a re-judged pair no-ops). One deviation from the original text: the trigger is NOT a `mergeFacts()` `state_key` match — see layer 3's pivot.

3. **State-key annotation as a new optional provenance field.** Facts that participate in atomic mutation declare a `state_key` (e.g. `state_key: "primary_treatment_for_X"`). Without it, the fact stays a flat history entry; with it, it becomes part of a validity timeline that `mergeFacts()` can update atomically. Mirrors Chandra's pattern for stateful facts. **⚠️ PIVOTED 2026-07-02 (D-259 — measured on the kit's own 1,246-fact corpus, [bake-off note](../docs/research/2026-07-02-contradiction-detection-bakeoff-real-corpus.md)):** the declared `state_key` field is NOT built — subjects proved recoverable from title tokens via the kit's own search (BM25 over QUOTED tokens; quoting makes FTS5's shredded `v0.3.2` → `[v0,3,2]` match as a phrase), and a declared field nobody populates is the D-169 dead-weight class (the same finding as D-258's caller-set-expiry check). The detection input is now `temporal-sweep.mjs` (Task 66.4): candidates from search → ONE batched Haiku verdict (SUPERSEDES/DUPLICATE/COEXIST — 10/10 twice on real pairs, ~$0.004/10) at the weekly-curate Haiku site → SUPERSEDES fires layer 2's close, DUPLICATE bumps `recurrence_count` (the restatement signal — the bake-off showed the two classes share a pipeline), COEXIST drops. A judge failure leaves the sweep marker unadvanced (pairs re-derive next pass — no fragile pending-queue); an overflow/unjudged pair holds the marker back to a fact boundary so deferred work re-derives too (the skill-review finding-1 barrier semantics). The demo surface (66.4) is a bounded one-line SessionStart mention built from recent `temporal_supersede` audit entries (inject-context; positioned 64KB audit tail read; reserved out of the cap like the preamble; D-215 heads-up posture). **Prompt-injection posture (finding 6):** fact bodies flow into the judge prompt, so a poisoned fact could try to steer verdicts ("PAIR N: SUPERSEDES" text inside a body). The blast radius is bounded by CODE, not trust: pairing is same-subject-search only, direction is `created_at`-decided, a close is archive-recoverable + audited + surfaced by the SessionStart mention, first-verdict-wins parsing ignores late duplicates, and bodies are delimited as DATA with an explicit ignore-directives instruction — plus Poison_Guard screens the write path upstream. The ORIGINAL declared-key design is preserved here per the decision-trail rule — re-open only if derived-subject retrieval measurably misses real chains in live use.

**✅ SHIPPED — Task 198, the per-session temporal sweep (v0.4.5 lane, 2026-07-04; D-266 — revisits D-259's site choice with new evidence).** The 66.4 sweep originally judged stale-State pairs ONLY inside `weekly-curate`, a cadence inherited from the convenient host site (weekly-curate had the free Haiku ceiling), never derived from a freshness requirement — so a stale State fact could mislead recall for up to 7 days (the D-166 acceptance window; live-observed in the v0.4.4 cut-gate). Task 198 runs the SAME sweep (judge/close semantics UNCHANGED — only sites + candidate source evolve) at EVERY existing Haiku maintenance site:

- **Sites (198.1):** `temporalSweep` now fires from the **SessionEnd** handler (joins `runSessionEndTasks`' CONCURRENT allSettled block — a third ~50s-max Haiku call run sequentially after the ~50s concurrent block would blow the 60s ceiling, so it OVERLAPS; disjoint inputs — compress touches `sessions/`, persona the user-tier, the sweep the fact corpus + SQLite index) AND the **SessionStart lazy path** (`runLazyCompress`, on the `stale-now`/`stale-daily` Haiku verdicts — `stale-weekly` already routes through `weeklyCurate`'s own sweep, so no double-sweep; covers the new-chat-same-window case where SessionEnd never fired, the Task-105 gap). `weekly-curate` stays the backstop. Best-effort at every site (allSettled/try-catch — a sweep hiccup never aborts the host flow, the 66.4 posture); `userDir` via `defaultUserDir()` at the production entry points only (D-260/D-69). **Idle is ~free:** the `no-new-facts` short-circuit returns BEFORE any Haiku call (pinned end-to-end: an idle lazy session spawns zero judge calls), and Memora's Appendix F shows judged consolidation stays a flat 16.5–22.2% of writes as the store grows — linear-cost, safe at higher cadence ([research note](../docs/research/2026-07-03-memora-harmonic-memory-review.md)).
- **Candidates (198.2):** when the project's configured search mode is `semantic`/`hybrid`, candidate retrieval switches from the FTS OR-query to **title-embedding cosine KNN** (Memora's validated θ=0.80 as the reference; `SEMANTIC_CANDIDATE_THRESHOLD`), gated on `resolveDefaultSearchMode` + the `CMK_DISABLE_SEMANTIC` kill-switch — a keyword project (the default) stays on FTS, and FTS remains the always-available fallback (embedder absent/disabled/no-vec-table). Sidesteps the FTS5 version-token-shredding the OR-query has to quote around; better pairs matter more at the higher cadence. The finder is built AFTER the no-new-facts short-circuit, so an idle sweep never loads the embedder. `candidateFinder` is injectable (the test seam).

**✅ SHIPPED — Task 66.3, the `expires_at` enforcement (v0.4.4 lane, 2026-07-02; D-258).** The field was design-defined since §4 v1 but written by ZERO code paths and enforced by none (verified 2026-06-01, re-verified 2026-07-02). Now both halves exist, per the D-258 primary-source-verified reference set (mem0 `expiration_date` + LangGraph store TTL + the in-base graphiti/letta reads — [research note](../docs/research/2026-07-02-expiry-ttl-precedents-mem0-langgraph.md)):

- **Semantics:** `expires_at` (strict ISO date/datetime, validated in `write-fact.mjs`) is the FIRST moment the fact no longer holds — `now >= expires_at` → expired (exclusive end, matching `ended_at`). Distinct from staleness-TTL (the 14-day scratchpad drop): a declared end never renews on access (LangGraph's `refresh_on_read` explicitly rejected for this field).
- **Enforcement, both halves:** (1) **read-time** — `search.mjs` keyword WHERE + the semantic post-filter hide expired rows (`includeExpired`/`--include-expired` reveals; human-only on the CLI, same D-163 posture as tombstones; the index carries a nullable `expires_at` epoch-ms column, 151.6-style migration); (2) **sweep** — `expiry-sweep.mjs::sweepExpiredFacts` runs in weekly-curate's deterministic pre-cooldown slot (next to the queue auto-drain) and TOMBSTONES each expired fact through `forget()` (audited `deleted_by: expiry-sweep`, recoverable) — never a hard delete. Read-time is the immediate guarantee; the sweep is the durable cleanup (LangGraph's no-sweep-configured = nothing-expires trap is why both exist).
- **Writers (the D-169 populated path):** explicit — `cmk remember --expires` / `--shape` (+ the `--from-file`/`--json` keys) and `mk_remember` `expires`/`shape` params; automatic — auto-extract's BEGIN_FACT `expires:` (strict-ISO-or-omit parser; the prompt scopes it to Plan/Event facts whose TURN states a concrete date, with an explicit NEVER-guess rule — the unprecedented increment among the surveyed systems, so its live behavior is a named cut-gate validation item).

**Deferred to v0.3 (or later):**

- The 7-mode query classifier + nudged reranker on the retrieval side (Current State / Historical Range / Upcoming / Lifetime / As-of Point / Deltas / Timeless). Requires classifier infrastructure + reranker stage; marginal value at single-user-at-a-keyboard scope. Revisit if multi-tenant ever enters the roadmap (it won't in v0.x). The shape-field + validity-windows layer gives us most of the practical benefit without the classifier. **⚠️ NARROWED 2026-07-10 (D-308 — revisits this deferral with new evidence, per the D-248 rule):** A-TMA (arXiv 2607.01935; [sweep note](../docs/research/2026-07-10-memory-research-sweep.md)) demonstrates its retrieval wins with a **4-view profiler (current / historical / transition / neutral) that is explicitly RULE-BASED** — temporal/change hint-words + negation guards, no classifier infrastructure, no reranker stage — which kills this deferral's COST premise for the 4-view cut. Filed as **Task 211** (a deterministic pre-rank bucket bias, not a score blend; §20.3 untouched). The full 7-mode + reranker version stays deferred on the original grounds; the original deferral text above is preserved per the decision-trail rule. **✅ The 4-view cut SHIPPED — Task 211 (v0.5.3, 2026-07-13, D-332):** `query-state-view.mjs` classifies at query time (hint catalogs + a 5-token negation guard that converts a negated past-hint to a current hit); a historical/transition verdict auto-includes expired rows AND strips the consumed hint words from the FTS query (implicit-AND would otherwise demand the asker's temporal adverb appear in fact bodies); historical additionally buckets stateful (Task-209-labeled) rows first — a stable partition, never a score change; current/neutral are byte-identical to the pre-211 pipeline. `--state-view` / `state_view` exist only as overrides; the detected view surfaces in the result envelope. Facts scope only. Mechanics note: §9.3.

**Smaller v0.1.x candidate (folds in opportunistically):**

- `Absence` as a tag or boolean on existing bullets, *without* the full shape-field machinery. Lets us start capturing negative facts ("user does NOT want emoji in responses") without v0.2-scoped work. Tradeoff: more bespoke; less general. Worth piloting before the full shape-field commits.

**Why this matters even before retrieval changes ship.** Even with timestamps and 14-day decay, we cannot reliably answer "what is the current valid version of X?" because the consolidator drops by AGE, not by VALIDITY. A `trust: high` fact from 2026-01 contradicting a `trust: medium` fact from 2026-05 stays around forever (trust:high is preserved). The validity-window mechanism solves this without changing trust semantics.

### 16.19 Self-wiring knowledge-graph layer — zero-LLM typed-edge extraction

v0.2 candidate. Inspired by Garry Tan's GBrain (research note: [`docs/research/2026-05-24-gbrain-architecture.md`](../docs/research/2026-05-24-gbrain-architecture.md), Pattern 1).

**The gap.** Our current model has per-fact files (granular archive) and bulleted scratchpads. Facts link to source transcripts via the `source` provenance field. They do NOT link to each other via typed edges. A search for "what does Alice work on?" can find facts mentioning Alice but cannot traverse "Alice → Acme (works_at) → Acme's recent decisions (made_at)" the way GBrain's typed-edge graph can. GBrain's measured impact: +31.4 P@5 over vector-only RAG on rich-prose corpus.

**Three-layer technique (port the technique, not the code — see SOURCES.md license note for GBrain).**

1. **Auto-link on every fact write.** When `writeFact()` (Task 7) commits a new fact, scan the body for entity-reference patterns. Two shapes: standard markdown links `[Name](dir/slug)` and Obsidian-style wikilinks `[[dir/slug|Display]]`. The directory prefix encodes the entity TYPE — `people/`, `companies/`, `projects/`, etc. — so the parser knows at extraction time what kind of entity it's linking to. Zero LLM calls; pure regex. Code-fence stripping is defense-in-depth (slugs inside ``` blocks aren't real refs).

2. **Verb-based type inference** for the edge type (`works_at`, `invested_in`, `founded`, `advises`, `mentions`). When a link is found, run the ~240-char context window through a per-edge-type regex catalog. GBrain's catalog is calibrated to VC/business prose; ours would need a developer-prose catalog (`works_on`, `owns`, `reviewed`, `merged_by`, `depends_on`, `replaces`, etc.). The technique adapts; the specific catalogs we write from scratch.

3. **Page-role prior layer.** When per-edge inference falls through to generic `mentions`, check whether the source page itself has a role descriptor (e.g. a person-page that establishes "the user is the engineer working on core-memory-kit" — outbound refs to projects then default to `works_on` even when individual link contexts lack the verb). Catches narrative prose where the verb appears once and downstream references rely on it being implied.

**Companion subcommand:** `cmk graph-query <slug> --type <edge-type>` for multi-hop traversal. Edge storage: every typed edge writes both directions (`from → to` AND `to ← from`) so traversal is symmetric. Per-page backlink count feeds §16.17's retrieval ranking (also informed by GBrain) when we add hybrid search.

**Why we'd port the technique but not the code.** GBrain's [`link-extraction.ts`](https://github.com/garrytan/gbrain/blob/master/src/core/link-extraction.ts) (~640 lines) is MIT-licensed and could in principle be reused with attribution. But: (a) it's tuned for the page-shaped knowledge model GBrain uses (entity pages with frontmatter), not our per-fact-archive shape; (b) the regex catalogs would need substantial rework for developer prose; (c) the implementation is tightly coupled to their `BrainEngine` interface. Cleaner to re-implement the *technique* (dir-whitelist + verb regex + page-role prior) with our shape and our catalogs. SOURCES.md records the inspiration.

**Deferred to v0.3:**

- Schema packs (agent-authored evolvable types — GBrain's `gbrain schema use ...` system). Right now the kit ships fixed scratchpad types; making them agent-evolvable adds scope. File as v0.3 candidate IF user feedback indicates the fixed scratchpad set is too rigid for their use cases.
- Frontmatter-derived edges (per-fact `related: [...]` fields auto-becoming edges). Useful but larger than v0.2's cut.

### 16.20 Self-host the kit's SessionStart injection on its own build environment

**v0.1.x candidate.**

The kit's auto-extract + SessionStart + scratchpads exist and ship in v0.1.0. Cold session, the user, and Claude (reviewer) have been managing campaign state via manual journey log + design.md + tasks.md updates — the durable spec stack working as designed. But the kit's own scratchpads at `c:/Projects/core-memory-kit/context/` are not loaded at session start; we've been treating `context/` as test-target output rather than as the kit's own memory.

**Soft dogfooding** (read side only — install SessionStart hook on the kit's own `context/`, leave auto-extract write side OFF during active kit development to avoid recursive modification) would absorb some of the manual discipline. Auto-load campaign state at session start; no recursive write-during-modification risk.

Deferred to v0.1.x because the manual disciplines work, the write side has recursive complexity (a session modifying `auto-extract.mjs` while auto-extract runs against that session creates uncertainty), and v0.1.0 release is better served by completing the audit campaign than expanding scope.

**The meta-irony worth documenting:** this is the **9th instance** of the cross-build pattern — we have the solution, it exists in the codebase, it shipped (Task 23), and we've been hand-rolling manual workarounds because nobody triggered the question "could we use this on ourselves?" Same shape as the skills library miss (had it, never surveyed — PR-D's planned skill experiment), the Goldberg attribution miss (knew the source, never cited — caught by PR-A's five-doors restoration), the audit campaign itself (rules exist, never enforced — what this whole campaign exists to fix). Documenting here so the option is visible after v0.1.0 ships.

### 16.21 `InstructionsLoaded` hook integration (article-verification finding)

**v0.1.x candidate.**

Surfaced by the 2026-05-26 article-verification side quest. Anthropic's official Claude Code docs document an `InstructionsLoaded` hook (see [code.claude.com/docs/en/memory](https://code.claude.com/docs/en/memory), Troubleshoot section): *"Use the `InstructionsLoaded` hook to log exactly which instruction files are loaded, when they load, and why."* The kit's hook research base ([`docs/research/2026-05-21-claude-ai-deep-research-option-b.md`](../docs/research/2026-05-21-claude-ai-deep-research-option-b.md)) enumerates 8 lifecycle hooks (SessionStart / UserPromptSubmit / PreToolUse / PostToolUse / Stop / SessionEnd / PreCompact / Notification) but does NOT include `InstructionsLoaded` — an integration gap the article-verification surfaced indirectly.

Use cases for the kit:

- **`cmk doctor` HC-* diagnostics**: log which kit-installed CLAUDE.md / `.claude/rules/*.md` files are actually loaded, when. If a user reports "the kit's instructions aren't firing," this hook tells us whether the files are visible to Claude Code at all.
- **Debug aid for the campaign's `validate-references.mjs` rollout**: when the validator surfaces a broken internal reference, the user might want to know whether that file was even loaded. `InstructionsLoaded` provides the ground-truth.

Deferred to v0.1.x because: (a) the kit currently functions without it; (b) needs research-base entry (deep-dive against the actual hook payload + timing semantics); (c) the kit's existing hooks already cover the high-leverage lifecycle events for v0.1.0.

Provenance: [`docs/research/2026-05-26-claude-code-memory-guide-verification.md`](../docs/research/2026-05-26-claude-code-memory-guide-verification.md) (side-finding #1).

### 16.22 MEMORY.md 25KB ceiling vs the kit's cap composition

**v0.1.x candidate (composition-verification class).**

Surfaced by the 2026-05-26 article-verification side quest. Anthropic's official docs: *"The first 200 lines of `MEMORY.md`, **or the first 25KB, whichever comes first**, are loaded at the start of every conversation."* The kit's [§7 cap-coordination invariant](#snapshot-cap-coordination-rule-binding) currently encodes the 200-line rule (via per-tier scratchpad budgets) but does NOT directly encode the 25KB byte-ceiling that Anthropic enforces on a separate file (`MEMORY.md` — the auto-memory entry-point, not the kit's per-tier scratchpads).

The composition question: when the kit's auto-extract subagent writes to MEMORY.md, does the 200-line-bullet-heavy output fit within 25KB? Or could a bullet-heavy MEMORY.md exceed 25KB before hitting the 200-line ceiling? A bullet-heavy `MEMORY.md` with average line-length 50 chars would fit 200 lines in ~10KB (well under 25KB). A paragraph-heavy file with 150-char lines would fit 200 lines in ~30KB (over 25KB — Anthropic truncates at the byte limit, dropping the last lines silently).

The kit's snapshot cap is currently 12KB total across tiers (per `DEFAULT_CAP_BYTES` in `inject-context.mjs`) — much less than Anthropic's 25KB MEMORY.md ceiling, so we're nominally safe. But if Anthropic raises their ceiling or the kit grows its per-tier budgets, the composition could drift. v0.1.x: add a `validate-memory-md-ceiling.mjs` validator OR a §7.1 amendment that explicitly states the kit's cap composes within Anthropic's ceiling.

This is the 5th instance of the composition-verification pattern (CLAUDE.md "Composition verification" rule — PR-14 / PR-22 / PR-25 / PR-A and now this).

Provenance: [`docs/research/2026-05-26-claude-code-memory-guide-verification.md`](../docs/research/2026-05-26-claude-code-memory-guide-verification.md) (side-finding #3).

### 16.23 Block-level HTML-comment stripping pattern in template CLAUDE.md

**v0.1.x candidate.**

Surfaced by the 2026-05-26 article-verification side quest. Anthropic's official docs: *"Block-level HTML comments (`<!-- maintainer notes -->`) in CLAUDE.md files are stripped before the content is injected into Claude's context. Use them to leave notes for human maintainers without spending context tokens on them. Comments inside code blocks are preserved."*

Use case for the kit's [`template/CLAUDE.md.template`](../template/CLAUDE.md.template): the template currently has either no maintainer notes OR token-spending inline prose. Anthropic's stripping rule means we can add:

```markdown
<!--
MAINTAINER NOTE: This file is the kit's auto-installed CLAUDE.md
template. Edit `template/CLAUDE.md.template` in the kit repo, not
the installed copy; `cmk repair` re-syncs from the template.
-->
```

…and the user's session won't burn tokens on the maintainer note. The kit's own `CLAUDE.md` could use the same pattern for internal-build notes (the "Working style locked in by the user" preamble could move into a stripped comment if we want to hide it from session context while keeping it visible to maintainers in the file).

Deferred to v0.1.x because: (a) low priority — the kit functions without it; (b) requires the template scaffold to settle (Task 14 still has follow-on work); (c) the optimization is small per file but useful at scale across the kit's template + per-tier CLAUDE.md emissions.

Provenance: [`docs/research/2026-05-26-claude-code-memory-guide-verification.md`](../docs/research/2026-05-26-claude-code-memory-guide-verification.md) (side-finding #4).

### 16.24 Shared queue-file parser primitive

**v0.1.x candidate.**

Surfaced by Task 26 (review-queue) code-review (2026-05-27). Both [`packages/cli/src/review-queue.mjs`](../packages/cli/src/review-queue.mjs) and [`packages/cli/src/conflict-queue.mjs`](../packages/cli/src/conflict-queue.mjs) parse the same shape of markdown queue file: `## <ts> — <header>` block + bullet + `<!-- provenance -->` HTML comment + blank-line separator. Each module has its own parser (`parseReviewQueue`, `parseConflictQueue`); the regex shape and block-walking logic are ~80% identical.

Deferred to v0.1.x as **premature abstraction**: with only 2 callers the duplication is cheaper than the indirection. The extraction trigger is a 3rd queue-shaped file shipping (e.g., a `queues/distill.md` for Layer 6, or a `queues/lessons-promote.md` companion to `lessons-promote.mjs`). At that point: extract `parseMarkdownQueue({text, headerPattern, bulletExtractor})` into a shared `packages/cli/src/queue-format.mjs` module + migrate both existing callers + add the new caller.

Why not now: the kit's "deep modules with simple interfaces" rule (CLAUDE.md Engineering discipline) cuts both ways. Two callers with co-located logic IS simple; one abstract parser with a parameterized configuration is shallower per-call but introduces a coordination point the kit doesn't need yet. The 3rd-instance rule defers the extraction to the moment it pays for itself.

Provenance: Task 26 code-review-excellence Suggestion (2026-05-27) — flagged by the holistic-pass review as "parser similarity worth noting; defer extraction to 3rd-instance rule."

### 16.25 `validate-integration-coverage.mjs` — structural enforcement of §17.8

**v0.1.x candidate.**

Surfaced 2026-05-27 alongside the §17.8 rule. The "Integration-test coverage for cross-module flows" discipline (design §17.8) has a structural shape that admits validator enforcement: every `packages/cli/src/*.mjs` file that imports another kit-module's public function should have at least one test that exercises that call path through both modules' public surfaces (not mocked).

Candidate validator design:

1. Build a dependency graph from `packages/cli/src/`: which modules import which.
2. For each (A, B) where A imports B, scan `tests/` for a test file that imports BOTH A and B (or imports A and asserts B's documented side effects — state in shared files, audit-log entries, etc.).
3. Flag missing pairs as `(A → B): no integration test found`.
4. Suppression marker: `// integration-coverage: <reason>` in the importing file (for cases where A's use of B is a leaf call that per-module tests cover sufficiently — e.g., a logger import).

Deferred to v0.1.x because:

- Heuristic depth — distinguishing "real integration test" from "mocked stand-in" requires reading test contents and identifying which imports are real vs `vi.mock`'d. The other kit validators (refs, gaps, exit-doors, composition, platform-commands) operate on syntactic / textual signal; this one needs semantic test introspection.
- The rule's tactical force comes from the CLAUDE.md headline + design §17.8 prose, which the code-review-excellence ONE-holistic-pass discipline already enforces at PR time.
- v0.1.0 has zero confirmed instances of the bug class beyond Task 25 → 25b (the rule's source case); the validator's value is in catching the SECOND instance, not the first.

Trigger to ship: a second `generateId`-style latent cross-module bug (named-args mismatch, default-arg drift, return-shape contract slip) makes it past the code-review pass and the post-release campaign. At that point the validator's heuristics get calibrated against two real failures, not one.

Provenance: the user 2026-05-27 picked option #1 (move to design §17.8 now) + option #3 (write validator) as v0.1.x candidate, deferring #2 (fold into Composition verification as sub-bullet) and the immediate validator build.

### 16.26 Integration tests for CLI subcommand stdin / readline glue

**v0.1.x candidate.**

Tracked from Task 25 + Task 26 code-review findings (the latter as Minor #5). The two interactive subcommand handlers — `runQueueConflicts` and `runQueueReview` in [`packages/cli/src/subcommands.mjs`](../packages/cli/src/subcommands.mjs) — wrap their respective resolvers (`resolveConflictQueue`, `resolveReviewQueue`) with a readline-based prompter that reads from `process.stdin` and writes to `process.stdout`. Today's tests cover the resolvers via sandbox prompters that simulate decision arrays in-memory; the readline + stdin layer is uncovered.

What's missing: a test that spawns `cmk queue conflicts` or `cmk queue review` as a real subprocess with seeded queue files, pipes decisions through stdin, and asserts the side effects landed (state on disk + audit-log entries). This is integration coverage for the spawn boundary at the CLI binary layer — same shape as the spawn-smoke discipline (§17.3) but for stdin-driven interactive subcommands rather than `claude --print` API calls.

Deferred to v0.1.x because:

- Both subcommands' resolvers are unit-tested thoroughly with sandbox prompters (8 cases each), so behavior beyond the readline glue is pinned.
- The CLI glue is mechanically simple — `createInterface({input: process.stdin})` + a `rl.question` loop with validation against a fixed enum — so the regression surface is small.
- Writing CLI stdin tests on Windows requires careful attention to line-ending and pipe-buffering quirks (CRLF vs LF in piped stdin; readline's interactive-mode auto-detection). The investment is real but not justified before the rest of v0.1.0 ships.
- Per §17.8's principle — integration tests are required where modules COMPOSE. The CLI glue's composition is `subcommands.mjs → resolveXxx → {audit-log, conflict-queue, scratchpad}` — every downstream layer is already integration-tested via the resolvers' direct tests. The CLI glue is a single thin readline-prompt wrapper, not a composition point.

Ship trigger: a bug surfaces in the readline-prompt layer that the per-module resolver tests + the cmk-scaffold tests don't catch (e.g., the prompter rejects valid-but-trimmed inputs, or readline's input encoding diverges from sandbox-prompter's plain-string inputs).

Until then, the §6 / §6.8 conflict-queue + review-queue contracts are pinned by resolveConflictQueue / resolveReviewQueue unit tests, and `cmk queue {conflicts,review}` is wired through `subcommands.mjs` whose dispatch is pinned by [`tests/cli-scaffold.test.js`](../tests/cli-scaffold.test.js) (NON_STUB_CHILDREN allowlist).

Provenance: Task 25 + Task 26 code-review-excellence holistic-pass findings (2026-05-26, 2026-05-27). Both code-review writeups flagged the CLI glue as untested at the integration level, parking it as a v0.1.x candidate; this entry is the durable single-source-of-truth record.

### 16.27 PostToolUse vs SessionEnd race on `now.md`

**SHIPPED 2026-06-07 (Task 106) — the file-rename fix (candidate #1 below) landed.** `compressSession` now CLAIMS the live buffer by an atomic rename (`now.md → now.md.rolling-{ts}`) before the Haiku call, compresses the claimed copy, and drops it on success (restores it to `now.md` on failure). A concurrent PostToolUse/capture-turn append during the ~5–10s compression lands on a fresh `now.md` with zero contention — the read→clear window this section documented is gone, for BOTH callers (SessionEnd + the Task 105 SessionStart lazy roll). Pinned by `tests/cli-task27-checkpoint-fixes.test.js` "Task 106 — §16.27 race CLOSED" (a backend that appends mid-compress; the appended turn must survive + the error path restores the buffer) + a 12/12 live-Haiku end-to-end run. The honesty tests' `now.md size === 0` assertions were corrected to "no leftover content (empty OR absent)" — the rename leaves `now.md` absent on an uncontended roll, exactly the size-vs-existence correction this section predicted. The original analysis + the Task 105 amplification note are preserved below for the decision trail.

**Original analysis (was a v0.1.x candidate until Task 106):**

Surfaced by the Task 27 Layer-4 checkpoint review (2026-05-27). PostToolUse is the only async hook in [`plugin/hooks/hooks.json`](../plugin/hooks/hooks.json) (`"async": true, "timeout": 120`); its handler [`packages/cli/src/observe-edit.mjs`](../packages/cli/src/observe-edit.mjs) appends Write/Edit/MultiEdit events to `context/sessions/now.md`. The SessionEnd hook's [`compressSession`](../packages/cli/src/compress-session.mjs) truncates the same file after compression. Failure mode: a long-running PostToolUse append still in flight when the user types `/exit` races with `truncateSync`. On Windows this can throw EBUSY (mitigated by the existing `try { truncateSync; } catch {}` — documented in compress-session.mjs:188-193 as "best-effort"); on POSIX the failure mode is "truncate is lost, now.md contains compressed content PLUS new appends, next SessionEnd re-compresses material that was already compressed."

The existing comment frames the failure as benign ("the next session compresses a slightly-larger buffer — not a data-loss event"). That framing IS correct — no data loss, no corruption — but the kit's "lazy-framing hides real bugs" rule cuts both ways. **Honesty check shipped in v0.1.0** ([`tests/cli-task27-checkpoint-fixes.test.js`](../tests/cli-task27-checkpoint-fixes.test.js) `§16.27 honesty check` describe block): two tests pin the benign-outcome contract — (a) compress-session tolerates leftover content from a race and still produces a structurally valid today-{date}.md, (b) two successive compress-session runs across a simulated race day produce valid output with the documented "noisy duplicates" outcome. The tests will continue to pass after the v0.1.x file-rename fix lands because they pin the BENIGN OUTCOME contract, not the current implementation. They surface immediately if a future change makes the failure mode non-benign (e.g., a refactor that lets EBUSY propagate out as a crash, or a today-{date}.md format change that breaks under same-heading adjacent appends).

Two fix candidates for v0.1.x:

1. **File-rename pattern**: read `now.md` → atomically rename to `now.md.compressing-{ts}` → process the renamed file → unlink it. The rename is atomic on both POSIX (rename(2)) and NTFS (MoveFileEx); PostToolUse continues appending to a freshly-opened `now.md` without contention.
2. **Add a test pinning the benign-failure mode**: assert that on truncate failure, the next `compressSession` call still produces valid output (no double-compress of already-compressed sections, OR if double-compress is accepted, no malformed today-{date}.md).

Deferred to v0.1.x because: (a) no data-loss path; (b) the 120s cooldown (now correctly composed across auto-extract + compress-session per §8.5 / Task 27 B2 fix) prevents the double-compress from running back-to-back; (c) v0.1.0 has no test coverage gap relative to the existing "best-effort" contract — adding rename semantics is a real design change, not a hot-fix.

Trigger to ship: a real instance of the race causing visible user pain (corrupted today-{date}.md OR cost-budget overrun from double-compress).

**Task 105 interaction (2026-06-07) — the likelihood went UP, and a minor new loss path opened.** Task 105 (D-78) added a SECOND caller of `compressSession`: the SessionStart lazy roll (detached). Unlike SessionEnd (the session is ENDING, so no concurrent appender — the race needs a still-in-flight PostToolUse), the SessionStart roll fires while a NEW session is STARTING and actively appending to `now.md`. `compressSession` reads `now.md`, spends ~5–10s in the Haiku call, then `truncateSync(now.md, 0)` — so a new turn appended in that window is **dropped from `today-*.md`** (NOT merely re-compressed next time, as in the SessionEnd case). **Bounded:** the dropped turn still lives in `context/transcripts/{date}.md` (capture-prompt/capture-turn write it there), so it's a session-DIARY fidelity gap, recoverable — not durable-memory loss. **Timing usually avoids it:** a new session's first `now.md` append (first Stop/PostToolUse) typically lands AFTER the ~10s roll completes (the user is still reading injected context / typing). **Net still strongly positive:** before Task 105, a never-cleanly-closed session left `now.md` growing UNBOUNDED and never rolling at all — a rare one-turn diary gap is far better. **This is now the concrete "visible user pain" trigger** for the file-rename fix (candidate #1): it closes the race for BOTH callers atomically. Recommend shipping it as a focused follow-up (the rename touches the shared `compressSession` read/truncate steps + needs its own race test, so it earns its own PR rather than riding Task 105).

Provenance: Task 27 code-review finding I4 (2026-05-27); Task 105 self-review (2026-06-07).

### 16.28 Windows `shell: true` grandchild process reaping

**v0.1.x candidate.**

Surfaced by the Task 27 Layer-4 checkpoint review (2026-05-27). [`packages/cli/src/compressor.mjs:213-224`](../packages/cli/src/compressor.mjs) spawns `claude.cmd` with `shell: true` on Windows (required to resolve .cmd shim extensions — CVE-2024-27980 hardening). The Windows-specific process tree becomes:

```text
parent node (kit)
  └─ cmd.exe              ← immediate child (shell:true)
      └─ claude.cmd       ← .cmd shim
          └─ node         ← grandchild running the actual Anthropic API call
```

POSIX has no `shell: true` requirement — spawn is single-child, no grandchild surface.

#### What the kill chain actually does

[`terminateSubprocess`](../packages/cli/src/compressor.mjs) at compressor.mjs:106-139 calls `child.kill('SIGTERM')` then `child.kill('SIGKILL')` against the **immediate child only**. On Windows, Node maps both signals to `TerminateProcess` against cmd.exe's PID. No `taskkill /T`, no Windows Job Objects, no tree-kill mechanism.

[`tests/spawn-smoke-kill-chain.test.js`](../tests/spawn-smoke-kill-chain.test.js) spawns its fixture via `spawn(process.execPath, [HANG_FIXTURE])` — a direct single-child tree. The test pins the immediate-child kill behavior but does NOT cover the production three-deep tree. The test's own comment acknowledges this scoping at line 22-24.

#### Actual grandchild lifecycle when cmd.exe is killed

When cmd.exe dies via `TerminateProcess`, the grandchild is NOT auto-reaped — Windows has no parent-death-cascades-to-descendants behavior without Job Objects. Node's `ChildProcess` emits 'exit' for cmd.exe, which causes the stdio pipes to be closed on the kit's side. The grandchild then exits via one of:

1. **Pipe-write failure (most common)**: the grandchild's stdout was inherited through cmd.exe; when cmd.exe dies and the pipe is closed on the kit's read side, the grandchild's next write to stdout (writing the API response) fails with broken-pipe-equivalent, and the grandchild exits.
2. **Anthropic API server timeout**: if the API is truly hung, the grandchild's internal HTTPS client eventually times out server-side; the grandchild exits via its own error-path.
3. **Manual kill**: a user noticing the orphan in Task Manager runs `taskkill /PID <pid>`.

In practice, path #1 fires within seconds of our kill — bounded by how long the API takes to produce a response once we've stopped waiting. The slow-API case (which is why our inner timeout fired in the first place) means the grandchild was already deep in the await; once the API responds (typically a few more seconds, sometimes longer), the broken-pipe-exit fires.

#### Concrete impact in v0.1.0

| Concern | Observed behavior |
| --- | --- |
| Kit functions correctly | Yes — kit settled the Promise rejection at timeout; no waiting on grandchild |
| Data loss / corruption / crash | None |
| Cost overhead | None (API call was already initiated server-side before our timeout; charged regardless) |
| Brief orphan process | Yes — typically a few seconds bounded by API response time |
| Rare truly-hung-API case | Orphan can persist longer; bounded by Anthropic's own server-side timeout |
| Lock interference | None — kit's locks key on the parent kit PID, not the grandchild |
| MCP-config tempfile cleanup race | `rmSync(sandbox)` runs before the kill chain; if the grandchild is mid-read, Windows can emit EBUSY which is swallowed by the existing catch |
| User-visible | Mostly no — Task Manager would briefly show extra node processes |

#### Why no v0.1.0 honesty test

Unlike §16.27 (where two simple tests pin the benign-outcome contract without changing production code), §16.28's behavior is OS-level + non-deterministic timing-dependent. A proper test would exercise the production shell:true spawn shape with a hang fixture AND assert the grandchild's eventual lifecycle — real work that arguably belongs WITH the v0.1.x fix, since both touch the same surface. Pinning the immediate-child kill (which we already do) without pinning the grandchild lifecycle would give false confidence.

#### v0.1.x fix sketch

Extend the kill chain to walk grandchildren via Windows Job Objects (associate processes, terminate together) OR shell to `taskkill /T /F /PID <cmd.exe-pid>` (kills the tree). Either choice adds Windows-specific code + test surface. The kit's existing single-child kill-chain test would become a baseline; new tests would exercise the production three-deep tree.

#### Trigger to ship

A real instance of orphaned-grandchild causing observable user pain: zombie process accumulation across many sessions, memory growth pinned to claude.cmd children, hung file handle blocking a subsequent operation, OR Task Manager pollution noticed by a Windows user.

Provenance: Task 27 code-review finding M5 (2026-05-27); empirical audit of `terminateSubprocess` + `spawn-smoke-kill-chain.test.js` (same day, the user's "check please" verification).

### 16.29 Consolidate `BULLET_LINE_RE` across Layer 4 modules

**v0.1.x candidate.**

Surfaced by the Task 27 Layer-4 checkpoint review (2026-05-27). Three modules — [`memory-write.mjs`](../packages/cli/src/memory-write.mjs), [`conflict-queue.mjs`](../packages/cli/src/conflict-queue.mjs), [`review-queue.mjs`](../packages/cli/src/review-queue.mjs) — each declare their own `BULLET_LINE_RE` to parse scratchpad bullet lines. `memory-write.mjs` uses the tight base32 alphabet (matches `ID_PATTERN` from canonicalize); the other two use a looser `[A-Za-z0-9]{8}` that accepts the kit's IDs but also accepts malformed IDs (e.g., a hand-edited bullet with `O` or `I` in the ID).

No behavioral bug today — the looser regex's "tolerance" is benign (reading an externally-edited bullet with a malformed ID is read-only; the kit never re-writes the bad ID). But the drift is a maintenance hazard: a future change to `ID_PATTERN` (e.g., adding a new character class) would need to land in three places.

v0.1.x candidate: extract `BULLET_LINE_RE` into a shared module — either `tier-paths.mjs` (which already owns scratchpad path resolution) or a new `bullet-format.mjs` if the kit grows more bullet-parsing primitives. Import from the three current consumers. The trigger to ship is adding a 4th consumer OR changing `ID_PATTERN`.

Provenance: Task 27 code-review finding M1 (2026-05-27).

### 16.30 Real-spawn integration test for `cmk-auto-extract.mjs` bin wrapper

**v0.1.x candidate.** *Backfilled 2026-05-27 — this entry was claimed-but-never-added in PR #43's housekeeping commit; corrected during Task 28.*

Surfaced by the Task 27 Layer-4 checkpoint review (2026-05-27) as Test Gap #2. The kit has per-module coverage of [`runAutoExtract`](../packages/cli/src/auto-extract.mjs) (32 tests in `tests/cli-auto-extract.test.js` with MockHaikuBackend), and the bin wrapper [`plugin/bin/cmk-auto-extract.mjs`](../plugin/bin/cmk-auto-extract.mjs) has a stub smoke test in `tests/cli-hooks-scaffold.test.js` that confirms it exits 0. Missing: a test that spawns `cmk-auto-extract.mjs` as a subprocess with a hanging Haiku fixture and asserts the kill chain catches it before the outer Stop-hook ceiling fires.

Deferred to v0.1.x because:

- The seam between `runAutoExtract` and the bin wrapper is thin (the wrapper imports + invokes + emits the hook envelope JSON); per-module + bin-stub tests give reasonable confidence
- Writing the test requires a MockHaikuBackend injection hook into the spawned subprocess (env-var override OR argv flag) — a design choice, not a cheap test addition

Ship trigger: a bug in the bin wrapper's stdin parsing or invocation contract that per-module tests don't catch.

Provenance: Task 27 code-review Test Gap #2 (2026-05-27).

### 16.31 Cross-platform runtime test for `recoveryCommand` strings

**v0.1.x candidate.** *Backfilled 2026-05-27 — this entry was claimed-but-never-added in PR #43's housekeeping commit; corrected during Task 28.*

Surfaced by the Task 27 Layer-4 checkpoint review (2026-05-27) as Test Gap #6. [`scripts/validate-platform-commands.mjs`](../scripts/validate-platform-commands.mjs) structurally enforces that every user-facing shell-command emission goes through `platform-commands.mjs` OR carries an explicit `// platform-commands: ignore <reason>` marker. The validator runs at lint time on every `npm test`. Missing: a runtime test that exec's an emitted `recoveryCommand` string on the current platform's native shell and asserts the documented behavior.

Deferred to v0.1.x because:

- The structural validator + manual cross-OS test in PR-E gives reasonable confidence today
- Proper coverage requires a GitHub Actions cross-OS matrix runner (queued for v0.1.x) OR a Windows-specific shell mock — neither is cheap

Ship trigger: a user-reported bug where a `recoveryCommand` doesn't actually work when pasted into the native shell.

Provenance: Task 27 code-review Test Gap #6 (2026-05-27).

### 16.32 Route `getIndexDbPath` through `tier-paths.mjs`

**v0.1.x candidate.**

Surfaced by the Task 28 code-review-excellence pass (2026-05-27). [`packages/cli/src/index-db.mjs`](../packages/cli/src/index-db.mjs) `getIndexDbPath(projectRoot)` joins `projectRoot + 'context' + '.index' + 'memory.db'` inline. The string `'context'` is the P-tier root that [`tier-paths.mjs`](../packages/cli/src/tier-paths.mjs)'s `resolveTierRoot({tier:'P', projectRoot})` already owns. Today's literal happens to match; a future change to the P-tier root convention would silently drift.

Deferred to v0.1.x because:

- The literal is a single segment; duplication cost is small for v0.1.0
- Design §9.1 documents the path literally — keeping production code obviously aligned with the spec has its own clarity benefit
- Tasks 29-31 (reindex, search, MCP) will be the first multi-caller consumers; the refactor is more natural to do once those callers exist

Ship trigger: a 2nd consumer needs the index DB path AND the kit grows a non-default P-tier root convention.

Provenance: Task 28 code-review Minor #1 (2026-05-27).

### 16.33 FTS5 availability probe in `openIndexDb`

**v0.1.x candidate.**

Surfaced by the Task 28 code-review-excellence pass (2026-05-27). `better-sqlite3` ships prebuilt binaries with FTS5 compiled in by default, so the kit's common-case install path always has FTS5. But a user who builds `better-sqlite3` from source against a custom libsqlite3 build could land a binary without FTS5. Today, the failure surfaces as a cryptic `SqliteError: no such module: fts5` at the `CREATE VIRTUAL TABLE ... USING fts5(...)` step.

A friendly check would be: `try { db.prepare("SELECT fts5(?)").get('check'); } catch { return errorResult({category: ERROR_CATEGORIES.SCHEMA, errors: ['SQLite build missing FTS5 module — search layer disabled. Reinstall better-sqlite3 from prebuilt binaries: npm install --force better-sqlite3']}); }` before applying the schema.

Deferred to v0.1.x because:

- `cmk doctor` (Task 37) is the natural home for environment checks of this class — bundling the FTS5 probe into doctor's `HC-*` checks composes with the kit's broader diagnostic surface
- The prebuilt-binary default makes the failure rare for the v0.1.0 audience

Ship trigger: a user-reported build-from-source install path that lands without FTS5. Most likely along with `cmk doctor` HC implementation.

Provenance: Task 28 code-review Minor #2 (2026-05-27).

### 16.34 SQLite `busy_timeout` pragma for MCP-server + reindex composition

**✅ SHIPPED 2026-07-11 (Task 219, D-321) — with a premise correction.** `openIndexDb` now sets `db.pragma('busy_timeout = 5000')` explicitly, and the §16.35 cross-process concurrent-writer test pins the behavior (a real second process holds `BEGIN IMMEDIATE`; the parent's write WAITS and lands instead of throwing). **The premise below was wrong for our driver:** better-sqlite3's `Database` constructor defaults its `timeout` option to **5000ms** (verified in `lib/database.js` — the primary source; the behavior test passed BEFORE any code change), so the immediate-SQLITE_BUSY failure this section predicted could not actually occur through `openIndexDb`. The pragma converts that accidental protection into an explicit, test-guarded contract (a future driver major or a `timeout: 0` option can no longer silently remove it). Original proposal preserved below per the decision-trail rule.

**Original analysis (2026-05-27, superseded on the default-value premise):**

Surfaced by the Task 28 code-review-excellence pass (2026-05-27) as a composition note for Task 31. The kit's index DB is opened with WAL + `synchronous=NORMAL` (design §9.1), which lets readers + one writer coexist. But the kit does NOT set `busy_timeout` — so a caller hitting database lock contention (e.g., MCP server holding a long read transaction while `cmk reindex` writes) gets an immediate `SQLITE_BUSY` instead of waiting for the lock to clear.

Easy fix: `db.pragma('busy_timeout = 5000')` in `openIndexDb` adds 5s of patience before SQLITE_BUSY surfaces. Per sqlite.org/pragma, this is the recommended posture for WAL databases with multiple connections.

Deferred to v0.1.x because:

- Task 28 ships ONLY the schema + open function; concurrent-access pressure doesn't surface until Task 31 (MCP server) lands
- The right composition pair is "MCP server + reindex" — Task 31's PR is the natural home for the busy_timeout fix
- The kit's writes are short (reindex of a single markdown file = milliseconds), so SQLITE_BUSY surfacing is itself rare in v0.1.0

Ship trigger: Task 31 implementation. Task 28's surface is forward-compatible — Task 31 amends `openIndexDb` to set the pragma alongside MCP server's own connection-management posture.

Provenance: Task 28 code-review composition note for Task 31 (2026-05-27).

### 16.35 Real concurrent-writer test for runtime watcher + reindex

**✅ SHIPPED 2026-07-11 (Task 219, D-321).** `tests/cli-index-db-busy-timeout.test.js` is the real cross-process test this section called for: a second Node process (`tests/fixtures/hold-index-write-lock.mjs`) acquires `BEGIN IMMEDIATE` on the same index DB, signals via sentinel, holds ~600ms; the parent's write waits out the hold and succeeds, with timing assertions proving it actually contended. Original deferral analysis preserved below.

**Original analysis (2026-05-27):**

Surfaced by the Task 29 code-review-excellence pass (2026-05-27) as Important finding I3. The kit's runtime watcher and `reindexBoot` both write to the index DB. In v0.1.0 with better-sqlite3's sync API + JavaScript's single-threaded runtime, "concurrent" actually means "sequential at the JS level" — the watcher event handler doesn't fire DURING a `reindexBoot` transaction, only between transactions. Existing test 29.4 #5 pins this sequential composition (boot writes → watcher writes-on-top → DELETE-INSERT replace → no duplicates).

A real mid-transaction race test would need:

- A second process holding the DB while the test process runs boot
- Timing fixtures to interleave operations
- Windows-specific lock semantics for SQLITE_BUSY scenarios

Deferred to v0.1.x because:

- v0.1.0's single-process design makes real mid-transaction races structurally impossible — both watcher events and boot/full reindex run on the same Node event loop
- The composition surface that DOES exist (watcher + boot sequential, separate transactions) is pinned by the renamed 29.4 #5 test
- Multi-process pressure surfaces when Task 31 (MCP server) lands — its connection-management posture composes with §16.34's `busy_timeout=5000` plan

Ship trigger: Task 31's MCP server creates a second process opening the same DB; the test pair becomes "boot in process A + MCP read transaction in process B" with timing fixtures that can be platform-specific.

Provenance: Task 29 code-review finding I3 (2026-05-27).

### 16.36 Stricter `userDir` boundary check in index-rebuild

**v0.1.x candidate.**

Surfaced by the Task 29 code-review-excellence pass (2026-05-27) as Important finding I1. `resolveTierRoot({tier:'U', userDir: undefined})` falls back to `homedir() + .core-memory-kit`. If a future caller (e.g., a SessionStart hook handler) invokes `startRuntimeWatcher` or `reindexBoot` without passing `userDir`, the U-tier path silently resolves to the user's real home-dir kit installation. In production this is actually CORRECT (the user's home IS where U-tier lives), so the current behavior matches the kit's `tier-paths.mjs` convention. The risk is purely test-side: a future test that forgets to pass `userDir` would silently walk the developer's real home dir.

Today's tests in `tests/cli-index-rebuild.test.js` all pass `userDir` explicitly (sandbox-rooted). `subcommands.mjs`'s `runReindex` also passes `userDir = join(homedir(), '.core-memory-kit')` explicitly. The current production callers are safe.

Deferred to v0.1.x because:

- No current caller hits the fallback unsafely
- The fallback IS the production-correct behavior — making it stricter would require a separate "test-only" vs "production" code path, which is worse than a documentation note
- A v0.1.x audit could add a `require-explicit-userDir` mode for hardening test discipline if the issue recurs

Ship trigger: a real-world bug where a caller forgot `userDir` and walked the developer's real home dir in CI.

Provenance: Task 29 code-review finding I1 (2026-05-27).

### 16.37 Hybrid mode over-fetching for better RRF quality

**v0.1.x candidate.**

Surfaced by the Task 30 code-review-excellence pass (2026-05-27) as Minor finding M2. The kit's hybrid mode fetches `limit` results from each of the keyword + semantic backends, then fuses via reciprocal-rank fusion (RRF) and slices to `limit`. Standard IR practice is to over-fetch 2-3× from each backend so good documents at rank `limit+1..3×limit` from one backend (that would have been promoted by their high rank in the OTHER backend) aren't dropped before fusion.

Today's implementation: `runKeywordSearch(opts.db, opts)` uses `opts.limit ?? 20`; same for the semantic backend. Acceptable for v0.1.0 with single-process usage and the small ~10k corpus the kit indexes. Becomes noticeable when (a) the corpus grows to 100k+ observations, or (b) keyword + semantic rankings disagree heavily for a query (where one's top-20 has no overlap with the other's top-20 → RRF can't fuse what wasn't fetched).

Deferred to v0.1.x because:

- v0.1.0 doesn't ship the semantic backend at all (memsearch + Milvus is Layer 5b OPTIONAL)
- Over-fetch tuning is more usefully calibrated against real corpora + real semantic embeddings — neither exists today

Ship trigger: Task 31's MCP server with a live semantic backend + observed "missing-but-relevant-in-other-backend" complaints from users.

Provenance: Task 30 code-review Minor #2 (2026-05-27).

### 16.38 Best-column snippet rendering

**v0.1.x candidate.**

Surfaced by the Task 30 code-review-excellence pass (2026-05-27) as Minor finding M5. The kit's keyword backend uses SQLite's `snippet(observations_fts, 0, ...)` — column index `0` is hardcoded to `body`. When a query matches `heading_path` or `write_source` but not the body (e.g., a search for `Active Threads` finds bullets under that heading), the snippet returned is unhighlighted body text rather than a snippet of the matched column.

v0.1.x candidate: detect which column matched (via FTS5's `highlight()` over all columns, or by inspecting the FTS5 match info) and render the snippet from the best-matching column. Acceptable degradation for v0.1.0 since the body column is what users care about in the common case; users searching by heading_path or write_source are typically power users who already know what they're looking for.

Ship trigger: a v0.1.x audit of search-snippet quality + user feedback on "the snippet doesn't show me why this matched."

Provenance: Task 30 code-review Minor #5 (2026-05-27).

### 16.39 mk_remember cites parameter — wire through memoryWrite provenance

**~~v0.1.x candidate~~ — CLOSED 2026-07-19 (Task 227, D-358; see the closure block below).**

Surfaced by the Task 31 code-review-excellence pass (2026-05-28) as Important finding I1. The MCP tool `mk_remember`'s public surface documents a `cites?: string[]` parameter (design §10's tool table). The underlying [`memoryWrite`](../packages/cli/src/memory-write.mjs) function doesn't accept `cites` today — its provenance frontmatter is generated from `source`, `at`, `sha1`, etc., not from a caller-supplied citation list.

Behavior through Task 227 (message reworded in Task 121, 2026-06-09): `mk_remember` rejected requests with non-empty `cites` with a "not recorded yet — omit it" error (the Zod `.describe()` said the same). The schema still accepts the parameter so an empty array is a no-op; citation linking was deferred behind the trigger below.

v0.1.x candidate: wire `cites` through `memoryWrite` → provenance frontmatter as an optional `cites: [P-XXX, P-YYY, ...]` field. Then downstream (`mk_get`, the indexer) can surface citation relationships. Requires:

1. `memoryWrite` parameter extension (optional `cites: string[]`)
2. provenance.mjs `writeBullet` extension (optional 8th field)
3. design §4 provenance schema update
4. `mk_remember` removes the rejection guard

Ship trigger: a user-facing need for citation linking. Most likely as part of v0.1.x's MCP server hardening or a Knowledge-Graph extraction layer.

Provenance: Task 31 code-review Important #1 (2026-05-28).

**CLOSED 2026-07-19 (Task 227, D-358) — deliberately NOT wired; the rejection is now the permanent contract.** The trigger question ("a user-facing need for citation linking") resolved NO on both halves: **write-time** fact-linking already ships as the `links` param (→ `related` frontmatter + `[[cross-links]]`, wired on both `cmk remember --links` and `mk_remember`), so `cites` would be a redundant second surface for the same capability; **recall-time** citations are provenance's job and are now complete (Task 227 surfaced `date` + `heading` on every search hit, alongside the existing id + `source_file:line`) — a caller never needs to hand-supply what the kit derives. The `cites` schema key stays (an empty array remains a no-op for back-compat) and a non-empty array errors permanently, pointing at `links` — silently dropping it would tell the model a citation landed when it didn't. Pinned by the cli-mcp-server contract test. The original wiring plan above is preserved as the decision trail; re-open only with new evidence of a need neither `links` nor provenance covers (e.g. a Knowledge-Graph layer wanting typed edges).

### 16.40 mk_remember tier U / L support

**v0.1.x candidate.**

Surfaced by the Task 31 code-review-excellence pass (2026-05-28) as Important finding I2. The MCP tool `mk_remember` accepts `tier: 'U' | 'P' | 'L'` per design §10, but v0.1.0's implementation only writes to tier P (project) — The user-tier templates (`USER.md`, `HABITS.md`, `LESSONS.md`) and local-tier templates don't have `MEMORY.md` with an `Active Threads` section, so `memoryWrite` would fail with `NOT_FOUND` when called with `tier: 'U'` or `tier: 'L'`.

Current behavior (REVISED in Task 121, 2026-06-09 — D-102): `mk_remember` **and** `cmk remember` **no longer reject** U/L — they **capture at the project tier (P)** and attach a shared `tier_note` pointing to `mk_lessons_promote` (/ `cmk lessons promote`) for making a fact cross-project. The three adapter paths (CLI terse / CLI rich / MCP) had diverged — error / warn / error — with three independently-stale "v0.1.0" messages; the note now comes from ONE source (`remember-core.nonProjectTierNote`), so it can't drift again. The misleading NOT_FOUND is avoided because the write always targets P. **Direct U/L scratchpad routing stays the deferred feature (the v0.1.x candidate described below).**

v0.1.x candidate: parameterize the scratchpad + section routing per tier. For tier U, write to `USER.md` § a real heading (TBD: which one — `Habits`? `Lessons`? Or a new `Notes` section). For tier L, similar decision for `context.local/MEMORY.md` (which DOES exist in the template).

Ship trigger: a user-facing need for cross-tier writes from the MCP surface. Most likely after Task 26's review-queue + Task 25's conflict-queue gain "promote to user tier" or "demote to local" semantics.

Provenance: Task 31 code-review Important #2 (2026-05-28).

### 16.41 Structural stdout-purity validator for MCP server

**v0.1.x candidate.**

Surfaced by the Task 31 code-review-excellence pass (2026-05-28) as Important finding I5. The MCP server's correctness rests on "no `console.log` or `process.stdout.write` in the call graph of any tool callback" — stdout is reserved for SDK-emitted JSON-RPC messages per design §10.1. Today, the kit's call graph is clean (verified by grep across all modules transitively imported by [`mcp-server.mjs`](../packages/cli/src/mcp-server.mjs)), but the discipline is prose-only. A future PR can add a `console.log` to `memory-write.mjs` or `search.mjs` and pollute stdout for the MCP server with no test catching it.

v0.1.x candidate: `scripts/validate-mcp-stdout-purity.mjs` — walks the import graph from `mcp-server.mjs` (via a static-analysis traversal of `import` statements), then greps every reachable module for `console.log` / `process.stdout.write` / unbounded `console.*` calls. Per-line suppression marker (`// stdout-purity: ignore <reason>`) for legitimate cases (none currently exist).

Deferred to v0.1.x because:

- v0.1.0's call graph is verifiably clean (manual audit + the existing CLI tests would surface stdout drift indirectly)
- The validator's import-graph traversal is non-trivial — needs to handle dynamic imports + side-effect-only imports + re-exports
- More useful AFTER v0.1.x adds the cron compression layer (Task 33+) which expands the call graph

Ship trigger: stdout drift surfaces in a real MCP session OR a future PR's diff touches MCP-reachable code.

Provenance: Task 31 code-review Important #5 (2026-05-28).

### 16.42 MCP path-traversal JSON-RPC error mapping

**v0.1.x candidate.**

Surfaced by the Task 31 code-review-excellence pass (2026-05-28) as Blocking finding B2 (partial — JSON-RPC `-32602` mapping). Tasks.md 31.6 #4 says "path traversal: arg with `..`, `%2e%2e`, or `/etc/passwd` → JSON-RPC error `code: -32602`". The [`validatePath`](../packages/cli/src/mcp-server.mjs) helper is unit-tested in isolation, but no v0.1.0 tool surface accepts a user-provided path argument:

- `mk_search`: query string + filter enums; no paths
- `mk_get`: `ids[]` validated by `ID_PATTERN`; no paths
- `mk_timeline`: anchor ID + depth numbers; no paths
- `mk_cite`: ID; no paths
- `mk_remember`: text + tier + cites (IDs); no paths
- `mk_recent_activity`: window enum + limit; no paths

So the criterion's literal test ("`..` arg → -32602") has no surface to fire against today. The `validatePath` helper is defensive readiness for v0.1.x tools that DO accept paths (likely candidates: an `mk_export(path)` for sending observations to an external system, or `mk_read_transcript(date)` for surfacing session transcripts).

v0.1.x candidate: when the first path-accepting tool ships, wire `validatePath` into its callback AND add the JSON-RPC `-32602` mapping test that tasks.md 31.6 #4 documents. Until then, the helper passes its 6 unit tests and is exported, ready for use.

Provenance: Task 31 code-review Blocking #2 (partial — 2026-05-28).

### 16.43 `cmk register-crons --daily-only` / `--weekly-only` flags

**v0.1.x candidate.**

Surfaced by Task 34 code-review-excellence Minor #1 (2026-05-28). Task 34's PR made `cmk register-crons` dual-register both daily-distill (23:00 daily) AND weekly-curate (Sun 09:00) by default — the right v0.1.0 UX since v0.1.0 hasn't shipped yet, but post-v0.1.0 some users may want to register only one (e.g., running on a machine that's powered down at 09:00 Sunday, or where the user manages weekly via a different mechanism).

v0.1.x candidate: add `--daily-only` / `--weekly-only` flags + matching `--unregister --daily-only` etc. Ship trigger: a user issue reporting "I only want one cron registered" or a v0.2 release that surfaces the flags via `cmk doctor` recommendation. Until then, users who want only one entry can `cmk register-crons --unregister && cmk register-crons` then manually `unregisterCron({entryName: 'cmk-weekly-curate'})` via a one-liner.

Provenance: Task 34 code-review Minor #1 (2026-05-28).

### 16.44 Per-bullet source-day attribution in `merged_from`

**v0.1.x candidate.**

Surfaced by Task 34 code-review-excellence Minor #2 (2026-05-28). The v0.1.0 `dedupBullets` pass writes `<!-- merged_from: ['YYYY-MM-DD', ...] -->` listing ALL sourceDates the curate call was given — not per-bullet attribution. The reason: today-*.md bullets have no inline day tags Haiku reliably preserves; the conservative attribution names "any of these days could have contributed" rather than "exactly these days contributed."

v0.1.x candidate: change `dedupBullets` to require Haiku output to carry per-bullet day attribution (e.g., a `[YYYY-MM-DD]` tag at the end of each bullet) and have the dedup pass parse those tags. Ship trigger: when audit-trail use cases need bullet-level provenance (e.g., a user asks "when did we first decide X?" and the answer needs to be a specific day rather than "sometime in this week"). Cost: stricter Haiku prompt + parser + fallback for non-conforming Haiku output.

Provenance: Task 34 code-review Minor #2 (2026-05-28).

### 16.45 `archive.md` rotation policy

**v0.1.x candidate.**

Surfaced by Task 34 code-review-excellence Suggestion #1 (2026-05-28). v0.1.0 ships with archive.md growing unboundedly (audit-grade file, not surfaced via SessionStart). After ~1 year of weekly runs the file is ~50 sections × ~4KB = 200KB. Tolerable for v0.1.0; could become a problem for very-long-lived projects.

v0.1.x candidate: when `archive.md` exceeds N MB (default 1MB), rotate to `archive-{YYYY-Q}.md` (quarterly archive partitions) keyed by ISO quarter. Ship trigger: a project that has run the kit for 6+ months reports archive.md exceeding 500KB. Until then, the file is small enough that manual cleanup via `cmk roll` (Task 39) is a sufficient escape hatch.

Provenance: Task 34 code-review Suggestion #1 (2026-05-28).

### 16.46 Direct unit test for `buildWindowsSchtasks` weekly branch

**v0.1.x candidate.**

Surfaced by Task 34 code-review-excellence Suggestion #3 (2026-05-28). The Windows `/SC WEEKLY /D <DAY>` branch in `buildWindowsSchtasks` is currently exercised only via the `runRegisterCrons` integration path. The unit test file `cli-register-crons.test.js` only hits `/SC DAILY`. Functional coverage is adequate (the integration path WILL fail loud if the branch is broken) but unit isolation would catch regressions earlier.

v0.1.x candidate: export `buildWindowsSchtasks` (currently module-private) and add a unit test calling it with `dayOfWeek: 0` asserting output contains `/SC WEEKLY /D SUN`. Ship trigger: a regression class affecting Windows scheduling that the integration test happens to mask.

Provenance: Task 34 code-review Suggestion #3 (2026-05-28).

### 16.47 `cmk doctor --json` flag

**v0.1.x candidate.**

Surfaced by Task 37 code-review-excellence Suggestion #1 (2026-05-28). The v0.1.0 `cmk doctor` prints a human-readable structured report (one `[STATUS] HC-N: name` line per check). For automation use cases (CI/CD pipelines, monitoring dashboards, scripted health checks), a machine-readable `--json` flag would emit the full `runDoctor` result struct (with `checks[]` array including all fields).

v0.1.x candidate: add `--json` flag that prints `JSON.stringify(r, null, 2)` instead of the human-readable report. Ship trigger: user-facing automation use case (CI workflow asking "is the kit healthy?", monitoring dashboard polling). Until then, automated consumers can call `runDoctor()` directly from Node code.

Provenance: Task 37 code-review Suggestion #1 (2026-05-28).

### 16.48 Promote ask-before-install rule to a proper FR/NFR

**v0.1.x candidate.**

Surfaced by Task 37 code-review-excellence Important #1 (2026-05-28). The "any repair requiring `pip install` / `npm install` / system-level changes MUST ASK the user first" rule lives in design §14 as an unsourced design assertion. The original citation was "NFR-9" but NFR-9 (per [`requirements-revisions-proposed.md:125`](../archive/specs/v0.1.0/requirements-revisions-proposed.md)) is "Memory poisoning defense baseline" — different rule entirely. Task 37 PR corrected the citation to "design §14" but the rule still lacks a backing FR/NFR.

v0.1.x candidate: add a proper NFR (e.g., a new NFR like "Consent gate for system-level installs") in `requirements.md`. Ship trigger: an audit campaign verifying every design.md assertion has a backing FR/NFR (parallel to PR-D1's validate-references.mjs but for assertion provenance). <!-- validate-references: ignore (next-NFR placeholder; not yet assigned) -->

Provenance: Task 37 code-review Important #1 (2026-05-28).

### 16.49 Unify install — make `cmk install` a complete entry point (de-plugin-ify hook bins)

**v0.1.x candidate (HIGH priority — UX wart surfaced at first real use).**

Surfaced 2026-05-29 during the post-publish usage walkthrough + the claude-mem install-model comparison (research note [`docs/research/2026-05-29-claude-mem-install-model.md`](../docs/research/2026-05-29-claude-mem-install-model.md)).

**The problem.** v0.1.0 forces a TWO-step mandatory install: `npm install -g @lh8ppl/core-memory-kit` + `cmk install` (scaffolds `context/`) **AND** a separate `/plugin marketplace add` + `/plugin install` (registers the hooks). Neither step alone is complete — `cmk install` scaffolds but does NOT wire the hooks, because the hook bins (`cmk-inject-context`, `cmk-capture-prompt`, `cmk-observe-edit`, `cmk-capture-turn`, `cmk-compress-session`) live in `plugin/bin/` and the hook commands reference `${CLAUDE_PLUGIN_ROOT}`, an env var only Claude Code's plugin loader sets. This was the Task 42 B4 finding ("hooks silently dead if you forget the plugin").

**The comparison.** claude-mem makes the npm route COMPLETE: `npx claude-mem install` registers the plugin hooks + worker for you (its README explicitly notes `npm install -g claude-mem` is "SDK/library only" — the `install` subcommand is what wires everything). So claude-mem offers two *complete* entry points (pick one): `npx claude-mem install` OR `/plugin` marketplace. We offer two *partial* steps that must BOTH run. We're the outlier.

**The fix (already half-built).** We solved this exact problem for the cron bins in Task 33/36 (the B1 fixes): we moved the cron bins out of `plugin/bin/` into the npm package and made `register-crons` emit PATH-resolved/absolute commands instead of `${CLAUDE_PLUGIN_ROOT}`. Apply the identical pattern to the 5 hook bins:

1. Ship the 5 hook bins in the npm package (it already ships the 3 cron bins).
2. Have `cmk install` write the hooks into `<repo>/.claude/settings.json` with PATH-resolved commands (`cmk-inject-context` etc., resolved via the global npm bin dir) — exactly what `cmk repair --hooks` does, minus the `${CLAUDE_PLUGIN_ROOT}` dependency.

Result: `npm install -g @lh8ppl/core-memory-kit` + `cmk install` becomes a complete, self-sufficient entry point (like `npx claude-mem install`). The `/plugin` route becomes optional-alternative (see §16.51), not mandatory-additional.

Ship trigger: v0.1.1. This is the highest-value install-UX fix. Tracked as tasks.md Task 49.

### 16.50 Cross-agent install via `cmk install --ide <agent>`

**v0.2 candidate.**

Surfaced 2026-05-29. The user raised the cross-agent question (codex/cursor/kiro/gemini) at publish time (see ADR-0012). claude-mem's README shows the verified pattern: `npx claude-mem install --ide gemini-cli` / `--ide opencode` — a single installer with an `--ide` flag that auto-detects each agent's config dir and installs the hooks there. Notably claude-mem kept the name "claude-mem" while supporting Gemini + OpenCode, so the "claude" in a product name does not block multi-agent.

For the kit: `cmk install --ide claude-code|cursor|codex|gemini-cli`. The kit's core is already agent-neutral (tenet T1 — markdown is the source of truth; `context/` doesn't care which agent reads it). Only the hook layer is agent-specific. So cross-agent = per-agent adapter modules that know each agent's (a) hook/lifecycle-event names, (b) settings-file location + schema, (c) session-transcript format. The memory store, compression, search, and CLI stay identical.

This depends on §16.49 landing first (once `cmk install` owns hook-wiring for Claude Code, generalizing it to other agents via `--ide` is the natural extension). Ship trigger: v0.2, or earlier if a second-agent user materializes. Tracked as tasks.md Task 50. Cross-ref: ADR-0012 (cross-agent naming deferral), design §16.6 (IDE adapters seam).

#### 16.50.1 Revised architecture — the adapter SEAM (D-180, 2026-06-20; supersedes the "per-agent adapter modules" sketch above)

**Status: ACTIVE BUILD (v0.4.0). The paragraphs above are the original pre-research sketch — preserved per the decision-trail rule. The D-180 research-revisit ([cross-agent adapter seam note](../docs/research/2026-06-20-cross-agent-adapter-seam-task50.md): 66-note corpus survey + cloned-source deep-read of claude-mem/Taskmaster/opencode/roo/continue + kiro.dev primary verification) revised the architecture below.**

**The load-bearing finding: do NOT build a per-agent `Installer` base class.** claude-mem (the one researched product that actually multi-agent-installs the three legs we install) proved it: a uniform `Installer.install()` interface is a leaky abstraction whose bodies share zero code — it breaks the moment agents differ in config *format* (Goose YAML, Codex TOML) or *mechanism* (Cursor whole-file vs Gemini surgical-merge vs Codex plugin-marketplace), and claude-mem's ~6 bespoke writers drifted in rigor (one surgical, one whole-file-clobber, one that discards user config on a JSON parse error). **What generalizes is the config-write PRIMITIVE, not the installer.**

So the seam is two layers:

1. **One shared, tested primitive — [`mutateAgentConfig`](../packages/cli/src/mutate-agent-config.mjs)** (Task 50.B, shipped). Signature: `mutateAgentConfig({ path, format, keyPath, entry, mode })`. It writes the kit's entry (an MCP registration, a hook entry) into ANY agent's config file with the kit's existing disciplines applied to third-party files:
   - **touch-only-our-keys** = the marker-block byte-preservation invariant (over-mutation guard: seed N siblings, mutate one, assert N−1 untouched).
   - **refuse-to-clobber-on-parse-error** = the safe-write / Poison_Guard fail-closed rule (a corrupt target is returned as `CONFIG_PARSE` error, NEVER overwritten — the exact claude-mem bug, inverted into a guarantee).
   - **atomic (tmp + rename)** = the same pattern compress-session / persona-portability use.
   - **idempotent `changed`-boolean** = re-running install is a no-op.
   - `format`: `json` for v0.4.0; `yaml`/`toml` deferred until an agent needs them.
2. **Per-agent profiles are DATA, not classes** (Task 50.C, a `defineAgentProfile({...})` factory). Each agent declares only what differs: `name`/`displayName`/`detect`/`instructionFile`/`mcpConfigPath`/`mcpServersKey`/`hookMechanism`/`eventMap`/`transcript:{dir,workspaceKey,parse}`. Markdown-canonical kit defaults (no `.mdc` transforms — we drop Taskmaster's `customReplacements`; `includeDefaultRules:false`; profileDir `'.'`). Adding an agent in a later version = one data declaration, not new code — the "don't reinvent the wheel every version" requirement (the user 2026-06-20).

**Integration-type taxonomy** (the claude-mem insight — the type dictates which legs the adapter wires): `native-hooks+MCP` (full: Claude Code, Kiro) · `hooks(dedicated-file)+MCP` (Cursor) · `hooks(settings-merge)+context` (Gemini CLI) · `plugin-marketplace` (Codex) · `MCP-only` (Copilot/Warp/Roo/Antigravity/Goose) · `instruction-file-only` (the AGENTS.md breadth rung). A `validate-agent-adapter-parity.mjs` validator (Task 50.D) asserts every profile wires the legs its type declares, both directions.

**Kiro specifics — original Task-50.E sketch (pre-research, preserved per the decision-trail rule; superseded by §16.50.2 below):** steering → `.kiro/steering/` (`inclusion: always`); MCP → `.kiro/settings/mcp.json` (`mcpServers`); hooks → **CLI agent-hooks** `agentSpawn`(=SessionStart-inject) + `stop`(=turn-end-capture) inside `.kiro/agents/<name>.json` — **NOT** the IDE "Agent Hooks" surface (the Taskmaster `.kiro/hooks/*.kiro.hook` claim was *thought* the wrong system at 50.E; the IDE-hooks rework D-182 later proved the IDE surface IS a fit and wired it too). **Transcript (50.E sketch):** Kiro is a VS Code fork; per-session JSON at `%APPDATA%/Kiro/User/globalStorage/kiro.kiroagent/workspace-sessions/<base64url(workspacePath)>/<sessionId>.json`, `.history[].message{role,content[].text}` — the kit's hardcoded Claude-Code transcript touchpoints (`~/.claude/projects/<slug>/<session>.jsonl`, `env -u CLAUDECODE`) became 3 per-agent params (`dir`/`workspaceKey`/`parse`). **This is now ONE of THREE Kiro transcript schemas — see §16.50.2.**

**Scope discipline:** do NOT registry-ize the agent matrix yet (single-digit N; opencode's data-row registry pays off at N≈75 — premature here). The data/code split is the *discipline*; the heavy infrastructure waits. Codex (plugin-marketplace) + YAML-config agents (Goose) are out of v0.4.0 scope (highest effort, lowest reuse). Cross-ref: tasks.md Task 50, D-180, the [research note](../docs/research/2026-06-20-cross-agent-adapter-seam-task50.md), ADR-0012, design §16.6.

#### 16.50.2 SHIPPED v0.4.0 — the cross-agent seam as it actually landed (Kiro-first, three live-proven surfaces)

**Status: SHIPPED v0.4.0 (Kiro-first cross-agent release; npm + GitHub).** The §16.50.1 paragraphs above are the pre-research + Task-50.E sketch (preserved per the decision-trail rule). v0.4.0 went well beyond that sketch via the D-182/D-198/D-203 rework: the kit now runs on **THREE surfaces, each live-proven** — **Claude Code**, **Kiro IDE 1.0.52**, and **kiro-cli V3 (2.9.0)**. All three drive the SAME `cmk hook <event>` dispatcher → the same inject/capture/observe/guard cores; only the per-surface input adapters (hook file format, transcript schema, trust mechanism) differ.

**Three Kiro transcript schemas** (the capture path resolves them in [`kiro-transcript.mjs`](../packages/cli/src/kiro-transcript.mjs) via `readKiroTurn`, first-non-empty-wins):

| # | Surface | Location | Shape | Reader |
| --- | --- | --- | --- | --- |
| 1 | **Kiro IDE 0.x** | `%APPDATA%/Kiro/User/globalStorage/kiro.kiroagent/workspace-sessions/<base64url(workspacePath)>/<sessionId>.json` | `.history[].message{role, content[].text}` | `parseKiroSessionHistory` (primary, when `CONTINUE_GLOBAL_DIR` is set) |
| 2 | **kiro-cli** | `~/.kiro/sessions/cli/<uuid>.json`, matched by `cwd` | `session_state.conversation_metadata.user_turn_metadatas[].result.Ok.content[].data` — assistant text only (the user prompt is stored as a length, not verbatim) | `readKiroCliTurn` (D-199) |
| 3 | **Kiro IDE 1.0** | `~/.kiro/sessions/<workspace-hash>/sess_<uuid>/messages.jsonl` | JSON-Lines, one `{id, timestamp, payload:{type, content}}` per line; `payload.type ∈ {user, assistant, tool_call, …}`, `content` is the message text | `readKiroIdeV1Turn` (D-203g) |

**The IDE v1 hook format + dual-emit** ([`kiro-ide-hooks.mjs`](../packages/cli/src/kiro-ide-hooks.mjs)). Kiro IDE 1.0 introduced a NEW v1 hook schema and stopped loading the legacy `.kiro.hook` files. The kit **dual-emits** both, so one install serves both Kiro generations:

- **v1 (Kiro IDE 1.0+)** — one clean `.kiro/hooks/cmk-{capture,inject,guard,observe}.json` PER hook, shape `{version:'v1', hooks:[{name, description, trigger, matcher?, action:{type:'command', command}, timeout, enabled}]}`. Triggers are **PascalCase**: `Stop`→capture, `UserPromptSubmit`→inject, `PreToolUse`→delete-guard (can BLOCK on non-zero exit), `PostToolUse` (`matcher:'fs_write'`)→observe-edit. `action.type:'command'` is the deterministic-shell action (no LLM) — the kit is the first surveyed to use deterministic capture instead of `askAgent`. Schema ground-truth-verified against Kiro 1.0's own migration output (D-203d).
- **legacy `.kiro/hooks/cmk-{capture,inject}.kiro.hook`** (Kiro 0.x) — `{version:'1.0.0', when:{type:'agentStop'|'promptSubmit'}, then:{type:'runCommand', command, timeout}}`. On a 1.0 IDE these files are **inert** (shown "legacy", not run — no double-fire, verified D-203d); on a 0.x IDE the v1 `.json` files are ignored. The IDE surface runs the full Claude-Code parity hook set (inject + capture + delete-guard + observe-edit), not just two triggers.

**Two trust mechanisms** (so the kit's hooks/MCP-tools/skills run prompt-free, one per Kiro flavor):

1. **kiro-cli — agent-config `allowedCommands`** ([`kiro-cli-agent.mjs`](../packages/cli/src/kiro-cli-agent.mjs)). The CLI agent lives at **`~/.kiro/agents/cmk.json`** (registered as the default via `~/.kiro/settings/cli.json` `{"chat.defaultAgent":"cmk"}`). Key fields (kiro-cli `agent validate` is strict — only valid top-level keys): `tools:['*']` (the CAPABILITY set — WITHOUT it a custom agent has zero tools and silently no-ops every shell command; this was the D-198/CLAUDE.md root cause), `includeMcpJson:false` (the CLI does NOT wire MCP tools to a custom agent + a loaded server flashes a console window — so the CLI path is hooks+CLI-commands, not MCP), `hooks{agentSpawn, userPromptSubmit, postToolUse, stop, preToolUse}` (camelCase, `timeout_ms`), and `toolsSettings.shell.allowedCommands` (pre-trusts `^cmk …` so capture/recall run without per-command approval). **The agent location is `~/.kiro/agents/cmk.json` — NOT the old `~/.aws/amazonq/cli-agents/q_cli_default.json`, which kiro-cli never read (the D-198 bug, fixed).** The sandbox env override is `$MEMORY_KIT_KIRO_DIR` (`$MEMORY_KIT_AWS_DIR` retained as a back-compat alias).
2. **Kiro IDE 1.0 — per-workspace Trust v2 store** ([`kiro-permissions.mjs`](../packages/cli/src/kiro-permissions.mjs)). The live trust on 1.0 is `~/.kiro/workspace-roots/<hash>/permissions.yaml` (NOT `.vscode/settings.json`, which Kiro auto-migrates here at first open). The kit writes its capability rules directly: `rules:[{capability:shell, match:[cmd.exe /c cmk hook *, …], effect:allow}, {capability:mcp, match:[core-memory-kit/mk_remember, …], effect:allow}, {capability:skill, match:[memory-write, memory-search, troubleshooting], effect:allow}]` — managed-merge (touch only our entries, byte-preserve the user's + Kiro's migration data). The **`<hash>`** is `sha256(projectRoot, normalized: forward-slash + no-trailing-slash + lowercase).hexdigest().slice(0,16)` — ground-truth-verified on a real install (D-203h). The IDE keeps its own MCP via `.kiro/settings/mcp.json` (where MCP works, unlike the CLI).

**Tool-name note:** kiro-cli's shell tool is `execute_command` on V3 (2.9.x); it was `execute_bash` on V2. The kit pre-trusts `^cmk …` by command-prefix in `toolsSettings.shell.allowedCommands` rather than by tool name, so the V2→V3 rename doesn't re-break it (matchers are literal strings, not regex — D-197).

**KNOWN DEFER (v0.4.0):** the kiro-cli V3 **delete-guardrail** (`preToolUse`) does not fire on V3 2.9.0 (proven live — D-198) → tracked as Task 166. Kiro's native shell-approval prompt covers memory deletes on the CLI path in the meantime. (The IDE-1.0 `PreToolUse` guard CAN block; only the CLI V3 leg is deferred.)

**Scope discipline (unchanged):** still no agent-matrix registry (single-digit N). Adding a future agent = one `defineAgentProfile({...})` data declaration. Cross-ref: tasks.md Task 50, D-180/D-182/D-198/D-203, the [research note](../docs/research/2026-06-20-cross-agent-adapter-seam-task50.md), ADR-0012, design §16.6.

#### 16.50.3 SHIPPED — Cursor (Task 196): the first agent to ride the generic seam end-to-end

**Status: SHIPPED (Task 196, the v0.4.5 lane).** Cursor is the seam's proof-of-thesis: unlike Kiro (which needed its own five-surface orchestrator, `installKiro`), Cursor rides the **generic per-profile route untouched** — `runInstallForAgent` falls through to `installAgent(profile)`, and the profile is pure data. Paths primary-source-verified against cursor.com (agent/hooks + context/mcp + context/rules, 2026-07-04); the market/coexistence layer is in the [Cursor memory landscape note](../docs/research/2026-07-04-cursor-memory-landscape.md) (D-268).

**The three legs** (profile: `cursor` in [`agent-profiles.mjs`](../packages/cli/src/agent-profiles.mjs), `integrationType: 'hooks-mcp'`):

- **MCP** → `.cursor/mcp.json` (`mcpServers`, stdio `{type, command, args}`) — the generic leg, unchanged.
- **hooks** → dedicated `.cursor/hooks.json`, mechanism `hooks-json`. Cursor's documented shape carries a REQUIRED top-level `version: 1` beside `hooks{}`, so the install **seeds** a missing file with `{version: 1, hooks: {}}` before the `mutateAgentConfig` merge (an existing file is the user's — touch only our keys; their `version` is theirs). Every wired event carries ONE platform-wrapped command — **`cmk cursor-hook`** — because Cursor hooks speak **JSON over stdio in both directions** and the payload's `hook_event_name` is the router key (no per-event argv, no per-event bins).
- **instruction** → `.cursor/rules/core-memory-kit.mdc` with `alwaysApply: true` frontmatter via the new data-driven `instructionFrontmatter` profile field (generalizes the Kiro `inclusion: always` heuristic). **The `.mdc` extension is load-bearing** — Cursor ignores plain `.md` in `.cursor/rules/`.

**The event map** (all six legs — full Claude-Code parity plus the guard):

| abstract | Cursor event | kit operation | Cursor response (exact field names — a drifted key is a silent no-op) |
| --- | --- | --- | --- |
| sessionStart | `sessionStart` | inject (frozen snapshot) | `{additional_context}` |
| promptSubmit | `beforeSubmitPrompt` | capturePrompt (`payload.prompt`) | `{continue: true}` — ALWAYS true; capture never blocks a prompt |
| turnEnd | `afterAgentResponse` | captureTurn (`payload.text` → `assistant_message`) | none |
| postEdit | `afterFileEdit` | observeEdit (`file_path` + `edits[].new_string` joined → a Write-class payload's `tool_response.content`, so the line-count eligibility check sees the real edit size — else every edit no-ops, the D-269-class trap) | none |
| sessionEnd | `sessionEnd` | the same compress+persona tasks as Claude's SessionEnd bin (lazy-imported) | none (fire-and-forget) |
| preShell | `beforeShellExecution` | decideGuard (D-192 delete-guardrail, `payload.command`) | `{permission: 'allow'\|'deny', agent_message?}` — deny rides the JSON, not an exit code |

`turnEnd → afterAgentResponse` (not `stop`) is deliberate: Cursor's `stop` payload is status-only, while `afterAgentResponse` carries the assistant's final text directly — **no transcript parsing**, hence NO `transcript` leg on this profile (the payload's `transcript_path` exists but its format is undocumented; deliberately not depended on). `preShell` is a cursor-only abstract event — agents without a shell-guard hook surface simply don't map it, and the generic `buildHookEntry` path skips unknown abstract events (no `HOOK_COMMANDS` entry).

**The dispatcher** ([`cursor-hook-dispatch.mjs`](../packages/cli/src/cursor-hook-dispatch.mjs), a pure router; [`runCursorHook`](../packages/cli/src/subcommands.mjs) wires the real cores): the project root resolves from the payload's **`workspace_roots[0]`** (authoritative — Cursor may spawn hooks outside the project dir), cwd is only the fallback. Invariants: **always exit 0**; permission-type events **fail OPEN on a crash** (`beforeSubmitPrompt` → `{continue: true}`, `beforeShellExecution` → `{permission: 'allow'}`); `sessionEnd` returns its async work as `pending` and the bin awaits it (the process must outlive the tasks). Doctor: `detectInstallKind` keys on the cmk-owned `.cursor/rules/core-memory-kit.mdc` marker (the I2 discipline — never a bare `.cursor/` dir), and `hc1CursorHooks` checks the dispatcher on both load-bearing events (kills the D-185 false-FAIL class for Cursor installs).

**Coexistence note (D-268):** Cursor REMOVED its native Memories feature in 2.1.x — static rules are its only built-in persistence, so there is no native-memory collision surface (no ADR-0011 analog needed). Watch-item trigger: re-open if Cursor re-ships native memory.

Cross-ref: Task 196, D-257 (the lane), D-268 (the landscape), the [2026-07-04 research note](../docs/research/2026-07-04-cursor-memory-landscape.md), §16.50.1 (the seam), tests `cli-cursor-hook-dispatch` / `cli-cursor-hook-bin` / `cli-install-agent-cursor` / `cli-install-ide-routing` (Task 196 blocks) / `cli-doctor` (Cursor HC-1).

#### 16.50.4 SHIPPED — the agent-relative LLM backend (Task 200): the automatic engine runs on WHATEVER agent the user has, not just Claude

**Status: Task 200 (v0.4.5). The seam §16.50 wired hooks/MCP/install per agent; this closes the PROMISE** — the kit's ENTIRE automatic-intelligence layer (auto-extract / compression / persona-wedge / temporal-sweep / daily-distill / weekly-curate) used to shell out to the local **`claude` binary** at ~11 construction sites, so a Cursor-only / Kiro-only user's engine SILENTLY no-op'd (spawn ENOENT → best-effort catch) — the kit degraded to a manual note store (**the D-270 bug**). The fix routes the "Haiku call" through the AGENT'S OWN CLI, so the engine works Claude-free. Grounded in the [D-271 cross-agent survey](../docs/research/2026-07-05-cross-agent-llm-backend-survey.md) (41 projects; the two-tier CLI-first + API-key-fallback shape is what the field converges on, validated by the one prior-art peer, codemem).

**The backends** — one `CompressorBackend` per agent (extends ADR-0008's pluggable seam, now un-deferred; the base class + `HaikuTimeoutError`/`HaikuFailedError`/`terminateSubprocess` are shared from [`compressor.mjs`](../packages/cli/src/compressor.mjs)):

| Agent | Backend | Invocation (LIVE-verified) | Model | Notes |
| --- | --- | --- | --- | --- |
| claude-code | `HaikuViaAnthropicApi` (unchanged) | `claude --print` (prompt on stdin) | `claude-haiku-4-5` | the original path; no regression |
| kiro | [`KiroCliBackend`](../packages/cli/src/kiro-backend.mjs) | `kiro-cli chat --no-interactive --model <m> --trust-tools=` (prompt positional) | `claude-haiku-4.5` | Google login, ~1s; strip ANSI + leading `> ` (stdout); D-279 single-directive prompt |
| cursor | [`CursorAgentBackend`](../packages/cli/src/cursor-backend.mjs) | `agent -p --trust --model <m> --output-format text` (prompt on stdin) | `composer-2.5-fast` | Cursor subscription (NO API key); clean stdout; **SLOW (30–83s)** |

**Selection** — [`makeBackend({projectRoot})`](../packages/cli/src/make-backend.mjs) via `resolveBackendAgent`: (1) the `backend.agent` config OVERRIDE (the **split-brain** backend, Task 201 — code in agent X, run the janitor LLM through agent Y; an INVALID override is ignored, never a broken backend), else (2) [`detectInstallKind`](../packages/cli/src/install-kind.mjs) (the agent the project was `cmk install`-ed for). `detectInstallKind` was EXTRACTED from `doctor.mjs` into its own module so `makeBackend` imports it without doctor's heavy dependency chain (a circular-dep hazard).

**Split-brain surfaces (Task 201, SHIPPED).** The override is set two ways — both write the SAME `backend.agent` key: at install (`cmk install --backend <agent>`, `applyBackendOverride`) or after (`cmk config set backend.agent <agent>`). The install path warns about the EFFECTIVE backend CLI (the override target, not the installed-for agent). **`cmk config show`** ([`runConfigShow`](../packages/cli/src/subcommands.mjs)) is the legibility surface — a one-glance informational readout (installed-for agent, active backend agent + override-or-not, backend-CLI presence, semantic mode), deliberately DISTINCT from `cmk doctor` (health/pass-fail). Motivating case: code in Claude (premium, full-context), run the frequent background compaction on cheaper `kiro-cli`. Novel — none of the 42 D-271-surveyed projects let a user CHOOSE a non-primary agent for the background call (codemem auto-detects one, can't override).

**Presence + degrade (D-272/D-277)** — [`agentCliOnPath(kind)`](../packages/cli/src/agent-cli.mjs) is the ONE shared detector both `cmk install` (first-touch `warnMissingBackendCli`) and `cmk doctor` (HC-11) use. Per D-274, presence-on-PATH is NOT enough (the Windows Cursor IDE shipped a bug where a binary resolved but was the wrong shim and errored) → it does an **exit-code `--version` probe**, Windows `.cmd`-aware (`claude.cmd`/`agent.cmd`; `kiro-cli` is bare). When the CLI is missing, both surfaces WARN with an honest **"automatic features degraded, file-only still works"** message — never a silent no-op.

**Composition — the D-278 latency invariant (LOAD-BEARING):** `cursor-agent -p` runs the full agent loop even in print mode — a real compression task took **30–83s** live (vs kiro-cli's ~1s). So `CursorAgentBackend` carries a large default timeout (`CURSOR_DEFAULT_TIMEOUT_MS = 150s`), and a Cursor backend call **cannot run synchronously inside the 60s SessionEnd hook ceiling** — a SessionEnd compress on Cursor times out and fails GRACEFULLY (`allSettled`, best-effort — bounded, NOT a hang), while the **ceiling-free daily-distill / lazy paths (120s)** do the durable work. This is the §8.5/§8.7 timeout family applied per-backend: the same code that's fine on kiro-cli blows the SessionEnd ceiling on cursor-agent, so latency is a backend PROPERTY the caller composes with.

**Prompt-shape discipline (D-278/D-279):** both non-Claude backends refuse the task if the prompt reads as a "workspace question" (the research's reject-gate class — the child model second-guesses instead of summarizing). Cursor: pipe the prompt on STDIN (a multi-line positional failed). Kiro: join `instructions + input` as a SINGLE directive line (`"<instructions>: <input>"`), NOT two newline blocks. The **recursion guard** (`CMK_BACKEND_SPAWN=1` in the child env → the kit's own hooks no-op at the dispatcher entry) is agent-agnostic and carried by both.

**Verification** — [`scripts/live-test-backend.mjs`](../scripts/live-test-backend.mjs) (`npm run live-test:backend`) is agent-PARAMETRIC: it exercises the REAL `makeBackend` selection against real input on whichever agent resolves (or `--agent <a>`), so a Claude-free machine can prove its own engine runs — closing the D-84 gap the old claude-hardcoded `live-test.mjs` left (it would PASS while hiding D-270). It carries a reject-gate so a non-empty refusal FAILS. On its first run it caught the D-279 Kiro prompt-shape bug.

Cross-ref: Task 200/201, D-270 (the gap), D-271 (the survey), D-272 (both-surfaces check), D-274 (Cursor live), D-277 (degrade + split-brain), D-278 (Cursor latency + prompt), D-279 (Kiro prompt + the parametric harness), ADR-0008 (the pluggable seam), the 11 migrated sites, tests `cli-cursor-backend` / `cli-kiro-backend` / `cli-agent-cli` / `cli-make-backend` / `cli-install-kind` / `cli-doctor` (HC-11) / `cli-install-backend-warn` / `cli-config-show` / `cli-install-backend-flag` (Task 201).

#### 16.50.5 SHIPPED — Codex (Task 196 tail, v0.5.2 lane): the second agent on the generic seam, with two new mechanism branches

**Status: SHIPPED 2026-07-13 (D-327).** The 2026-06-20 seam research classed Codex `plugin-marketplace` ("highest effort, lowest reuse"); the build-time primary-source pass ([2026-07-12 note](../docs/research/2026-07-12-codex-adapter-surfaces.md)) found that OBSOLETE — Codex ships first-class hooks (v0.117+; the probed binary is 0.142.5) with a near-Claude-compatible contract, so it rode the generic `defineAgentProfile` seam as pure data + two mechanism branches:

- **`codex-hooks-json` (hooks mechanism):** dedicated `.codex/hooks.json` in MATCHER-GROUP nesting — `{hooks: {<Event>: [{matcher?, hooks: [{type:'command', command}]}]}}`, NO top-level version key (vs Cursor's flat versioned shape). Events: `SessionStart` (inject → `hookSpecificOutput.additionalContext`), `UserPromptSubmit` (prompt-capture; never blocks), `PostToolUse` matcher `apply_patch|Edit|Write` (observe), `Stop` (turn-capture), `PreToolUse` matcher `Bash` (the D-192 delete-guard → `permissionDecision: 'deny'`). NO SessionEnd event — compression rides lazy/cron, like Kiro. **Group-preserving writes both ways** (the skill-review #2/#3 class): install appends the kit's group to a user's existing event arrays (deepMerge replaces arrays, so the entry carries the user's groups); uninstall filters each event's array down to non-kit groups and drops a key only when it empties. **Hash-based hook trust is the honesty line:** Codex SKIPS non-managed hooks until the user runs `/hooks` once — stated in every doc + the install output + the HC-1 pass message; never claimed zero-step.
- **`agent-cli` (MCP mechanism):** Codex's MCP config is TOML (`~/.codex/config.toml` `[mcp_servers]`, user-level; project config is trusted-only with open Desktop issues) — the kit registers via the agent's OWN `codex mcp add core-memory-kit -- cmk mcp serve` (live-verified) and NEVER hand-edits TOML. Off-PATH binary (the Desktop app bundles codex.exe off-PATH) → the install prints the manual one-liner (`legs.mcp: 'manual'` + `mcpManualCommand` on the result). Uninstall's `codex mcp remove` is EVIDENCE-GATED on the project's own hooks file naming `cmk codex-hook` (the registration is user-level + shared across projects — a stray uninstall must not deregister another project's setup; AGENTS.md is NOT evidence, it's shared with the agents-md rung).
- **Turn capture reads the rollout:** Codex's `Stop` payload is status-only, but every payload carries `transcript_path` — `readCodexTurn` ([codex-transcript.mjs](../packages/cli/src/codex-transcript.mjs)) parses the rollout jsonl (`event_msg` / `user_message` + `agent_message`; format pinned from a REAL 0.142.5 capture committed as `tests/fixtures/codex-rollout-sample.jsonl`), BOM/CRLF/malformed-line hardened (D-306 class), and hands `user_message` + `assistant_message` to the shared `captureTurn` (the field name is captureTurn's contract — a `user_prompt` draft was the D-269 dead-key class, caught by skill review + now pinned by an integration test through the REAL captureTurn).
- **Backend:** `CodexExecBackend` — `codex exec --skip-git-repo-check -s read-only --json -`, prompt on stdin (D-280), the LAST `item.completed`/`agent_message` parsed from the JSONL stream; ~5s live round-trip (far under cursor-agent's 60–83s); `CMK_BACKEND_SPAWN` guard via the shared `spawnBackendCall`.

**Open at the manual live-gate (the user's step, same class as Task 208):** (a) the `UserPromptSubmit` payload's `prompt` field + `PostToolUse`'s `tool_input.file_path`/`tool_response.content` shapes are doc-implied Claude-parity, NOT live-verified — capture one real payload each as committed fixtures at the gate; (b) whether Codex-on-Windows launches the registered bare-`cmk` MCP server (`.cmd` shim resolution — the D-274 class; Kiro's identical entry works, Codex's Rust launcher may differ).

Cross-ref: Task 196 (tail), D-327, the [2026-07-12 surfaces note](../docs/research/2026-07-12-codex-adapter-surfaces.md), §16.50.1 (the seam), §16.50.3 (the Cursor sibling), tests `cli-codex-hook-dispatch` / `cli-install-agent-codex` / `cli-codex-backend` / `cli-doctor` (Codex HC-1), docs/CODEX.md.

### 16.51 First-class `/plugin` marketplace path (parallel to `cmk install`)

**v0.1.x candidate (pairs with §16.49).**

Surfaced 2026-05-29 (the user: "we also need to do something like this in parallel" — referring to claude-mem's `/plugin marketplace add thedotmack/claude-mem` + `/plugin install claude-mem`).

claude-mem offers BOTH a complete npm-route installer AND a complete `/plugin` marketplace route — The user picks one. The kit should match: alongside the unified `cmk install` (§16.49), the `/plugin marketplace add LH8PPL/core-memory-kit` + `/plugin install core-memory-kit` flow must be a **complete, first-class entry point** that sets up everything (hooks via the plugin + a scaffold step). Today the kit references this flow in the README, and the plugin ships a `bootstrap` skill (`/core-memory-kit:bootstrap`) that scaffolds `context/` — but the marketplace path needs to be verified end-to-end: (a) the GitHub repo is registerable as a marketplace, (b) `/plugin install` wires the hooks, (c) the bootstrap skill scaffolds the project tier. The two routes are equivalent and either alone is sufficient:

- **Route A (terminal/npm)**: `npm install -g @lh8ppl/core-memory-kit` → `cmk install` (§16.49 makes this wire hooks too)
- **Route B (in-Claude-Code/plugin)**: `/plugin marketplace add LH8PPL/core-memory-kit` → `/plugin install core-memory-kit` → `/core-memory-kit:bootstrap`

Ship trigger: v0.1.1, alongside §16.49. Tracked as tasks.md Task 49 (sub-task). Cross-ref: ADR-0005 (three-install-paths), ADR-0012.

### 16.52 Behavioral pattern detection + promotion ("learn how I work," not just facts)

**v0.2 candidate (the user endorsed 2026-05-29: "I want this feature… a clean refinement of what we have, so we just do it").**

Today the kit captures **facts** (decisions, preferences, environment) and already records *some* working-style as facts — `USER.md`, `HABITS.md`, `SOUL.md` scratchpads, trust:high "from now on…" memories, and the auto-persona synthesizer (Task 45). This candidate is the **clean refinement**: have auto-extract actively *detect recurring behavioral patterns* across turns/sessions ("the user always wants X format," "always runs tests before commit," "prefers terse replies") and **promote** them — into `HABITS.md` / the persona — rather than leaving them as scattered one-off facts. It's a ranking/promotion step on top of the existing extract→trust→scratchpad pipeline, reusing the trust hierarchy + review queue; no new storage model.

Distinct from the *bigger* swing it's often conflated with: ECC-style **procedural memory** that turns observed patterns into *actionable reusable skills/procedures* (a new capability, larger product direction). That bigger version is explicitly **out of scope here** — parked as a separate, evidence-gated consideration (revisit if real usage shows facts+habits are insufficient). This candidate is only the refinement: detect + promote behavioral patterns as memory.

Mechanism sketch: (1) a lightweight recurrence signal in auto-extract (same observation canonicalized/seen N times, or an explicit "always/usually/prefer" cue); (2) promote to `HABITS.md` (project) or user-tier persona with a `pattern_count` / confidence field — a numeric refinement of the categorical trust level (the one idea worth borrowing from ECC's confidence scoring); (3) surface in the frozen snapshot like other high-trust memory. Composes with: Task 45 auto-persona (shared promotion target), the trust hierarchy, the review queue (medium-confidence patterns route there for confirmation).

Ship trigger: v0.2. Tracked as tasks.md Task 55. Cross-ref: Task 45 (auto-persona), §6 (auto-extract pipeline), §4 (trust hierarchy).

### 16.53 Auto-persona hardening (deferred from Task 45 PR #83 skill-review)

**v0.1.x / v0.2 candidates.** Surfaced by the code-review-excellence pass on the auto-persona core (PR #83). None block the feature (the automatic path ships + works); each has a trigger:

1. **Re-apply `privacy.mjs` to the classification corpus.** `autoPersona` sends project-tier fact bodies to the [[CompressorBackend]] for classification + promotes the result to the (cross-project) user tier. `<private>` filtering runs at the SHARED WRITE BOUNDARY — `sanitizePrivacyTags` is the first step in both `memoryWrite` (terse bullets) and `writeFact` (fact files), on every tier (cut-gate v0.3.1 finding + fix: it had been wired ONLY into the UserPromptSubmit hook, so a direct `cmk remember`/`mk_remember`/import wrote the secret verbatim — the earlier "verified present in auto-extract + write-fact" claim here was STALE/false until that fix). So committed facts are now private-stripped at write time regardless of capture path. Defense-in-depth still worth doing: re-run the corpus through `privacy.mjs` before classification, so a private fact that somehow predates the boundary fix can't be promoted cross-project. Trigger: any evidence private content reaches a committed fact file.
2. **Bound the classification corpus.** `assembleProjectCorpus` concatenates all project-tier facts + `MEMORY.md` with no size cap before sending to the backend. Fine for normal projects; a very large fact archive could exceed a sensible input budget (cost/quality). Trigger: a project whose corpus exceeds N KB → truncate/window (most-recent or highest-trust first).
3. **Live-Haiku spawn smoke for the classifier prompt (Door 3).** `autoPersona`'s tests use mock backends; the real Haiku call uses the *classifier* prompt, which has no live spawn-smoke (the weekly-curate live smoke exercises the *curate* prompt). The spawn mechanism is identical (`HaikuViaAnthropicApi`, already smoke-tested), so this is a prompt-shape gap, not a spawn gap. Trigger: a classifier-prompt regression the mock tests can't catch.

The two **product** follow-ups (manual `cmk persona generate` wrapper; low/medium-confidence → review-queue *file* write, currently response-only `queued[]`) are tracked in tasks.md 45.6, not here.

### 16.54 Final-state vs intermediate-state auto-extraction (self-test finding #3 Gap A)

**v0.2 candidate.** Auto-extract captures observations per-turn, reflecting that turn's understanding — which a later turn in the same session may supersede. The v0.1.1 self-test surfaced this: turn-1 queued a Python pip/3.13 version-mismatch "workaround" (reinstall deps / explicit interpreter path); the session later corrected the real fix (VS Code `settings.json` PATH + venv). By `cmk queue review` time the queued entry is factually stale — discarded only because the reviewer happens to know the later correction. **Question:** should auto-extract prefer end-of-turn/end-of-session state, or weight later turns over earlier when the same canonical topic recurs within a session? Composes with conflict-detection (Task 25) + the bi-turn extraction shape (§6.4). Trigger: evidence that stale intermediate captures are a recurring review-queue burden. _(Extracted from the v0.1.1 self-test findings during the 2026-05-31 doc-governance read, before that findings doc was archived.)_

### 16.55 `degraded_input` observability flag for silent inter-hook degradation

**v0.1.x candidate.** `capture-turn` reads the most-recent user entry `capture-prompt` wrote to today's transcript (the bi-turn dependency, §6.4). In production the chain holds (UserPromptSubmit fires before Stop), but if `capture-prompt` is disabled / errors / hits a lock, `capture-turn` silently reads no USER_TURN section and auto-extract reverts to assistant-only — the exact bug §6.4 fixed, but **silently degraded** rather than failing loudly. The empty-string fallback is correct (crashing the Stop hook would interrupt the user). Candidate: `extract.log` gains a `degraded_input: true` field when the USER_TURN section is empty AND a user prompt was expected, so `cmk doctor` can surface "N degraded extracts this week" and flag a misconfigured capture-prompt. Same shape as the Poison_Guard-blocked-write counter (§6.7). Trigger: a report of silently-degraded capture. _(Extracted from the 2026-05-26 live-test parked observations during the doc-governance read.)_

### 16.56 `cmk checkpoint <n>` — programmatic checkpoint verification

**v0.1.x candidate.** The 2026-05-23 cold-start bootstrap test surfaced a failure mode docs didn't prevent: a fresh session flipped a checkpoint checkbox using fresh-looking-but-stale PR-branch test numbers, without re-running the criteria from current main ("checkpoint marked but not verified"). The behavioral guard is a CLAUDE.md rule (checkpoint-verification: never flip on stale numbers); the structural fix is a `cmk checkpoint <n>` subcommand that programmatically runs the checkpoint's criteria (full suite from main + the named smoke checks) and only then flips the box — removing the temptation to shortcut. Same "prose-rule → tool" graduation pattern as the other §16 enforcement candidates. Trigger: the manual rule proving insufficient (a second checkpoint-not-verified incident). _(Extracted from the 2026-05-23 bootstrap-test research during the doc-governance read.)_

### 16.57 Explicit-capture R2 friction on `cd <abs-path> && cmk` compounds (✅ RESOLVED 2026-06-08 via Task 108b — MCP-first)

**✅ RESOLVED 2026-06-08 (Task 108b / Task 118).** The fix is the MCP-first surface: `cmk install` now registers the kit's MCP server in `.mcp.json` and allowlists `mcp__cmk__*`, and the `memory-write` skill prefers the MCP tools (`mk_remember` / `mk_forget` / …). A tool call is **not** a shell command — no `cd`, no compound, no `Bash()` matcher — so the permission prompt can't arise on the Claude-mediated path (D-85). The `mcp__cmk__*` tool-wildcard was verified against [code.claude.com/docs/en/permissions](https://code.claude.com/docs/en/permissions). The bash CLI path described below stays a documented power-user edge (decision-trail preserved); the original deferral analysis follows as history.

**Original deferral (2026-06-07) — DOCUMENTED, not fixed (the user: "document it as an edge case we won't fix unless we have a working simple solution"). Full decision + verified primary-source findings: D-80.**

Surfaced by the v0.2.2 cut-gate live run. The agent captured a preference richly via `cmk remember … --type --why --how --title` (F1 working), but Claude Code prompted *"Allow this bash command?"* because the agent wrapped it as `cd "<abs project path>" && cmk remember …`. Verified against [code.claude.com/docs/en/permissions](https://code.claude.com/docs/en/permissions): compounds are split per-subcommand and each must qualify; `cd` is read-only only when its target is *inside the working directory*, so a `cd` to an absolute path the WD-check doesn't recognize doesn't qualify → the whole compound prompts. `Bash(cmk:*)` already covers the **bare** `cmk remember …` (the normal case → no prompt), so **R2 substantially passes** — the friction is only the agent's redundant `cd` wrapper.

Two false fixes ruled out by the docs: `Bash(cd:*)` is a no-op (`cd` is already read-only); `Bash(*cmk:*)` doesn't address the `cd` subcommand (and is a hole). The two real options both have a catch: a behavioral skill/CLAUDE.md nudge (docs: guidance "doesn't change what Claude Code allows" — the weak kind) or a **PreToolUse hook** to auto-approve `cmk` capture calls, which **re-opens ADR-0006's deliberate PreToolUse-drop**. **Ship trigger:** a *simple, reliable* fix — e.g. Claude Code treating `cd`-to-WD-root as read-only in all forms, or a cheap non-PreToolUse mechanism.

---

## 17. Test discipline

**Tail-appended 2026-05-26.** §17.2-17.6 originated from the live-test that surfaced a class of bug mocked-spawn tests could not catch (the Windows `.cmd`-shim ENOENT class). §17.1 was promoted in front of them after the PR-30 exit-doors audit, because the doors checklist is the broader umbrella — spawn-smoke is the application of doors 3 + 4 to cross-process testing, not a peer discipline.

### 17.1 The five exit doors (what every test must assert)

The five exit doors framework is adopted from Yoni Goldberg's [*nodejs-testing-best-practices*](https://github.com/goldbergyoni/nodejs-testing-best-practices) (README.md §1, "Test the five known backend exit doors (outcomes)"). Citation in [`SOURCES.md`](../docs/SOURCES.md). Idea-level absorption — no prose copied. The kit uses Goldberg's original numbering so traceability to the source is preserved.

**v0.1 caveat for Door 4 (Message queues)**: the kit has no general message-queue infrastructure. Two **named exceptions** apply Door 4 in primitive form today:

- **Auto-extract's `capture-turn → temp-file → auto-extract` handoff** is a queue-of-one. `capture-turn.mjs` writes `transcripts/.extract-<ts>.tmp`; the detached auto-extract subprocess reads it. Tests for auto-extract MUST annotate Door 4 — the temp-file IPC contract (USER_TURN / ASSISTANT_TURN markers, routing on canonical-id dedup) IS the kit's message-passing surface.
- **Task 31 (MCP stdio transport)** when it ships. MCP is full message-passing.

For all other kit boundaries, Door 4 is N/A in v0.1. Re-evaluate at Checkpoint 27 (Layer 4 layer-wide review). **Discipline is never silent omission**: a test either asserts a door OR marks it N/A with a reason. Tests created or modified from the post-PR-31 audit campaign onward use the `@doors:` annotation header — PR-D adds the validator that enforces declared-vs-actual.

When writing a test — or opening an existing test file for any other reason — walk this checklist and pin every door that applies. Tests that miss Door 3 or Door 5 ship silent-failure bugs because the happy-path assertions on doors 1 + 2 still pass.

| Door | What it is | Kit examples / mapping |
| --- | --- | --- |
| **1. Response** | What the public function returned (data, schema, errorCategory) | `r.action === 'compressed'`, `r.errorCategory === 'poison_guard'`, `r.id` matches `ID_PATTERN`, `r.observation_count === 3` |
| **2. New state** | What changed on disk / in memory / in the audit trail (kit-adapted: disk vs DB) | `MEMORY.md` contains the new bullet; `now.md` was truncated to 0 bytes; `archive/tombstones/<id>.md` exists with the documented frontmatter; the lock file was rewritten with the current pid |
| **3. External services** | Calls to subprocesses or external APIs (kit-adapted: subprocess spawn vs HTTP / SMS / payment) | `mock.calls[0].input` contains the §8.4 prompt structure; the real-binary spawn-smoke (§17.3) actually invoked `claude --print` with the documented flags |
| **4. Message queues** | Message-passing IPC. **N/A by default in v0.1**; named exceptions: auto-extract temp-file IPC + Task 31 MCP | Auto-extract: turn-file written by `capture-turn`, read by detached auto-extract child; USER_TURN / ASSISTANT_TURN marker parsing pinned. Other boundaries: mark `// Door 4 N/A: no message-queue interaction.` |
| **5. Observability** | Logs, metrics, errors — what NDJSON entry landed in the right log with the right shape | `extract.log` records `{success:false, error_category:'concurrent_run', observation_count:0}`; `compress.log` has matching `input_bytes` and `output_bytes` cross-checked against the return struct; `poison-guard.log` masked the matched secret with `***` and recorded the canonical `pattern_id` |

**Common gap patterns** (each surfaced as a real finding in the PR-30 audit; preserved here so future tests pre-empt them):

- A test for a function that *invokes a subprocess* pins door 1 (the return value) but never asserts door 3 (the subprocess was called with the expected args). Result: a spawn-broken regression passes if the return value happens to be set before the spawn would fail.
- A test for a function that *writes to disk and logs* pins door 1 + door 2 but never reads the NDJSON log. Result: a refactor that silently drops the log-write ships, breaking analytics + audit trails downstream.
- A test for a function that *mutates a subset of records* pins the mutation but not the non-mutation of siblings. (See the "over-mutation guard" rule in CLAUDE.md — Goldberg §6.)
- A test that asserts a return-struct field has a value pins door 1 but doesn't cross-check that the corresponding log entry has the SAME value. **Separately-correct-jointly-broken** is a real failure class (CLAUDE.md "Composition verification" rule) and the return-vs-log cross-check is exactly where it hides.

#### Annotation format

Test files declare which doors they exercise via a `@doors:` header. Format:

```js
// @doors: 1, 2, 3, 5
// Door 4 N/A: no message-queue interaction.
```

Or for the auto-extract case where temp-file IPC counts as Door 4:

```js
// @doors: 1, 2, 3, 4, 5
// Door 4 (MQ) covered by temp-file IPC verification — the bi-turn
// extraction tests assert USER_TURN/ASSISTANT_TURN parsing.
```

PR-D adds [`scripts/validate-exit-doors.mjs`](../scripts/validate-exit-doors.mjs) which parses the `@doors:` declaration on each test file and heuristic-checks that the declared doors map to actual assertion patterns in the file body. Files without an annotation produce a warning during the PR-D rollout; at PR-D's final commit the validator flips to error-mode (all kit tests annotated, no perpetual-warning fallback).

§17.2-§17.6 are specializations: §17.2-§17.5 are how to assert door 3 properly when the call is cross-process (real-binary spawn smoke), and §17.6 is the PR-level gate that catches concurrency-class door-3/door-5 flakes which a single test run misses.

### 17.2 Why mocked-spawn tests miss spawn-layer breakage

Task 23 shipped with `HaikuViaAnthropicApi`'s spawn fully unit-tested via an injectable `spawnFn` parameter. The unit test pinned the command name, the argument array, and the spawn options (`cwd`, `env`, `stdio`). All assertions passed. The contract was correct per spec.

The contract was **wrong per reality**. The unit test mock recorded what `spawnFn` was called with — but it never invoked the real `child_process.spawn` against the real `claude` binary on the real operating system. When the live test ran on Windows, three real-spawn issues immediately surfaced:

1. **`spawn('claude', args)` returned ENOENT on Windows** — npm-installed CLI binaries ship as `.cmd` shims; node's spawn does not auto-resolve `.cmd`/`.bat` extensions (unlike shell PATH resolution).
2. **`{ shell: true }` was required** for `.cmd` execution per CVE-2024-27980 hardening, AND it triggered cmd.exe's quote-stripping behavior on inline JSON arguments (`--mcp-config '{"mcpServers":{}}'` became `--mcp-config {mcpServers:{}}`).
3. **`cwd: '/tmp'`** didn't resolve on Windows.

All three are real-world boundary semantics that the mocked-spawn unit test couldn't reach. The shape of the spawn call was right; the kit's interaction with the OS's spawn implementation was broken.

See [`docs/journey/2026-05-26-live-test-findings.md`](../docs/journey/2026-05-26-live-test-findings.md) ("Bonus finding — Windows spawn bug") for the full diagnostic chain.

### 17.3 The pattern — real-binary spawn smoke tests

Every kit module that constructs a `spawn()` call MUST ship a complementary **real-binary spawn smoke test** alongside its unit tests:

- Calls `child_process.spawn` via the production code path, with no mock or injected `spawnFn`.
- Spawns **the real subject binary** the production code targets (`claude`, `node`, etc.). NOT a no-op stand-in like `echo` or `node -e "process.exit(0)"`.
- Uses a minimal-but-meaningful invocation (e.g., for HaikuViaAnthropicApi: `compress({input: "hi"})` against the real Haiku model).
- Asserts on observable spawn-layer signals: no ENOENT/EINVAL exception, exit code 0, stderr does not contain `unrecognized` or `invalid` (catches flag renames in future tool updates), and the response is non-empty.

The no-op-binary alternative was rejected because it fails to catch the exact bug class that motivates the test:

- `echo "hi"` resolves to a shell builtin or coreutils binary that has nothing to do with `claude`'s `.cmd` shim semantics — the test would pass while the production spawn still ENOENTs.
- `node -e "..."` resolves to node which is on every developer's PATH but proves nothing about the subject binary's resolution.

Real-binary spawn is the load-bearing check.

### 17.4 When to apply

Every spawn boundary in the kit. Currently:

- **HaikuViaAnthropicApi** (Task 23) — smoke test ships in [`tests/spawn-smoke-haiku.test.js`](../tests/spawn-smoke-haiku.test.js) per Task 23.8.

Future spawn boundaries each add their own smoke test:

- Task 24 `memory-write` skill if it spawns sub-Claude for trigger-phrase auto-invocation
- Task 28-29 cron compression invocations
- Task 31 MCP stdio transport
- Any v0.2 backend that uses subprocess IPC

### 17.5 How to guard CI portability

Real-Haiku tests have two failure modes that aren't kit bugs: (1) the test environment lacks the `claude` binary, (2) the test environment lacks Anthropic auth. Both are environment-not-kit problems and should not produce false-positive test failures.

The graceful-skip protocol:

```js
const skipReason = (() => {
  if (process.env.CMK_SKIP_LIVE_HAIKU === '1') return 'CMK_SKIP_LIVE_HAIKU=1';
  if (!claudeBinaryFound()) return 'claude binary not on PATH';
  return null;
})();

(skipReason ? describe.skip : describe)(`spawn-smoke: HaikuViaAnthropicApi (${skipReason ?? 'live'})`, () => {
  // real-spawn tests
});
```

**Default behavior is to run the real thing.** The opt-out env var is purely for end-user CI environments that can't run real `claude`. Setting `CMK_SKIP_LIVE_HAIKU=1` is an explicit, auditable choice — not a silent default that hides regressions.

Dev environments that have `claude` available run the smoke automatically on every `npm test`. The smoke is fast (~3-8 seconds for the round-trip) and the unit-test alternative (mocked spawn) is what missed the bug originally — having a real-spawn baseline on every test invocation is the structural fix.

### 17.6 Stress-run gate (PR-level discipline)

Spawn-layer flakes don't always surface on a single `npm test` invocation. PR #29's audit surfaced four time-bound flakes that had passed individually but failed under full-suite concurrency on Windows (cold-start contention, file-system visibility races, live-Haiku rate-limit retry windows). PR #30 surfaced another one in the same class (empty-file race in `cli-capture-turn`).

The structural fix is a **stress-run gate** before opening any PR whose surface touches spawn boundaries, detached children, hook handlers, or anything else where concurrency-class flakes hide:

```bash
npm run stress   # runs npm test 5x, exit-fails on first non-green run
```

The script (`scripts/stress-test.mjs`) refuses to run if `CMK_SKIP_LIVE_HAIKU=1` is set — the whole point is to stress the live spawn boundaries, not to avoid them. Wired into the test verbs:

| Script | Purpose |
| --- | --- |
| `npm test` | Single full-suite run (validate-test-ids + validate-template prerun + vitest). Live spawn-smokes enabled by default. |
| `npm run test:file -- <path>` | Targeted file iteration (skips the slow prerun; pass `-t "name"` for a single test). |
| `npm run test:watch` | Interactive vitest. |
| `npm run stress` | 5x full suite, refuses `CMK_SKIP_LIVE_HAIKU=1`. PR-opening gate for concurrency-sensitive changes. |

Concrete checklist for the agent (Claude in this repo):

1. Before opening a PR that touches `auto-extract.mjs`, `capture-turn.mjs`, `compress-session.mjs`, `compressor.mjs`, any new spawn boundary, any new hook handler, or any new detached child: **run `npm run stress` and confirm 5/5 green**.
2. If a stress run fails, do not open the PR. Either fix the flake or surface it as a blocker for review.
3. Never invoke tests manually via `npx vitest run …` or shell loops; the scripts exist so that the workflow survives across sessions and so the `windowsHide:true` option fires consistently (avoids cmd.exe popup flicker on Windows).

### 17.7 Enforcement validators for §17 disciplines

§17 disciplines that have a deterministic structural shape get enforcement validators in `scripts/validate-*.mjs`, wired into `npm test` as pre-test steps. Drift is caught at lint time, not when it ships. This section is the source-of-truth for which §17 disciplines are structurally enforced vs. which remain code-review-only (judgment-rules).

| §17 discipline | Validator | Mode |
| --- | --- | --- |
| §17.1 — every test file declares its exit-door coverage via `// @doors:` header (and explicitly marks N/A doors with reasons) | [`scripts/validate-exit-doors.mjs`](../scripts/validate-exit-doors.mjs) | **Strict** (post-PR-D2b, 2026-05-27). Missing header / silent-omission of any door 1..5 / out-of-range door numbers all violate; exit 1. The `CMK_DOORS_STRICT` env-var opt-in from the D1 rollout has been retired (was a phased-rollout flag during PR-D1's warning period). Per-file `// @doors-ignore` marker is the emergency escape valve. All 37 kit test files annotated. |
| §17.3-§17.5 — every production subprocess `spawn()` declares its timeout contract (native `timeout:`, caller-managed via documented helper, or explicit fire-and-forget suppression) | [`scripts/validate-spawn-discipline.mjs`](../scripts/validate-spawn-discipline.mjs) | **Strict**. Marker forms: `// spawn-discipline: caller-managed <ref>` (e.g., `terminateSubprocess` in compressor.mjs), `// spawn-discipline: ignore <reason>` (e.g., detached-fire-and-forget in capture-turn.mjs), or `timeout:` / `timeoutMs:` in the spawn options. Scans `packages/cli/src/` + `plugin/bin/`. |
| §17.6 — `npm run stress` gate before opening any PR whose surface touches spawn boundaries / hook handlers / detached children | None (workflow rule; enforced by the PR-author's discipline) | **Judgment rule**: stays prose-only. The validator that COULD enforce this is "did the PR description include a stress-result line?" — the kit doesn't have a PR-description linter, and adding one is out of scope for v0.1. |
| §17.9 — every LLM-spawn site's test pins WHAT IS SENT (the `@door-3.5:` marker + actual input/instructions assertions) | [`scripts/validate-prompt-assertions.mjs`](../scripts/validate-prompt-assertions.mjs) | **Strict** (Task 137.1). Two-factor: the marker declares, the assertion tokens prove. Discovery = src modules calling `backend.compress({` (comments stripped; compressor.mjs is the transport, excluded). |
| §17.10 — every documented numeric budget has an at-cap + over-cap test pair (or a written suppression) | [`scripts/validate-budget-pairs.mjs`](../scripts/validate-budget-pairs.mjs) | **Strict** (Task 137.4). Registry-driven: `BUDGET_REGISTRY` in the validator names budget → test file → boundary patterns. The D-124 class (budgets fail at their edges). |
| Skill scaffold ↔ permissions allowlist parity — every `template/.claude/skills/<name>` has its `Skill(<name>)` KIT_ALLOW entry, both directions | [`scripts/validate-skill-allowlist.mjs`](../scripts/validate-skill-allowlist.mjs) | **Strict** (Task 137.2). The D-123 class (Task 90 + Task 75.1 both shipped the gap). |

**Cross-cutting validators** (apply across §17 + §6 + §8 disciplines):

| Rule | Validator | Mode |
| --- | --- | --- |
| Internal cross-references resolve: file links, `ADR-NNNN`, `§N.N` (within design.md), `FR-N`, `NFR-N`, `Task N`, `D-nnn` (§17.13) — broken or dangling references fail the suite. Code blocks + inline-code spans + `docs/research/` + `docs/sources/` + `docs/conversation-log/` are skipped (research-base notes use third-party FR namespaces). | [`scripts/validate-docs.mjs`](../scripts/validate-docs.mjs) — the `references` family (Task 186 consolidation; `--only references` runs it alone) | **Strict**. Suppression via `<!-- validate-docs: ignore -->` on the same line — sparingly; the legacy `<!-- validate-references: ignore -->` marker is honored forever. Anchor-out-of-corpus debug surfaceable via `CMK_REFS_DEBUG=1`. |
| ID sequences (ADR / FR / NFR / Task) either have no gaps OR have an explicit `reserved` / `TODO` / `placeholder` / `not-yet` / `tail-appended` marker in the relevant file. PR-C found ADR-0009 + ADR-0010 missing for ~3 weeks because no validator caught the gap. | [`scripts/validate-numbering-gaps.mjs`](../scripts/validate-numbering-gaps.mjs) | **Strict**. Markers parsed case-insensitively, in both directions (`reserved ADR-NNNN` or `ADR-NNNN ... reserved`). |
| Every documented composition-verification instance in CLAUDE.md references at least one addressing artifact (test file, design section, or reserved marker). Catches the failure mode where a new instance gets enumerated but no corresponding test / design / reserved-marker is written. | [`scripts/validate-composition.mjs`](../scripts/validate-composition.mjs) | **Strict**. Heuristic: instance descriptors are inline `PR-<id> (...)` parens within the rule body; each parenthesized description must match `tests/X.test.js` / `design §X.Y` / `reserved` / `v0.1.x` / `not-yet`. |
| Every user-facing shell command emission in production code uses the `platform-commands.mjs` helper OR carries an explicit `// platform-commands: ignore <reason>` marker. Catches the failure mode PR-B surfaced (lock-discipline.mjs originally emitted hardcoded `rm` to Windows users on stock cmd.exe). | [`scripts/validate-platform-commands.mjs`](../scripts/validate-platform-commands.mjs) | **Strict**. Scans `packages/cli/src/` + `plugin/bin/`. Three pass conditions: file imports from `./platform-commands.mjs` (helper-in-scope), per-line `// platform-commands: ignore <reason>` marker, or no hardcoded POSIX-command tokens at all. |

### 17.8 Integration-test coverage for cross-module flows

**Tail-appended 2026-05-27** after the Task 25 → 25b sequence surfaced the failure mode this rule prevents. Sister to §17.1 (the five exit doors) — same family of rules: doors check what each test pins, integration coverage checks what set of tests pins the composition. Sister to CLAUDE.md "Composition verification" — same family of disciplines: composition verification is the spec-author side (did the spec author consider the other surfaces?), integration coverage is the test-author side (did the test author exercise the call path between surfaces?).

#### The rule

When two kit modules compose at runtime, at least one test MUST exercise the full integration path through both modules' public surfaces — not mocked stand-ins.

"Compose at runtime" means: module A's public function calls module B's public function (directly, via passed callback, or via shared state mutation that B then reads). Examples in v0.1.0:

- `memory-write.doAdd` → `conflict-queue.detectConflicts` → `conflict-queue.writeConflictEntry`
- `auto-extract.routeHigh` → `memory-write.doAdd`
- `auto-extract.routeMedium` → review-queue file (queue-of-one IPC, Door 4)
- `Stop hook` (capture-turn.mjs) → detached `auto-extract.mjs` child via temp-file IPC
- `forget` → `audit-log.appendAuditEntry`

Per-module tests answer **"does the surface work?"** — `writeConflictEntry({...})` writes the expected file when given the expected args. Integration tests answer **"do the surfaces COMPOSE?"** — calling `memory-write.doAdd` with a conflict scenario actually triggers `writeConflictEntry` with the right args. Both are required for cross-module flows.

#### The precedent — Task 25 → 25b

Task 25 shipped the conflict-queue with full per-module test coverage (24 tests on `conflict-queue.mjs`). The integration with `memory-write.doAdd` had ONE wiring point: the queue-route called `generateId({text: opts.text, tier: opts.tier})` (named-args object). The canonicalize module's signature is `generateId(tier, text)` (positional). Every test that asserted queue routing constructed `writeConflictEntry({newId, ...})` directly — bypassing `memory-write` entirely. The bug was latent for the full Task 25 ship.

Task 25b's `mergeScratchpadBullets` work added the first test that called `memory-write.doAdd` with a conflict scenario end-to-end. The test failed immediately on `generateId` returning `undefined` because the named-args object collapsed under positional parameter destructuring. Fix: `generateId(opts.tier, opts.text)` in `memory-write.mjs`. The bug had been catchable on day one if the integration test had been written when the wiring shipped, not three weeks later.

#### How to apply

When wiring a new module A to an existing module B (or wiring an existing module A to a new module B), the PR MUST include at least one test that:

1. **Calls A's public function** (not B's, not a helper inside A).
2. **Asserts B's documented side effects** (state on disk, audit-log entries, files written, return-shape that propagates through A) — these are doors 2 and 5 from §17.1 applied at the integration layer.
3. **Does NOT mock B**. If B is mocked, the test pins A's call shape to the mock, which is exactly the failure mode we're trying to catch (the named-args / positional-args contract drift).

External-system mocking is fine — mocking the file system, mocking subprocess spawn, mocking time. The discipline is to NOT mock the kit modules under test.

#### What about mock-heavy tests for other reasons?

Some kit tests legitimately mock kit modules for isolation reasons (e.g., testing `subcommands.mjs` dispatch logic without running every subcommand's real implementation). Those tests are valid AND don't satisfy §17.8 — they're testing dispatch, not integration. The discipline is additive: keep the mock-heavy isolation tests AND add a non-mocked integration test per cross-module pair.

#### Enforcement

**Today: judgment rule.** The code-review-excellence ONE-holistic-pass discipline (CLAUDE.md skill-agency section) checks integration coverage as part of PR review. Reviewer asks: "this PR wires module A to module B — where's the test that exercises the call path?"

**v0.1.x candidate: structural validator.** [`scripts/validate-integration-coverage.mjs`](../scripts/validate-integration-coverage.mjs) — see §16.25 for the candidate validator design, deferral rationale, and ship trigger.

#### Composition with §17.1 (the five exit doors)

§17.8 and §17.1 compose. An integration test typically pins doors 1 (Response from A) + 2 (State from B's writes) + 5 (Observability from B's NDJSON entries). Door 3 (external calls) gets pinned by spawn-smoke tests (§17.3) on the few integration paths where A spawns B as a subprocess. Door 4 (message queues, N/A by default) applies to the two named exceptions in §17.1 — both of which are inherently integration tests (capture-turn → auto-extract temp-file IPC; MCP transport).

The `@doors:` header for an integration test usually looks like `// @doors: 1, 2, 5` with Door 3 marked N/A unless subprocess composition is involved.

### 17.9 Door 3.5 — pin WHAT IS SENT to the LLM (prompt assertions)

**Tail-appended 2026-06-12 (Task 137.1; the D-122 class made structural.)** Door 3 (§17.1) asserts a subprocess was CALLED with the right argv. For an LLM call, that's not enough: the bug class that suppressed organic capture for ~10 releases (D-122) lived in the PROMPT CONTENT — capture-turn composed the just-captured turn into the dedup context SENT to Haiku, and no test pinned the sent prompt. Every surface was unit-green; the composition was poisoned.

**The rule:** every src module that composes an LLM prompt (calls `backend.compress({input, instructions})`) must have a test pinning BOTH halves of what is sent:

- **input** — the composed content actually rides the prompt (seeded fixture text appears in the captured call's `input`; exclusion rules pin what must NOT ride — the Task 132 DEDUP_CONTEXT pin is the template);
- **instructions** — the directive contract (format rules, grounding rules, no-preamble) appears in the captured call's `instructions`.

The test file declares the discipline with a `// @door-3.5: prompt-assertion — <what is pinned>` header marker. Enforcement is two-factor (marker + actual assertion tokens) via [`scripts/validate-prompt-assertions.mjs`](../scripts/validate-prompt-assertions.mjs) — declared-but-not-asserted and asserted-but-undeclared both fail. The 137.1 audit found three real gaps at introduction: compress-session pinned input but not instructions; daily-distill and weekly-curate pinned instructions but not input — each closed with a real assertion in the same change.

### 17.10 Budget boundaries — at-cap/over-cap test pairs

**Tail-appended 2026-06-12 (Task 137.4; the D-124 class made structural.)** Budgets fail at their EDGES: the extraction output cap was documented and enforced, but no test sat AT and OVER the boundary, so the hard-slice clipping a rich fact mid-word shipped a corrupted stub to disk. The rule: every documented numeric budget has a test pair — one case that fits exactly at the cap, one that exceeds it and pins the documented over-cap behavior (drop / consolidate / truncate-with-marker). Registry-driven enforcement via [`scripts/validate-budget-pairs.mjs`](../scripts/validate-budget-pairs.mjs) (`BUDGET_REGISTRY`: budget → test file → boundary patterns, or `suppressed: '<reason>'` — never silence).

### 17.11 Live-test trend thresholds (the gate side, not the suite side)

**Tail-appended 2026-06-12 (Task 137.5; the D-122 detection gap.)** Per-turn outcomes are individually plausible — a single `nothing_durable` skip is normal; 90%+ of judged turns skipping is the fingerprint of a systemic suppressor. Lenient per-turn pass-bars tolerate stochastic masking; only the TREND exposes it. [`scripts/extract-trend.mjs`](../scripts/extract-trend.mjs) (`npm run trend:extract -- <dir>`) reads a live run's `*.extract.log` files and FAILS when the nothing_durable rate over judged turns crosses the threshold (default 80%, min sample 5; mechanical skips like `concurrent_run` are excluded from the denominator). NOT wired into the npm-test prerun — the trend is a property of a live run's accumulated log, not of the source tree; it's a cut-gate step (cut-gate.md §3).

### 17.12 Prose count-claims — the `counts` family (Task 236 / D-377)

**The drift class.** Sentences like "12 MCP tools" / "41 CLI verbs" / "12 health checks" are hand-maintained numbers describing collections the CODE owns. They were hand-fixed ~6 times across v0.4–v0.6, always reactively. This is the "single source of truth" rule applied to a derived *number* rather than a derived index. <!-- validate-docs: ignore (illustrative examples of the drift class, not live counts) -->

**Scan, never enumerate — and the reason is empirical.** ECC ships this exact gate (`scripts/ci/catalog.js`) and hand-enumerates **40 doc locations**, each with its own file + regex. Their `WORKING-CONTEXT.md` is in **none** of them — and that is precisely the file measured **4 months stale** (47/79/181 claimed at v1.10.0 vs 67/94/278 actual at v2.0.0). Their gate runs green in CI while the staleness ships: it checked 40 places, the drift happened in the 41st. **Drift lands wherever you did not enumerate**, and the enumeration list is itself a thing a human must remember to extend — the same dependency the stale number had. So this family scans every living markdown doc; a new doc is covered the day it is written.

**Resolution is from CODE, never a second hand-maintained number:** MCP tools via `parseMcpToolParams`, CLI verbs via the `subcommands` registry, agent profiles via `AGENT_PROFILES`, and HC ids scanned across **all of `packages/cli/src`** — not `doctor.mjs` alone, because **HC-9 lives in `version-drift.mjs`** (Task 162). The first cut scanned only the doctor and undercounted by one: the family committed the exact drift class it polices, which is the sharpest possible argument for resolving against the whole owning surface.

**Exemptions, by class:**

| Class | Mechanism | Why |
| --- | --- | --- |
| Frozen records — CHANGELOG, `docs/adr/`, `docs/research/`, `docs/sources/`, `docs/journey/`, `docs/conversation-log/`, `archive/`, `docs/process/` | path prefix (structural) | a point-in-time record naming an old count is HISTORY; editing it to match today's code is a bug (the D-249 frozen-record rule) |
| **The memory tiers** — `context/`, `context.local/` | path prefix | strongest case of the same: a captured fact reading *"v0.3.5 verified all 9 health checks pass"* is correctly-recorded history, and "fixing" it would corrupt the memory the kit exists to keep. 50 of the family's first 62 hits <!-- validate-docs: ignore --> |
| **`docs/SOURCES.md`** | path prefix | the external-project catalog — the collection nouns are not kit-exclusive, so every count there is somebody else's surface |
| Identifier-shaped numbers — `Task 108 added MCP tools`, `#5873 for MCP tools` | pattern (a number introduced by `#` or by `task`/`issue`/`PR`/`ADR`/`FR`/`HC`/`D`) | a number that NAMES something is not a quantity |
| A one-off historical line inside a LIVING doc | inline `<!-- validate-docs: ignore -->` | deliberate, visible, reviewable — preferable to widening a path exemption |

**Conservatism posture:** a false positive here fails the build on correct prose, which is worse than missing one claim. So the number must sit immediately before the collection noun (one optional adjective between), and version-shaped tokens (`v0.6.0`, `0.6`) never count.

**A second claim shape: the `HC-1..HC-N` range.** The cut-gate guides phrase the count as "11 checks now (HC-1..HC-11)", where the surrounding noun is a bare "checks" — far too generic for the noun scan to match safely. The RANGE is unambiguous and kit-specific, so it gets its own rule: the upper bound IS the claimed size. Exempt in `specs/tasks.md` + `specs/design.md`, the two living docs that narrate build history inline (a shipped `[x]` entry naming `HC-1..HC-9` is what existed then; both would need ~15 inline markers apiece to say what one exemption says).

**What it caught on its first real runs — 30 stale claims:** `specs/glossary.md` described `cmk doctor` as running "all 7 health checks (HC-1..HC-7)"; a LIVE cut-gate checklist still said "11 MCP tools" / "11 checks now"; and the range rule then found 26 more across **the npm README, QUICKSTART (still on `HC-1..HC-9`), RELEASE-PLAN, both READMEs and every cut-gate guide**. Several had survived five minor releases and every prior doc review. One more turned up inside a TEST — `docs-structure.test.js` pinned `HC-1..HC-11` with a growing list of `not.toMatch` lines enumerating previously-stale values; the same losing game, now replaced by a shape assertion with the value resolved against the live registry. <!-- validate-docs: ignore -->

**Cross-references:** §17.7 (the validator-modes family this joins), the CLAUDE.md validators table, D-249 (the ONE doc-drift rule this makes structural for numbers), D-377 (the scan-vs-enumerate decision + the prior-art counter-example). _Implements: Task 236._

### 17.13 Decision-log citations — the `dnnn` sub-check (Task 247)

**The gap.** The `references` family resolved every internal-id class the corpus uses — `ADR-NNNN`, `FR-N`, `NFR-N`, `Task N`, `§N.N`, file links — except `D-nnn`, which is the **most-cited** reference in the corpus (the DECISION-LOG is the chronological spine). The CLAUDE.md rule "internal cross-references are subject to the same primary-source verification" names the class, and `D-nnn` was its lone prose-only member. The concrete failures: `D-382` was cited in a task entry and a commit message *before the entry existed*, and the D-380..D-384 authoring hour cross-referenced four sibling entries — exactly the window where a typo'd `D-38X` resolves to nothing and nobody notices.

**The target case is the FORWARD reference:** `D-406` cited while the log stops at `D-405`. A typo that happens to land on an existing entry is out of reach of any anchor scheme — the check buys the dangling half, which is the half that actually happened.

**Anchor extraction — leads only, all ids in a lead.** `parseDecisionIds` indexes the D-ids appearing in an **entry lead**: a heading line, or the leading bold span of a list item. The log grew three lead shapes over 400 entries and all three are live (`## <date> — D-405 · TYPE — …`, `## <date> — D-375: TYPE — …`, `- **⚙️ DECISION (<date>) — D-150: …**`). Restricting to leads is what keeps the check's teeth: entry BODIES are dense with citations (`_Relates D-285, D-198._`), and indexing those would make every typo self-anchoring. Within a lead, **all** ids count, not just the first — `- **✅ FIX + RESOLUTION of D-212 (…) — D-213: …**` opens with a citation and carries its own id second, so first-only would drop a genuine anchor.

**The cost of "all ids in a lead", with both numbers** (they answer different questions, and quoting only one is the dishonest version):

| | Today's log |
| --- | --- |
| **Mechanism** — leads that *can* mint a false anchor | **110** (84 leads carrying more than one id + 30 indented sub-bullets that are formatting rather than entry leads; 4 are both) |
| **Outcome** — false anchors that mechanism actually produced | **1** (`D-552`, a typo inside D-270's lead — cited by nothing, so it masks nothing) |

The mechanism is broad, the realised cost is one. The trade follows the standing conservatism rule: an extra anchor can only MASK a citation; a missing anchor FAILS THE BUILD on correct prose. _Both figures move with the token — a review of this change measured 92 against the narrower `\bD-\d+\b`; widening for sub-letters and slash continuations in the same round moved it to 110. Re-measure after any token change rather than trusting either number._

**The citation TOKEN is mirrored from the kit's own parser.** `packages/cli/src/graph-index.mjs` (`ANCHOR_MATCHERS` + `slashNodes`, Task 232, same release) already parses D-anchors out of fact bodies, and it handles the shape this check first missed: **`D-270/271/277` is three citations**, so validating only the head silently exempted ~60 tails across the corpus. The token is mirrored rather than imported — that module pulls `fact-store` / `frontmatter` / `tier-paths` to build a graph table, and this validator is a zero-dependency lint step — with one deliberate divergence: an optional **sub-letter** (`\bD-(\d+[a-z]?)…`).

**Sub-lettered ids are checked on BOTH sides, because the log really anchors them.** `D-203b`…`D-203n`, `D-253a`, `D-258a` are 14 real entry ids in leads, and `CLAUDE.md` really cites `D-253a`. The alternative considered and rejected was to leave the token narrow and document the hole: that would half-check the class — `D-253a` unverifiable while `D-253` is verified — which is exactly the "answers with a subset of the truth" failure the verification rules name. Extending both sides costs nothing (the corpus resolves fully) and closes it.

**The anchor source is a GLOB, not a file — `docs/journey/DECISION-LOG*.md`.** Task 249 splits the append-only histories at a version boundary, putting the pre-split entries in `DECISION-LOG-archive-pre-v0.5.md` beside the live log. Reading one file would make every citation to a pre-split entry dangle **the day 249 lands** — the check would punish the repo for doing the archiving. The same treatment applies to `Task N`, whose ids now come from `specs/tasks*.md` (249 splits `tasks.md` into `tasks-archive.md` the same way). Sources are parsed **per file and unioned**, never concatenated, so fence state cannot bleed across an archive boundary. _(249 still owes the archives their frozen-record path prefixes — `docs/journey/` already covers the log archive; `specs/` does not, so `specs/tasks-archive.md` needs an explicit entry or its historical citations become policed.)_

**Fenced blocks and inline-code spans are stripped on BOTH sides.** The scan side always did; the parse side now does too. The asymmetry was real: a lead-shaped *example* inside a ` ``` ` block in the log would have minted an anchor, letting an illustration authorise a citation. Zero such examples exist today — the fix closes the shape, not a live bug.

**HTML comments are scanned, not stripped** — pre-existing behavior of the whole `references` family, stated here rather than left as a surprise. A `D-nnn` inside `<!-- … -->` is validated like any other, which is deliberate on balance: the suppression marker is itself an HTML comment on the same line, so a commented-out citation that is genuinely historical takes the marker like anything else.

**No source (or an empty one) ⇒ the sub-check is skipped**, and the summary says so rather than printing "0 indexed" — a check that did not run must not read like a check that found nothing. Turning one missing FILE into N citation errors is noise under a fixture root; deletion of the real log is caught by the `registry` family's direction 2 (`docs/journey/DECISION-LOG.md` is a backticked manifest entry).

**What the first run caught — 4 dangling citations, 2 distinct ids that were never numbered entries.** `D-132` (cited by `specs/tasks.md` Task 147 + `docs/RELEASE-PLAN.md`) was reserved when the log stood at D-131, and its content was **appended into D-133's entry tail** instead of getting its own numbered entry — backfilled as one, with D-133 left untouched. `D-168` (cited by `specs/tasks.md` Task 156, this document's §19.4.2 heading, and the build log) named a real entry that shipped **without its number** — the id was backfilled onto it. Both are the reserved-but-never-anchored class of D-129 and the ADR-0009/0010 backfills.

**Cross-references:** §17.7 (the family this sub-check joins), §17.12 (the frozen-record list it reuses), Task 249 (the archive split this composes with), Task 232 / `graph-index.mjs` (the token's source), D-249, D-129 (the backfill precedent). _Implements: Task 247._

## 18. Cross-platform command discipline

Tail-appended 2026-05-27 by PR-E (post-PR-31 audit campaign Part 7/7; v0.1.0 release blocker). The class surfaced when PR-B's `recoveryCommand` field in `lock-discipline.mjs` emitted a hardcoded `rm "..."` command — fine on macOS/Linux, broken on Windows stock cmd.exe (`rm` is not a builtin or PATH'd command; the user pasting the recovery hint gets "command not found"). The fix in PR-B was an inline `process.platform === 'win32'` switch. PR-E generalizes that pattern into a shared helper + a validator + this discipline.

### 18.1 The rule

Every user-facing shell command emission — whether emitted programmatically by kit code (`recoveryCommand`, `cmk doctor` repair output, `cmk repair` hints, error messages, audit-log action hints, install completion paths) OR written into docs (README install instructions, `SETUP.md` recovery, `HEALTH-CHECKS.md` repairs, design.md user-facing shell snippets) — must work on the user's native shell across **Windows + macOS + Linux**.

### 18.2 The helper: `packages/cli/src/platform-commands.mjs`

Single source of truth for the kit's primitive shell-command builders. One function per primitive; each returns a complete, copy-paste-ready shell command in the user's native shell, with the platform branch handled internally.

Primitives currently exposed:

- `removeFile(path)` — `Remove-Item "..."` on Windows, `rm "..."` on POSIX.
- `removeDir(path)` — `Remove-Item -Recurse -Force "..."` on Windows, `rm -rf "..."` on POSIX.
- `listDir(path)` — `Get-ChildItem "..."` on Windows, `ls "..."` on POSIX.

Plus `PLATFORM` constant (`'win32'` or `'posix'`) for callers that need to branch explicitly.

Adding a new primitive: add the function + a per-platform branch + a unit test in `tests/cli-platform-commands.test.js` asserting both branches' output shapes. Keep the helper module narrow (PR-E shipped 3 primitives; expand as the kit grows new emission sites).

### 18.3 The validator: `scripts/validate-platform-commands.mjs`

Structurally enforces "no hardcoded POSIX commands in user-facing emission paths" in `packages/cli/src/` + `plugin/bin/`. Three pass conditions per match:

1. **Helper-in-scope** — the file imports from `./platform-commands.mjs`. The discipline is established at the file level; the validator assumes inline POSIX strings in such files live inside platform branches.
2. **Per-line suppression** — `// platform-commands: ignore <reason>` on the same line OR the line above. Reserved for legitimate platform-specific contracts (e.g., a `.sh` script that already requires bash).
3. **No match** — the file doesn't contain any hardcoded POSIX-command tokens (`rm "..."`, `mkdir "..."`, etc.).

Scanned tokens: `rm`, `mkdir`, `ls`, `cat`, `cp`, `mv`, `chmod`, `chown`. Each requires a space + quoted path follow-up (or hyphen-arg) so the regex doesn't false-positive on Node identifiers like `mkdirSync` (where `mkdir` is at end of identifier with no following space).

### 18.4 Doc-side emissions (out of scope for the validator)

Docs (README / SETUP.md / design.md / HEALTH-CHECKS.md) emit shell snippets in markdown code blocks. The validator does NOT scan docs because:

1. False positives are severe: legitimate code-block examples of POSIX commands in research notes, conversation logs, or "here's the Linux flow" sections would all flag.
2. The right discipline for docs is "show both halves" — provide the Windows command + the POSIX command alongside each other where users need a copy-paste hint. Reviewer discipline catches missing halves at PR-review time.

If doc-side hardcoded POSIX emissions become a recurring problem, the v0.1.x candidate is a markdown-aware validator that scans only fenced code blocks tagged as `bash`/`sh`/`shell`. Not in scope for v0.1.0.

### 18.5 Legacy `.sh` references in docs

The `.sh → .mjs` migration audit (Task 23.15.7) confirmed that `plugin/bin/auto-extract-memory.sh` (the legacy bash-based auto-extract) is dead code: Task 23 shipped `cmk-auto-extract.mjs` (node-based) which is the current runtime path. The kit's tests don't reference the .sh file. However, ~14 doc references remain (README.md, ARCHITECTURE.md, plugin/README.md, plugin/skills/bootstrap/SKILL.md, plugin/context-template/SETUP.md, install.sh/ps1, design.md §X, requirements.md, docs/adr/0011, conversation-log).

**v0.1.x cleanup**: remove `auto-extract-memory.sh` from the repo + update the doc references to describe the node-based flow. Deferred from PR-E because:

1. The .sh file is dead code, not a runtime hazard.
2. Cleaning up 14 references is a small but spread-out doc refactor; bundling it into PR-E would dilute the cross-platform-discipline review surface.
3. The kit's PRIMARY cross-platform risk is the runtime emission path, which PR-E closes structurally.

### 18.6 Live-test plan

PR-E's spot-check on **Windows PowerShell** (the development platform) confirmed `removeFile / removeDir / listDir` emit the documented PowerShell forms. **macOS + Linux** verification: deferred to install-time testing — when a user installs the kit on those platforms, the helper's POSIX branch is exercised on every `recoveryCommand` emission. The kit doesn't have CI matrix runners for macOS/Linux today (v0.1.x candidate: GitHub Actions cross-OS matrix).

Live-test cross-OS validation is also covered by:

- The lock-discipline.mjs unit tests (`tests/cli-lock-discipline.test.js`) — assert the `recoveryCommand` field shape in both branches via test-time platform detection.
- The platform-commands unit tests (`tests/cli-platform-commands.test.js`) — assert each primitive's output for the current platform AND that the shape invariants hold (non-empty, quoted path argument).
- The validator self-test (`tests/scripts-validate-platform-commands.test.js`) — sandboxed fixtures pin the helper-in-scope / suppression-marker / hardcoded-violation paths.

---

## 19. Memory-retention architecture — load-cap (not write-cap) + universal graduation (D-61, 2026-06-04)

> **Binding architecture (D-61).** Supersedes the **write-cap** behavior in §2.1 / §7.1.1 and generalizes Task 91 (project-MEMORY.md graduation) to **all tiers**. The invariant: **memory is never lost; it is always retrievable.** That is the kit's entire reason to exist — so no write path may reject, truncate, or silently drop a fact. Validated against Anthropic's own Auto Memory model (D-60): MEMORY.md loads the first 25 KB and moves detail to on-demand topic files; D-61 is that model, generalized to every tier.

### 19.1 Two caps, separated

Originally one per-file number served BOTH roles: the **write-cap** (`appendScratchpadBullet` rejects a write that would exceed it — §2.1) AND the **inject budget** (per-tier truncation — §7.1.1). D-61 splits them:

- **Write-cap — REMOVED.** Writes ALWAYS succeed; scratchpad files grow on disk without bound. The `cap_exceeded` error path in `appendScratchpadBullet` is deleted. No write-lock, ever, on any tier. (This is the change that kills the persona write-lock from D-60/cut-gate2 §6.)
- **Load-cap (inject budget) — KEPT.** The per-tier budgets + snapshot cap (§7.1.1, `DEFAULT_CAP_BYTES`) now govern ONLY **how much of each (now-growable) file is injected** at session start — never whether content can be saved.

### 19.2 Universal graduation (all tiers)

When a scratchpad's content exceeds its **load**-cap, the overflow **graduates** into the searchable fact store via the Task 91 mechanism (`graduateForCapRelief` → `writeFact`), keeping the injected hot index within budget while the durable content stays on disk + indexed.

- **Every scratchpad:** project `MEMORY.md` (already, Task 91), the **user-tier persona** (`USER.md`/`HABITS.md`/`LESSONS.md`), `SOUL.md`. Graduated content lands in each tier's **existing** fact store — project → `context/memory/`, **user → `<userDir>/fragments/`** (the user-tier equivalent; `writeFact` already routes tier-U facts there, so no new structure is needed), searchable via `cmk search` / `mk_get`.
- **⚠️ REVISED for the user-tier persona (Task 151.4, 2026-06-30, ADR-0016 §20.3 — supersedes the all-tiers default ABOVE for tier U only).** The original D-61 "every scratchpad graduates to its fact store" turned out to BE **Hole B**: the user-tier graduation target `<userDir>/fragments/` is **NOT read by `inject-context`** (only the scratchpads + granular facts are), so a *promoted high-trust persona trait* graduated to `fragments/` **vanished from the cold-open snapshot** — the v0.3.1 cold-open regression. The **intent** (never-lose-memory) is preserved; the **mechanism** changes for the persona tier: at cap, the persona scratchpads **CONDENSE in place** (`condenseScratchpadForCapRelief` — mechanical: trim trailing whitespace + collapse blank runs, **drops no bullet**, no LLM) and, if still over budget, the file is allowed to **grow past the inject budget** (the load-cap-not-write-cap invariant already permits this); the snapshot's importance-aware load-cap (§19.3) + the 151.5 sweep order keep the **high-trust traits injected**. The persona tier **never graduates a bullet out to `fragments/`**. **Project `MEMORY.md` / `SOUL.md` graduation is UNCHANGED** — those graduate to `context/memory/`, which IS recall-reachable, so no Hole-B there. A genuine LLM *tighter-rewrite* condense (letta's agent-condenses) is **Task 95** (re-curation), deliberately OFF this synchronous append hot path (an inline Haiku call in `appendScratchpadBullet` would be a composition + latency hazard). See §20.3.
- **Trigger (both built):** **reactively** at write (cap-relief inside `appendScratchpadBullet`) AND **proactively** via a SessionEnd sweep (`graduateAllScratchpads` → `sweepScratchpadForCapRelief`, Task 94.3), so each scratchpad's injected slice stays under its load-cap even in a read-only session, and bullets that AGE past the 14-day stale window between sessions get caught. The sweep runs the **same** relief sequence as the append path (consolidate stale-drop+archive → **for tier P** graduate high-trust overflow / **for tier U** condense-in-place per the 151.4 carve-out above), gated to fact-bearing tiers P+U, writing back only if content changed (over-mutation safe). **Composition:** it runs **sequentially after** the SessionEnd concurrent `allSettled([compress, persona])` block — autoPersona writes the persona scratchpads, graduation reads+rewrites them, so they must not overlap (the §6.8 disjoint-input rule); after `allSettled` resolves there is no window. Local file I/O + best-effort (SessionEnd exits 0 on overrun) → no 60s-ceiling risk on top of the ~50s Haiku block. It is strictly better than the §19.3 inject-side tail-drop: overflow is preserved + recoverable, not silently dropped.
- **Eviction archives, never hard-deletes** (Task 91.2 — already tier-generic via `tierRoot`/`memory/archive/evicted-bullets.md`).

### 19.3 What stays injected — importance-aware, not tail-order

With files now growable, the inject step must choose WHICH slice to inject. The original truncation dropped whole sections from the **tail** (file order). **Built (G7/Task 93/94.4, 2026-06-05, D-66):** per-tier budget truncation in `truncateTierToBudget` ([inject-context.mjs](../packages/cli/src/inject-context.mjs)) now drops the **lowest-value section first** — aggregate trust (MAX bullet trust per section, so any high-trust bullet protects its section) → recency (newest `at`) → later-in-file as the tiebreak. The tiebreak makes it a **strict generalization** of the old tail-drop: with no provenance present (every section ranks equal) it drops from the end exactly as before, so all legacy behavior is preserved. The `tier_truncated_to_budget` Door-4 event records `strategy: 'importance-ordered'` + `dropped_sections` (heading + aggregate trust + ids). This keeps the BEST rules in the cold-open window and **minimizes the recall dependency** (only the long tail must be searched for).

- **Granularity (accepted approximation):** eviction is **section**-granular (per §7.1.1 structural-shape preservation + the Task 93 "whole sections by aggregate value" sanction), so a low-trust bullet bundled in a section with a high-trust bullet survives over a standalone medium-trust section — a bullet-level inversion. This is asymmetric with §19.2 graduation, which evicts per-**bullet** (oldest-first). Bullet-granular inject eviction is the stricter v-next option.
- **Follow-up (not yet built):** the **total-cap fallback** (Step 2 of `enforceCap` — fires only when Σ per-tier budgets > snapshot cap, a config-error safety net) still drops whole **tiers** from the priority tail (USER/persona first). That contradicts the importance theme and could evict the wedge persona wholesale under extreme overflow. Making the fallback priority/importance-aware is a tracked v-next candidate.

### 19.4 Recall — the retrieval half (Task 75, v0.3)

Graduated content is on-disk + searchable, but *"Claude knows to search for it when needed"* is the **active-recall** behavior (Task 75), currently ~50/50. **The storage half (§19.1–19.3) alone satisfies the never-lose-memory invariant** — everything stays on disk + indexed. The **retrieval-reliability** half is v0.3. Until Task 75 lands, graduated memory is retrievable **on demand** (`cmk search`, the agent searching) but not always **auto**-recalled; §19.3 minimizes the exposure by keeping the best content injected.

### 19.4.1 The L3 raw tier — transcripts (Task 104, D-117)

The recall waterfall's floor. The kit's `context/transcripts/{date}.md` records every turn's dialogue **plus its tool activity** (104.1: a capped `**Tools:**` block extracted at Stop time from Anthropic's live session JSONL — which is machine-local and expires ~30 days; ours is committed and permanent). The raw tier is searched **only as a last resort** (104.2): chunks (`## `-heading turns, ≤1500-char windows) index into the SEPARATE `transcript_chunks` table + `vec_transcripts`, reached via `cmk search --scope transcripts` / `mk_search {scope}` — never mixed into L1 fact results (the MemPalace last-resort contract). Hits are locations, not facts: synthetic `T:<file>:<line>` ids, no tier/trust. **Task 126 (D-119) widened the scope to the MIDDLE tier too:** `sessions/today-*.md` / `recent.md` / `archive.md` (the compressed conversation history) index into the same table — discussed-but-never-graduated content was otherwise a recall blind spot (surfaced by the creator's-v2 comparison, whose primary store is exactly those daily summaries). `now.md` (volatile live buffer) and `*.log` are excluded.

**Retention (104.3, settled):** transcripts keep **full history** — they are the differentiator over native Auto Memory's expiring record, and git handles append-only text well. Growth is bounded at the SOURCE (the 104.1 per-turn caps: 300-char result snippets / 4000-char Tools block), not by deletion. A retention knob (e.g. `transcripts.max_age_days` in settings.json) is deferred with an explicit trigger: transcripts dominating repo size in real installs. Public-repo deviation: this repo gitignores `context/transcripts/` (raw dev-conversation content — D-108); normal projects commit them.

### 19.4.2 Decision-journal recall (Task 156, v0.3.3, D-168)

**The gap (D-164).** Task 147 shipped `context/DECISIONS.md` — the append-only decision journal (every decision, with retract/supersede-in-place; D-161). But it is **write-only for the AI**: it's in ZERO recall directives, and it is deliberately NOT FTS-indexed (a derived view, skipped like `INDEX.md`), so `mk_search` never returns a journal hit. A human reads it in the file / PR diff; the agent never consults it. That breaks the kit's thesis ("you ask the AI and it recalls") for the journal's UNIQUE value — decision **evolution**, the **retracted/superseded trail**, and **"what did we reject / why did X change"** queries. (Single-decision recall — "what did we decide on Kamal" — already works: the underlying `type:project` fact carries its Why and IS FTS-indexed. The journal adds the *history* axis the flat fact store can't.)

**The design — reuse the transcript-scope precedent, don't add a verb/tool.** §19.4.1's last-resort transcript tier is reached via `cmk search --scope transcripts` / `mk_search {scope: "transcripts"}` — a separate, derived corpus surfaced through the EXISTING search verb with a new scope, never a bespoke tool. The journal is architecturally the same shape (a separate derived corpus, queried for a specific class). So Task 156 adds **`--scope decisions`** to the same surface:

- **`cmk search "<topic>" --scope decisions`** / **`mk_search {query, scope: "decisions"}`** scans `context/DECISIONS.md` (the journal is a single bounded markdown file — a direct entry-grep, no index needed; the entries are already structured: title + `**When:**` + `**Why:**` + fact-id + retract/supersede markers). Returns matching decision entries WITH their evolution markers (so "what did we reject" surfaces the `_(retracted …)_` / superseded entries that the live fact store no longer carries).
- **No new CLI verb, no new MCP tool** → the CLI↔MCP parity surface is unchanged (`validate-cli-mcp-parity.mjs` stays green with zero new ops); `--scope` is already a search parameter. This is strictly less surface than a `cmk decisions` verb + `mk_decisions` tool, and it composes with the skill's existing `--scope` muscle memory.

**The recall directives that point at it (the behavioral half — the part that's only verifiable live):**

1. **memory-search skill** gains a step: for decision-HISTORY / evolution / "what did we reject / why did X change" query shapes, run `--scope decisions` (alongside, not instead of, the fact-index ladder — single-decision recall stays on the fact search; the journal scope is additive for the history axis).
2. **The injected recall directive** (CLAUDE.md managed block / the snapshot preamble) names the journal scope for decision-history questions, so the agent knows the journal exists as a recall target.

**Cut-gate DJ4 (the recall gate).** DJ1–DJ3 test the WRITE side (append / idempotent / retract-in-place / type-filter). DJ4 is the new RECALL stage: seed a decision, supersede it with a contradicting one, then assert `--scope decisions` recall surfaces BOTH the current AND the superseded entry (the "what did we reject" path) — and assert a live in-session recall ("what did we decide about X, and did it change?") consults the journal. The live half is a behavioral directive (like W1/E1) — flagged for the user's manual live-test session, not auto-asserted.

**Why this completes the feature, not just adds a flag.** D-164's principle: a feature isn't shipped until it works end-to-end (write AND automatic AI-recall). The write half shipped in v0.3.2 (held, un-framed). This is the recall half: the scope + the directives + the gate. After this, "you ask the AI and it recalls the decision timeline" is true, and v0.3.3 can frame DECISIONS.md as a real capability.

### 19.5 Decision-trail — the superseded write-cap design (preserved)

**Original design (pre-2026-06-04, §2.1 + §7.1.1):** per-file caps were **write** caps. `appendScratchpadBullet` consolidated stale bullets at 95%, then (post-Task-91, project tier) graduated, then **rejected** with `cap_exceeded` if still over ("no silent truncation; raise the cap or distill"). It protected the inject budget by bounding the FILE. Hermes uses the same hard-reject (D-60) — so this was a defensible, researched choice, not an accident.

**Why changed (D-61, 2026-06-04):** the write-cap **conflates** "how much you can store" with "how much you inject," and it **write-locks the persona tier** (the wedge) once a section fills — reproduced live in cut-gate2 §6 (D-60: the architecture rule couldn't promote, `not-promoted-cap_exceeded`). Anthropic keeps the two separate (load-cap, write-free). D-61 adopts that. The write-reject path is removed; the cap becomes inject-only. The old behavior is retained here for contributors who need to understand why the build's current path differs from §2.1/§7.1.1 as originally written.

### 19.6 Composition + invariants

- The **snapshot-cap coordination rule (§7.1.1) still holds — for the INJECT budget**: per-tier budget = Σ per-file **inject**-caps; snapshot cap ≥ Σ per-tier budgets. `validate-template.mjs` keeps enforcing it on the inject-caps (the write-caps no longer exist).
- Composes with **§6.5 tombstones** (eviction archives), **Task 91** (graduation mechanism — generalized), **G7/Task 93** (importance-aware inject), **Task 75** (recall).
- **Boundary tests (per tier):** a write that exceeds the load-cap **succeeds** (no `cap_exceeded`) AND the overflow appears in the searchable store AND `cmk search` finds it. Seed N, overflow, assert N retrievable (never N−k). The never-lose-memory invariant is a test, not a hope.

---

## 20. Persona-promotion redesign — recurrence gate + passive trust + demote-not-evict (Task 151, v0.4.3)

_Canonical HOW for the persona-promotion redesign. Decision: [ADR-0016](../docs/adr/0016-recurrence-promotion-passive-trust-demote-not-evict.md). Evidence (7-system code-read): [research note](../docs/research/2026-06-29-curation-cluster-code-study.md). Supersedes the form-based `PERSONA_CONFIDENCE_RULE` + fixes the §19 graduation→fragments eviction for the durable persona. Replaces D-177's three holes._

**The thesis.** The persona is a *recurrence-earned*, *outcome-trusted*, *never-deleted* fact base; the injected snapshot is a **validity-filtered VIEW** over it, not storage. Promotion is arithmetic (no LLM, no ritual); protection-at-cap is a *separate* passive-outcome trust signal; the durable tier is demoted-not-evicted. Cross-system consensus (7-system code-read, D-228): never-delete + status-flip; recurrence-CAPPED earns promotion; trust moves on outcome events, not a clock.

### 20.1 Promotion gate — capped recurrence (replaces phrasing)

Two signals, two fields (a unified score lets a noisy fact rank high — MemOS):

- **`recurrence_count`** (frontmatter int): `++` when the SAME canonical fact re-surfaces — re-stated by auto-extract (same content-hash ID) OR surfaced by `cmk search`/`cmk cite`. The existing canonical-ID IS the re-surface detector.
- **heat** (computed, lazy): `heat = min(recurrence_count, RECUR_CAP)·W_REC + exp(-Δhours/τ)` (τ = 24 h), recency at READ — no cron. The **cap is load-bearing** (MemOS `min(count·w, 2)`): recurrence is a tie-breaker, never the driver.
- **promote** a working-scratchpad bullet → the user-tier persona when `recurrence_count ≥ 3`. Explicit-imperative stays a fast-path-to-promote. **No LLM on the hot path** (mem0 abandoned its per-fact judge for hash-dedup — too costly/unstable). Fixes **Hole A** (the form-gate strands demonstrated philosophy).
- **THE SYNTHESIS↔RECURRENCE BRIDGE (cite-and-sum; D-230, the 5-system bridge study).** Our trait is LLM-BORN (it doesn't exist until the classifier synthesizes it), unlike the 5 strong-yes systems whose gated unit PRE-EXISTS the LLM (a session segment / dedup-cluster / trace-cluster already carries its own count). Unanimous finding (5/5): **arithmetic counts + selects; the LLM NEVER counts recurrence.** So the faithful adaptation: the classifier emits each `PERSONA CANDIDATE` line WITH a `source_fact_ids=[…]` citation (the project facts it synthesized the trait from) — **NOT** a `recurrence=N` number. Code resolves those ids against the corpus, **sums their real `recurrence_count`** (from 151.1, validating/rejecting hallucinated ids), and that arithmetic sum is the gate. **The LLM decides which facts cohere into a trait (synthesis — its job); the COUNT lives in code (the honcho discipline).** Rejected: Option A (LLM emits the count) — 5/5 reject LLM-counting; it reintroduces the bug (grading a number ≈ grading phrasing). Caveat: the sum is deterministic but trait MEMBERSHIP is the LLM's grouping choice — acceptable (grouping is synthesis), not the same guarantee as arithmetic pre-clustering (which we'd prefer IF we had an embedding-cluster primitive pre-LLM; we don't).

### 20.2 Trust — evolving, passive, floored (the protection field; folds Task 97)

- **`trust_score`** (float, in the **rebuildable index, NOT committed frontmatter** — D-218: a moving value = git-diff noise). Init from source (`user-explicit` > `auto-extract`).
- **update** event-driven: `+0.1` reinforce / `−0.15` dampen / **floor `0.05`** (memclaw `_adjust_weights`; never zero, never auto-deleted). NO time-decay of the stored value.
- **signals** PASSIVE only (D-169, zero ritual): contradiction-queue hit, `superseded_by` set, session-end restatement. We already produce all three.
- **screened** (Task 193, ADR-0017 Phase 1d - shipped 2026-07-06): every signal routes through the FEEDBACK-SCREEN inside `applyTrustSignal` (the single mutation gate; 4 callers, no bypass): per-fact-per-day rate limit (5) + burst-hold quarantine (>=10 same-day applied signals with >80% dampens -> further dampens held, reinforces pass) + every delta audit-logged (`action: trust-signal`). State + observability: `context/.locks/trust-signals.log` (the seven-log table, section 6). FAIL-OPEN on unreadable state - a broken diagnostic never breaks the primary write. Task 192's judge signals inherit the screen for free. **The judge SHIPPED (2026-07-07, Task 192 - judge-signals.mjs):** four deterministic detectors on the capture hooks - tool-result +/- (JSONL is_error, attributed to the turn window's SEARCHED ids via the recall-log; tight attribution, never the whole snapshot), user-correction - (start-anchored patterns on the prompt hook; revert-phrasing = REVERSAL), re-ask - (a search returning ONLY already-injected ids; polarity per D-246: re-surfacing is DAMPEN, never reinforcement), silent-success weak-+ (expectations pending past TURN_WINDOW_MS resolve WEAK-POSITIVE). Attribution joins by timestamp window, not session id (production search entries carry session:null). **Accepted posture until Task 192 (recorded per skill-review I1/M5, 2026-07-06):** all 7 production emitters today send `dampen` (zero production `reinforce` exists), so the fraction test is trivially satisfied and burst-hold currently degenerates to a DAILY DAMPEN THROTTLE (>=10 applied/day quarantines the rest until UTC midnight) - deliberately fail-PROTECTIVE: a legit bulk day (big import, queue-resolution session) loses late-day dampen SIGNAL but no memory is wrongly dampened; and the hold is prospective, not batch-retroactive - the first ~10 storm dampens DO apply (bounded by the per-fact rate limit at <=0.75 total per fact) before the gate closes, the accepted first-N leak. The fraction becomes a real anomaly detector when 192's judge adds reinforces; revisit both constants there.

### 20.3 Eviction → DEMOTE-NOT-EVICT (fixes the cold-open / Hole B)

- The snapshot is a VIEW; the durable tier is never hard-evicted to un-injected `fragments/`. At cap, **CONDENSE** `HABITS/LESSONS/USER.md` into a tighter form (git keeps the prior version — letta condense-not-delete), NOT a fragment-split.
- **Built (151.4):** the condense is **mechanical** (`condenseScratchpadForCapRelief` — trim trailing whitespace + collapse blank runs, CRLF-tolerant, drops no bullet, no LLM). The on-disk persona file is **intentionally allowed to grow past the inject budget** (the D-61 load-cap-not-write-cap invariant) — the bound on growth is the **promotion rate** (recurrence ≥ 3 gates what gets here), NOT a byte cap, and the snapshot's importance-aware load-cap (§19.3) keeps the high-trust slice injected while the long tail stays searchable. A genuine LLM tighter-rewrite (letta's agent-condenses) is **Task 95** (re-curation), kept OFF the synchronous `appendScratchpadBullet` hot path (hooks/auto-extract call it — an inline Haiku call would be a composition + latency hazard).
- The cap-relief sweep drops **low-trust AND long-unaccessed** bullets first; a high-trust persona trait is NEVER swept out of the injected scratchpads. (MemoryOS-LFU / MemOS-top-N value-blind sweeps ARE the bug; this section overrides §19's fragments-eviction for `trust_score`-high facts.)
- **Built (151.5) — the sweep order is value-ordered on BOTH surfaces, a two-axis CONJUNCTION (never single-axis — single-axis IS the MemoryOS-LFU/MemOS-top-N bug):**
  - **Inject surface** (`truncateTierToBudget`, §19.3/D-66 — already built): sections drop **lowest aggregate trust first → oldest → tail**; a section holding any high-trust bullet is protected before one that holds none. 151.5 adds a trust-varying regression test pinning "low-trust section drops, high-trust survives."
  - **Write surface** (`consolidate`): the drop GATE stays the existing two-axis conjunction (`trust !== high` **AND** age > 14 d — high-trust exempt at any age, recent low-trust spared); 151.5 orders the eviction LIST **low-trust before medium, then oldest first**, so the archive + audit (and any future partial-drop) see the cheapest bullets first.
  - **✅ 151.6 re-evaluation RESOLVED (2026-06-30, D-238) — the sweep KEEPS the `trust` ENUM proxy; it does NOT consume the evolved `trust_score` float. Verdict grounded in BOTH research + code:**
    - **Research:** the systems that evolve trust (memclaw `_adjust_weights`, letta, graphiti) use the score as a **FLOOR + never-delete protection**, NOT as an active sweep-ranking driver. The systems that DO rank-and-sweep by a score (MemoryOS-LFU, MemOS-top-N) are the **CAUTIONARY** ones — *exactly the Task-151 bug*. So wiring `trust_score` into an active hot-path sweep would drift TOWARD the documented bug, not away from it.
    - **Code:** the protection the score provides is already wired in the ARITHMETIC — `TRUST_SCORE_FLOOR = 0.05` (never-zero → never auto-deleted by trust decay) is enforced in `updateTrustScore`/`initTrustScore`. The sweep already protects high-trust STRUCTURALLY via the enum (`scratchpad.mjs` "preserve high-trust regardless of age" + `inject-context.mjs` "never evict a high-trust bullet before a lower one"). The float would only re-order *within* the medium/low band — a refinement, not a missing protection.
    - **Reliability:** `inject-context.mjs` does NOT open the index-db; adding a `trust_score` lookup would put DB I/O on the 500 ms SessionStart inject path AND make the sweep depend on an overlay value that resets on a full reindex (D-237) — non-deterministic across a repair. The enum is read from the always-present committed `.md` provenance: no such failure mode.
    - **So:** the enum-based sweep ORDER (151.5) + the `trust_score` FLOOR (151.7) + demote-not-evict (151.4) together ALREADY deliver the research-faithful protection. The `trust_score`'s job is the floor + protection (the dampen lowers it, the floor stops it at 0.05, the demote-not-evict store never reaps it), NOT to drive the hot-path sweep ranking. No new sweep code; the `// 151.6: re-evaluate` markers are now resolved (kept as decision-trail pointers to this verdict).
- **⚠️ AMENDED 2026-07-13 (Task 194, ADR-0017 Phase 2 — the narrow revision the ADR's Consequences pre-authorized, executed with the new evidence per the decision-trail rule).** The "cautionary bug" this section guards against — rank the HOT PATH by a naive score — **remains forbidden and untouched**: inject stays enum-ordered, opens no index-db, and a structural regression test pins its import graph (tests/cli-search-blend.test.js). What changes, narrowly: **SEARCH ranking now blends a confidence-gated trust term** — `blended = bm25 × (1 + λ·(trust_score − 0.5))`, facts only, applied only past an evidence threshold — and the score now **gates survival** in curation (the §20.7 survival gate). The new evidence that authorized it (ADR-0017's corpus): Memoria + memclaw are the two oracle-free systems that close the loop into ranking, both score-blended and both healthy; the cautionary systems (MemoryOS-LFU / MemOS-top-N) failed by ranking VALUE-BLIND sweeps, not by blending an outcome-earned score into an already-open search query. The three D-238 reliability arguments above (floor-not-ranker / structural enum protection / no DB on the inject path) all still hold — they were about the SWEEP and INJECT surfaces, which are unchanged. Full mechanics: §20.7.

### 20.4 Routing + drain + mention (fixes Hole C; keeps D-169)

- Explicit `lessons-promote` TOPIC-routes across USER/HABITS/LESSONS (like auto-persona's classifier) instead of piling into one `DEFAULT_SECTION` → no single-section overflow (**Hole C**).
- Silent auto-drain stays (no queue the user drains); promotion auto-applies, post-hoc revert via `cmk forget`.
- Optional in-conversation MENTION on a high-recurrence promotion ("noticed X across 3 projects — promoted it") — a heads-up, NOT a gate (awrshift warmth without re-introducing the human-in-the-loop).

### 20.5 Re-curation op-set (151 consumes; full build = Task 95)

ADD / UPDATE-in-place / **SUPERSEDE-mark (never DELETE)**: mem0 `md5` hash-dedup floor → graphiti `resolve_edge` (one LLM pass, *event-time wins, not the LLM*) → archive-with-provenance (memclaw `crystallized_from`). 151 needs only the supersede-on-contradiction path its trust signal (20.2) depends on; the full pass is Task 95.

### 20.6 Composition

- **Task 97** folds in as 151.6–151.8 (the `trust_score` field) — it IS the protection mechanism 20.3's sweep order needs.
- **Task 66** (temporal validity, v0.4.4) builds the full validity-window engine; 151 consumes only the SUPERSEDE signal (graphiti event-time-wins), not the engine — no re-derivation.
- **§19** (load-cap + graduation): this section OVERRIDES §19's fragments-graduation for `trust_score`-high persona facts (they condense, never graduate-out); §19's mechanism still governs genuinely-low-value overflow.

### 20.7 The confidence-gated search blend + survival gate + anti-pattern conversion (Task 194, v0.5.3)

_Canonical HOW for ADR-0017 Phase 2 — the MEASURE→RETRIEVE edge, closed. Decision: [ADR-0017](../docs/adr/0017-memory-learn-loop-cross-session-runtime-judge-as-adapter.md) Decision #3 + #5; the §20.3 amendment above records the narrow revision. Precedents: Memoria (the multiplier shape), memclaw (the weight-into-ranking loop), ExpeL (survival gating), Memento/REMEMBERER/Negative-Knowledge (anti-pattern retention)._

**The blend (`search.mjs::blendTrustScore`, pure + exported).** The facts-scope keyword backend fetches an oversampled candidate window (3× the requested limit), then re-ranks: `blended = bm25_rank × (1 + BLEND_LAMBDA·(trust_score − 0.5))` — Memoria's retrieval-integrated multiplier (`final_score *= (1 + w·(useful − …)).clamp(0.5, 2.0)`) adapted to FTS5's negative-better rank; multiplicative = scale-invariant against corpus-dependent BM25 magnitudes. `BLEND_LAMBDA = 0.5` bounds the adjustment at ±22.5% of the rank (trust separates ties and near-ties; a weak match can never leapfrog a strong one). The sort is stable, so untouched rows keep their exact BM25 order; a dampened row is re-ranked, never dropped (demote-not-evict at the result-list level). Hybrid mode inherits the effect for free — RRF fuses by rank position, and the keyword list arrives pre-blended; semantic-only mode is unblended (the backend owns its similarity scale — a future refinement, not a gap: hybrid is the configured default when semantic is installed).

**The confidence gate (`signal_count`).** The trust term applies ONLY when the fact carries real outcome evidence: `observations.signal_count` — a feedback counter incremented per APPLIED signal in `applyTrustSignal` (rate-limited / quarantined / not-found events never count) — must reach `BLEND_MIN_SIGNALS = 3` (the kit's existing "three occurrences = a pattern" constant, ADR-0016 §20.1). A score nobody has tested never moves rank. **The ADR-0017 open seam is resolved by construction:** recurrence/restatement lives in the `initTrustScore` SEED (capped `recurrenceTerm`), never in `signal_count`, so restatement cannot buy ranking boosts the way a tool-outcome can. Same overlay posture as `trust_score` (D-237): a full reindex resets the counter to 0 — the gate then honestly reports "no evidence" until the loop re-earns it.

**Judgments NEVER rank (ADR-0017 Decision #1).** The blend excludes any row whose `source_file` is a `judgment_*.md` (the writeFact filename convention — the checkable rule judgment.mjs promised). Judgments surface with their confidence visible; they never auto-rank.

**The survival gate (`trust-signal.mjs` → `prune-queue.mjs`).** An applied dampen landing on a fact ALREADY at `TRUST_SCORE_FLOOR` is "floored + still failing" — the score can't sink further, so the verdict escalates to prune-CANDIDACY: `routePruneCandidate` appends to `context/queues/prune-review.md` (always the project tier — where the trust overlay lives), audit-logged, NEVER a silent delete (ExpeL's prune-at-zero, demote-not-evict flavored). The queue is PRESERVATIONAL (the conflict-queue convention): resolved entries keep their `resolution:` marker, which doubles as the idempotency memory — a routed id (pending OR resolved) is never re-nagged. Candidates arrive automatically (the D-169 automatic-path criterion); resolution is `cmk queue prune` / `mk_queue_resolve {queue: 'prune'}`: **convert / forget / keep / skip**.

**Anti-pattern conversion (`anti-pattern.mjs::convertToAntiPattern`).** The `convert` resolution retains the failing content REFRAMED as a warning — never erased (erasing a failure loses exactly the "this looked right and wasn't" knowledge). Two shapes: a scratchpad **bullet** is rewritten in place via the memoryWrite replace path (`⚠️ AVOID (repeatedly failed in practice): …`) — scratchpads inject, so the warning IS injected; a granular **fact file** is retyped `type: anti-pattern` (a CONVERSION-ONLY type — writeFact's VALID_TYPES deliberately excludes it, like judgments: born from the loop, never dictated), title AVOID-prefixed, body warning-blocked, filename kept (frontmatter is the truth; renaming would churn INDEX.md + git history), PLUS a compact high-trust warning bullet appended to MEMORY.md § Anti-patterns so the warning reaches the injected snapshot. `forget` routes through the shape-aware `forgetCandidate` (fact → `forget()` tombstone; bullet → memoryWrite remove tombstone). Everything audited (`anti-pattern-converted` / `prune-kept` / the forget trail).

**Constraint edges honored (the §20.3 amendment's checklist):** inject untouched (enum-ordered, no index-db import — structurally pinned); no ritual (candidates surface with no manual command; the queue verb is only the decision step); markdown stays truth (the queue is a markdown file; conversions edit committed markdown through safe paths); the asymmetry respected (the gate keys on dampens — failure evidence — not on reinforce scarcity).

### 20.8 The recall-trigger hybrid — gated cheap-index pointer hint + existence advertisement + skill-fire telemetry (Task 233, v0.6.3)

_Canonical HOW for [ADR-0024](../docs/adr/0024-recall-architecture-judgment-pulled-hybrid.md)'s build slice — keep judgment-pulled as the deep spine, close the under-fire risk (D-40/D-153) with three composed additions. Evidence: the [recall-trigger study](../docs/research/2026-07-19-recall-trigger-architecture-study.md) (pro-workflow hint + Letta advertisement) + Memora (the in-skill ladder refinements) + the [octopoda-OS code dive §5](../docs/research/2026-07-22-octopoda-os-code-dive.md) (the conservative relevance-floor warning)._

**1 — the gated cheap-index pointer hint (`capture-prompt.mjs::buildMemoryHint`).** The per-prompt hint upgrades from a static line to a REAL FTS5 query over the prompt's terms. Gates, in order: below `HINT_MIN_PROMPT_CHARS` (10) → `null` (no fire — "ok"/"go" never pay); no granular archive (`INDEX.md` with a `- (` entry) → `null`; prompt ≥ `HINT_QUERY_MIN_CHARS` (20) → run the query, else the static hint. The query is **recall-oriented, NOT the precision search**: it extracts content terms (drops a small stopword set + <3-char tokens, caps at 8) and OR-joins them — a whole natural-language question fed to `cmk search`'s per-token implicit-AND matches ~nothing (the doc would need every word, verbs and all). When the top hit clears the **bm25 score floor** (`HINT_BM25_SCORE_FLOOR = -0.5`; FTS5 bm25 is negative-better so a hit clears at `score <= FLOOR`) the hint injects up to 3 **index lines** — `id · title · date`, title from `INDEX.md`, **never bodies** — plus the skill pointer; below the floor / no hit → the static hint. The floor is **conservative (lenient)** per the octopoda-OS lesson (their 0.80 floor filtered 5/7 relevant facts): bm25 magnitude is CORPUS-DEPENDENT (measured — near-zero IDF on a 2-doc index, −4..−12 on a realistic corpus), so −0.5 cuts only near-zero degenerate single-common-term matches on a real corpus; it is a named, tunable constant (a real-corpus calibration pass may adjust it against the recall.log fire-rate). **Zero LLM/embedding.** **FAIL-OPEN**: this runs on EVERY prompt, so ANY error (missing index, sqlite failure) degrades to exactly today's static hint — never a crash, never a blocked prompt. The query opens the EXISTING index only (never reindexes — a slightly-stale index just misses a pointer; the DB is not created on the hot path, so a never-searched project stays static). This runs in the UserPromptSubmit hook — NOT the §20.3-pinned inject path — so the ADR's sanction of a real FTS5 query in the per-prompt hook applies; `openIndexDb` now closes-on-throw so a corrupt DB never leaks a handle. **Deliberate, measured trade:** this is the first time the interactive per-prompt path does a bounded SYNCHRONOUS sqlite read — accepted because it is measured (~8-9 ms on the real ~2000-fact corpus, latency-tested), fail-open, and opens the existing index only (no reindex, no DB creation on the hot path). **PRIVACY:** the prompt is screened at the top of `buildMemoryHint` (`sanitizePrivacyTags` + `maskPii`, FR-15) BEFORE the query or the log sees it, and the recall log stores only the extracted, screened, length-capped terms — never raw prompt text.

**2 — the existence advertisement (`inject-context.mjs::buildExistenceAdvertisement`).** The SessionStart snapshot gains ONE live metadata line — `Searchable memory beyond this snapshot: N recorded fact(s) · scopes: … · latest capture <date>` — so the model knows WHAT there is to search before deciding. **§20.3 IMPORT PIN honored:** computed WITHOUT opening the sqlite index (the inject path imports no index-db — a structural regression test pins the graph). The three inputs are all markdown/logs: the COUNT from `INDEX.md`'s `- (` entries (the reindex-maintained derived view); the SCOPES from tier-file presence (`facts` always; `decisions` when `DECISIONS.md` exists; `transcripts` when a transcripts/sessions dir holds markdown); the RECENCY as an absolute date from the audit-log tail's newest `created`/import-applied entry. **Byte-stable when memory is unchanged** (no `now`-relative rendering — the snapshot is prefix-cache-sensitive); reserved out of the cap like the preamble/temporal-mention/commit-proposal lines (§7.1.2), and emitted only with a body (empty-archive installs stay byte-identical to the pre-233 shape).

**3 — the in-skill Memora refinements (`memory-search` SKILL.md, both committed copies).** The ladder absorbs: (a) **score survivors 1–3, fetch bodies only when ≥2 survive at ≥2** (the policy-retriever discipline — filter hard, fetch little); (b) **episodic grouping** — hits sharing a `source_file` → ONE `expand`, not N `mk_get` bodies (restores the narrative the flat hits fragmented, at a fraction of the tokens); (c) the **relative-answer re-query** rule ("the same X as Sarah" → re-query the referent first, then X).

**4 — skill-invocation telemetry (the added scope — `recall-log.mjs`).** The kit logged recalls (`inject`/`search`) and extraction outcomes but NOT skill fires, so ADR-0024's own success criterion (fire-rate moves) was unmeasurable. Two derivable signals, both in the existing recall.log NDJSON: a **hint-fire** entry `{source:'hint', form:'static'|'evidence', ids, query, error?}` per fired hint (before/after: the evidence-vs-static share, and whether the hint precedes a recall) — `query` is the SCREENED extracted terms (never the raw prompt, capped), and `error:true` marks an errored evidence query so "errored" ≠ "no match" in the fire-rate data; a **search-origin** tag `{source:'search', origin:'skill', …}` written when `cmk search --source skill` / `mk_search {source:'skill'}` runs (the skill's first ladder step passes it), so a skill-driven recall is distinguishable from an ambient one. Both fields are added ONLY when set, so ordinary inject/search entries stay byte-shape identical and the Task-191/192 consumers (which filter on `source` = `search`/`inject`) are inert to a `hint` entry. Each entry also records the harness **tool-loading policy** (`toolPolicy`) from `$CMK_HARNESS_TOOL_POLICY` when the cut-gate exports it (P-DXPCKAUU: deferred-tools harnesses are a different fire-rate population). All appends best-effort (a broken diagnostic never breaks the hook).

**Explicitly out of scope (rejected in the ADR):** per-prompt SEMANTIC injection; inject-everything; the PreToolUse:Read file-context trigger (deferred until this slice's fire-rate numbers are in).

**Tuning instrumentation (Task 212, v0.5.3):** the blend's before/after numbers are `cmk stats memory-health` (`memory-stats.mjs` — AutoMem's Figure-4 indicator set aggregated from recall.log / audit.log / truncation.log, report-only): **empty-search rate** and **redundant-write rate** are the two the blend should move over time (fewer misses when healthy facts rank first; fewer redundant writes when recall works). Distinct from the Task-144 doctor section (content quality over the fact archive) — this is PROCESS behavior over the activity logs.

### 20.9 Source-aware injection split + the injection-size meter (Task 253, v0.6.x)

_Two independent riders on the SessionStart injection surface, borrowed as IDEAS from [obsidian-mind](../docs/research/2026-07-21-repo-obsidian-mind.md) (borrow candidates 1 + 3) and reimplemented in kit terms. Zero LLM, zero dependencies, fail-open everywhere. The third borrow (tmpdir-cwd for detached spawns) lands in §8.5._

**1 — the source-aware injection split (`inject-context.mjs::injectionModeForSource`).** Claude Code's SessionStart payload carries `source` — **primary-source verified 2026-07-27** against [code.claude.com/docs/en/hooks](https://code.claude.com/docs/en/hooks): *"How the session started: `startup` for new sessions, `resume` for resumed sessions, `clear` after `/clear`, `compact` after compaction, or `fork` for a new session forked from an existing one."* Both inject bins (npm + plugin) already parsed the payload for `session_id`; they now read `source` from the same parse and pass it through.

- **Pointer mode fires on `resume` ONLY** (`POINTER_MODE_SOURCES`). A resumed session replays its transcript, so the snapshot injected at session start is already in the model's context and re-injecting the tier bulk pays full byte price for nothing. The bulk is replaced by ONE byte-stable line (`SNAPSHOT_POINTER`).
- **The static/volatile split.** REPLACED: the tier blocks (`body`) and the state-label instruction that describes labels living inside them. STILL INJECTED: the authoritative-memory preamble (the D-40 under-fire class — re-anchoring authority is worth ~700 B), the existence advertisement (§20.8 — "what there is to search" matters *more* when the bulk is absent), and the volatile action lines (temporal mention + commit proposal — a resumed session has not seen the git dirtiness that accrued since). When in doubt, keep injecting.
- **`compact` DELIBERATELY KEEPS THE FULL SNAPSHOT — a narrowing of the borrow** (obsidian-mind pointers on both). Anthropic's own docs describe compaction as summarizing older history to free space ([docs/en/costs](https://code.claude.com/docs/en/costs)), so the pre-compaction snapshot survives as a *summary*, not verbatim text. Pointing at content that may have been summarized away would silently cost the session its memory — the one failure this kit exists to prevent. Compaction is precisely when re-anchoring earns its bytes.
- **Fail-open everywhere.** `startup` / `clear` / `fork` / an unknown value / a non-string / a missing or unparseable payload all take the FULL snapshot — byte-identical to the pre-253 shape. The cross-agent legs (Kiro / Cursor / Codex `inject`) pass no `source` and are therefore unchanged.
- **Two guards, and the optimization declines itself.** (1) **SIZE** — the pointer is taken only when it is genuinely *smaller* than the bulk it replaces. On a small corpus it is not: measured on the real bin, a one-bullet project emits **673 B on startup but 778 B on resume**, because the preserved preamble + advertisement + pointer line outweigh a two-line body — inverting the premise for exactly the fresh-install shape. (2) **CAP** — the pointer variant is not produced by `enforceCap`, so it is measured against `capBytes` and rejected under a pathological tiny cap in favour of the (always cap-honoring) full snapshot. An empty-memory project emits no pointer at all — the kit does not claim memory it has not got.
- **The mode label describes the EMISSION, never the request.** When either guard rejects, the result is a full injection and `injectionMode` / the status line / the `recall.log` entry all say `full`. This is load-bearing rather than cosmetic: the pointer-vs-full aggregation in the log is the evidence that the saving is real, and a label that reported the *requested* mode would count emissions that never happened.
- **Prefix-cache discipline:** the pointer line carries no count, clock, or path, so two resumes of unchanged memory are byte-identical.
- **Known bounded edge — memory written DURING the session, then resumed (documented, not silently accepted).** The pointer says "unchanged since session start", which is a statement about *the emission*, not a proof about the disk: a scratchpad bullet captured mid-session and then `--resume`d is not re-injected, so it stays invisible to that session's context. Three things bound it, which is why it ships as documented rather than gated: (i) the frozen-snapshot contract *already* says writes take effect at the next session start, and a resume continues the same session id; (ii) most capture lands in the granular archive, which the snapshot never carried — those facts are search-reachable in both modes; (iii) pointer mode still injects the **existence advertisement**, whose live fact count and latest-capture date DO move when something was captured, and the pointer line itself names `cmk search` as the reach. **Trigger to close it (D-248 form):** if a real session is observed missing a same-session capture across a resume, gate pointer mode on tier-file mtime vs. the last `inject` entry's timestamp for that session id (both artifacts already exist — a bounded `recall.log` tail read plus the stats the tier walk already does; no new sidecar state, per ADR-0002).
- **The sibling case — resuming a session that was NEVER injected into** (the kit was installed mid-session, the session predates the install, or its first SessionStart hook errored): the pointer then points at something that was never there. It is self-limiting rather than silent — the pointer line names `cmk search` as the reach, the existence advertisement still rides with the live fact count, and the very next non-`resume` start emits the full snapshot and heals it — so the worst case is one resumed session searching instead of reading. The same-session-capture trigger above closes this one too (a session with no prior `inject` entry is exactly what that lookup finds).
- **Why the `compact`-keeps-full rule makes the resume pointer SOUND, not just cautious** (the composition worth stating): the risk case for a pointer is "the context it points at was summarized away," and compaction is the only event that does that. Because a `compact` start re-injects the FULL snapshot, any post-compaction context already holds a fresh copy — so a `resume` arriving after a compaction points at memory that a compaction-time injection has re-anchored, not at text the summarizer ate. The two rules compose: `compact` restores, `resume` economizes.

**2 — the injection-size meter (`inject-context.mjs::buildStatusLine`).** Every SessionStart status line now ends with `· snapshot <N> B` (plus `(pointer)` when pointer mode produced it) — obsidian-mind's `formatInjectionSize`, kit-shaped.

- **Placement resolution (the self-reference question):** the meter rides `systemMessage`, the USER-display channel (D-130), **never `additionalContext`**. Three consequences, all load-bearing: the model pays zero tokens for it; the snapshot stays byte-identical so the prefix cache and every byte-stability contract are untouched; and there is no self-reference to resolve — it measures `snapshot`, a string it is not part of. Byte counts are therefore exact, not "pre-meter".
- **Door 5:** the same numbers land durably on the `recall.log` `inject` entry as `bytes` + `mode`, so the token saving is *measurable from the log* rather than asserted in prose. Both fields are added only when set, so `search` / `hint` entries keep their pre-253 shape.
- **Fail-open:** the meter is computed defensively and appended on every return path including the catch — a meter error degrades to no meter, never to a broken snapshot.

## 21. Dream re-curation engine (Task 95) — the offline-consolidation pass (designed 2026-07-18, D-352; build lanes after v0.6.0)

_Design written from the settled forks (D-352, the four-question grill) + the 11-source research base ([synthesis](../docs/research/2026-07-18-task-95-design-input-synthesis.md), [Sleep paradigm](../docs/research/2026-07-18-sleep-paradigm-memory-consolidation.md)). This section is the mechanism contract the build implements; no open forks remain._

### 21.1 What it is

The kit's **offline consolidation** organ (the Sleep paper's second phase; Anthropic Dreams' shape): a batched pass that reads **raw transcripts + the fact corpus + scratchpads** and produces re-curation ops — merge duplicates, resolve contradictions latest-wins, surface cross-session insights, prune resolved scratchpad threads (the absorbed Task-68 facet), re-curating from the RAW tier rather than derivative-over-derivative (the D-44 lesson; Memora measured raw-grounding 0.863 vs extracted 0.838). It absorbs F-D (semantic dedup), Task 55's remainder (behavioral-pattern/insight surfacing), and Task 68; `weekly-curate`'s curation half evolves into it. **Phase 2 of the same lane** (built second, on the proven envelope): the AutoMem-style **schema/process self-audit** — a meta-pass over `audit.log` + `recall.log` + the `context/memory/` tree diagnosing SYSTEMIC pathologies (unbounded append-logs, redundant-write patterns, recurring empty searches), report-only into the same review queue.

### 21.2 The three-stage pass

1. **Deterministic floor (zero-LLM):** canonical-ID / hash dedup over the candidate set (the mem0 lesson — they abandoned their per-write LLM judge for exactly this floor). Nothing the floor can decide reaches the LLM.
2. **ONE batched LLM call (the TencentDB pool shape):** per new/changed memory, recall top-K=5 existing candidates (FTS5 BM25; embedding cosine at θ=0.80 when the semantic backend is present — the Memora-validated threshold; **App. F warning binding: θ stays ≥0.80, similarity only FINDS candidates**), build one de-duplicated pool, and a single call — which accepts an optional CAPPED free-text `--focus`/instructions field (≤500 bytes, screened like any input; the user steers a pass toward a topic — adopted 2026-07-21 from Anthropic's shipped Dreams API `instructions` param, primary-verified, D-380) — returns per-item `action ∈ {add, update, supersede, none}` + `target_ids[]` (many-to-many) + proposed wording + a **timestamps union** (feeds the Task-66 validity engine). **The LLM proposes; CODE decides:** ids are validated against the corpus (hallucinated ids rejected — the D-230 bridge discipline), **which-wins on a contradiction is decided by EVENT-TIME, never by the LLM**, and the LLM never counts recurrence.
3. **Op application — the D-352 op-class split:**
   - **AUTO class (non-destructive, deterministic, reversible):** exact-duplicate cleanup, **relative→absolute date normalization** (a fact saying "yesterday"/"last week" rots silently; normalizing against the fact's own `created_at` is deterministic and lossless — adopted 2026-07-21, D-380), and event-time supersede-marks (validity-window close via the 66 engine — both sides retained, archive-not-delete). Applied under a **feedback-screen-style envelope** (ADR-0017 Decision-#4 template): per-run op budget, every op audit-logged, floor/trust rules respected, burst-hold on anomalous volumes.
   - **QUEUE class (lossy or generative):** merged wording, NEW insight/judgment entries, scratchpad thread-pruning, and ANY op touching a high-trust fact → land as a reviewable **adopt-or-discard diff** in `context/queues/recuration.md` (the conflicts/prune queue pattern; composes with D-126/Task-150 propose-and-approve). The Dreams contract holds: **inputs are never modified; the prospective output is validated before anything applies; the source tier is pruned only AFTER adoption** (the Sleep compute→consolidate→update protocol).

### 21.3 Screening + provenance (the D-352 F2 answer)

Input AND output route through the **shared** `screenBeforeCommittedWrite` (Task 216 — extending the one screen; a dedicated second screen re-creates the D-337 two-screens-drift shape and is rejected). Each extracted claim carries a **source-trust tag** (Task 70.5: `user-said` / `tool-output` / `pasted-web`); only `user-said` claims may promote to committed authority through the AUTO class — the rest queue. Every condensed/merged claim keeps **source pointers** (the Task-213 pattern: source-session ids + absorbed fact ids; "lossy summarization is where provenance dies") and the merged-timestamps union.

### 21.4 Scheduling + resumability

Runs **against the today→archive roll** (the Sleep ordering invariant: consolidate BEFORE the fast tier loses data — the lifecycle-G8 spot), on the existing idle/cron + lazy machinery, composed with the Haiku cooldown. **Resumable per ADR-0020:** per-batch durable units, results banked as they complete, resume point derived from artifacts, partial output preserved on failure (the Dreams behavior). Insight surfacing obeys the ADR-0017 judgment contract: provisional, confidence-visible, **never auto-ranked**. **No same-session self-grading (adopted 2026-07-21, D-380):** the pass never evaluates, merges, or grades content produced in the session that spawned it — a run triggered at a session boundary operates on PRIOR sessions' output only (the corpus's convergent failure: a consolidator grading its own fresh output amplifies rather than curates).

### 21.5 Gates (each run, before anything lands)

- **HC-12 as a regression gate:** the pass's output must not resurrect tombstoned content (deletion propagation — Task 210's check run against the prospective output).
- **Entrenchment pre-mortem (adopted 2026-07-21, D-380):** a fixture corpus carrying a planted, screened-out payload must come OUT of the pass without that payload consolidated, reworded, or propagated into derived output — arXiv 2607.14611 measured that consolidation passes ENTRENCH planted instructions more often than they remove them (96.7% persistence on the flag-but-keep path); the kit's pass must be tested for the failure the field measured, not assumed immune.
- **Task-212 stats probe:** before/after deterministic metrics (fact count, dup-pair estimate, queue depths) logged per run; a run that worsens them quarantines its own AUTO ops to the queue.
- **Never-silent-skip:** every skipped item carries a stated reason in the run log (the stash discipline); every op audit-logged.
- **Conservative by default:** merge threshold θ≥0.80; per-run op caps; the archive/persona tiers churn RARELY (Sleep Fig. 4: a fast-churning stable tier HURTS retention).

### 21.6 Anti-scope (settled, not up for re-litigation at build time)

No DELETE op exists (only the human-only `cmk purge --hard`, §6.5). No in-entry trail-lossy merges (the Memora not-adopted line: the kit keeps separate facts + closed windows). No LLM-decided which-wins, no LLM-counted recurrence, no auto-ranked judgments, no unscreened raw-verbatim to the LLM, no self-audit mutations in phase 1 (report-only until the envelope is proven).

## 22. Bootstrap import — `cmk import-sessions` (Task 225, D-326; shipped v0.6.0)

The day-one-memory mechanism: a user with months of Claude Code history installs the kit
and their memory already knows it. Origin: the 2026-07-12 market sweep (the origin
creator's v3 `memory:import-sessions` demo — see the research note); the kit's version
differs in exactly the places the sweep flagged as its strengths (screening + resumability).

### 22.1 Pipeline (per session, oldest-first)

`discoverSessions` (38b, `~/.claude/projects/<slug>/<uuid>.jsonl`) → `extractTranscript`
(38b filter contract: text turns only, tool/thinking/system noise dropped) → raw markdown
archived to **`context/transcripts/imported/<uuid>.md`** (the ADR-0010 floor for imported
history — **gitignored + never indexed**: unscreened content must not travel or become
searchable, the 148.3 invariant) → ONE agent-relative backend call (`makeBackend`, Task
200/201) summarizes into the day-file shape (`## Decisions / ## Open Questions / ## Active
Threads`, ≤`SUMMARY_MAX_BYTES`=1200) **with the ADR-0019 privacy instruction in the same
call** (the sessions-tier posture: judge-in-the-prompt + L1 `maskPii`, no second call) →
`screenBeforeCommittedWrite` (216, scope `all`) → append `today-<session-end-date>.md` via
the shared `appendToTodayMd` writer, prefixed with a `<!-- imported-session: <uuid> … -->`
provenance marker (Task 213) → ledger + audit (`import-applied` / `import-screened` /
`import-skipped-empty`) → best-effort `syncTranscriptChunks` so the summaries are
searchable immediately (scope `transcripts`; the next `reindexBoot` self-heals if it fails).

### 22.2 Resumability (ADR-0020) — ledger-artifact, NOT run-once sentinel

The origin creator's import is sentinel-guarded run-once — considered + **REJECTED**
(tasks.md 225 decision trail): it can't recover a killed run and can't catch up later.
The kit derives the resume point from artifacts: **`context/sessions/imported-sessions.md`**
— a committed, single-writer, append-only ledger, one line per processed session
(`imported` / `screened` / `skipped-empty`). Why a committed ledger and not day-file
markers alone: weekly-curate ROTATES old day files into `archive.md` (Haiku-summarized —
markers die), so only the ledger keeps idempotency durable across rotation and `git clone`.
Day-file markers remain the secondary guard (a run killed between the day-file append and
the ledger line re-skips via the marker scan). A failed backend call is deliberately NOT
ledgered — the next run retries exactly the remainder. The ledger is excluded from the
transcript-chunk index (`SESSIONS_EXCLUDE`) — a UUID list is not recallable memory.

### 22.3 Consent + bounds

Selection: newest-first, `DEFAULT_MAX_SESSIONS`=50 cap (`--max` / `--all` override;
`--since` / `--slug` / `--all-projects` scope). One confirmation, default-skip, after an
honest cost heads-up (one backend call per session on the user's subscription); `--yes`
required non-interactively; `--dry-run` previews. **The install offer** (the automatic-path
criterion): `cmk install` on the claude-code path detects existing history for the
project's slug and asks the one question itself — the user never needs to know the command.

### 22.4 Composition note — the curate-squash bound (open follow-up)

`weekly-curate` folds ALL >7-day-old day files through ONE `archiveMaxBytes`-capped
compress, then deletes them — so a bulk import of months gets coarser archive granularity
than live capture would have (26 weekly folds vs 1). Mitigations shipped: the default
selection bound + compact summaries + the raw floor (drill-down survives regardless).
The clean fix is making weekly-curate per-week-resumable (the ADR-0020 checklist applied
to curate — it is all-or-nothing today). **Ship trigger:** when a real bulk import (>4
weeks of history) demonstrably degrades archive quality, or at the next curate-surface
task, whichever first.

## 23. Failure-driven health nudge — the kit tells the agent when it is broken (Task 250, v0.6.4)

_Canonical HOW for the ratified 8-point design ([D-412](../docs/journey/DECISION-LOG.md), the 2026-07-29 grill). Evidence: the [self-healing-CLI-repair-UX survey](../docs/research/2026-07-29-self-healing-cli-repair-ux.md) (brew · flutter · git-maintenance · npm/pnpm · rustup · Tailscale · Claude Code `/doctor` · Nx · Sentry, primary sources) plus the [Octopoda-OS code dive](../docs/research/2026-07-22-octopoda-os-code-dive.md) for the detection half. The survey's honest finding: **no shipped tool whispers its own broken state into a coding agent's per-prompt context** — the ingredients all have precedent, the composition is the kit's._

### 23.1 The problem this closes

Every hook path in the kit fails **open** by design — a broken capture must never break the user's prompt — and `cmk doctor` is **reactive only**: nothing runs it, and users do not (`U-U5PPSG7Y`, high trust). Compose those two correct decisions and you get the kit's worst failure mode: a wedged agent CLI, a repeatedly-timing-out extraction, or a crashed precompact worker all present as *nothing happened*, for as long as it takes a human to become suspicious. Durability is the product; silent non-capture is the one failure that costs what the kit exists to protect.

**Two shapes were considered and REJECTED at the grill, recorded so nobody re-proposes them:** auto-running doctor at SessionStart (ceremony on every session, and the HC-10 cut already said no), and a SessionStart status-line nudge (fires every session and has **no self-clean lifecycle** — after one fire it can only learn the fix landed by re-checking every session, which *is* the auto-run we cut).

The shape that survives is **failure-driven and anchored to the EVENT, not a schedule**: fix the thing → the next run succeeds → there is no fresh failure → there is no nudge. Self-clean is structural rather than a cleanup job.

### 23.2 The evidence store — `health.log` + the Warnable-shaped registry (`health-log.mjs`)

ONE append-only NDJSON log at `context/.locks/health.log` (the gitignored run-time-state tier, same class as `audit.log` / `recall.log` / `poison-guard.log`). One line per event: `{ts, schema, class, outcome: 'ok'|'fail', detail?}`.

- **Instrumented ops append BOTH outcomes.** The `ok` is what CLEARS a warning, so it is not optional — a fail-only log can never self-clean.
- **Event-driven only. Nothing probes the environment.** A deterministic condition enters the log when a real op *hits* it (a spawn `ENOENT` → `agent-cli-missing`), never by the hot path going looking. This is what keeps the per-prompt read to one bounded file tail.
- **No sidecar state.** The active-warning set is DERIVED from the log tail on every read ([ADR-0002](../docs/adr/0002-markdown-source-of-truth-over-opaque-db.md)). A Warnables-style read-modify-write state map was explicitly rejected as the two-writer hazard — and Tailscale's own stuck-warning bug (#19241) is what statefulness invites.
- **`detail` is a machine-ish token** (an error category, a spawn reason, a tool name) — never a message and never user content. The log is a diagnostic, not a transcript.

**The registry** is Tailscale's `Warnable` struct, kit-shaped: `code` (the stable id the troubleshooting skill's repair book is sectioned by), `title`, `severity`, `dependsOn`, `primaryAction`, `fixClass`, plus the kit's two additions — `deterministic` and `strikeThreshold`.

| Code | Severity | Deterministic | dependsOn | primaryAction | Fix class |
| --- | --- | --- | --- | --- | --- |
| `agent-cli-missing` | memory-off | yes (1 strike) | — | `cmk doctor` | advise |
| `extract-failing` | memory-off | no (2 strikes) | `agent-cli-missing` | `cmk doctor` | advise |
| `inject-failing` | degraded | no (2) | — | `cmk doctor` | advise |
| `precompact-failing` | degraded | no (2) | `agent-cli-missing` | `cmk doctor` | advise |
| `index-drift` | advisory | yes (1) | — | `cmk reindex` | **silent** |
| `mcp-tool-failing` | degraded | no (2) | — | `cmk doctor` | advise |

`deterministic` means exactly one thing: **can this condition transiently recover on its own?** A missing binary cannot (it is missing until someone installs it); a spawn timeout can (the machine was busy). `strikeThreshold` is therefore DERIVED from it, not independently chosen, and a test pins the two together so they can never drift apart.

`fixClass` follows the survey's observed industry split and bounds what the troubleshooting skill may do: **silent** (kit-owned, idempotent, reversible — just run it), **confirm** (touches user-owned state — PROPOSE it, one-tap approve, [ADR-0018](../docs/adr/0018-memory-commit-propose-and-approve.md)), **advise** (expensive or outside the kit's authority — print the command). **An unknown class defaults to advise**; auto-fix is earned per-fix, never per-tool (Nx's three-condition gate is the template).

**The semantics** (`computeActiveWarnings`, a PURE function over log entries — every edge is testable without a filesystem). Per class, newest-backwards: count CONSECUTIVE `fail` entries, stopping at the first `ok` (**a success resets the streak — that IS the self-clean mechanism**); require the streak to reach `strikeThreshold`; require the NEWEST fail to be within **7 days** (`HEALTH_FRESHNESS_MS` — keyed on "is it still broken NOW", not "when did it start", so a project resumed after a fortnight is not greeted by a warning about something an environment change may long since have fixed). Then **cascade**: a warning whose `dependsOn` names an ACTIVE code is dropped, computed against the pre-cascade set so a chain collapses to its ROOT in one pass. `ts` is sorted as the truth rather than trusting file order, so an out-of-order append cannot silently invert a streak.

**The tail read is BOUNDED** — `HEALTH_TAIL_BYTES` (**64 KB**), one positional read, with the partial head line DISCARDED (a byte-slice of an earlier record would either fail to parse or, worse, parse into something wrong).

**Transition logging at the high-cadence sites — the composition that makes the bound safe (review finding B2).** The tail is bounded AND SHARED ACROSS ALL CLASSES, so a chatty writer evicts a quiet one. At one `ok` per MCP tool call and one per fact write, a few hundred healthy operations pushed a genuine two-strike streak of a SPARSE class off the window before the whisper ever read it — the sparse class was structurally **unreachable**, which is worse than noisy: the feature silently did not work for exactly the failures it exists to catch. The fix is at the source. `appendHealthTransition` keeps a per-process, per-class memory of the last outcome written and appends an `ok` only when the previous outcome was a fail — or unknown, so each process still records one healthy baseline. `fail` is never suppressed.

It is safe because it **preserves the streak semantics exactly**: consecutive fails stay adjacent (fails always write), and the `ok` that arrives *between* two fails always lands (the previous outcome was a fail) — so the transition that CLEARS a warning is never the one dropped. Only the 2nd..Nth consecutive `ok` disappears, and those carry nothing the 1st does not. The memory is a write-rate optimization, not state the verdict depends on: ADR-0002 still holds, because the active set is still derived from the log's own bytes. Applied at **`mcp-server`** (long-lived, hundreds of calls per session) and **`reindex`** (once per fact written); the low-cadence sites — inject, precompact, extract — append directly, since they run about once per session or per turn and their evidence should stay densest. **One subtlety worth stating:** a site that writes a `fail` for a class whose `ok` goes through the transition path must ALSO use the transition form, so the shared memory is updated — otherwise a stale `ok` in the map would suppress the real clearing `ok` and strand the warning. `writeFact`'s `index-drift` fail does exactly that.

The 64 KB bound is then defence-in-depth for whatever cadence a future site brings. The trade remains deliberate and stated: evidence older than the tail window is invisible to the whisper, which is correct — but with transition logging that window now spans a very long span of real activity, because a healthy class contributes one line per process rather than one per operation.

**`detail` is enforced, not just asked for.** It must match `DETAIL_TOKEN_PATTERN` (`/^[a-z0-9._:-]{1,64}$/i`); a violating value is REPLACED with `invalid-detail`, never written through and never thrown on (review finding I2). The prose contract said "never user content" and nothing checked it, so the first future site to pass `err.message` would have put stderr — which can carry a prompt, a path, or a secret — into a file the whisper reads. Losing the reason is acceptable; losing the event is not.

**The write is gated on the install marker** (`context/MEMORY.md`), not on a bare `context/` directory (review finding M2): `context/` is an ordinary folder name, and the kit must not drop a log into an unrelated repo's docs directory. `cmk install` scaffolds `MEMORY.md` on every project, so it is the honest is-the-kit-here test.

### 23.3 The whisper — `buildPromptHookOutput` (`capture-prompt.mjs`)

The per-prompt UserPromptSubmit hook emits ONE line while something is actively broken:

```text
⚠ [core-memory-kit] <code>: <title> — load the troubleshooting skill to diagnose; fix: `<primaryAction>`
```

The **code leads** (D-412 point 5). It is the key the repair book is sectioned by and the only part of the line guaranteed stable across re-wordings of the title, so carrying it makes the whisper → section lookup exact rather than asking the model to map prose onto a heading. It also survives the byte clip, which eats the title only.

- **It does NOT inherit the recall hint's gates — the structural rule of this section.** `buildMemoryHint` returns `null` below 10 prompt characters and on a project with no granular archive; both are correct for a RECALL nudge and both are fatal for a FAILURE nudge, because *"go"* is exactly what a user types while their capture is broken and an empty archive is exactly what a project whose extraction has never once succeeded looks like. So the health read is computed independently and the two results are merged into the one output string, **whisper first**. `buildMemoryHint` keeps its signature and its tests; the whisper is additive.
- **Stateless, present on every prompt while active** (D-412 point 3). No "did I already whisper" sidecar — the Tailscale present-only-when-broken model.
- **One line, always.** Multiple independent actives collapse to the most severe plus a count (`(+N more kit issues)`); the `dependsOn` cascade has already merged same-root failures upstream, so a count > 1 means genuinely separate problems.
- **Byte-bounded** (`WHISPER_MAX_BYTES` = 320) — it is paid on every prompt for as long as the failure lasts. The clip eats the TITLE only, protecting the actionable tail: a whisper that says *something broke* and nothing else is worse than no whisper. Truncation walks code points, never bytes.
- **Fail-open in BOTH directions.** An error in the health read leaves the hint intact; an error in the hint leaves the whisper intact. Neither may suppress the other — the failure the whisper reports is often the same failure that broke the hint.
- **No privacy surface.** No prompt-derived text enters the whisper at any point; it is built purely from the registry (kit-authored strings) and the log's outcome counts.

**Scope bound, recorded rather than assumed: the whisper is Claude-Code-only in wave 1.** The three cross-agent dispatchers (`kiro-hook-dispatch` / `cursor-hook-dispatch` / `codex-hook-dispatch`) call `capturePrompt` — the `<private>`-strip + transcript-append half — but have never emitted the per-prompt recall hint either, so there is no prompt-hook output surface on those legs to hang a whisper on. This is a pre-existing asymmetry the whisper inherits, NOT a regression. The consequence worth naming: the `troubleshooting` skill DOES ship to Kiro (`kiro-skills` copies all three skills), so a Kiro/Cursor/Codex user has the repair book but reaches it through `cmk doctor`'s **HC-14** rather than through a whisper. Closing it means giving those dispatchers a prompt-hook output channel, which is an adapter-parity task, not a health-nudge one. **Trigger (D-248):** the next cross-agent surface task, or the first report of a silent-capture failure on a non-Claude leg.

**Growth + concurrency.** The log has no runtime rotation, the `audit.log` posture (§16.13 covers both when it ships) — but its highest-frequency writer is the MCP `ok` append, one line per tool call, which is busier than anything in `recall.log`. At ~90 B/line and a realistic 10-100 tool calls per session that is single-digit KB/day in a gitignored tier; the bounded tail read means growth costs nothing at read time. **Rotation trigger:** if a real install's `health.log` crosses ~5 MB, it goes on the §16.13 rotation surface with `audit.log`. Concurrent appenders (the detached auto-extract child, the MCP server, the inject hook) are safe by the same reasoning as the sibling logs — `appendFileSync` opens `O_APPEND` and every line is far under `PIPE_BUF`, and the reader skips a torn line rather than failing on it.

**Channels (D-412 point 6).** The whisper rides `additionalContext` — model-facing, no user interruption, every severity. A visible `systemMessage` line is added **only at severity `memory-off`**, as a SIBLING of `hookSpecificOutput` (never nested inside it, which would put a human-facing string in the model's context). `systemMessage` is a UNIVERSAL hook output field — *"Warning message shown to the user"* ([code.claude.com/docs/en/hooks](https://code.claude.com/docs/en/hooks), verified 2026-08-01) — and the split is deliberately asymmetric: interrupting a human deserves a real threshold, and `memory-off` means the kit is effectively not capturing, where silence loses sessions the user believes are being saved.

### 23.4 Wave-1 instrumentation, and three judgement calls in it

Wave 1 covers the capture chain, injection, precompact, index drift, and the MCP tools. Three of the wiring decisions are not obvious, and each is pinned by a test:

1. **`capture-turn` and the lazy-compress spawn are ONE-SIDED (fail only).** Spawning is not extracting — the detached child may still fail — so an `ok` there would clear a genuine extraction-failure streak on every subsequent turn. The child owns its own `ok`.
2. **`inject-context` records ONE verdict per RUN**, the worst thing that happened in it (`classifyInjectionHealth`, pure + exported). The obvious alternative — `ok` for the snapshot plus a separate `fail` for the spawn — writes `[ok, fail]` on EVERY session start, which pins the tail streak at 1 forever: a two-strike class could then never fire, and the signal would be **dead while looking instrumented**.
3. **MCP counts a THROWN handler as failure but an `isError` ENVELOPE as `ok`** (`withToolHealth`, wrapped once at the registration seam so tool number 14 cannot forget it). `isError` is the documented way a tool reports an ordinary outcome — id not found, guard rejection, empty search — i.e. the tool WORKED; whispering on it would nag a user who merely asked for something absent. A thrown handler is different in kind: it escapes to the SDK, becomes a JSON-RPC error, and touches no file anywhere.

**Where a class CLEARS is part of its contract, not an afterthought (review finding B1).** `index-drift`'s clearing `ok` lives in **`reindex()` itself** — the one function that rebuilds INDEX.md — so every route reaches it: the `cmk reindex` the whisper prescribes, `cmk repair --index`, the boot reindex, and `writeFact`'s inline rebuild. It was originally appended only at `writeFact`'s call site, which meant an agent that did exactly what the whisper told it to could not clear the warning, and it persisted for up to the 7-day window: the stuck-warning class §23.1 claims is structurally impossible, with the added insult that the kit prescribed the one command that could not help. **The general rule this generalizes to: for every registry entry, the `primaryAction` must be a command that actually writes that class's `ok`.** A test pins `index-drift`'s pairing so the two cannot drift apart.

`auto-extract` owns the split the whole noise gate rests on: at the one point where the backend call resolves, a spawn `ENOENT` (`isBinaryMissingError`, shared rather than re-sniffed per site) routes to `agent-cli-missing`, everything else to `extract-failing`. It is also the ONLY site that can CLEAR `agent-cli-missing`, since nothing probes for the binary.

**One composition worth naming, because it strengthens an existing documented edge:** §20.9 records a bounded case where a `resume` pointer points at a session that was never successfully injected into, and calls it self-limiting because nothing could observe it. An `inject-failing` streak is now exactly that observation — the case remains bounded, but it is no longer invisible.

**The recorded limit (D-412 point 7), documented rather than hidden: a fully dead hook layer kills the whisper too.** Event-driven means a hook that never fires writes nothing. Total hook death stays covered by install auto-recover (Task 248), `cmk doctor`, and the MCP surfaces; **partial** hook failure — the common case, and the one that used to be silent — is what this covers.

### 23.5 The surfaces that consume it

- **The `troubleshooting` skill** — the third scaffolded skill, one keyed section per registry code (symptom → diagnosis → exact fix → fix class), with the confirm-first discipline stated ABOVE the first repair instruction and `cmk doctor` as the fallback section. It is tied to the registry BY TEST: every code must have a section, and every section must declare the same `fixClass` and `primaryAction` the registry declares — a repair book that drifts from the code producing the whisper would name codes the skill cannot look up, or repair at an authority the registry never granted. Kit failure codes only. **Its `allowed-tools` is exactly `Bash(cmk doctor)`, `Bash(cmk doctor *)`, `Bash(cmk reindex)`, `Bash(cmk reindex *)`, `Bash(cmk search *)`, `mcp__cmk__mk_search`** — diagnosis, the one silent-class fix, and read-only lookups. **No form of `cmk repair` or `cmk install` is granted** (review finding B3: the first cut granted `Bash(cmk repair *)`, which includes `--hooks` (rewrites `settings.json`) and `--format` (migrates COMMITTED memory markdown) — both confirm-class, and the section above claimed they were absent while they were not).

**Why repair is ungranted ENTIRELY rather than narrowed to `--index`:** a `Bash()` pattern is a PREFIX match, so `Bash(cmk repair --index*)` also admits `cmk repair --index --hooks`. The pattern language cannot express "this flag and no other", and a grant with a hole in it is worse than no grant, because the prose would be the only thing between a mis-fire and a rewritten settings file. Where the repair book says to propose a confirm-class fix, the skill proposes and the user runs. Two tests pin the boundary in both directions — the positive list matches exactly, and a blocklist asserts the absence of `repair`/`install`/`--hooks`/`--format`/`--all` — because the earlier "cannot mutate memory" test passed while the grant was wide open, having only looked for `cmk remember`-shaped verbs. _(A `validate-skill-sources` extension that checks every skill's grants against a per-skill allowlist is a candidate for the next skill-surface task, recorded in the Task 250 entry.)_
- **HC-14** — doctor's view of the same data, reusing `activeWarnings` rather than re-deriving the thresholds (a second copy would drift and produce "doctor says fine, the AI says broken"). Advisory (`warn`, never `fail`). Its repair line is offered only when it is a real next step (`cmk reindex`): most codes' `primaryAction` is `cmk doctor`, which is right in the WHISPER — where the model has not run doctor — and circular in a line doctor itself prints, so nothing is emitted there and the message's pointer to the troubleshooting skill carries the action instead. It **SKIPs rather than PASSes** when the log cannot be read: the reader is fail-open by contract, which is right on the hot path and a false green in a diagnostic whose job is to say what it could and could not verify.

The two surfaces answer different questions: the whisper reaches the MODEL on the next prompt; HC-14 reaches the USER when they go looking. Before HC-14, doctor could report thirteen passes while the kit's own failure log held a week of dead extraction — every other check probes CONFIGURATION, none looked at OUTCOMES (the D-298 / HC-10 false-green class, one level up).

### 23.6 Extending it

A new failure class is: a registry entry + the instrumented site that appends its two outcomes + a repair-book section in the skill. **Task 258**'s `stale-refs` scan enters here as a low-severity `advisory` once its noise floor is measured on the real corpus (D-412 point 8) — the registry is the seam, and it stays a SEPARATE task deliberately.

**Verification:** `scripts/live-verify-health-whisper.mjs` (`npm run live-verify:health-whisper`) drives the REAL hook bin against a sandboxed install with a seeded streak and asserts the whisper, the `memory-off` systemMessage, the noise gate, the self-clean, and whisper-vs-HC-14 agreement — with NO manual command run anywhere (the D-169 automatic-path criterion). Zero LLM, zero network, so unlike its sibling live-verify scripts it is cheap to run any time.

## 24. The memory viewer — `cmk view` (Task 255, v0.6.4 headline; grill-ratified 2026-08-02, D-414)

The kit's own read-only UI over the memory it manages — the D-121 lineage finally built (the v0.1.0 stub was removed with "design it properly first"; D-397 committed to building it; the 2026-08-02 grill ratified this design). The Obsidian vault (Task 254) remains the free companion; this section owns the KIT-SEMANTIC rendering Obsidian cannot do. Prior-art: the [2026-08-02 viewer survey](../docs/research/2026-08-02-memory-viewer-prior-art.md) (claude-mem 89k★ / PAI-Pulse / hermes / datasette / mdserve).

### 24.1 The contract (the 8 ratified points)

1. **Ephemeral localhost server.** `cmk view` binds **127.0.0.1 ONLY** (a non-loopback bind request is refused, stated in the error), picks a free port, auto-opens the browser (URL printed as fallback), serves until Ctrl-C. NO resident daemon — the datasette lifecycle, deliberately against the claude-mem/Pulse resident shape and its complaint class ("viewer never turns off"; viewer breaks when the daemon evolves).
2. **API-first routes.** Every view is JSON and HTML from the SAME route (datasette's pattern): the server doubles as the kit's local read API. Future consumers (team layer, integrations) build on the JSON side without re-architecture. The HTML page is a consumer of its own API.
3. **Read-only, structurally.** The server MOUNTS no write route — not auth-gated, absent (ADR-0018: the safe write path stays the only writer). The field's #1 demand (delete-from-viewer — four claude-mem issues, still open) is answered in the UI: copy-able `cmk forget <id>` / `cmk trust <id>` beside every fact.
4. **Five wave-1 views:** (i) **landing** — pinned one-line health strip (green when quiet, the active 250-warning when not) + FTS search box + newest facts (trust · date · source badges); (ii) **fact detail** — body, Why/How, trust tier + history, edges (cites / superseded-by as a local neighborhood), source session, the copy commands; (iii) **graph** — kit-semantic: trust as color, supersession as direction, anchors as hubs (232/256 edges); (iv) **health** — the doctor checks + active health-log warnings rendered; (v) **decisions** — the DECISIONS.md journal chronologically, superseded/retracted entries visible but struck (the evolution view `--scope decisions` search cannot give).
5. **All three tiers** (P/L/U), badge-labeled, injection-precedence semantics. The user tier on screen is one more reason loopback-only is non-negotiable.
6. **Manual refresh + per-view freshness labels** ("as of HH:MM" — the Pulse TabFreshness borrow). SSE live-refresh is **Task 259** (deferred, named trigger).
7. **Zero new dependencies:** node stdlib `http`, ONE committed static HTML file with inline vanilla JS, the existing better-sqlite3 FTS. No framework, no bundler (the 89k★ precedent's consumer runtime is exactly this after their esbuild step — we skip the step by not needing React).
8. **Deferred, stated:** timeline (mk_timeline/`cmk recent` cover it), conflict-queue UI (the health strip shows the count and points at the CLI), stats page.

### 24.1.1 What wave 1 settled at BUILD time (Task 255, 2026-08-02)

The eight ratified points above are unchanged. These are the contract details the build had to decide and the design did not pre-specify — recorded here so the next reader finds one spec, not a spec plus a surprise.

- **Route scheme.** The HTML side is ONE page (§24.1 point 7) that routes client-side off `location.pathname`; the JSON side answers on the same paths. Three equivalent ways to ask for JSON, any of which is sufficient: the **`/api/` prefix** (`/api/facts`), a **`.json` suffix** (`/facts.json`), or **`Accept: application/json`** without `text/html`. Views: `/` ≡ `/facts` · `/fact/:id` · `/graph` · `/health` · `/decisions`. Anything else is 404 on both sides.
- **Read-only, enforced before routing.** Any method other than `GET`/`HEAD` returns **405 with `Allow: GET, HEAD`**, decided ahead of the route table so an added route cannot accidentally accept a write. No route maps a path segment onto a filesystem path — the only file read is the committed page, at a constant path — so traversal is unreachable rather than filtered.
- **Two hardenings the survey argued for and the ratified points did not name.** (a) A **`Host:`-header guard**: binding loopback does NOT stop DNS rebinding — a hostile page can resolve its own domain to `127.0.0.1` and read the user's memory through their browser — so a request whose `Host` is not a loopback literal gets **403**. (b) A **`default-src 'none'` CSP** on every response, which turns "no CDN, fully offline" from an author habit into a runtime guarantee (a stray external reference fails visibly instead of working on the author's machine).
- **Port + lifecycle.** `--port` defaults to `0` (OS-assigned); an in-use port fails with a stated reason, not a stack. `--host` accepts only loopback literals. `--no-open` suppresses the browser; the URL is always printed. `SIGINT`/`SIGTERM` close the server and exit.
- **Freshness.** Each request re-runs the same incremental boot reindex every other read verb runs, and the page labels each view "as of HH:MM" with a manual Refresh. The DB handle is opened and closed **per request** — a long-lived handle would keep a Windows lock on `context/.index/` (the D-302 half-broken-install class) for as long as the tab is open.
- **Two budgets** (both registered in `validate-budget-pairs`): `VIEWER_DEFAULT_LIMIT=50` / `VIEWER_MAX_LIMIT=200` for the facts list — an over-cap `?limit=` **clamps** and reports `clamped:true` rather than 400ing a URL someone typed; and the graph's `node_limit`, which budgets **live facts only** — anchor hubs, dangling link targets, and archived-superseded predecessors ride on top and are each counted separately (`anchor_count` / `dangling_count` / `archived_count`), because a supersession arrow with no tail is not a supersession arrow, and a broken link is not a hub. Revisit trigger: a corpus where their sum approaches `node_limit`.
- **The viewer writes NO kit log.** The facts route calls the shared `search()` **without** `projectRoot`, which is what suppresses its recall-log append: a human scrolling a UI is not the model recalling a fact, and browse traffic in `.locks/recall.log` would corrupt the Task-233/ADR-0024 fire-rate measurement. The only thing a request touches is the rebuildable `context/.index/` cache.
- **No threshold is re-derived.** `/api/health` calls `runDoctor` + `activeWarnings` (§23) directly, so the pinned strip and the per-prompt whisper cannot disagree about whether memory is working. `?strip=1` answers the pinned line ALONE (health-log tail + the two queue counts — all cheap file reads) and skips the doctor: the strip is on every view, so paying 14 checks including a subprocess probe per navigation would make the viewer feel broken.
- **The strip carries the queue count** (§24.1 point 8's stated answer to the deferred conflict-queue UI): with no active failure but a non-empty queue, the strip reads `queued` and names the resolving verb (`cmk queue conflicts` / `cmk queue review`). An active failure outranks a queue — a broken kit is losing memory, a queue is only waiting on a human — and the counts stay in the payload either way.
- **Superseded facts are reachable.** They were MOVED out of the live corpus and so are not in the index — but they are exactly what a supersession arrow points at, so both the graph and `/api/fact/:id` read them from `archive/superseded/` via the shared `eachSupersededFact` walk.

### 24.2 Boundaries and hazards

- **Search parity is the point:** the FTS search box is the landing feature (the 89k★ precedent ships search in its API but NOT its UI — the gap we exist to not repeat).
- **The port/launch shape** follows `register-crons`' platform discipline for the browser-open command (platform-commands.mjs; `start`/`open`/`xdg-open`).
- **No fs.watch anywhere in wave 1** — the one platform-sensitive moving part, deliberately excluded (Task 259 owns it).
- **Empty/uninstalled projects:** `cmk view` on a project without `context/MEMORY.md` explains and exits — it must not scaffold (the 250 no-scaffold guard class).

## End of design.md v0.1.0

Sections 1-17 = full design surface. Cross-references to specific FRs and ADRs throughout. The four absorbable changes from the spec-generator comparison (tombstones §6.5, review queue §6.2, native auto-memory detection HC-8, structured logging §6.1) are baked in. §17 was tail-appended 2026-05-26 after the working-product live-test surfaced the spawn-layer Windows bug.

Total ~900 lines. Next per Kiro flow: write `tasks.md` after design.md is approved.
