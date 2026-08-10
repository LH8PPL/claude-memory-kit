// viewer.mjs — `cmk view`, the kit's own read-only memory viewer (Task 255,
// design §24, ratified 2026-08-02 as D-414).
//
// WHAT THIS IS. One command → an EPHEMERAL loopback HTTP server → a browser
// tab showing the memory the kit manages, in the kit's own semantics (trust
// tiers, supersession direction, anchor hubs, health warnings, the decision
// journal) — the rendering Obsidian (Task 254, the companion) structurally
// cannot do. Ctrl-C and it is gone. There is no daemon.
//
// THE FOUR CONTRACTS THIS MODULE OWES (design §24.1), each enforced here rather
// than documented and hoped for:
//
//   1. LOOPBACK ONLY. `bindHost` refuses anything that is not a loopback
//      literal, and says WHY (there is no authentication mode — the user tier
//      is on screen). This is the hermes hardening borrow: a non-loopback bind
//      would need auth, so the answer is "don't bind there", not "add a flag".
//      A `Host:`-header guard backs it up at request time, because loopback
//      binding alone does NOT stop DNS rebinding — a hostile page can resolve
//      its own domain to 127.0.0.1 and read your memory through your browser
//      unless the server checks who the request THINKS it is talking to.
//
//   2. READ-ONLY, STRUCTURALLY. There is exactly one route table and every
//      entry in it is a reader. No mutating method is mounted at all: anything
//      that is not GET/HEAD gets 405 + `Allow: GET, HEAD` before routing even
//      happens. Not auth-gated — ABSENT (ADR-0018: the safe write path stays
//      the only writer). The field's #1 viewer demand (delete-from-here) is
//      answered in the page as copy-able `cmk forget` / `cmk trust` commands.
//
//      The read-only claim extends to the kit's OWN logs. The facts route runs
//      the shared `search()` WITHOUT `projectRoot`, which is what suppresses
//      its recall-log append — browse traffic in `.locks/recall.log` would
//      corrupt the Task-233/ADR-0024 skill fire-rate measurement (a human
//      scrolling a UI is not the model recalling a fact). The one thing a
//      request does touch is `context/.index/` — the rebuildable FTS cache
//      every read verb refreshes, per ADR-0002 markdown-is-the-truth.
//
//   3. API-FIRST. Every view answers as JSON and as HTML from the same route
//      (the datasette pattern). Three equivalent ways to ask for the JSON, in
//      precedence order: the `/api/` prefix, a `.json` suffix, or an
//      `Accept: application/json` header. So `/facts`, `/facts.json` and
//      `/api/facts` are one view with two renderings, and the server doubles as
//      the kit's local read API for whatever consumes it later.
//
//   4. NO SCAFFOLDING. A project without `context/MEMORY.md` gets an
//      explanation and an exit — never a silently-created memory tree (the
//      Task-250 no-scaffold guard class).
//
// WHAT IS DELIBERATELY ABSENT IN WAVE 1: `fs.watch` / SSE live refresh (Task
// 259, named trigger), a timeline view, a conflict-queue UI, a stats page
// (§24.1.8). The page refreshes when the human asks it to and labels how stale
// it is — the Pulse TabFreshness borrow.
//
// ZERO NEW DEPENDENCIES (§24.1.7): node's own `http`, one committed static HTML
// file, the better-sqlite3 index the kit already carries.

import { createServer } from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { errorResult, ERROR_CATEGORIES } from './result-shapes.mjs';
import { openBrowserCommand } from './platform-commands.mjs';
import { openIndexDb } from './index-db.mjs';
import { reindexBoot } from './index-rebuild.mjs';
import {
  search as searchAction,
  countKeywordMatches,
  matchDecisionEntries,
  SEARCH_MODES,
  SEARCH_MAX_LIMIT,
} from './search.mjs';
import { ID_PATTERN, VALID_TIERS } from './tier-paths.mjs';
import { eachSupersededFact } from './fact-store.mjs';
import { parseRichFactBody } from './rich-fact.mjs';
import { traverseLinks, supersessionChain } from './graph-index.mjs';
import { readDecisionsJournal } from './decisions-journal.mjs';
import { activeWarnings } from './health-log.mjs';
import { runDoctor } from './doctor.mjs';
import { listConflictQueue } from './conflict-queue.mjs';
import { listReviewQueue } from './review-queue.mjs';
import { stateFieldFor } from './state-label.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));

/**
 * The host values that mean "this machine, and only this machine". Anything
 * else is refused at start; anything else in a request's `Host:` header is
 * refused at request time (the rebinding guard).
 */
export const LOOPBACK_HOSTS = Object.freeze(new Set(['127.0.0.1', 'localhost', '::1']));

/** The default page size for the facts list. */
export const VIEWER_DEFAULT_LIMIT = 50;

/**
 * The hard ceiling on `?limit=`. A viewer request is human-driven and the page
 * renders every row it receives, so an unbounded limit is a self-inflicted
 * freeze on a large corpus rather than a security boundary. Over-cap CLAMPS
 * (the request still succeeds, `limit` in the envelope reports what was
 * actually used) — a browse surface that 400s because someone typed a big
 * number in the URL bar would be worse than one that shows 200 rows.
 */
export const VIEWER_MAX_LIMIT = 200;

/**
 * How deep `?offset=` can reach IN SEARCH MODE (Task 269) — the search engine's
 * own ceiling, imported rather than copied so the two cannot drift.
 *
 * A ranked page is served by asking the engine for THIS MANY rows on EVERY page
 * — a constant, never `offset + limit` — and slicing the result. The engine
 * oversamples and re-ranks in JS (search.mjs `blendTrustScore`), so a variable
 * ask ranks a different-sized pool per page and a record lands on two pages or
 * on none; a constant ask pins the pool and makes page N a slice of the same
 * ordering page 1 came from. Pushing the offset into SQL has the same defect
 * for the same reason. The cost is this reachable depth, which the envelope
 * states rather than hides (`reachable`), plus a full-depth search per page.
 * BROWSE mode has no such cap: its sort is a plain stable SQL ORDER BY, so it
 * pages to the last record.
 */
export const VIEWER_SEARCH_DEPTH = SEARCH_MAX_LIMIT;

/**
 * The relevance bands a search hit is coloured by (Task 269 sub-item, D-429 —
 * mnemory's green/amber/red at ≥0.7 / ≥0.4).
 *
 * WHAT THE NUMBER IS, stated because it would otherwise be read as a confidence:
 * FTS5's bm25 rank is unbounded and negative (more negative = better) and means
 * nothing across two different queries, so there is no absolute 0..1 score to
 * report. `relevance` is therefore RELATIVE — a hit's blended score over the
 * TOP hit's blended score for the same query, in (0, 1]. The top hit is 1.0 by
 * construction. It answers "how much weaker than the best match is this", which
 * is the question a colour on a result row can honestly answer.
 *
 * Normalized against the top of the WHOLE result set, never per page: a
 * per-page normalization would repaint every page's first row as a full-strength
 * match, which is precisely the "a weak match looks strong" defect this closes.
 */
