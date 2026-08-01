// MCP server (Task 31, T-027). Layer 5's final task — closes Layer 5.
//
// Per design §10 + tasks.md 31 + ADR-0014 (Task 108b parity):
//   - stdio JSON-RPC transport per MCP 2025-06-18 spec
//   - Thirteen tools (full CLI parity): READ — mk_search, mk_get, mk_timeline, mk_expand,
//     mk_links, mk_cite, mk_recent_activity; WRITE/MUTATE — mk_remember, mk_trust,
//     mk_lessons_promote, mk_forget, mk_queue_list, mk_queue_resolve
//   - Path-traversal validation on every read/write surface
//   - All logs to stderr (or sessions/{date}.mcp.log); stdout pure
//
// Composes on top of:
//   - Task 28 index-db (the SQLite cache the server queries)
//   - Task 30 search (mk_search delegates to search())
//   - Task 24 memory-write (mk_remember delegates to memoryWrite())
//   - Task 13 provenance (citation IDs match ID_PATTERN)
//
// The MCP SDK (@modelcontextprotocol/sdk v1.29.0, official Anthropic
// TypeScript SDK) handles JSON-RPC framing + the initialize/initialized
// handshake + tool listing. We register tool handlers; the SDK handles
// the protocol envelope.
//
// The user's 2026-05-23 decision: @modelcontextprotocol/sdk library naming
// goes in tasks.md Task 31 implementation, NOT in design.md. This
// module is where the dep choice lands.
//
// High-risk surface per tasks.md 31 — individual PR review required.
// The risk class: MCP is a protocol implementation + security boundary
// (stdio with path-traversal validation). Subtle bugs in JSON-RPC
// framing, newline handling, or path validation can introduce real
// CVEs. The SDK handles framing; we own path validation + tool body
// + error mapping.

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { readFileSync } from 'node:fs';
import { resolve as resolvePath, isAbsolute, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openIndexDb } from './index-db.mjs';
import { reindexBoot } from './index-rebuild.mjs';
import { search, SEARCH_MODES } from './search.mjs';
import { memoryWrite } from './memory-write.mjs';
import { rememberRich, nonProjectTierNote, prepareNearDupGuard } from './remember-core.mjs';
import { forget } from './forget.mjs';
import { overrideTrust } from './trust.mjs';
import { lessonsPromote } from './lessons-promote.mjs';
// Task 250 (D-412) — the MCP half of the health log. A thrown tool handler is
// the module's one wholly-silent failure path (it becomes a JSON-RPC error and
// touches no file); this is what gives it a durable trace.
import { appendHealthEntry, HEALTH_CODES } from './health-log.mjs';
import { resolveReviewQueue, listReviewQueue } from './review-queue.mjs';
import { resolveConflictQueue, listConflictQueue } from './conflict-queue.mjs';
import { resolvePruneQueue, listPruneQueue } from './prune-queue.mjs';
import { STATE_INSTRUCTION } from './state-label.mjs';
import { createHash } from 'node:crypto';
import { getObservations, citeLink, buildTimeline, recentActivity, expandObservation, buildLinks } from './read-core.mjs';
import { resolveTierRoot } from './tier-paths.mjs';

// The kit version, read from package.json — NOT hardcoded. A hardcoded '0.1.0'
// shipped through the v0.2.3 cut and advertised the WRONG version to the MCP
// client (D-102 / Task 121.1). PKG_ROOT is one level up from src/.
const PKG_VERSION = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'package.json'), 'utf8'),
).version;

// --- Path-traversal validation (design §10.2; tasks.md 31.2) ----------

/**
 * Reject paths that escape the kit's three documented tier roots. Per
 * NFR-6 + Kiro's stricter pattern:
 *   - canonicalize via path.resolve() so symlinks + .. are normalized
 *   - reject URL-encoded traversal (%2e%2e%2f)
 *   - require the canonical path to start with one of the three roots
 *
 * Returns the canonical resolved path on success; throws on rejection.
 * The tool surface catches the throw and translates to a JSON-RPC error.
 *
 * Currently no MCP tool accepts a user-provided path directly (mk_get
 * takes IDs which match ID_PATTERN, mk_remember writes via memoryWrite
 * which constructs paths internally). This is defensive readiness for
 * v0.1.x tools that may add path-accepting surfaces.
 */
export function validatePath(p, { projectRoot, userDir }) {
  if (typeof p !== 'string' || p.length === 0) {
    throw new Error('validatePath: path must be a non-empty string');
  }
  // Reject URL-encoded traversal before path.resolve normalizes it.
  if (/%2e%2e/i.test(p) || /%2f/i.test(p)) {
    throw new Error('validatePath: URL-encoded traversal rejected');
  }
  const canonical = isAbsolute(p) ? resolvePath(p) : resolvePath(projectRoot, p);
  // Per CLAUDE.md "Shared modules" rule: derive every tier root from
  // tier-paths.mjs's resolveTierRoot rather than re-deriving inline.
  // The earlier draft constructed the user-tier root as
  // `resolvePath(userDir ?? homedir() + '/.core-memory-kit')` —
  // which silently drifted from resolveTierRoot's posture (honoring
  // env vars + path normalization). Surfaced as Layer-5 checkpoint
  // finding L5-I1 (2026-05-28); fixed by going through the shared
  // helper for all three roots.
  const roots = [
    resolvePath(resolveTierRoot({ tier: 'P', projectRoot, userDir })),
    resolvePath(resolveTierRoot({ tier: 'L', projectRoot, userDir })),
    resolvePath(resolveTierRoot({ tier: 'U', projectRoot, userDir })),
  ];
  for (const root of roots) {
    if (canonical === root || canonical.startsWith(root + (process.platform === 'win32' ? '\\' : '/'))) {
      return canonical;
    }
  }
  throw new Error(`validatePath: path escapes kit roots: ${p}`);
}

// --- Tool handlers ----------------------------------------------------

