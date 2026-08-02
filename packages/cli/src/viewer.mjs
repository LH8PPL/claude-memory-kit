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
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { errorResult, ERROR_CATEGORIES } from './result-shapes.mjs';
import { openBrowserCommand } from './platform-commands.mjs';
import { openIndexDb } from './index-db.mjs';
import { reindexBoot } from './index-rebuild.mjs';
import { search as searchAction, SEARCH_MODES } from './search.mjs';
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

/** Media types, spelled once. */
const HTML = 'text/html; charset=utf-8';
const JSON_TYPE = 'application/json; charset=utf-8';

/**
 * A read-only, loopback-only, offline page: no external origin is reachable at
 * all, so a stray CDN link in the HTML fails loudly in the browser console
 * instead of silently working on the author's machine and breaking on a plane.
 * `script-src 'unsafe-inline'` (with no host source) is exactly "inline only".
 */
const CSP =
  "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; " +
  "img-src data:; connect-src 'self'; base-uri 'none'; form-action 'none'";

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
      if (err instanceof BadRequest) {
        return sendJson(res, 400, { view: route.view, error: err.message });
      }
      ctx.logError?.(`cmk view: ${route.view} failed — ${err?.message ?? err}`);
      // The message only — a stack in a browser tab helps nobody and can name
      // paths the page has no business showing.
      return sendJson(res, 500, { view: route.view, error: String(err?.message ?? err) });
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
      ctx.logError?.(`cmk view: index refresh failed (${err?.message ?? err}); serving the existing index.`);
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