export const RELEVANCE_BANDS = Object.freeze({ strong: 0.7, fair: 0.4 });

/** The journal orderings `/api/decisions?order=` accepts. */
const DECISION_ORDERS = Object.freeze(new Set(['journal', 'newest']));

/** Media types, spelled once. */
const HTML = 'text/html; charset=utf-8';
const JSON_TYPE = 'application/json; charset=utf-8';

/**
 * A read-only, loopback-only, offline page: no external origin is reachable at
 * all, so a stray CDN link in the HTML fails loudly in the browser console
 * instead of silently working on the author's machine and breaking on a plane.
 * `script-src 'unsafe-inline'` (with no host source) is exactly "inline only".
 */
// `frame-ancestors` is listed EXPLICITLY: it is one of the few directives that
// does NOT fall back to `default-src`, so `default-src 'none'` does not stop
// another origin from framing this page and clickjacking it (M3).
const CSP =
  "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; " +
  "img-src data:; connect-src 'self'; base-uri 'none'; form-action 'none'; " +
  "frame-ancestors 'none'";

/** Is this a host we are willing to bind to / answer for? */
export function isLoopbackHost(host) {
  if (typeof host !== 'string') return false;
  // A `Host:` header carries the port; a bind host does not. Strip either
  // shape: `[::1]:1234`, `127.0.0.1:1234`, `localhost`.
  let h = host.trim().toLowerCase();
  if (h.startsWith('[')) {
    const end = h.indexOf(']');
    if (end === -1) return false;
    h = h.slice(1, end);
  } else if (h.includes(':') && h.split(':').length === 2) {
    h = h.split(':')[0];
  }
  return LOOPBACK_HOSTS.has(h);
}

/**
 * Resolve a request URL into {view, id, json, params}.
 *
 * Path traversal is not defended against here because it is not REACHABLE: no
 * route maps a path segment onto a filesystem path. The only file this server
 * ever reads is the one committed page, at a constant path. A traversal attempt
 * simply fails to match a view and 404s, which the tests pin so that a future
 * file-serving route cannot be added without the test noticing.
 */
export function resolveRoute(rawUrl, { accept = '' } = {}) {
  let u;
  try {
    // WHATWG URL normalizes `..` segments and rejects malformed input, so the
    // matcher below only ever sees a clean path.
    u = new URL(rawUrl, 'http://127.0.0.1');
  } catch {
    return { view: null, json: false };
  }
  let path;
  try {
    path = decodeURIComponent(u.pathname);
  } catch {
    return { view: null, json: false }; // malformed percent-encoding
  }
  // The three equivalent ways to ask for JSON (§24.1.2). A browser sends
  // `Accept: text/html,…` so it lands on HTML; `Accept: application/json`
  // without a wildcard is an unambiguous API client.
  let json = /\bapplication\/json\b/.test(accept) && !/\btext\/html\b/.test(accept);
  if (path === '/api' || path.startsWith('/api/')) {
    json = true;
    path = path.slice(4) || '/';
  }
  if (path.endsWith('.json')) {
    json = true;
    path = path.slice(0, -5) || '/';
  }
  if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);

  const params = u.searchParams;
  if (path === '/' || path === '/facts') return { view: 'facts', json, params };
  if (path === '/graph') return { view: 'graph', json, params };
  if (path === '/health') return { view: 'health', json, params };
  if (path === '/decisions') return { view: 'decisions', json, params };
  if (path.startsWith('/fact/')) {
    return { view: 'fact', id: path.slice('/fact/'.length), json, params };
  }
  return { view: null, json, params };
}

/** Read the committed page. Read once per request — it is ~30 KB and this is a
 *  human-paced surface; re-reading means an edit during development shows up on
 *  refresh without a restart. */
function readPage() {
  return readFileSync(join(HERE, 'viewer-page.html'), 'utf8');
}

/** The default browser opener: detached, fire-and-forget, never fatal. */
function defaultOpenBrowser(url, { logError } = {}) {
  try {
    const { command, args } = openBrowserCommand(url);
    // The child is the user's BROWSER (or the platform's opener stub),
    // detached + unref'd — a parent-side timeout would kill their browser.
    // spawn-discipline: ignore detached fire-and-forget browser launch; a timeout would kill the user's browser
    const child = spawn(command, args, {
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
    });
    child.on('error', () => {
      /* no opener on this box — the printed URL is the fallback */
    });
    child.unref();
  } catch (err) {
    logError?.(`cmk view: could not open a browser (${err?.message ?? err}) — open the URL above.`);
  }
}

function send(res, status, type, body, extraHeaders = {}) {
  res.writeHead(status, {
    'content-type': type,
    'content-length': Buffer.byteLength(body),
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'no-referrer',
    'content-security-policy': CSP,
    ...extraHeaders,
  });
  // HEAD must carry the headers and no body (RFC 9110 §9.3.2).
  if (res.req.method === 'HEAD') res.end();
  else res.end(body);
}

function sendJson(res, status, payload) {
  send(res, status, JSON_TYPE, JSON.stringify(payload, null, 2));
}

/**
 * Start the viewer.
 *
 * @param {object} opts
 * @param {string} opts.projectRoot
 * @param {string} [opts.userDir]              the user tier (badged `U` in the UI)
 * @param {string} [opts.host='127.0.0.1']     loopback literals only
 * @param {number} [opts.port=0]               0 = let the OS pick a free port
 * @param {boolean} [opts.open=true]           auto-open the browser
 * @param {Function} [opts.openBrowser]        injection seam for the open
 * @param {string[]} [opts.signals=[]]         signals to bind for graceful close
 * @param {Function} [opts.onShutdown]         what a bound signal does after close
 * @param {Function} [opts.log] @param {Function} [opts.logError]
 * @returns {Promise<{action:'listening',url,host,port,close}|{action:'error',…}>}
 */