// Task 218 (D-329): the per-query index refresh EVERY reader must run. The CLI
// wraps every read in `withReadDb` (subcommands.mjs), which runs an incremental
// `reindexBoot` (mtime/sha1 diff — only re-parses CHANGED files; the `files`
// checkpoint table short-circuits the no-change case to ~0ms) before the read,
// so a `cmk search`/`get`/`timeline` always sees the latest on-disk facts. The
// MCP server is the ONE reader that used to skip this (on a false "the runtime
// watcher handles it" premise — the watcher was never wired, and chokidar drops
// events under load anyway). Making every MCP read tool call this brings it to
// PARITY with the CLI: deterministic, load-immune (a synchronous inline refresh,
// no async FS event to lose). Best-effort: a refresh failure degrades to the
// existing index rather than crashing the tool call (mirrors withReadDb).
function refreshIndexForRead({ db, projectRoot, userDir }) {
  if (!projectRoot) return; // no project context (in-process tests) → nothing to refresh
  try {
    reindexBoot({ projectRoot, userDir, db });
  } catch (err) {
    process.stderr.write(
      `cmk-mcp-server: per-read index refresh failed: ${err?.message ?? err}\n`,
    );
  }
}

function makeMkSearch({ db, semanticBackend, projectRoot, userDir }) {
  return async ({ query, mode, scope, tier, since, limit, min_trust, include_expired, state_view, source }) => {
    // Task 218: refresh from disk before reading (CLI parity — every `cmk search`
    // does this). Sees facts written since boot by any writer.
    refreshIndexForRead({ db, projectRoot, userDir });
    // Task 46: explicit mode wins; otherwise the project's configured
    // default (search.default_mode — set by `cmk install --with-semantic`).
    const { prepareSemanticBackend, resolveDefaultSearchMode } = await import(
      './semantic-backend.mjs'
    );
    let wantMode =
      mode ??
      (projectRoot ? resolveDefaultSearchMode({ projectRoot }) : SEARCH_MODES.KEYWORD);
    // Task 65: when the caller asks for semantic/hybrid and no test seam is
    // injected, prepare the REAL embedded backend (lazy-optional — an absent
    // embedder degrades to the actionable error below; keyword unaffected).
    let backend = semanticBackend;
    let degradedNote = null;
    if (
      backend === undefined &&
      (wantMode === SEARCH_MODES.SEMANTIC || wantMode === SEARCH_MODES.HYBRID)
    ) {
      const prep = await prepareSemanticBackend({ db, query, scope: scope ?? 'facts' });
      if (!prep.ok && mode) {
        // Explicitly requested — surface the actionable error.
        return {
          content: [
            {
              type: 'text',
              text: `error: semantic backend unavailable (${prep.reason}). ${prep.hint ?? 'Use mode "keyword".'}`,
            },
          ],
          isError: true,
        };
      }
      if (!prep.ok) {
        // Configured default can't run — degrade gracefully to keyword.
        wantMode = SEARCH_MODES.KEYWORD;
        // A scope that is keyword-only BY DESIGN (e.g. `decisions`, Task 156)
        // rejects the semantic default with reason `unknown-scope:<scope>` —
        // that is NOT an embedder failure, so it degrades SILENTLY (P-355DF75F,
        // the v0.5.0 cold-open false alarm): emitting "the embedder is
        // unavailable, run cmk install" for a by-design keyword scope tells a
        // brand-new user their search is broken on the showcase path when it is
        // working perfectly. The reinstall note fires ONLY for a REAL embedder
        // failure (embedder-not-installed / sqlite-vec-unavailable / disabled).
        if (!String(prep.reason).startsWith('unknown-scope:')) {
          // NOT silently (Task 125.1, the user's call reversing the Task-46
          // review skip): the note tells the model what it got so it can relay
          // the fix to the user.
          degradedNote =
            `note: this project's configured default search is semantic (hybrid), but the embedder is unavailable (${prep.reason}) — these are keyword-only results. ` +
            'Suggest the user run `cmk install --with-semantic` to restore semantic recall.';
        }
      } else {
        backend = prep.backend;
      }
    }
    const r = search({
      db, query,
      mode: wantMode,
      scope,
      projectRoot, // Task 156: the decisions scope reads context/DECISIONS.md
      tier,
      since,
      limit,
      minTrust: min_trust,
      // Task 218 (D-329 parity): the agent CAN opt into expired facts too (the
      // user's call) — CLI parity with `cmk search --include-expired`. Expired =
      // past a DECLARED expires_at date (hidden by default, never deleted);
      // distinct from tombstones, which stay agent-blind (D-163).
      includeExpired: include_expired === true,
      // Task 211: the state-view OVERRIDE only — the 4-view classification is
      // automatic inside search() (CLI parity with `--state-view`).
      stateView: state_view,
      // Task 233: the recall-origin tag (CLI parity with `cmk search
      // --source`). The memory-search skill passes source:'skill' on its
      // first ladder step so the recall-log makes the skill fire-rate
      // measurable (ADR-0024's success criterion) on the MCP path too.
      recallOrigin: source,
      semanticBackend: backend,
    });
    if (r.action === 'error') {
      return {
        content: [{ type: 'text', text: `error: ${r.errors.join('; ')}` }],
        isError: true,
      };
    }
    return {
      content: [
        { type: 'text', text: JSON.stringify(r.results, null, 2) },
        // Results stay content[0] (shape-compatible); the degradation note,
        // when present, rides as a second block.
        ...(degradedNote ? [{ type: 'text', text: degradedNote }] : []),
        // Task 209 (A-TMA): the one-line state-label instruction, ONLY when a
        // labeled (non-current) row is present — zero noise on all-current
        // results. CLI parity: `cmk search` prints the same line.
        ...(Array.isArray(r.results) && r.results.some((x) => x.state)
          ? [{ type: 'text', text: STATE_INSTRUCTION }]
          : []),
        // Task 211: say WHY old rows appeared when the state-view gate biased
        // retrieval (historical/transition only; CLI parity).
        ...(r.state_view
          ? [{
              type: 'text',
              text: `state view: ${r.state_view} — expired/superseded history included${r.state_view === 'historical' ? ' and listed first' : ''}`,
            }]
          : []),
      ],
    };
  };
}