/** The shape every fact row is rendered in, on every route. One place. */
function toFactRow(row, { snippet, now } = {}) {
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
    const tier = readTier(params);
    const q = (params.get('q') ?? '').trim();

    return withDb(ctx, (db) => {
      let rows;
      let mode;
      if (q) {
        mode = 'search';
        const r = searchAction({
          db,
          query: q,
          mode: SEARCH_MODES.KEYWORD,
          scope: 'facts',
          limit,
          ...(tier ? { tier } : {}),
        });
        if (r.action === 'error') throw new BadRequest((r.errors ?? ['search failed']).join('; '));
        // Re-read the full rows so a search hit and a browse row are the SAME
        // shape on the wire — the page must not have two renderers.
        const byId = new Map(hydrate(db, r.results.map((h) => h.id)).map((x) => [x.id, x]));
        rows = r.results
          .filter((h) => byId.has(h.id))
          .map((h) => toFactRow(byId.get(h.id), { snippet: flatten(h.snippet, 240) }));
      } else {
        mode = 'recent';
        rows = db
          .prepare(
            `SELECT ${ROW_COLUMNS} FROM observations
             WHERE deleted_at IS NULL
               AND (expires_at IS NULL OR expires_at > @now)
               ${tier ? 'AND tier = @tier' : ''}
             ORDER BY created_at DESC, id ASC
             LIMIT @limit`,
          )
          .all({ now: Date.now(), limit, ...(tier ? { tier } : {}) })
          .map((row) => toFactRow(row));
      }
      return {
        status: 200,
        payload: { mode, query: q || null, tier, limit, clamped, count: rows.length, facts: rows },
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
      let superseded = false;
      if (!row) {
        // A superseded fact was MOVED out of the live corpus, so it is not in
        // the index — but it is exactly what someone following a supersession
        // arrow clicked on. Read it from the archive rather than 404ing the
        // history the graph just drew.
        const archived = findSupersededFact(ctx, id);
        if (!archived) return { status: 404, payload: { found: false, id } };
        row = archived;
        superseded = true;
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
          fact: { ...toFactRow(row), body: row.body, headline: rich.headline, why: rich.why, how: rich.how, superseded },
          edges: {
            out: hops
              .filter((e) => e.direction === 'out')
              .map((e) => ({ dst: e.to_id, type: e.type, resolved: e.dst_resolved === 1 })),
            in: hops
              .filter((e) => e.direction === 'in')
              .map((e) => ({ src: e.from_id, type: e.type })),
          },
          supersession: supersessionChain(db, id),
          // §24.1.3 — the read-only answer to "let me delete it from here".
          commands: {
            forget: `cmk forget ${id}`,
            trust: `cmk trust ${id} ${row.trust ?? 'high'}`,
            get: `cmk get ${id}`,
          },
        },
      };
    });
  },

  /**
   * The kit-semantic graph (§24.1.4 iii): trust is the colour, supersession is
   * the direction, anchors are the hubs.
   *
   * `node_limit` budgets the LIVE facts (newest-first). Two node classes ride
   * on top of it rather than inside it, and the counts are reported separately
   * so the page can say so: anchor hubs (the structure that makes a bounded
   * slice legible) and archived-superseded predecessors (the direction the view
   * exists to show — a supersession arrow with no tail is not a supersession
   * arrow). Both are naturally an order of magnitude smaller than the fact
   * corpus. Trigger to revisit: a project where `archived_count + anchor_count`
   * approaches `node_limit` — then they need their own budgets, not a shared one.
   *
   * Edges are filtered to pairs whose BOTH endpoints made the cut, so the page
   * never draws an arrow into nothing.
   */
  graph(route, ctx) {
    const { limit, clamped } = readLimit(route.params, { fallback: VIEWER_MAX_LIMIT });
    return withDb(ctx, (db) => {
      const live = db
        .prepare(
          `SELECT id, tier, trust, trust_score, heading_path, created_at, superseded_by
             FROM observations WHERE deleted_at IS NULL
            ORDER BY created_at DESC, id ASC LIMIT @limit`,
        )
        .all({ limit });
      const total = db
        .prepare('SELECT COUNT(*) AS n FROM observations WHERE deleted_at IS NULL')
        .get().n;

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
          superseded: false,
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
      let anchorCount = 0;
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
          anchorCount += 1;
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
    const strip = buildStrip(warnings, queues);

    // `?strip=1` answers the PINNED LINE ONLY, and this split is load-bearing
    // rather than tidy: the strip is on every view, so a page navigation would
    // otherwise run all 14 doctor checks — including a subprocess probe of the
    // user's agent CLI — just to draw one line. The strip's inputs (the health
    // log tail + two queue reads) are cheap file reads; the doctor is the
    // expensive part, and only the health VIEW actually needs it.
    if (route.params?.get('strip') === '1') {
      return { status: 200, payload: { strip, active_warnings: warnings, queues } };
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
        strip,
      },
    };
  },

  /** The append-only journal, in journal order — which IS the chronology. A
   *  retracted or superseded entry stays visible and flagged; that trail is the
   *  whole reason this view exists (§24.1.4 v). */
  decisions(route, ctx) {
    const { limit, clamped } = readLimit(route.params, { fallback: VIEWER_MAX_LIMIT });
    const all = readDecisionsJournal(ctx.projectRoot);
    const slice = all.slice(0, limit);
    return {
      status: 200,
      payload: {
        count: slice.length,
        total: all.length,
        limit,
        clamped,
        truncated: all.length > slice.length,
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

/**
 * How many items are waiting in the two human-decision queues. Best-effort —
 * an unreadable queue reads as zero rather than failing the health view.
 */
function pendingQueues(ctx) {
  const count = (fn) => {
    try {
      return fn({ tier: 'P', projectRoot: ctx.projectRoot, userDir: ctx.userDir }).length;
    } catch {
      return 0;
    }
  };
  return { conflicts: count(listConflictQueue), review: count(listReviewQueue) };
}

/**
 * The pinned one-line strip (§24.1 point 4i + point 8).
 *
 * Precedence is deliberate: an ACTIVE FAILURE outranks a full queue, because a
 * broken kit is losing memory while a queue is only waiting on the human. The
 * queue line is §24.1 point 8's stated answer to "no conflict-queue UI in wave
 * 1" — the strip carries the COUNT and names the CLI verb that resolves it, so
 * a pending decision is never invisible just because its screen was deferred.
 */
function buildStrip(warnings, queues) {
  if (warnings.length) {
    const w = warnings[0];
    return { state: 'warn', text: w.title, action: w.primaryAction, code: w.code, severity: w.severity, queues };
  }
  const pending = [];
  if (queues.conflicts > 0) pending.push(`${queues.conflicts} conflict(s)`);
  if (queues.review > 0) pending.push(`${queues.review} item(s) awaiting review`);
  if (pending.length) {
    return {
      state: 'queued',
      text: `memory is healthy — ${pending.join(' and ')} waiting on you`,
      action: queues.conflicts > 0 ? 'cmk queue conflicts' : 'cmk queue review',
      code: null,
      severity: 'advisory',
      queues,
    };
  }
  return {
    state: 'ok',
    text: 'memory is healthy — capture, recall and the index are all reporting fine.',
    action: null,
    code: null,
    severity: null,
    queues,
  };
}

/** Full rows for a set of ids, order-independent (the caller re-orders). */
function hydrate(db, ids) {
  if (ids.length === 0) return [];
  const holes = ids.map(() => '?').join(',');
  return db.prepare(`SELECT ${ROW_COLUMNS} FROM observations WHERE id IN (${holes})`).all(...ids);
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
      source_file: `memory/archive/superseded/${f.filename}`,
      source_line: 1,
      created_at: fm.created_at ? Date.parse(fm.created_at) : null,
      expires_at: null,
      superseded_by: fm.superseded_by ?? null,
      deleted_at: null,
    };
  }
  return null;
}