export async function startViewer({
  projectRoot,
  userDir,
  host = '127.0.0.1',
  port = 0,
  open = true,
  openBrowser = defaultOpenBrowser,
  doctorOptions = {},
  signals = [],
  onShutdown = () => process.exit(0),
  log = console.log,
  logError = console.error,
} = {}) {
  if (!projectRoot) {
    return errorResult({
      category: ERROR_CATEGORIES.MISSING_PROJECT_ROOT,
      errors: ['projectRoot is required'],
    });
  }
  if (!isLoopbackHost(host)) {
    return errorResult({
      category: ERROR_CATEGORIES.SCHEMA,
      errors: [
        `refusing to bind ${host}: cmk view serves your memory — including the ` +
          'user tier — over plain HTTP with no authentication, so it binds ' +
          'loopback ONLY (127.0.0.1, localhost, ::1). There is no auth mode to ' +
          'turn on; exposing the viewer beyond this machine is not supported.',
      ],
    });
  }
  // The no-scaffold guard (§24.2): a read verb explains, it never creates.
  if (!existsSync(join(projectRoot, 'context', 'MEMORY.md'))) {
    return errorResult({
      category: ERROR_CATEGORIES.NOT_FOUND,
      errors: [
        `no kit memory found at ${join(projectRoot, 'context')} — ` +
          'cmk view is read-only and will not scaffold one. ' +
          'Run `cmk install` here first (or run cmk view from your project root).',
      ],
    });
  }

  // `doctorOptions` is a TEST seam only: production passes nothing, so
  // /api/health runs exactly the probes `cmk doctor` runs (the two must never
  // be able to disagree). The suite stubs the backend-CLI probe so it does not
  // depend on which agent binary happens to be installed on the machine.
  const ctx = { projectRoot, userDir, logError, doctorOptions };
  const server = createServer((req, res) => handle(req, res, ctx));

  const listenError = await new Promise((resolve) => {
    const onError = (err) => resolve(err);
    server.once('error', onError);
    server.listen(port, host, () => {
      server.removeListener('error', onError);
      resolve(null);
    });
  });
  if (listenError) {
    return errorResult({
      category: ERROR_CATEGORIES.SCHEMA,
      errors: [
        listenError.code === 'EADDRINUSE'
          ? `port ${port} is already in use — omit --port to let cmk view pick a free one.`
          : `could not listen on ${host}:${port} — ${listenError.message}`,
      ],
    });
  }

  const addr = server.address();
  const boundPort = typeof addr === 'object' && addr ? addr.port : port;
  // An IPv6 loopback bind needs bracket form in the URL.
  const urlHost = host.includes(':') ? `[${host}]` : host;
  const url = `http://${urlHost}:${boundPort}/`;

  let closed = false;
  const bound = [];
  const close = async () => {
    for (const [sig, fn] of bound) process.removeListener(sig, fn);
    bound.length = 0;
    if (closed) return;
    closed = true;
    // `server.close()` stops ACCEPTING but waits for open sockets to end — and
    // a browser holds its connection open on keep-alive, so Ctrl-C with the tab
    // still open would hang the shutdown indefinitely. A viewer the user cannot
    // stop is precisely the resident-daemon complaint class §24 exists to avoid,
    // so the sockets are dropped explicitly. Safe here in a way it would not be
    // for a writer: every in-flight request is a read.
    server.closeIdleConnections?.();
    server.closeAllConnections?.();
    await new Promise((resolve) => server.close(() => resolve()));
  };
  for (const sig of signals) {
    const fn = () => {
      log('\ncmk view: shutting down.');
      close().then(onShutdown, onShutdown);
    };
    process.on(sig, fn);
    bound.push([sig, fn]);
  }

  log(`cmk view: serving ${projectRoot} at ${url}`);
  log('  read-only · loopback only · Ctrl-C to stop');
  if (open) openBrowser(url, { logError });

  return { action: 'listening', url, host, port: boundPort, close };
}

/** The ONE request path. Every branch is a reader. */
function handle(req, res, ctx) {
  // (1) Read-only, before routing: nothing but GET/HEAD is mounted anywhere.
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return send(res, 405, JSON_TYPE, JSON.stringify({ error: 'read-only: cmk view mounts no write route. Use `cmk forget` / `cmk trust` from your shell.' }), { allow: 'GET, HEAD' });
  }
  // (2) The DNS-rebinding guard: a loopback BIND does not stop a hostile page
  // from pointing its own hostname at 127.0.0.1 and reading your memory
  // through your browser. The Host header is the only thing that distinguishes
  // those requests from a real localhost visit.
  if (!isLoopbackHost(req.headers.host ?? '')) {
    return send(res, 403, JSON_TYPE, JSON.stringify({ error: 'cmk view answers loopback hosts only' }));
  }

  const route = resolveRoute(req.url, { accept: req.headers.accept ?? '' });
  if (route.view === null) {
    if (route.json) return sendJson(res, 404, { error: 'no such view' });
    return send(res, 404, HTML, '<!doctype html><meta charset="utf-8"><title>404</title><p>No such view. <a href="/">Back to memory</a>.');
  }

  if (!route.json) {
    // Every HTML view is the SAME committed page; it routes client-side off
    // location.pathname, so a deep link works and there is still exactly one
    // static file (§24.1.7).
    try {
      return send(res, 200, HTML, readPage());
    } catch (err) {
      ctx.logError?.(`cmk view: could not read the viewer page — ${err?.message ?? err}`);
      return send(res, 500, HTML, '<!doctype html><meta charset="utf-8"><title>error</title><p>The viewer page is missing from this install. Reinstall the kit.');
    }
  }

  // The JSON side. Every handler returns {status, payload}; a thrown error is a
  // 500 with its message, never a stack — this is a browser surface.
  const t0 = Date.now();
  Promise.resolve()
    .then(() => API[route.view](route, ctx))
    .then(({ status, payload }) => {
      sendJson(res, status, {
        view: route.view,
        generated_at: new Date().toISOString(),
        took_ms: Date.now() - t0,
        ...payload,
      });
    })
    .catch((err) => {
      // A BadRequest carries a DEVELOPER-authored message — every `new
      // BadRequest(...)` site in this file passes a string literal (the only
      // interpolated values are `JSON.stringify` of already-rejected input and
      // the search core's own kit-generated error strings; never an exception
      // or a stack). So its message is safe to return.
      if (err instanceof BadRequest) {
        return sendJson(res, 400, { view: route.view, error: err.message });
      }
      // An UNEXPECTED error's message is attacker-influenceable and may name a
      // path or carry a stack fragment. It goes to the terminal ONLY; the HTTP
      // client gets a constant. (CodeQL js/stack-trace-exposure: no tainted
      // value reaches the response.)
      ctx.logError?.(`cmk view: ${route.view} failed — ${err?.stack ?? err?.message ?? err}`);
      return sendJson(res, 500, {
        view: route.view,
        error: 'internal error — see the terminal running `cmk view` for details',
      });
    });
}

// --- The read layer ------------------------------------------------------
//
// One DB handle PER REQUEST, opened and closed. Deliberate, not lazy: a
// long-lived better-sqlite3 handle keeps a Windows file lock on
// `context/.index/`, which is the D-302 half-broken-install class (a running
// process holding kit files while npm tries to replace them). A viewer is
// human-paced; a sqlite open costs a millisecond and buys the property that
// leaving the tab open all day blocks nothing.
//
// The boot reindex is the same incremental mtime/sha refresh every other read
// verb runs — it is what makes the page's manual Refresh mean something. It
// touches only `context/.index/`, the rebuildable cache (ADR-0002).
function withDb(ctx, fn) {
  const db = openIndexDb({ projectRoot: ctx.projectRoot });
  try {
    try {
      reindexBoot({ projectRoot: ctx.projectRoot, userDir: ctx.userDir, db });
    } catch (err) {
      // M5: the terminal line is the only place this failure surfaces, so it
      // carries the fix — same wording contract as `cmk search`, which says
      // exactly this. A degraded-but-silent index is how stale results get
      // mistaken for missing memory.
      ctx.logError?.(
        `cmk view: index refresh failed (${err?.message ?? err}); serving the existing index. ` +
          'Run `cmk reindex --full` if results look stale.',
      );
    }
    return fn(db);
  } finally {
    db.close();
  }
}