function makeMkGet({ db, projectRoot, userDir }) {
  // Thin adapter over the shared read core (read-core.getObservations) — the
  // SAME logic the CLI `cmk get` calls (ADR-0014 parity).
  //
  // D-163 (BINDING): mk_get is tombstone-BLIND and must stay that way. It calls
  // getObservations WITHOUT `includeTombstoned`, so a forgotten fact returns
  // `not found`. Tombstone recovery is a HUMAN-only verb (`cmk get
  // --include-tombstoned`); the agent must NEVER recover a fact the user
  // forgot (resurfacing a deleted fact is the worst memory-product failure).
  // Do NOT add an includeTombstoned param to this tool.
  return async ({ ids }) => {
    refreshIndexForRead({ db, projectRoot, userDir }); // Task 218: CLI parity (withReadDb)
    return {
      content: [{ type: 'text', text: JSON.stringify(getObservations(db, ids), null, 2) }],
    };
  };
}

function makeMkTimeline({ db, projectRoot, userDir }) {
  // Thin adapter over read-core.buildTimeline (shared with CLI `cmk timeline`).
  return async ({ anchor, depth_before, depth_after }) => {
    refreshIndexForRead({ db, projectRoot, userDir }); // Task 218: CLI parity (withReadDb)
    const r = buildTimeline(db, {
      anchor,
      depthBefore: depth_before ?? 5,
      depthAfter: depth_after ?? 5,
    });
    if (!r.ok) {
      return { content: [{ type: 'text', text: `error: ${r.error}` }], isError: true };
    }
    return { content: [{ type: 'text', text: JSON.stringify(r.timeline, null, 2) }] };
  };
}

function makeMkExpand({ db, projectRoot, userDir }) {
  // Thin adapter over read-core.expandObservation (shared with CLI
  // `cmk expand` — ADR-0014 parity). The recall ladder's middle rung:
  // a hit's source-file neighborhood, bounded by EXPAND_MAX_CHARS.
  return async ({ id }) => {
    refreshIndexForRead({ db, projectRoot, userDir }); // CLI parity (withReadDb)
    const r = expandObservation(db, id, { projectRoot, userDir });
    if (r.error) {
      return { content: [{ type: 'text', text: `error: ${r.error}` }], isError: true };
    }
    return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] };
  };
}

function makeMkLinks({ db, projectRoot, userDir }) {
  // Thin adapter over read-core.buildLinks (shared with CLI `cmk links` —
  // ADR-0014 parity). The relational adjacency axis: backlinks, out-links, and
  // the supersession chain. Read-only.
  return async ({ id, depth, direction }) => {
    refreshIndexForRead({ db, projectRoot, userDir }); // CLI parity (withReadDb)
    const r = buildLinks(db, id, { depth: depth ?? 1, direction: direction ?? 'both' });
    if (!r.ok) {
      return { content: [{ type: 'text', text: `error: ${r.error}` }], isError: true };
    }
    return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] };
  };
}

function makeMkCite() {
  // Thin adapter over read-core.citeLink (shared with CLI `cmk cite`). The
  // canonical link form is `[#P-S79MJHFN](memkit://obs/P-S79MJHFN)`.
  return async ({ id }) => {
    const r = citeLink(id);
    if (!r.ok) {
      return { content: [{ type: 'text', text: `error: ${r.error}` }], isError: true };
    }
    return { content: [{ type: 'text', text: r.link }] };
  };
}

function makeMkRemember({ projectRoot, userDir }) {
  return async ({ text, tier, cites, why, how, type, title, links, shape, expires }) => {
    // cites: PERMANENTLY not recorded — CLOSED deliberately in Task 227
    // (design §16.39): `links` already delivers write-time fact-linking
    // (→ `related` frontmatter + [[cross-links]]), and recall-side citations
    // (id + date + heading + path) come from provenance automatically, so a
    // second citation param would be a redundant surface. Silently dropping
    // the array would tell the model "your citation was recorded" — false —
    // so the rejection stays, now as the permanent contract.
    if (Array.isArray(cites) && cites.length > 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'error: the `cites` parameter is permanently not recorded (closed — design §16.39). Use `links` to connect related facts; recall results carry their own citations (id + date + heading + source) from provenance.',
          },
        ],
        isError: true,
      };
    }
    // tier U/L: mk_remember writes the PROJECT tier (P) regardless; a fact
    // becomes cross-project via mk_lessons_promote, not a direct tier write
    // (direct U/L routing is the deferred feature in design §16.40). We do NOT error — we
    // capture at P and attach the note, CONSISTENTLY with `cmk remember`. The
    // three adapter paths had diverged (MCP error / CLI-rich warn / CLI-terse
    // error); the note now comes from ONE shared source (D-102 / design §16.40).
    const tierNote = tier === 'U' || tier === 'L' ? nonProjectTierNote(tier) : null;
    // Task 108b — MCP write parity: when rich fields (why/how/type/title/links)
    // are present, route to the SAME shared core (remember-core.rememberRich)
    // the CLI `cmk remember --why/--how` uses → a granular Why/How fact file, not
    // a terse MEMORY.md bullet. Identical fact files from both surfaces (ADR-0014).
    if (why || how || type || title || links || shape || expires) {
      const rr = rememberRich(text, { why, how, type, title, links, shape, expires }, { projectRoot });
      if (rr.action === 'error') {
        return {
          content: [
            {
              type: 'text',
              text: `error (${rr.errorCategory ?? 'unknown'}): ${(rr.errors ?? [rr.errorCategory ?? 'error']).join('; ')}`,
            },
          ],
          isError: true,
        };
      }
      if (rr.action === 'skipped') {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { accepted: true, status: 'skipped', skip_reason: rr.skipReason, id: rr.id, written_to: rr.path },
                null,
                2,
              ),
            },
          ],
        };
      }
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              { id: rr.id, written_to: rr.path, accepted: true, action: rr.action, kind: 'rich', ...(tierNote && { tier_note: tierNote }) },
              null,
              2,
            ),
          },
        ],
      };
    }
    // Task 143 (D-130): the semantic near-dup guard (one embed of the
    // incoming text when the project is semantic-configured + the embedder
    // is available; {} = literal pipeline, never blocks capture).
    const nearDup = await prepareNearDupGuard({ projectRoot, text });
    const r = memoryWrite({
      action: 'add',
      text,
      tier: 'P',
      scratchpad: 'MEMORY.md',
      section: 'Active Threads',
      source: 'user-explicit', // mk_remember IS the user-explicit MCP write surface
      sessionId: 'mcp-server',
      projectRoot,
      userDir,
      ...nearDup,
    });
    if (r.action === 'error') {
      return {
        content: [
          { type: 'text', text: `error (${r.errorCategory ?? 'unknown'}): ${(r.errors ?? []).join('; ')}` },
        ],
        isError: true,
      };
    }
    // B1 (Task 31 code-review): memoryWrite has THREE outcomes — appended,
    // queued (to queues/conflicts.md), or supersede/append (the v0.1.0
    // fallthrough path). Don't report `accepted: true` when the write
    // was actually queued for human review — the model would treat that
    // as "fact saved" while in fact `cmk queue conflicts` is required
    // to land the bullet. Same composition class as the Task 25 → 25b
    // mergeScratchpadBullets lesson in CLAUDE.md.
    if (r.action === 'queued') {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                accepted: false,
                status: 'queued',
                awaiting_review: true,
                queue: 'conflicts',
                id: r.id,
                queued_to: r.path,
                hint: 'Run `cmk queue conflicts` to resolve the conflict; the bullet is not yet in MEMORY.md.',
              },
              null,
              2,
            ),
          },
        ],
      };
    }
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            { id: r.id, written_to: r.path, accepted: true, action: r.action, ...(tierNote && { tier_note: tierNote }) },
            null,
            2,
          ),
        },
      ],
    };
  };
}

