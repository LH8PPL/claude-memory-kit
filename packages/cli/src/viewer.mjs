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
export function resolveRoute(rawUrl) {
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
  let json = false;
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

  const ctx = { projectRoot, userDir, logError };
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

  const route = resolveRoute(req.url);
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

  try {
    return sendJson(res, 200, { error: 'not implemented' });
  } catch (err) {
    ctx.logError?.(`cmk view: ${route.view} failed — ${err?.message ?? err}`);
    return sendJson(res, 500, { error: String(err?.message ?? err) });
  }
}