class BadRequest extends Error {}

/** Parse + validate `?limit=`, clamping (never rejecting) an over-cap value. */
function readLimit(params, { fallback = VIEWER_DEFAULT_LIMIT } = {}) {
  const raw = params.get('limit');
  if (raw === null || raw === '') return { limit: fallback, clamped: false };
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1) {
    throw new BadRequest(`limit must be a positive integer (got ${JSON.stringify(raw)})`);
  }
  return n > VIEWER_MAX_LIMIT
    ? { limit: VIEWER_MAX_LIMIT, clamped: true }
    : { limit: n, clamped: false };
}

/**
 * Parse `?offset=` — the whole functional fix of Task 269 (D-426: without it,
 * 91% of the fact corpus and 92% of the journal were unreachable by ANY URL).
 *
 * OFFSET, not a cursor, decided at build time. A cursor is the better answer for
 * an unbounded feed read newest-first; this is a bounded archive read
 * DELIBERATELY, and three properties settle it: (a) the browse sort is a total
 * order already (`created_at DESC, id ASC` — the id tiebreak is what makes a
 * same-millisecond batch pageable at all), so an offset is deterministic;
 * (b) a RANKED result set has no stable key to carry in a cursor — the blend
 * re-ranks in JS — while an offset slices one ranking cleanly; and (c) only an
 * offset can say "records 101–150 of 2,300", and a citeable position is the
 * stated point (a pager, not an infinite scroll).
 *
 * The cost, stated: a fact written WHILE someone pages shifts the window by one,
 * so a newest-first offset can repeat or skip a record across a live insert. On
 * an ephemeral read-only viewer over a corpus that changes at human pace that is
 * the right trade; a cursor would be the fix if it ever stops being.
 *
 * Unlike `limit` this REJECTS rather than clamps: an over-cap limit is a typo
 * with an obvious sane reading (give me the most you will), while an offset past
 * the end has one too — an empty page — and that is served as a 200. What is
 * left (negative, fractional, non-numeric) has no reading at all.
 *
 * THE SAFE-INTEGER CEILING (review I2). `/^\d+$/` alone let `?offset=` carry a
 * 20-digit number: `Number('9'.repeat(20))` is 1e20, which `Number.isInteger`
 * accepts, so it sailed through to better-sqlite3, which refuses to bind a
 * value outside int64 — a 500 on a route whose documented contract says an
 * offset past the end is a 200. The ceiling is `Number.MAX_SAFE_INTEGER` and
 * the verdict above it is 400, NOT a clamp, on the same reasoning that governs
 * the rest of this function: past 2^53 the parsed value is no longer the number
 * that was typed (float64 has already rounded it), so there is nothing to serve
 * a page of and nothing honest to echo back in `offset`. That is a MALFORMED
 * offset, not a large one — and every offset that is genuinely a number,
 * including every one past the end of the corpus, still gets its empty 200.
 */
function readOffset(params) {
  const raw = params.get('offset');
  if (raw === null || raw === '') return 0;
  const n = Number(raw);
  if (
    !/^\d+$/.test(raw.trim()) ||
    !Number.isSafeInteger(n) ||
    n < 0
  ) {
    throw new BadRequest(
      `offset must be a non-negative integer no larger than ${Number.MAX_SAFE_INTEGER} (got ${JSON.stringify(raw)})`,
    );
  }
  return n;
}

function readTier(params) {
  const tier = params.get('tier');
  if (tier === null || tier === '') return null;
  if (!VALID_TIERS.has(tier)) {
    throw new BadRequest(`tier must be one of P, L, U (got ${JSON.stringify(tier)})`);
  }
  return tier;
}

const ROW_COLUMNS = `
  id, tier, trust, trust_score, signal_count, write_source, heading_path, body,
  source_file, source_line, created_at, expires_at, superseded_by, deleted_at`;

/**
 * A hit's strength RELATIVE to the best hit for the same query, in (0, 1], plus
 * the band it falls in (§RELEVANCE_BANDS). Both are `null` outside search mode —
 * a browse row has no query and therefore no relevance to claim, and the fields
 * stay PRESENT so a search hit and a browse row remain one shape on the wire
 * (§24.1.1: the page must not have two renderers).
 */
/**
 * Which band a relevance falls in. Exported as a PURE function so the two
 * thresholds can be pinned at their exact edges (`0.7` and `0.4` are inclusive
 * lower bounds) without arranging a corpus that happens to produce them — the
 * same shape `blendTrustScore` is tested in. Budget pair: design §17.10.
 */
export function relevanceBandFor(rel) {
  if (!Number.isFinite(rel)) return null;
  if (rel >= RELEVANCE_BANDS.strong) return 'strong';
  if (rel >= RELEVANCE_BANDS.fair) return 'fair';
  return 'weak';
}

function relevanceOf(score, topScore) {
  if (!Number.isFinite(score) || !Number.isFinite(topScore) || topScore === 0) {
    return { relevance: null, relevance_band: null };
  }
  const rel = Math.max(0, Math.min(1, score / topScore));
  return { relevance: rel, relevance_band: relevanceBandFor(rel) };
}

/** The shape every fact row is rendered in, on every route. One place. */
function toFactRow(row, { snippet, now, relevance = null, relevanceBand = null } = {}) {
  const rich = parseRichFactBody(row.body);
  return {
    id: row.id,
    tier: row.tier,
    trust: row.trust,
    trust_score: row.trust_score,
    signal_count: row.signal_count,
    write_source: row.write_source,
    title: row.heading_path ?? null,
    snippet: snippet ?? flatten(rich.headline || row.body, 240),
    source_file: row.source_file,
    source_line: row.source_line,
    created_at: row.created_at,
    date: row.created_at ? new Date(row.created_at).toISOString().slice(0, 10) : null,
    expires_at: row.expires_at ?? null,
    superseded_by: row.superseded_by ?? null,
    relevance,
    relevance_band: relevanceBand,
    ...stateFieldFor(row, now),
  };
}

function flatten(s, max) {
  const flat = String(s ?? '').replace(/\s+/g, ' ').trim();
  return flat.length > max ? `${flat.slice(0, max)}…` : flat;
}