function makeMkRecentActivity({ db, projectRoot, userDir }) {
  // Thin adapter over read-core.recentActivity (shared with CLI
  // `cmk recent-activity`).
  return async ({ window, limit }) => {
    refreshIndexForRead({ db, projectRoot, userDir }); // Task 218: CLI parity (withReadDb)
    const r = recentActivity(db, { window: window ?? '24h', limit: limit ?? 20 });
    if (!r.ok) {
      return { content: [{ type: 'text', text: `error: ${r.error}` }], isError: true };
    }
    return { content: [{ type: 'text', text: JSON.stringify(r.rows, null, 2) }] };
  };
}

// --- Mutate tools (Task 108b — MCP parity with the CLI) ---------------
//
// These wrap the existing CLI cores (forget / overrideTrust / lessonsPromote)
// so the model can perform the same mutations the user could via `cmk`. Per
// D-85: the user never types `cmk`; the conversation is the interface, so every
// mutate the CLI offers needs an MCP path the model can drive on their behalf.

/** Map a core error / not-found result to an MCP isError envelope. */
function mcpToolError(r) {
  const msg = r.action === 'error'
    ? `error (${r.errorCategory ?? 'unknown'}): ${(r.errors ?? ['operation failed']).join('; ')}`
    : `error: ${(r.errors ?? ['not found']).join('; ')}`;
  return { content: [{ type: 'text', text: msg }], isError: true };
}

/**
 * Deterministic confirm token for a destructive op. Derived from id + body so a
 * caller CANNOT produce it without first seeing the preview (the digest is not
 * knowable from the id alone) — that forces the two-step preview→confirm flow.
 * Stable across re-calls (idempotent), so a retried confirm with the same token
 * still works. sha256 (not sha1) — not because this is a crypto-sensitive
 * context (it's a preview-fingerprint nonce, not auth/signing), but so static
 * analysis isn't tripped by a "weak hash" smell on a brand-new code path.
 */
function forgetConfirmToken(id, body) {
  return createHash('sha256').update(`${id}:${body ?? ''}`).digest('hex').slice(0, 8);
}

function makeMkTrust({ projectRoot, userDir }) {
  return async ({ id, level }) => {
    const r = overrideTrust({ id, level, projectRoot, userDir, actor: 'mcp-user-explicit' });
    if (r.action !== 'trust-updated') return mcpToolError(r);
    return {
      content: [{ type: 'text', text: JSON.stringify(
        { accepted: true, action: r.action, id: r.id, tier: r.tier, level: r.level }, null, 2,
      ) }],
    };
  };
}

function makeMkLessonsPromote({ projectRoot, userDir }) {
  return async ({ id, to, section }) => {
    // 151.9: pass `to` THROUGH (undefined when the caller omits it) so the offline
    // TOPIC-router spreads the promote across USER/HABITS/LESSONS by content. The
    // old `to ?? 'LESSONS.md'` forced every MCP-driven promote into LESSONS,
    // bypassing the router (Hole C) — and the MCP path is the PRIMARY one (Claude
    // drives the kit via the tool, not the CLI). An explicit `to` still wins.
    // Task 218 (D-329 parity): `section` overrides the router's section choice —
    // CLI parity with `cmk lessons promote --section` (undefined → router picks).
    const r = lessonsPromote({ id, projectRoot, userDir, to, section });
    if (r.action !== 'promoted' && r.action !== 'queued') return mcpToolError(r);
    return {
      content: [{ type: 'text', text: JSON.stringify(
        {
          accepted: true,
          action: r.action,
          id: r.id,
          target: r.target,
          section: r.section,
          // 151.11: surface the optional high-recurrence MENTION so Claude MAY
          // relay it in conversation (a heads-up, NOT a gate — never blocks; only
          // present when the fact recurred enough to be worth a word).
          ...(r.mention ? { mention: r.mention } : {}),
          ...(r.action === 'queued'
            ? { status: 'queued', hint: 'Promotion routed to the user-tier review/conflict queue — it lands once resolved.' }
            : {}),
        }, null, 2,
      ) }],
    };
  };
}

function makeMkForget({ projectRoot, userDir }) {
  return async ({ id, reason, deleted_by, confirm }) => {
    // Dry pass: resolve + capture the preview via a confirm callback that
    // refuses (returns false → action:'cancelled'), so nothing is deleted yet.
    // A not-found / ambiguous / schema error short-circuits BEFORE the callback.
    let preview = null;
    const dry = forget({
      idOrQuery: id,
      projectRoot,
      userDir,
      reason,
      deletedBy: deleted_by, // Task 218 (D-329 parity): CLI `--deleted-by` (default: user-explicit)
      confirm: (p) => { preview = p; return false; },
    });
    if (dry.action !== 'cancelled' || !preview) {
      return mcpToolError(dry);
    }

    const token = forgetConfirmToken(preview.id, preview.body);
    if (confirm !== token) {
      // Step 1 — preview + issue the token; require a second deliberate call.
      return {
        content: [{ type: 'text', text: JSON.stringify(
          {
            status: 'confirm_required',
            would_tombstone: {
              id: preview.id,
              tier: preview.tier,
              title: preview.title ?? null,
              path: preview.path,
              body_preview: String(preview.body ?? '').slice(0, 280),
            },
            confirm_token: token,
            hint: `Permanently tombstones this fact (audit trail preserved). To proceed, call mk_forget again with confirm: "${token}".`,
          }, null, 2,
        ) }],
      };
    }

    // Step 2 — token matches → execute.
    const r = forget({ idOrQuery: id, projectRoot, userDir, reason, deletedBy: deleted_by, yes: true });
    if (r.action !== 'tombstoned') return mcpToolError(r);
    return {
      content: [{ type: 'text', text: JSON.stringify(
        { accepted: true, action: 'tombstoned', id: r.id, tier: r.tier, tombstoned_to: r.tombstonePath }, null, 2,
      ) }],
    };
  };
}

// The review/conflict queues resolve via interactive walkers that take a
// `prompter(entry) → decision` callback. Two callback shapes give a clean,
// non-interactive MCP surface over them WITHOUT duplicating the walk logic:
//   - LIST: a prompter that records each entry + returns 'skip' (mutates
//     nothing) — so the model can see what's pending and tell the user.
//   - RESOLVE: a prompter that returns the requested action for the matching
//     id and 'skip' for every other entry — resolves exactly one item.
// 'merge-both' is excluded from mk_queue_resolve: it composes the two facts'
// content (mergeFacts needs a merged body), which is an interactive decision —
// the model is pointed at `cmk queue conflicts` for that.

function makeMkQueueList({ projectRoot, userDir }) {
  return async ({ queue }) => {
    const q = queue ?? 'review';
    if (q !== 'review' && q !== 'conflicts' && q !== 'prune') {
      return mcpToolError({ action: 'error', errorCategory: 'schema', errors: [`queue must be 'review', 'conflicts', or 'prune' (got ${q})`] });
    }
    // PURE READ (code-review SR-1): list via the dedicated read helpers, NOT the
    // resolve* walkers — those reserialize + rewrite the queue file on every call,
    // so listing through them would mutate (mtime churn / reformat / concurrent-
    // resolve race) on a read-only op. listReviewQueue / listConflictQueue /
    // listPruneQueue parse the file without writing.
    try {
      const entries = q === 'review'
        ? listReviewQueue({ tier: 'P', projectRoot, userDir })
        : q === 'conflicts'
          ? listConflictQueue({ tier: 'P', projectRoot, userDir })
          : listPruneQueue({ projectRoot });
      return {
        content: [{ type: 'text', text: JSON.stringify({ queue: q, pending: entries.length, entries }, null, 2) }],
      };
    } catch (err) {
      return { content: [{ type: 'text', text: `error: ${err?.message ?? err}` }], isError: true };
    }
  };
}

function makeMkQueueResolve({ projectRoot, userDir }) {
  return async ({ queue, id, action }) => {
    const q = queue ?? 'review';
    if (q === 'review') {
      if (action !== 'promote' && action !== 'discard') {
        return mcpToolError({ action: 'error', errorCategory: 'schema', errors: [`review action must be 'promote' or 'discard' (got ${action})`] });
      }
      const prompter = async (e) => (e.id === id ? action : 'skip');
      const r = await resolveReviewQueue({ tier: 'P', projectRoot, userDir, prompter });
      if (r.action === 'error') return mcpToolError(r);
      const count = action === 'promote' ? r.promoted : r.discarded;
      return {
        content: [{ type: 'text', text: JSON.stringify({ accepted: count > 0, queue: 'review', id, action, result: r }, null, 2) }],
      };
    }
    if (q === 'conflicts') {
      if (action === 'merge-both') {
        return mcpToolError({ action: 'error', errorCategory: 'schema', errors: ["merge-both composes the two facts' content — run `cmk queue conflicts` for an interactive merge. mk_queue_resolve supports 'keep-old' / 'keep-new'."] });
      }
      if (action !== 'keep-old' && action !== 'keep-new') {
        return mcpToolError({ action: 'error', errorCategory: 'schema', errors: [`conflict action must be 'keep-old' or 'keep-new' (got ${action})`] });
      }
      const prompter = async (e) => (e.proposedId === id ? action : 'skip');
      const r = await resolveConflictQueue({ tier: 'P', projectRoot, userDir, prompter });
      if (r.action === 'error') return mcpToolError(r);
      return {
        content: [{ type: 'text', text: JSON.stringify({ accepted: r.resolved > 0, queue: 'conflicts', id, action, result: r }, null, 2) }],
      };
    }
    if (q === 'prune') {
      // Task 194 — the survival gate's decision surface, MCP side (parity
      // with `cmk queue prune`). Same one-id prompter shape as the others.
      if (action !== 'convert' && action !== 'forget' && action !== 'keep') {
        return mcpToolError({ action: 'error', errorCategory: 'schema', errors: [`prune action must be 'convert', 'forget', or 'keep' (got ${action})`] });
      }
      const prompter = async (e) => (e.id === id ? action : 'skip');
      const r = await resolvePruneQueue({ projectRoot, userDir, prompter });
      if (r.action === 'error') return mcpToolError(r);
      const count = action === 'convert' ? r.converted : action === 'forget' ? r.forgotten : r.kept;
      return {
        content: [{ type: 'text', text: JSON.stringify({ accepted: count > 0, queue: 'prune', id, action, result: r }, null, 2) }],
      };
    }
    return mcpToolError({ action: 'error', errorCategory: 'schema', errors: [`queue must be 'review', 'conflicts', or 'prune' (got ${q})`] });
  };
}