const API = {
  /**
   * The landing data: an FTS search when `q` is present, else newest-first.
   *
   * The search runs WITHOUT `projectRoot`, which is what suppresses `search()`'s
   * recall-log append. That is not an oversight — see the module header: a human
   * scrolling a UI is not the model recalling a fact, and mixing the two would
   * corrupt the ADR-0024 fire-rate measurement.
   */
  facts(route, ctx) {
    const params = route.params;
    const { limit, clamped } = readLimit(params);
    const offset = readOffset(params);
    const tier = readTier(params);
    const q = (params.get('q') ?? '').trim();

    return withDb(ctx, (db) => {
      let rows;
      let mode;
      // How far `?offset=` can actually go under this mode. `total` says what
      // the query matched; `reachable` says how much of it this route can hand
      // back a page at a time. They differ only in search mode, and only past
      // the engine's ranking depth — where the honest answer is "refine the
      // query", not a pager button that returns nothing.
      let reachable;
      // The DENOMINATOR, on the same payload as the rows (§24.1.1). It counts
      // the population the rows were drawn from — same filters, no LIMIT — so
      // the page can say "the first 50 of N" without asking a second route for
      // a number that was never quite the same number.
      let total;
      // Rows of the ranking/list this window covered — the basis for `has_more`.
      // Equals `rows.length` in browse mode; in search mode it can exceed it by
      // however many hits were dropped as unresolvable (see below).
      let served;
      const now = Date.now();
      if (q) {
        mode = 'search';
        // ASK FOR A CONSTANT DEPTH ON EVERY PAGE, then slice. This is the whole
        // of "a ranked page is a slice of ONE ranking", and the first cut of it
        // got the arithmetic wrong in a way worth writing down.
        //
        // Asking for `offset + limit` looks equivalent and is not: the engine
        // OVERSAMPLES (search.mjs `BLEND_OVERSAMPLE`) and re-ranks the candidate
        // window in JS, so a request for 50 ranks a 150-row pool and a request
        // for 100 ranks a 300-row one. A trust-blended fact sitting past the
        // page-1 pool is invisible to page 1 and present for page 2, which
        // shifts every row after it — the reviewer reproduced one id on two
        // pages and one on none across a 200-row walk (199 unique), and the
        // TOP hit changed between pages, which silently corrupted the relevance
        // normalization that is defined against it.
        //
        // A constant `limit` makes the pool constant (`min(DEPTH × 3, MAX)` is
        // pinned at the engine ceiling), so every page slices the identical
        // ranking. The cost is a full-depth search per page — bounded, human-
        // paced, and the price of a pager that cannot lose a record.
        const beyondDepth = offset >= VIEWER_SEARCH_DEPTH;
        const r = searchAction({
          db,
          query: q,
          mode: SEARCH_MODES.KEYWORD,
          scope: 'facts',
          // Past the reachable depth the rows are known to be empty, so the
          // search runs at the CHEAPEST legal size the engine accepts (it
          // rejects 0) and its result is discarded — the early-out costs one
          // row, not a full-depth ranking. It still RUNS so that both branches
          // reject identically: whatever `search()` refuses on a normal page it
          // refuses here, as a 400, instead of the unlimited count below
          // throwing the same objection as a 500. That is defensive rather than
          // a demonstrated path — `prepareFtsQuery` sanitizes every user query
          // into a quoted term, so no `?q=` value is known to reach FTS5's
          // parser raw (the test says so explicitly rather than asserting a
          // grammar error it cannot produce).
          limit: beyondDepth ? 1 : VIEWER_SEARCH_DEPTH,
          ...(tier ? { tier } : {}),
        });
        if (r.action === 'error') throw new BadRequest((r.errors ?? ['search failed']).join('; '));
        const ranked = beyondDepth ? [] : r.results;
        // The reference point for `relevance` is the top of the WHOLE ranking,
        // taken BEFORE the page slice — so page 2's first row is scored against
        // page 1's best hit and a weak match keeps looking weak.
        const topScore = ranked.length > 0 ? ranked[0].score : null;
        const page = ranked.slice(offset, offset + limit);
        // How much of the ranking this window COVERED, which is not always how
        // many rows come back: an FTS hit whose observations row is missing is
        // dropped below (the Task-270 orphan class — a fact whose id the index
        // cannot resolve). `has_more` must count the window, or the last page
        // of a set containing one orphan reports "no more" while a record it
        // never showed sits past it.
        served = page.length;
        // Re-read the full rows so a search hit and a browse row are the SAME
        // shape on the wire — the page must not have two renderers.
        const byId = new Map(hydrate(db, page.map((h) => h.id)).map((x) => [x.id, x]));
        rows = page
          .filter((h) => byId.has(h.id))
          .map((h) => {
            const { relevance, relevance_band: band } = relevanceOf(h.score, topScore);
            return toFactRow(byId.get(h.id), {
              snippet: flatten(h.snippet, 240),
              relevance,
              relevanceBand: band,
            });
          });
        // The whole match set, not the page of it: `count` is what the search
        // returned, `total` is what it matched. The search ran first, so any
        // FTS grammar error has already surfaced as a 400 by this point.
        total = countKeywordMatches({
          db,
          query: q,
          scope: 'facts',
          ...(tier ? { tier } : {}),
        });
        reachable = Math.min(total, VIEWER_SEARCH_DEPTH);
      } else {
        mode = 'recent';
        rows = db
          .prepare(
            `SELECT ${ROW_COLUMNS} FROM observations
             WHERE deleted_at IS NULL
               AND (expires_at IS NULL OR expires_at > @now)
               ${tier ? 'AND tier = @tier' : ''}
             ORDER BY created_at DESC, id ASC
             LIMIT @limit OFFSET @offset`,
          )
          .all({ now, limit, offset, ...(tier ? { tier } : {}) })
          .map((row) => toFactRow(row));
        // The SAME filters as the row query — deleted, expired and the active
        // tier — off the same `now`, so the count can never describe a corpus
        // the list is not a window onto.
        total = db
          .prepare(
            `SELECT COUNT(*) AS n FROM observations
             WHERE deleted_at IS NULL
               AND (expires_at IS NULL OR expires_at > @now)
               ${tier ? 'AND tier = @tier' : ''}`,
          )
          .get({ now, ...(tier ? { tier } : {}) }).n;
        // A plain stable ORDER BY pages to the last record — nothing to cap.
        reachable = total;
        // Browse reads the rows themselves, so the window IS what came back.
        served = rows.length;
      }
      return {
        status: 200,
        payload: {
          mode,
          query: q || null,
          tier,
          limit,
          clamped,
          offset,
          count: rows.length,
          total,
          reachable,
          // The pager's whole question, answered by the payload rather than
          // guessed by the page from `count === limit` (which is wrong exactly
          // once — on a corpus whose size is a multiple of the page size, where
          // it offers a Next that leads to an empty page). Computed from the
          // WINDOW, not from `count`, so a dropped orphan hit cannot end the
          // pager one page early.
          has_more: offset + served < reachable,
          facts: rows,
        },
      };
    });
  },

  /** One fact, in full: the body split back into headline/Why/How, its trust
   *  evidence, its dates, and its local edge neighborhood in both directions. */
  fact(route, ctx) {
    const id = route.id ?? '';
    if (!ID_PATTERN.test(id)) {
      throw new BadRequest('not a kit id — expected the [PUL]-XXXXXXXX shape');
    }
    return withDb(ctx, (db) => {
      let row = db.prepare(`SELECT ${ROW_COLUMNS} FROM observations WHERE id = ?`).get(id);
      // M2: named for WHERE THE ROW CAME FROM, not for what it means. The old
      // name (`superseded`) collided with the graph node's `superseded`, which
      // means something else entirely ("has a successor"). Renamed while the
      // API still has no consumers — later it would be a breaking change.
      let fromArchive = false;
      if (!row) {
        // A superseded fact was MOVED out of the live corpus, so it is not in
        // the index — but it is exactly what someone following a supersession
        // arrow clicked on. Read it from the archive rather than 404ing the
        // history the graph just drew.
        const archived = findSupersededFact(ctx, id);
        if (!archived) return { status: 404, payload: { found: false, id } };
        row = archived;
        fromArchive = true;
      }
      const rich = parseRichFactBody(row.body);
      // The depth-1 neighbourhood in BOTH directions and across ALL edge kinds
      // (related / link / cites / superseded_by) — the shared traversal, not a
      // second hand-written pair of queries.
      const hops = traverseLinks(db, id, { depth: 1, direction: 'both' });
      return {
        status: 200,
        payload: {
          found: true,
          fact: { ...toFactRow(row), body: row.body, headline: rich.headline, why: rich.why, how: rich.how, from_archive: fromArchive },
          edges: {
            out: hops
              .filter((e) => e.direction === 'out')
              .map((e) => ({ dst: e.to_id, type: e.type, resolved: e.dst_resolved === 1 })),
            in: hops
              .filter((e) => e.direction === 'in')
              .map((e) => ({ src: e.from_id, type: e.type })),
          },
          supersession: supersessionChain(db, id),
          ...actionsFor({ id, row, fromArchive }),
        },
      };
    });
  },

  /**
   * The kit-semantic graph (§24.1.4 iii): community is the colour, trust is the
   * rim arc, supersession is the direction, anchors are the hubs.
   *
   * `node_limit` budgets the LIVE facts (newest-first) — live meaning the same
   * population `/api/facts` lists: neither deleted nor expired. Three node
   * classes ride on top of it rather than inside it, each counted on its own so
   * the page can name it accurately: anchor hubs (the structure that makes a bounded slice
   * legible), dangling link targets (a reference to a fact that does not exist
   * — worth seeing, but not the same thing as a hub), and archived-superseded
   * predecessors (the direction the view exists to show — a supersession arrow
   * with no tail is not a supersession arrow). All three are naturally an order
   * of magnitude smaller than the fact corpus. Trigger to revisit: a project
   * where their sum approaches `node_limit` — then they need their own budgets
   * rather than an unbounded ride-along.
   *
   * Edges are filtered to pairs whose BOTH endpoints made the cut, so the page
   * never draws an arrow into nothing.
   */
  graph(route, ctx) {
    const { limit, clamped } = readLimit(route.params, { fallback: VIEWER_MAX_LIMIT });
    return withDb(ctx, (db) => {
      // ONE definition of "the corpus", shared with `/api/facts`: not deleted,
      // not expired — the population the page's search can actually reach.
      //
      // Both queries carried only `deleted_at IS NULL`, so on any corpus with an
      // expired fact the graph rail's 56px "facts on disk" figure exceeded the
      // facts view's 56px total by exactly the expired count — two different
      // corpus sizes for the same corpus, in the same type size, one page apart.
      // The COUNT and the node query take the filter off the same `now`: the
      // budget contract is `nodes(live facts) === fact_count` at cap, so
      // counting a population the graph does not draw would have replaced one
      // disagreement with another.
      const now = Date.now();
      const CORPUS = 'deleted_at IS NULL AND (expires_at IS NULL OR expires_at > @now)';
      const live = db
        .prepare(
          `SELECT id, tier, trust, trust_score, heading_path, created_at, superseded_by
             FROM observations WHERE ${CORPUS}
            ORDER BY created_at DESC, id ASC LIMIT @limit`,
        )
        .all({ now, limit });
      const total = db
        .prepare(`SELECT COUNT(*) AS n FROM observations WHERE ${CORPUS}`)
        .get({ now }).n;

      const nodes = new Map();
      for (const r of live) {
        nodes.set(r.id, {
          id: r.id,
          kind: 'fact',
          label: r.heading_path ?? r.id,
          tier: r.tier,
          trust: r.trust,
          trust_score: r.trust_score,
          created_at: r.created_at,
          // A fact can be superseded and STILL be in the live index (the
          // successor was written but the predecessor has not been archived
          // yet). Reading the flag off the row rather than off which loop
          // found it keeps the colour honest in that window.
          superseded: r.superseded_by != null,
        });
      }
      // The predecessors: history the live corpus no longer holds.
      let archivedCount = 0;
      for (const f of eachSupersededFact({ projectRoot: ctx.projectRoot, userDir: ctx.userDir })) {
        archivedCount += 1;
        nodes.set(f.id, {
          id: f.id,
          kind: 'fact',
          label: f.frontmatter.title ?? f.id,
          tier: f.tier,
          trust: f.frontmatter.trust ?? null,
          trust_score: null,
          created_at: f.frontmatter.created_at ?? null,
          superseded: true,
        });
      }

      const allEdges = db.prepare('SELECT src, dst, type, dst_resolved FROM edges ORDER BY src, dst, type').all();
      // Counted SEPARATELY, not lumped: an anchor hub is real structure the
      // corpus earned, a dangling node is a link pointing at a fact that does
      // not exist. Reporting them as one number let the page say "N doc
      // anchors" about a set that might be mostly broken links.
      let anchorCount = 0;
      let danglingCount = 0;
      const edges = [];
      for (const e of allEdges) {
        if (!nodes.has(e.src)) continue;
        if (!nodes.has(e.dst)) {
          // An unresolved dst is either an anchor hub (`anchor:D-414`,
          // `anchor:Task-232`) or a dangling slug someone linked before the
          // target existed. Both are real structure — promote them to nodes so
          // the hub-and-spoke shape the design asks for is visible.
          if (e.dst_resolved === 1) continue; // a resolved id that fell outside the slice
          const kind = e.dst.startsWith('anchor:') ? 'anchor' : 'dangling';
          nodes.set(e.dst, { id: e.dst, kind, label: e.dst, tier: null, trust: null, trust_score: null, created_at: null, superseded: false });
          if (kind === 'anchor') anchorCount += 1;
          else danglingCount += 1;
        }
        edges.push({ src: e.src, dst: e.dst, type: e.type, resolved: e.dst_resolved === 1 });
      }

      return {
        status: 200,
        payload: {
          node_limit: limit,
          clamped,
          truncated: total > limit,
          fact_count: total,
          archived_count: archivedCount,
          anchor_count: anchorCount,
          dangling_count: danglingCount,
          nodes: [...nodes.values()],
          edges,
        },
      };
    });
  },

  /**
   * Health, from the two sources that already own it — `runDoctor` for the
   * checks and `activeWarnings` for the 250 nudge evidence. Neither threshold
   * is re-derived here: if the strip and the whisper could disagree, the viewer
   * would be a second opinion about the user's own kit, which is worse than no
   * viewer at all.
   */
  async health(route, ctx) {
    const warnings = activeWarnings(ctx.projectRoot);
    const queues = pendingQueues(ctx);

    // `?strip=1` answers the PINNED LINE ONLY, and this split is load-bearing
    // rather than tidy: the strip is on every view, so a page navigation would
    // otherwise run the FULL doctor sweep — every HC, including a subprocess probe of the
    // user's agent CLI — just to draw one line. The strip's inputs (the health
    // log tail + two queue reads) are cheap file reads; the doctor is the
    // expensive part, and only the health VIEW actually needs it.
    //
    // The COST of that split is epistemic, and B1 is what it cost: without the
    // doctor this line cannot see an unregistered hook, so its positive wording
    // is bounded to what the log can actually prove (see buildStrip).
    if (route.params?.get('strip') === '1') {
      return {
        status: 200,
        payload: { strip: buildStrip(warnings, queues, null), active_warnings: warnings, queues },
      };
    }

    const checks = await runDoctor({
      projectRoot: ctx.projectRoot,
      userDir: ctx.userDir,
      ...ctx.doctorOptions,
    });
    const list = checks.checks ?? [];
    return {
      status: 200,
      payload: {
        checks: list.map((c) => ({
          id: c.id,
          name: c.name,
          status: c.status,
          message: c.message ?? null,
          recoveryCommand: c.recoveryCommand ?? null,
        })),
        fail_count: list.filter((c) => c.status === 'fail').length,
        warn_count: list.filter((c) => c.status === 'warn').length,
        duration_ms: checks.duration_ms ?? null,
        active_warnings: warnings,
        queues,
        // The full route HAS the doctor table, so the strip folds it in — the
        // exact information that was in scope and unused when B1 was filed.
        strip: buildStrip(warnings, queues, list),
      },
    };
  },

  /**
   * The append-only journal. A retracted or superseded entry stays visible and
   * flagged; that trail is the whole reason this view exists (§24.1.4 v).
   *
   * Task 269 gave it the two things a 2,502-entry journal needs to be usable:
   *
   *  - `?q=` — a substring search through `matchDecisionEntries`, the SAME
   *    matcher `cmk search --scope decisions` and `mk_search` run. The journal
   *    is not in the FTS index (it is a markdown file, not a fact), so this is
   *    the kit's one decisions backend, reused rather than re-rolled.
   *  - `?offset=` + `?order=` — paging, and the end of the journal to page from.
   *    `journal` (oldest→newest, the order the kit APPENDS in) stays the DEFAULT
   *    because it is the shipped contract and it is the chronological trail this
   *    view exists to show. But page 1 of a real journal in that order is the
   *    oldest 50 decisions, which is not what a reader asking "what did we
   *    decide" wants — so `newest` exists and the page requests it, matching the
   *    label the tab has always carried.
   */
  decisions(route, ctx) {
    const params = route.params;
    const { limit, clamped } = readLimit(params, { fallback: VIEWER_MAX_LIMIT });
    const offset = readOffset(params);
    const q = (params.get('q') ?? '').trim();
    const order = (params.get('order') ?? '') || 'journal';
    if (!DECISION_ORDERS.has(order)) {
      throw new BadRequest(`order must be one of journal, newest (got ${JSON.stringify(order)})`);
    }
    // O(journal) per request, deliberately: the file is parsed whole and the
    // match is a linear scan, so a page deep in a 2,502-entry journal costs the
    // same as page 1. That is a markdown file read at human pace, not a query
    // — and the alternative (indexing the journal) would put a second writer on
    // a derived store for a list one file read already answers. Revisit if a
    // journal ever reaches a size where the read itself is felt.
    const journal = readDecisionsJournal(ctx.projectRoot);
    // Filter FIRST, then order, then page — so `total` is the match set and the
    // pages partition it. (Reversing before filtering would give the same set;
    // reversing after paging would give a shuffled one.)
    const matched = matchDecisionEntries(journal, q).map((m) => m.entry);
    const ordered = order === 'newest' ? [...matched].reverse() : matched;
    const slice = ordered.slice(offset, offset + limit);
    return {
      status: 200,
      payload: {
        mode: q ? 'search' : 'journal',
        query: q || null,
        order,
        count: slice.length,
        total: matched.length,
        // The journal is a file read whole in memory, so every match is
        // reachable — unlike a ranked fact search, this has no depth cap.
        reachable: matched.length,
        limit,
        clamped,
        offset,
        has_more: offset + slice.length < matched.length,
        // Unchanged meaning: are there matching entries this response does not
        // carry. It was `all.length > slice.length` when the only reason to be
        // short was the cap; with paging and a query the same question is asked
        // of the match set.
        truncated: matched.length > slice.length,
        decisions: slice.map((d) => ({
          id: d.id,
          title: d.title,
          when: d.when,
          why: d.why,
          fact_id: d.factId,
          retracted: d.retracted,
          source_file: 'context/DECISIONS.md',
          source_line: d.sourceLine,
        })),
      },
    };
  },
};