// --- Server build + run ----------------------------------------------

/**
 * Build the kit's MCP server. Caller passes context (projectRoot, userDir,
 * db handle, optional semanticBackend). Returns the McpServer instance
 * ready for `.connect(transport)`.
 *
 * Tests can build the server + invoke tool callbacks directly without
 * spinning up the stdio transport.
 */
/**
 * Task 250 (D-412) — wrap one tool handler so a THROWN handler leaves evidence.
 *
 * THE LINE THIS DRAWS, and why it is the whole design: an `isError:true`
 * envelope is the documented way a tool reports an ordinary outcome (id not
 * found, Poison_Guard rejection, empty search) — the tool WORKED. Only a THROWN
 * handler is a kit failure, and it is the silent one: it escapes into the SDK,
 * becomes a JSON-RPC error, and touches no log on disk anywhere in this module.
 * Counting `isError` as failure would whisper at a user who merely asked for
 * something that isn't there, which is precisely the noise the strike threshold
 * exists to kill.
 *
 * Exported for its own boundary test — a wrapper that swallowed, re-wrapped, or
 * narrowed a handler would be a far worse bug than the silence it fixes, so the
 * passthrough (identity of the thrown error, identity of the result, all args
 * forwarded) is pinned rather than assumed.
 */
export function withToolHealth(projectRoot, name, handler) {
  if (!projectRoot) return handler; // nothing to log to; stay a pure passthrough
  return async (...args) => {
    let result;
    try {
      result = await handler(...args);
    } catch (err) {
      appendHealthEntry(projectRoot, {
        class: HEALTH_CODES.MCP_TOOL_FAILING,
        outcome: 'fail',
        detail: name, // the TOOL NAME, never the message — a message can carry content
      });
      throw err;
    }
    appendHealthEntry(projectRoot, { class: HEALTH_CODES.MCP_TOOL_FAILING, outcome: 'ok' });
    return result;
  };
}

export function buildMcpServer({ projectRoot, userDir, db, semanticBackend }) {
  const server = new McpServer({
    name: 'cmk',
    version: PKG_VERSION,
  });

  // Task 250: ONE registration seam, so the health wrapper cannot be forgotten
  // on tool number 14. Every `registerTool(...)` below is this, not the SDK's.
  const registerTool = (name, schema, handler) =>
    server.registerTool(name, schema, withToolHealth(projectRoot, name, handler));

  // mk_search
  registerTool(
    'mk_search',
    {
      description: 'Search kit memory. FTS5 keyword by default; semantic + hybrid use the embedded Layer-5b backend (sqlite-vec + a local ONNX embedder — needs the optional @huggingface/transformers install).',
      inputSchema: {
        query: z.string().min(1).describe('search query'),
        mode: z.enum(['keyword', 'semantic', 'hybrid']).optional(),
        scope: z.enum(['facts', 'transcripts', 'decisions']).optional().describe("'facts' (default) = curated memory; 'transcripts' = the raw session record (LAST-RESORT — only when curated memory has no answer); 'decisions' = the append-only decision journal (context/DECISIONS.md) — use for decision-HISTORY / evolution / 'what did we reject / why did X change' queries (it returns superseded + retracted entries the live fact store no longer carries)"),
        tier: z.enum(['U', 'P', 'L']).optional(),
        since: z.string().optional().describe('ISO 8601 timestamp'),
        limit: z.number().int().positive().max(1000).optional(),
        min_trust: z.enum(['low', 'medium', 'high']).optional(),
        include_expired: z.boolean().optional().describe('include facts past their declared expires_at date (hidden by default, never deleted) — CLI parity with `cmk search --include-expired`'),
        state_view: z.enum(['current', 'historical', 'transition', 'neutral']).optional().describe('OVERRIDE the automatic query state-view classification (Task 211 — normally detected from the query: a history/transition question auto-includes expired+superseded facts, labeled). Omit for automatic.'),
        source: z.enum(['skill']).optional().describe("recall-origin tag for telemetry (Task 233) — the memory-search skill passes 'skill' so the recall log makes the skill fire-rate measurable (ADR-0024); a bounded enum keeps log cardinality small (extend it when a new origin is added). Omit for ordinary searches."),
      },
    },
    makeMkSearch({ db, semanticBackend, projectRoot, userDir }),
  );

  // mk_get
  // M1: bounded `.max(100)` to prevent soft-DoS via a 100k-id request
  // opening 100k prepared statements + writing 100k JSON-encoded rows.
  registerTool(
    'mk_get',
    {
      description: 'Fetch full observation bodies + provenance + relations by ID.',
      inputSchema: {
        ids: z.array(z.string()).min(1).max(100).describe('kit observation IDs (max 100)'),
      },
    },
    makeMkGet({ db, projectRoot, userDir }),
  );

  // mk_timeline
  registerTool(
    'mk_timeline',
    {
      description: 'Sequential context around an anchor observation — N observations before + N after by created_at.',
      inputSchema: {
        anchor: z.string().describe('kit observation ID'),
        depth_before: z.number().int().nonnegative().max(50).optional(),
        depth_after: z.number().int().nonnegative().max(50).optional(),
      },
    },
    makeMkTimeline({ db, projectRoot, userDir }),
  );

  // mk_expand
  registerTool(
    'mk_expand',
    {
      description: "Expand a recall hit to its source-file neighborhood — the enclosing heading section, bounded (the recall ladder's middle rung between a search hit and the transcript drill).",
      inputSchema: {
        id: z.string().describe('a search-hit id — a kit observation ID (P-XXXXXXXX) or a transcript-chunk id (T:<file>:<line>)'),
      },
    },
    makeMkExpand({ db, projectRoot, userDir }),
  );

  // mk_links (Task 232 — the relational adjacency axis; ADR-0023 ACTIVATE slice)
  registerTool(
    'mk_links',
    {
      description: "Traverse a fact's relations — its backlinks (what points AT it), out-links (its `related`/[[cross-links]]), and full supersession chain (what replaced what, in order). Also accepts an ANCHOR token (D-nnn, Task nnn, ADR-nnnn, FR-nn, NFR-nn) to answer \"what cites this anchor\" (its citers as backlinks). The graph-only shapes flat search can't answer. Read-only.",
      inputSchema: {
        id: z.string().describe('a kit observation ID (P-XXXXXXXX) OR an anchor token (D-361, Task 232, ADR-0023, FR-13, NFR-9)'),
        depth: z.number().int().positive().max(20).optional().describe('how many hops to traverse for links/backlinks (default 1)'),
        direction: z.enum(['in', 'out', 'both']).optional().describe("'in' = backlinks (what references this fact); 'out' = what this fact references; 'both' (default)"),
      },
    },
    makeMkLinks({ db, projectRoot, userDir }),
  );

  // mk_cite
  registerTool(
    'mk_cite',
    {
      description: 'Render a canonical Markdown citation link for a kit observation.',
      inputSchema: {
        id: z.string().describe('kit observation ID'),
      },
    },
    makeMkCite(),
  );

  // mk_remember
  // M1: bounded `.max(5000)` on text — a 10MB body would burn Poison_Guard
  // regex time + index-fts size. 5000 chars matches the kit's per-bullet
  // soft cap (design §2.1).
  registerTool(
    'mk_remember',
    {
      description: 'Explicit user-driven save to kit memory with audit trail.',
      inputSchema: {
        text: z.string().min(1).max(5000).describe('the fact text (max 5000 chars)'),
        tier: z.enum(['U', 'P', 'L']).optional().describe("target tier (default P). U/L are captured to the project tier (P) with a note — use mk_lessons_promote to make a fact cross-project"),
        cites: z.array(z.string()).optional().describe('permanently not recorded (closed — use `links` for fact-linking); omit it'),
        // Task 108b — rich capture parity with the CLI `cmk remember --why/--how`.
        // Any of these routes to a granular Why/How fact file (not a terse bullet).
        why: z.string().max(5000).optional().describe('rich: the rationale (the **Why:** block)'),
        how: z.string().max(5000).optional().describe('rich: how to apply it (the **How to apply:** block)'),
        type: z.enum(['feedback', 'project', 'reference', 'user']).optional().describe('rich: fact type (default feedback)'),
        title: z.string().max(200).optional().describe('rich: short title (also the fact-file slug)'),
        links: z.array(z.string()).optional().describe('rich: related fact names for [[cross-links]]'),
        // Task 66.1/66.3 — temporal fields (rich triggers: both live in fact-file frontmatter).
        shape: z.enum(['State', 'Event', 'Plan', 'Relationship', 'Preference', 'Absence', 'Timeless']).optional().describe('rich: what KIND of truth the fact asserts (default State). Use Plan for future-dated ("demo Friday"), Event for happened-once, Absence for negative facts ("user does NOT want X")'),
        expires: z.string().max(40).optional().describe('rich: declared validity end, ISO date/datetime (e.g. 2026-08-01) — after it the fact hides from search and the weekly sweep tombstones it. Set it when the fact self-declares a shelf life; omit for permanent facts'),
      },
    },
    makeMkRemember({ projectRoot, userDir }),
  );

  // mk_recent_activity
  registerTool(
    'mk_recent_activity',
    {
      description: 'List recently added observations within a time window (by creation time).',
      inputSchema: {
        window: z.enum(['1h', '24h', '7d']).optional(),
        limit: z.number().int().positive().max(1000).optional(),
      },
    },
    makeMkRecentActivity({ db, projectRoot, userDir }),
  );

  // mk_trust (Task 108b — mutate parity). Reversible; audited.
  registerTool(
    'mk_trust',
    {
      description: 'Override the trust level (low|medium|high) of a fact or bullet by ID. Reversible + audited. Parity with `cmk trust`.',
      inputSchema: {
        id: z.string().describe('kit observation ID'),
        level: z.enum(['low', 'medium', 'high']).describe('the new trust level'),
      },
    },
    makeMkTrust({ projectRoot, userDir }),
  );

  // mk_lessons_promote (Task 108b — mutate parity). Sanitized + audited.
  registerTool(
    'mk_lessons_promote',
    {
      description: 'Promote a project-tier (P-) fact to the cross-project user tier so it applies in every project. Sanitized + secret-screened + audited. Parity with `cmk lessons promote`.',
      inputSchema: {
        id: z.string().describe('kit observation ID (a project-tier P- fact)'),
        to: z.enum(['USER.md', 'HABITS.md', 'LESSONS.md']).optional().describe('target user-tier file (default LESSONS.md)'),
        section: z.string().optional().describe('override the landing section within the target file (default: the topic-router picks one) — CLI parity with `cmk lessons promote --section`'),
      },
    },
    makeMkLessonsPromote({ projectRoot, userDir }),
  );

  // mk_forget (Task 108b — DESTRUCTIVE mutate parity). Two-step confirm-token:
  // the first call previews + returns a confirm_token; call again with that
  // token to execute. Tombstones (audit trail preserved), never hard-deletes.
  registerTool(
    'mk_forget',
    {
      description: 'Tombstone (forget) a fact by ID. DESTRUCTIVE + two-step: the first call previews what would be removed and returns a confirm_token; call again with confirm set to that token to execute. Audit trail preserved. Parity with `cmk forget`.',
      inputSchema: {
        id: z.string().describe('kit observation ID to tombstone'),
        reason: z.string().max(500).optional().describe('why it is being forgotten (audited)'),
        deleted_by: z.string().max(200).optional().describe('who is forgetting it — audit provenance (default: user-explicit) — CLI parity with `cmk forget --deleted-by`'),
        confirm: z.string().optional().describe('the confirm_token from the preview call — required to actually delete'),
      },
    },
    makeMkForget({ projectRoot, userDir }),
  );

  // mk_queue_list (Task 108b — queue parity). Read-only: show pending entries.
  registerTool(
    'mk_queue_list',
    {
      description: "List pending entries in the review queue (medium-trust auto-extracts awaiting promotion), the conflict queue (writes that clashed with existing facts), or the prune queue (survival-gate candidates — trust floored + still failing). Read-only. Parity with `cmk queue review` / `cmk queue conflicts` / `cmk queue prune`.",
      inputSchema: {
        queue: z.enum(['review', 'conflicts', 'prune']).optional().describe("which queue (default 'review')"),
      },
    },
    makeMkQueueList({ projectRoot, userDir }),
  );

  // mk_queue_resolve (Task 108b — queue parity). Resolve one entry by id.
  registerTool(
    'mk_queue_resolve',
    {
      description: "Resolve one queued entry by ID. review: 'promote' (land it in MEMORY.md at high trust) | 'discard'. conflicts: 'keep-old' | 'keep-new' (merge-both composes content — use `cmk queue conflicts`). prune: 'convert' (retain as a typed anti-pattern warning) | 'forget' (tombstone) | 'keep' (dismiss, never re-queued). Audited.",
      inputSchema: {
        queue: z.enum(['review', 'conflicts', 'prune']).describe('which queue the entry is in'),
        id: z.string().describe('the queued entry ID to resolve'),
        action: z.enum(['promote', 'discard', 'keep-old', 'keep-new', 'merge-both', 'convert', 'forget', 'keep']).describe('review: promote|discard; conflicts: keep-old|keep-new (merge-both → use `cmk queue conflicts`); prune: convert|forget|keep'),
      },
    },
    makeMkQueueResolve({ projectRoot, userDir }),
  );

  return server;
}