/** The trust levels, weakest → strongest. Used to build the trust template. */
const TRUST_LEVELS = Object.freeze(['low', 'medium', 'high']);

/**
 * What the fact page offers to DO about a fact (§24.1 point 3's copy-the-command
 * answer to the delete-from-viewer demand) — and, just as importantly, when it
 * offers nothing.
 *
 * I1: an ARCHIVED-superseded fact is not in the live corpus, so `cmk forget` and
 * `cmk trust` against it are no-ops — three buttons that look actionable and do
 * nothing. It gets an honest state note instead. Commands render only where
 * they work.
 *
 * M8: on a LIVE fact the pasted text must be REAL as pasted. `cmk forget <id>`
 * alone stops at an interactive confirm, so the paste appeared to do nothing;
 * it now carries `--yes` — the human choosing to paste and run IS the
 * confirmation ADR-0018 asks for, and it happens in their own shell, not in a
 * click handler. The trust command was worse than useless: it echoed the
 * CURRENT level, so running it changed nothing. It is now an explicit
 * TEMPLATE — every level offered, the current one marked, each copy line a
 * command that would actually move the trust somewhere else.
 */
function actionsFor({ id, row, fromArchive }) {
  if (fromArchive) {
    return {
      commands: null,
      // Deliberately not `commands: {…}` with disabled entries: a null is
      // unambiguous to any consumer, including the page.
      state_note: {
        kind: 'archived',
        text: row.superseded_by
          ? `Archived record — superseded by ${row.superseded_by}. It is kept for history; no actions apply.`
          : 'Archived record — kept for history; no actions apply.',
        superseded_by: row.superseded_by ?? null,
      },
    };
  }
  const current = TRUST_LEVELS.includes(row.trust) ? row.trust : null;
  return {
    state_note: null,
    commands: {
      // `--yes` because a command that stops at a prompt is not what the button
      // promised. The paste is the confirmation.
      forget: `cmk forget ${id} --yes`,
      get: `cmk get ${id}`,
      // A single `trust` string cannot be both honest and useful here, so the
      // page gets the whole ladder and marks where the fact currently sits.
      trust_current: current,
      trust_options: TRUST_LEVELS.map((level) => ({
        level,
        current: level === current,
        command: `cmk trust ${id} ${level}`,
      })),
    },
  };
}