/**
 * Run the kit's MCP server over stdio (the production CLI path).
 *
 * Per design §10.1: stdout is reserved for JSON-RPC messages; ALL logs
 * to stderr. The SDK's StdioServerTransport handles the stdout/stdin
 * pipe — our concern is making sure we don't pollute stdout via
 * console.log() anywhere in the tool callbacks. console.error() (which
 * writes to stderr) is fine.
 *
 * Caller (`cmk mcp serve` subcommand) provides projectRoot + userDir.
 * We open the index DB read-only-ish (better-sqlite3 doesn't expose
 * a read-only flag mid-life; WAL + multi-connection makes this safe).
 */
export async function runMcpServer({ projectRoot, userDir, db: dbOverride, semanticBackend } = {}) {
  const db = dbOverride ?? openIndexDb({ projectRoot });
  // Refresh the index at server startup so mk_search sees facts already on
  // disk — same fresh-install gap as `cmk search` (self-test finding #0):
  // nothing reindexes for a just-installed project, so without this the
  // model's first mk_search returns empty for facts sitting in the
  // scratchpads. Incremental (mtime/sha1 diff) + best-effort.
  //
  // Task 218 (D-329): in-session freshness for facts written AFTER startup (a
  // Stop-hook auto-extract child, a `cmk remember` CLI, a 2nd window) is handled
  // by a PER-QUERY incremental reindex inside each read tool — the SAME thing
  // every CLI read already does (subcommands.mjs `cmk search` runs reindexBoot
  // per call). The MCP reader used to skip it on a false "the long-lived watcher
  // handles it" premise (the watcher was never even wired, and chokidar drops
  // events under load anyway — the D-329 research). Making the MCP reader
  // consistent with the CLI is deterministic + load-immune (a synchronous inline
  // refresh, no async FS event to lose). This boot reindex stays as the
  // first-query fast-path; refreshIndexForRead does the per-call work.
  if (projectRoot) {
    try {
      reindexBoot({ projectRoot, userDir, db });
    } catch (err) {
      process.stderr.write(
        `cmk-mcp-server: startup index refresh failed: ${err?.message ?? err}\n`,
      );
    }
  }
  const server = buildMcpServer({ projectRoot, userDir, db, semanticBackend });
  const transport = new StdioServerTransport();

  // I4 (Task 31 code-review): graceful shutdown. Without this, the
  // server holds the DB handle until the process is hard-killed —
  // problematic on Windows where Node's process-exit doesn't flush
  // SQLite WAL files synchronously. The kit's tests force `kill()`
  // which doesn't exercise this path, but production Claude Code
  // will simply close stdin when the session ends; we want to honor
  // that as the "shut down cleanly" signal.
  const closeOnce = (() => {
    let closed = false;
    return () => {
      if (closed) return;
      closed = true;
      try {
        db.close();
      } catch (err) {
        // Best-effort — log to stderr (stdout reserved for JSON-RPC).
        process.stderr.write(
          `cmk-mcp-server: db.close() failed: ${err?.message ?? err}\n`,
        );
      }
    };
  })();

  // stdin close from Claude Code → graceful shutdown.
  process.stdin.on('end', closeOnce);
  process.stdin.on('close', closeOnce);
  // SIGINT / SIGTERM — the user interrupted from the terminal OR the
  // OS asked for a clean exit. Honor it.
  process.once('SIGINT', () => {
    closeOnce();
    process.exit(0);
  });
  process.once('SIGTERM', () => {
    closeOnce();
    process.exit(0);
  });

  await server.connect(transport);
  // The server now runs until stdin closes (Claude Code disconnects).
  // Return the handle so callers in tests can close cleanly.
  return { server, transport, db, close: closeOnce };
}