/**
 * How many items are waiting in the two human-decision queues, and whether
 * either read FAILED — see the note in the function body (M4).
 */
function pendingQueues(ctx) {
  // `unreadable` is NOT the same as zero, and collapsing them is how a strip
  // ends up cheerfully green over a queue it could not open (M4). A read that
  // throws is reported as such so the strip can say "I don't know" instead of
  // "nothing pending".
  const count = (fn) => {
    try {
      return fn({ tier: 'P', projectRoot: ctx.projectRoot, userDir: ctx.userDir }).length;
    } catch {
      return null;
    }
  };
  const conflicts = count(listConflictQueue);
  const review = count(listReviewQueue);
  return {
    conflicts: conflicts ?? 0,
    review: review ?? 0,
    unreadable: conflicts === null || review === null,
  };
}

/**
 * The pinned one-line strip (§24.1 point 4i + point 8).
 *
 * B1 — WHAT THIS LINE IS ALLOWED TO CLAIM. The strip originally read its whole
 * verdict from the health LOG, and then said "capture, recall and the index are
 * all reporting fine." Those are different statements. The health log records
 * failures of things that RAN; a hook that was never registered never runs and
 * therefore never logs, so an unwired kit produces a silent log — and the strip
 * printed a green all-clear directly above a doctor table with a red HC-1. That
 * is the HC-10 false-green class, on the most prominent line in the UI.
 *
 * The rule now: the strip never claims more than its inputs support.
 *   - Given doctor results (the full route), a FAIL outranks everything and the
 *     line names the failing checks; a WARN-only table reads amber.
 *   - Without them (`?strip=1`, the cheap per-view read), the positive case is
 *     worded as the bounded thing it actually knows: "no failures recorded"
 *     plus "(quick check)" — never "everything is fine".
 *
 * Precedence below that is deliberate: an active failure outranks a full queue,
 * because a broken kit is losing memory while a queue is only waiting on the
 * human. The queue line is §24.1 point 8's stated answer to "no conflict-queue
 * UI in wave 1" — the strip carries the COUNT and names the CLI verb that
 * resolves it, so a pending decision is never invisible.
 *
 * @param {Array} warnings   activeWarnings() — the health-log verdict
 * @param {object} queues    pendingQueues()
 * @param {Array|null} checks  doctor checks when the caller has them, else null
 */
function buildStrip(warnings, queues, checks = null) {
  const base = { code: null, severity: null, action: null, queues };

  // 1. Doctor FAIL — the loudest thing the viewer can know, and the case that
  //    used to be invisible here entirely.
  if (Array.isArray(checks)) {
    const failed = checks.filter((c) => c.status === 'fail');
    if (failed.length) {
      return {
        ...base,
        state: 'warn',
        severity: 'memory-off',
        text: `${failed.length} health check(s) FAILING: ${failed.map((c) => c.id).join(', ')}`,
        action: 'cmk doctor',
      };
    }
  }

  // 2. An active health-log warning.
  if (warnings.length) {
    const w = warnings[0];
    return { ...base, state: 'warn', text: w.title, action: w.primaryAction, code: w.code, severity: w.severity };
  }

  // 3. Doctor WARN — real, but advisory.
  if (Array.isArray(checks)) {
    const warned = checks.filter((c) => c.status === 'warn');
    if (warned.length) {
      return {
        ...base,
        state: 'warn',
        severity: 'advisory',
        text: `${warned.length} health check(s) warning: ${warned.map((c) => c.id).join(', ')}`,
        action: 'cmk doctor',
      };
    }
  }

  // 4. A queue the viewer could not read is an unknown, not an all-clear (M4).
  if (queues.unreadable) {
    return {
      ...base,
      state: 'warn',
      severity: 'advisory',
      text: 'a decision queue could not be read — its pending count is unknown',
      action: 'cmk doctor',
    };
  }

  // 5. Real pending work.
  const pending = [];
  if (queues.conflicts > 0) pending.push(`${queues.conflicts} conflict(s)`);
  if (queues.review > 0) pending.push(`${queues.review} item(s) awaiting review`);
  if (pending.length) {
    return {
      ...base,
      state: 'queued',
      severity: 'advisory',
      text: `${pending.join(' and ')} waiting on you`,
      action: queues.conflicts > 0 ? 'cmk queue conflicts' : 'cmk queue review',
    };
  }

  // 6. Nothing known to be wrong — worded to the evidence actually in hand.
  return Array.isArray(checks)
    ? { ...base, state: 'ok', text: `all ${checks.length} health checks passing` }
    : { ...base, state: 'ok', text: 'no failures recorded (quick check)' };
}

/** Full rows for a set of ids, order-independent (the caller re-orders). */
function hydrate(db, ids) {
  if (ids.length === 0) return [];
  const holes = ids.map(() => '?').join(',');
  return db.prepare(`SELECT ${ROW_COLUMNS} FROM observations WHERE id IN (${holes})`).all(...ids);
}

/**
 * A fact file's path as the observations table would record it: relative to the
 * USER dir for the U tier, to the project root otherwise. Mirrors
 * `index-rebuild.relativeSource` so archived and live rows carry the same shape.
 */
function relativeFactPath(absPath, tier, ctx) {
  const base = tier === 'U' ? ctx.userDir : ctx.projectRoot;
  if (!base) return absPath.replaceAll('\\', '/');
  return relative(base, absPath).replaceAll('\\', '/');
}

/** Look up one archived-superseded fact, shaped like an observations row. */
function findSupersededFact(ctx, id) {
  for (const f of eachSupersededFact({ projectRoot: ctx.projectRoot, userDir: ctx.userDir })) {
    if (f.id !== id) continue;
    const fm = f.frontmatter;
    return {
      id: f.id,
      tier: f.tier,
      trust: fm.trust ?? null,
      trust_score: null,
      signal_count: null,
      write_source: fm.write_source ?? null,
      heading_path: fm.title ?? null,
      body: f.body,
      // M1: formed by the SAME rule the indexer uses for a live row
      // (`relativeSource` — relative to the user dir for U, to the project root
      // for P/L), so an archived fact's location reads
      // `context/memory/archive/superseded/<id>.md` rather than a bare
      // `memory/...` that silently dropped the tier's own prefix and could not
      // be pasted anywhere useful.
      source_file: relativeFactPath(f.path, f.tier, ctx),
      source_line: 1,
      created_at: fm.created_at ? Date.parse(fm.created_at) : null,
      expires_at: null,
      superseded_by: fm.superseded_by ?? null,
      deleted_at: null,
    };
  }
  return null;
}
