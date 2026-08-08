// @doors: 1, 2, 3
// Door 4 N/A: no message-queue surface.
// Door 5 N/A: the viewer writes NO kit log at all — the ABSENCE is the contract
//   (design §24.1.3, structurally read-only), so it is ASSERTED rather than
//   waived. In particular a viewer search must not append to `.locks/recall.log`
//   (browse traffic there would corrupt the Task-233/ADR-0024 skill fire-rate
//   measurement). The "no log written / tier unchanged" assertions below are
//   Door 5 in its negative form.
//
// Task 255 — `cmk view`, the kit's read-only memory viewer (design §24, D-414).
//
// Boundary under test: viewer.mjs's ONE public entry —
//   startViewer({projectRoot, userDir, host, port, open, …})
//     → {action:'listening', url, host, port, close} | errorResult
// exercised the way a user exercises it: over REAL HTTP against the real
// server on an ephemeral port. Nothing here reaches into internal helpers.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  mkdtempSync,
  mkdirSync,
  rmSync,
  existsSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { request as httpRequest, Agent as HttpAgent } from 'node:http';
import { install } from '../packages/cli/src/install.mjs';
import { writeFact } from '../packages/cli/src/write-fact.mjs';
import { appendHealthEntry, activeWarnings, HEALTH_CODES } from '../packages/cli/src/health-log.mjs';
import { writeConflictEntry } from '../packages/cli/src/conflict-queue.mjs';
import {
  startViewer,
  LOOPBACK_HOSTS,
  VIEWER_DEFAULT_LIMIT,
  VIEWER_MAX_LIMIT,
} from '../packages/cli/src/viewer.mjs';
import { subcommands, runView } from '../packages/cli/src/subcommands.mjs';

let sandbox, projectRoot, userDir, server;

async function boot(opts = {}) {
  const r = await startViewer({
    projectRoot,
    userDir,
    open: false,
    log: () => {},
    logError: () => {},
    ...opts,
  });
  if (r.action === 'listening') server = r;
  return r;
}

beforeEach(async () => {
  sandbox = mkdtempSync(join(tmpdir(), 'cmk-viewer-'));
  projectRoot = join(sandbox, 'proj');
  userDir = join(sandbox, 'user');
  await install({ projectRoot, userTier: userDir });
});

afterEach(async () => {
  if (server) await server.close();
  server = null;
  rmSync(sandbox, { recursive: true, force: true });
});

describe('viewer — server core (255.1)', () => {
  it('binds loopback on a free port and serves the page (Door 1 + Door 2)', async () => {
    const r = await boot();
    expect(r.action).toBe('listening');
    expect(r.host).toBe('127.0.0.1');
    expect(r.port).toBeGreaterThan(0);
    expect(r.url).toBe(`http://127.0.0.1:${r.port}/`);

    const res = await fetch(r.url);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toMatch(/text\/html/);
    const html = await res.text();
    expect(html).toContain('<!doctype html>');
  });

  it('a non-loopback --host is REFUSED with a stated reason, and nothing binds', async () => {
    for (const host of ['0.0.0.0', '192.168.1.20', '::', 'example.com']) {
      const r = await boot({ host });
      expect(r.action).toBe('error');
      expect(r.errorCategory).toBe('schema');
      expect(r.errors.join(' ')).toMatch(/loopback/i);
      // The refusal must NAME the reason (no auth mode exists) rather than
      // just rejecting — the hermes hardening borrow (research §3).
      expect(r.errors.join(' ')).toMatch(/no authentication|no auth/i);
      expect(r.url).toBeUndefined();
    }
  });

  it('accepts every loopback spelling', async () => {
    for (const host of [...LOOPBACK_HOSTS]) {
      const r = await boot({ host });
      expect(r.action).toBe('listening');
      await server.close();
      server = null;
    }
  });

  it('an uninstalled project explains and exits — and NEVER scaffolds', async () => {
    const bare = join(sandbox, 'bare');
    const r = await startViewer({
      projectRoot: bare,
      userDir,
      open: false,
      log: () => {},
      logError: () => {},
    });
    expect(r.action).toBe('error');
    expect(r.errorCategory).toBe('not-found');
    expect(r.errors.join(' ')).toMatch(/cmk install/);
    // The 250 no-scaffold guard class: a read verb must not create the tier.
    expect(existsSync(join(bare, 'context'))).toBe(false);
    expect(existsSync(bare)).toBe(false);
  });

  it('an explicit --port is honored; two viewers get different free ports', async () => {
    const a = await boot();
    const first = a.port;
    const b = await startViewer({
      projectRoot,
      userDir,
      open: false,
      log: () => {},
      logError: () => {},
    });
    expect(b.action).toBe('listening');
    expect(b.port).not.toBe(first);
    const pinned = b.port;
    await b.close();

    const c = await startViewer({
      projectRoot,
      userDir,
      port: pinned,
      open: false,
      log: () => {},
      logError: () => {},
    });
    expect(c.action).toBe('listening');
    expect(c.port).toBe(pinned);
    await c.close();
  });

  it('a port already in use fails with a stated error, not a stack (Door 1)', async () => {
    const a = await boot();
    const r = await startViewer({
      projectRoot,
      userDir,
      port: a.port,
      open: false,
      log: () => {},
      logError: () => {},
    });
    expect(r.action).toBe('error');
    expect(r.errors.join(' ')).toMatch(/in use|EADDRINUSE/i);
  });

  it('Door 3 — the browser is opened via the platform helper, and --no-open suppresses it', async () => {
    const calls = [];
    const spy = (url) => calls.push(url);

    await boot({ open: false, openBrowser: spy });
    expect(calls).toEqual([]);
    await server.close();
    server = null;

    const r = await boot({ open: true, openBrowser: spy });
    expect(calls).toEqual([r.url]);
  });

  it('the URL is printed even when the browser opens (the fallback contract)', async () => {
    const lines = [];
    const r = await boot({ open: true, openBrowser: () => {}, log: (s) => lines.push(String(s)) });
    expect(lines.join('\n')).toContain(r.url);
  });

  it('close() releases the port and is idempotent', async () => {
    const r = await boot();
    await r.close();
    await r.close();
    await expect(fetch(r.url)).rejects.toThrow();
    server = null;
  });

  it('close() does not hang on a keep-alive connection (a browser holds one open)', async () => {
    const r = await boot();
    // A real browser keeps its socket open between requests. `server.close()`
    // alone waits for those sockets, so Ctrl-C with the tab still open would
    // never return — a viewer you cannot stop.
    const agent = new HttpAgent({ keepAlive: true });
    await new Promise((resolve, reject) => {
      const req = httpRequest({ ...urlParts(r.url), agent }, (res) => {
        res.resume();
        res.on('end', resolve);
      });
      req.on('error', reject);
      req.end();
    });
    const closed = await Promise.race([
      r.close().then(() => 'closed'),
      new Promise((res) => setTimeout(() => res('HUNG'), 4000)),
    ]);
    agent.destroy();
    expect(closed).toBe('closed');
    server = null;
  });

  it('starting the viewer mutates nothing under context/ (read-only, Door 2)', async () => {
    const before = snapshotTier(projectRoot);
    const r = await boot();
    await fetch(r.url);
    const after = snapshotTier(projectRoot);
    // `.index/` is the rebuildable cache the read path refreshes (same as every
    // other read verb); everything else in the tier must be byte-identical.
    expect(after.filter((p) => !p.includes('.index'))).toEqual(
      before.filter((p) => !p.includes('.index')),
    );
  });
});

// --- The corpus the route tests browse ------------------------------------
//
// Real ids from fixtures/canonicalize-vectors.json's alphabet, re-prefixed per
// tier so the P/L/U badging is provable rather than assumed.
const P_ALPHA = 'P-2DZG7XF4'; // cites [[bravo]] + anchor D-414; the FTS target
const P_BRAVO = 'P-34GZDKAW';
const L_LOCAL = 'L-56UXMRD6';
const U_HABIT = 'U-D6YL7RBC';
const P_OLD = 'P-GDZU5542'; // superseded BY P_NEW (archived)
const P_NEW = 'P-NJD6HT3P';

function seedFact({ id, tier, slug, body, related, root, expiresAt }) {
  const r = writeFact({
    ...(expiresAt ? { expiresAt } : {}),
    projectRoot,
    userDir,
    tier,
    type: 'feedback',
    slug,
    title: slug,
    body,
    writeSource: 'user-explicit',
    trust: tier === 'U' ? 'medium' : 'high',
    sourceFile: 'MEMORY.md',
    sourceLine: 1,
    sourceSha1: 'a'.repeat(40),
    id,
    related,
  });
  if (r.action === 'error') throw new Error(`seedFact ${slug}: ${(r.errors ?? []).join('; ')}`);
  void root;
  return r.path;
}

function seedCorpus() {
  seedFact({
    id: P_ALPHA,
    tier: 'P',
    slug: 'alpha',
    body:
      'The quicksort pivot rule we settled on.\n\n' +
      '**Why:** because the naive midpoint degraded on sorted input.\n' +
      '**How to apply:** pick the median of three.\n\n' +
      'See [[bravo]] and D-414.',
    related: ['bravo'],
  });
  // Two distinct citers: graph-index's MIN_ANCHOR_CITERS floor means a doc
  // anchor cited by only ONE fact forms no hub and gets no edge (design §9.5.1).
  seedFact({ id: P_BRAVO, tier: 'P', slug: 'bravo', body: 'The bravo fact body, also per D-414.' });
  seedFact({ id: L_LOCAL, tier: 'L', slug: 'local-thing', body: 'A machine-local note.' });
  seedFact({ id: U_HABIT, tier: 'U', slug: 'habit', body: 'A cross-project habit.' });
  seedFact({ id: P_NEW, tier: 'P', slug: 'ver2', body: 'The current version of the rule.' });

  // A superseded predecessor lives in the archive (that is where the kit MOVES
  // it), so the graph's supersession direction has a real edge to draw.
  const arch = join(projectRoot, 'context', 'memory', 'archive', 'superseded');
  mkdirSync(arch, { recursive: true });
  writeFileSync(
    join(arch, `${P_OLD}.md`),
    [
      '---',
      `id: ${P_OLD}`,
      'type: feedback',
      'title: ver1',
      'created_at: 2026-06-23T17:26:37Z',
      'write_source: user-explicit',
      'trust: high',
      'source_file: user-explicit',
      'source_line: 1',
      `source_sha1: ${'a'.repeat(64)}`,
      `superseded_by: ${P_NEW}`,
      '---',
      '',
      'The superseded version of the rule.',
      '',
    ].join('\n'),
    'utf8',
  );
}

function seedDecisions() {
  writeFileSync(
    join(projectRoot, 'context', 'DECISIONS.md'),
    [
      '# Decisions',
      '',
      `<!-- decision:${P_ALPHA} -->`,
      '',
      '## Use median-of-three pivots',
      '',
      `**When:** 2026-07-01 · **Fact:** \`${P_ALPHA}\``,
      '**Why:** the naive midpoint degraded on sorted input',
      '',
      `<!-- decision:${P_BRAVO} -->`,
      '',
      '## Drop the bravo experiment',
      '_(retracted 2026-07-14)_',
      '',
      `**When:** 2026-07-02 · **Fact:** \`${P_BRAVO}\``,
      '**Why:** superseded by the median rule',
      '',
    ].join('\n'),
    'utf8',
  );
}

/**
 * A RAW http request — `fetch`/undici refuses to send a `Host` override and
 * refuses the `TRACE` method outright, and both are exactly what the
 * rebinding-guard and read-only tests need to send.
 */
function raw(base, path, { method = 'GET', headers = {} } = {}) {
  const u = new URL(path, base);
  return new Promise((resolve, reject) => {
    const req = httpRequest(
      { host: u.hostname, port: u.port, path: u.pathname + u.search, method, headers },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
      },
    );
    req.on('error', reject);
    req.end();
  });
}

/** Split a viewer URL into the node:http request fields. */
function urlParts(url, path = '/') {
  const u = new URL(path, url);
  return { host: u.hostname, port: u.port, path: u.pathname + u.search };
}

/** GET a JSON route and return {status, body}. */
async function getJson(base, path, init) {
  const res = await fetch(new URL(path, base), init);
  const text = await res.text();
  let body = null;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { status: res.status, headers: res.headers, body };
}

// The doctor's backend-CLI probe spawns the user's agent binary. Production
// keeps that (the viewer's /api/health must say exactly what `cmk doctor`
// says); the tests stub it so the suite never depends on what is installed.
//
// It reports PRESENT so the baseline sandbox is doctor-clean — otherwise every
// route test would sit permanently behind an HC-11 failure and the B1 tests
// below could not tell a seeded failure from the fixture's own noise.
const STUB_DOCTOR = {
  backendCliProbe: () => ({ present: true, bin: 'claude', agent: 'claude' }),
};

describe('viewer — JSON API routes (255.2)', () => {
  let base;
  beforeEach(async () => {
    seedCorpus();
    seedDecisions();
    const r = await boot({ doctorOptions: STUB_DOCTOR });
    base = r.url;
  });

  it('/api/facts lists newest-first across ALL THREE tiers, badged (§24.1.5)', async () => {
    const { status, body } = await getJson(base, '/api/facts');
    expect(status).toBe(200);
    expect(body.view).toBe('facts');
    expect(body.mode).toBe('recent');
    expect(body.query).toBeNull();
    expect(typeof body.generated_at).toBe('string');
    expect(body.count).toBe(body.facts.length);
    // The corpus denominator rides on the SAME payload as the rows (I3/I4):
    // the page's 56px hero used to come from `/api/graph`'s `fact_count`, which
    // counts a DIFFERENT population (no expiry filter) and cost a whole second
    // route — COUNT + edges + an archive walk — to paint one headline.
    expect(typeof body.total).toBe('number');
    expect(body.total).toBeGreaterThanOrEqual(body.count);

    const byId = new Map(body.facts.map((f) => [f.id, f]));
    expect(byId.get(P_ALPHA).tier).toBe('P');
    expect(byId.get(L_LOCAL).tier).toBe('L');
    expect(byId.get(U_HABIT).tier).toBe('U');
    // The badges the landing page renders must all be present on every row.
    for (const f of body.facts) {
      expect(f).toHaveProperty('trust');
      expect(f).toHaveProperty('created_at');
      expect(f).toHaveProperty('source_file');
      expect(f).toHaveProperty('title');
    }
    // Newest-first.
    const dates = body.facts.map((f) => f.created_at);
    expect([...dates].sort((a, b) => b - a)).toEqual(dates);
  });

  it('/api/facts?q= runs the FTS search (the landing feature the 89k★ precedent lacks)', async () => {
    const { body } = await getJson(base, '/api/facts?q=quicksort');
    expect(body.mode).toBe('search');
    expect(body.query).toBe('quicksort');
    expect(body.facts.map((f) => f.id)).toContain(P_ALPHA);
    expect(body.facts.map((f) => f.id)).not.toContain(L_LOCAL);

    expect(body.total).toBeGreaterThanOrEqual(body.count);

    const none = await getJson(base, '/api/facts?q=zzzznotpresent');
    expect(none.body.count).toBe(0);
    expect(none.body.facts).toEqual([]);
    expect(none.body.total).toBe(0);
  });

  it('I3/I4 — `total` is the FULL population in both modes, so the hero is honest', async () => {
    // The redesign promoted a number to 56px type, and it was the wrong one:
    // browse read `/api/graph`'s `fact_count` (a different filter set, a whole
    // extra route per page-load) and SEARCH showed `count` — the rows returned
    // — so a 500-hit query rendered "50 matches" as the biggest thing on
    // screen. `total` counts the same population the rows come from, unlimited;
    // `count` stays the rows on the wire.
    const browse = await getJson(base, '/api/facts?limit=2');
    expect(browse.body.count).toBe(2);
    expect(browse.body.total).toBeGreaterThan(browse.body.count);
    // …and it is the whole live corpus, not the page.
    const all = await getJson(base, '/api/facts');
    expect(browse.body.total).toBe(all.body.count);

    // The tier filter narrows the denominator too — a filtered list under an
    // unfiltered headline is the same lie one level down.
    const tiered = await getJson(base, '/api/facts?tier=P&limit=1');
    const tieredAll = await getJson(base, '/api/facts?tier=P');
    expect(tiered.body.count).toBe(1);
    expect(tiered.body.total).toBe(tieredAll.body.count);
    expect(tiered.body.total).toBeLessThan(all.body.count);

    // SEARCH: seed more matches than the limit asks for, and the total must
    // reach past the limit rather than reporting the page size.
    for (const [i, id] of ['P-2FGHJKMN', 'P-3PQRSTVW', 'P-4XYZ2345', 'P-5679ABCD'].entries()) {
      seedFact({ id, tier: 'P', slug: `zebrafish-${i}`, body: `A zebrafish note number ${i}.` });
    }
    const hits = await getJson(base, '/api/facts?q=zebrafish&limit=2');
    expect(hits.body.mode).toBe('search');
    expect(hits.body.count).toBe(2);
    expect(hits.body.total).toBe(4);
    expect(hits.body.total).toBeGreaterThan(hits.body.count);
  });

  it('/api/facts?tier= filters to one tier, in both modes', async () => {
    const recent = await getJson(base, '/api/facts?tier=L');
    expect(recent.body.tier).toBe('L');
    expect(recent.body.facts.map((f) => f.id)).toEqual([L_LOCAL]);

    const searched = await getJson(base, '/api/facts?q=fact&tier=P');
    expect(searched.body.facts.every((f) => f.tier === 'P')).toBe(true);

    const bogus = await getJson(base, '/api/facts?tier=Z');
    expect(bogus.status).toBe(400);
    expect(String(bogus.body.error)).toMatch(/tier/i);
  });

  it('the facts budget: AT-CAP limit is honored, OVER-CAP clamps and says so', async () => {
    const atCap = await getJson(base, `/api/facts?limit=${VIEWER_MAX_LIMIT}`);
    expect(atCap.status).toBe(200);
    expect(atCap.body.limit).toBe(VIEWER_MAX_LIMIT);
    expect(atCap.body.clamped).toBe(false);

    const overCap = await getJson(base, `/api/facts?limit=${VIEWER_MAX_LIMIT + 1}`);
    expect(overCap.status).toBe(200);
    expect(overCap.body.limit).toBe(VIEWER_MAX_LIMIT);
    expect(overCap.body.clamped).toBe(true);

    const dflt = await getJson(base, '/api/facts');
    expect(dflt.body.limit).toBe(VIEWER_DEFAULT_LIMIT);

    const one = await getJson(base, '/api/facts?limit=1');
    expect(one.body.facts).toHaveLength(1);

    for (const bad of ['0', '-3', 'abc']) {
      const r = await getJson(base, `/api/facts?limit=${bad}`);
      expect(r.status).toBe(400);
    }
  });

  it('/api/fact/:id returns the body, Why/How, trust, source, dates and edges', async () => {
    const { status, body } = await getJson(base, `/api/fact/${P_ALPHA}`);
    expect(status).toBe(200);
    expect(body.view).toBe('fact');
    expect(body.found).toBe(true);
    const f = body.fact;
    expect(f.id).toBe(P_ALPHA);
    expect(f.tier).toBe('P');
    expect(f.trust).toBe('high');
    expect(typeof f.trust_score).toBe('number');
    expect(f.write_source).toBe('user-explicit');
    expect(f.source_file).toMatch(/alpha\.md$/);
    expect(f.created_at).toBeTruthy();
    expect(f.body).toContain('quicksort');
    expect(f.why).toMatch(/naive midpoint/);
    expect(f.how).toMatch(/median of three/);

    // The local neighborhood the design asks for (§24.1.4 ii).
    const outDsts = body.edges.out.map((e) => e.dst);
    expect(outDsts).toContain(P_BRAVO); // related: + [[bravo]] both resolve
    expect(body.edges.out.some((e) => e.type === 'cites' && e.dst === 'anchor:D-414')).toBe(true);
    expect(Array.isArray(body.edges.in)).toBe(true);

    // M8 — the answer to the field's #1 delete-from-viewer demand (§24.1.3)
    // has to be REAL AS PASTED. A bare `cmk forget <id>` stops at an
    // interactive confirm, so the paste appeared to do nothing; the human
    // choosing to paste and run in their own shell IS the ADR-0018 confirmation.
    expect(body.commands.forget).toBe(`cmk forget ${P_ALPHA} --yes`);
    expect(body.commands.get).toBe(`cmk get ${P_ALPHA}`);
    expect(body.state_note).toBeNull();

    // The trust command used to ECHO the current level, so running it changed
    // nothing. It is now a template over the whole ladder.
    expect(body.commands.trust).toBeUndefined();
    expect(body.commands.trust_current).toBe('high');
    expect(body.commands.trust_options.map((o) => o.level)).toEqual(['low', 'medium', 'high']);
    for (const o of body.commands.trust_options) {
      expect(o.command).toBe(`cmk trust ${P_ALPHA} ${o.level}`);
      expect(o.current).toBe(o.level === 'high');
    }
    // Every offered command must actually CHANGE something — the current level
    // is marked so the page can refuse to hand out a no-op.
    expect(body.commands.trust_options.filter((o) => !o.current)).toHaveLength(2);
  });

  it('I1 — an ARCHIVED fact offers an honest state note, never dead commands', async () => {
    const { status, body } = await getJson(base, `/api/fact/${P_OLD}`);
    expect(status).toBe(200);
    expect(body.found).toBe(true);
    // M2: named for WHERE the row came from, not for what it means (the graph
    // node's `superseded` means something else — "has a successor").
    expect(body.fact.from_archive).toBe(true);
    expect(body.fact.superseded).toBeUndefined();

    // `cmk forget` / `cmk trust` are no-ops against a fact already out of the
    // live corpus — three controls that look actionable and do nothing.
    expect(body.commands).toBeNull();
    expect(body.state_note.kind).toBe('archived');
    expect(body.state_note.text).toMatch(/no actions apply/i);
    expect(body.state_note.superseded_by).toBe(P_NEW);
    // …and it points at the version that IS actionable.
    expect(body.state_note.text).toContain(P_NEW);
  });

  it('M1 — an archived fact reports its path the way a live row does', async () => {
    const live = await getJson(base, `/api/fact/${P_ALPHA}`);
    const archived = await getJson(base, `/api/fact/${P_OLD}`);
    // Both are relative to the same base, so both carry the tier's own prefix.
    expect(live.body.fact.source_file).toMatch(/^context\/memory\//);
    expect(archived.body.fact.source_file).toBe(
      `context/memory/archive/superseded/${P_OLD}.md`,
    );
    expect(archived.body.fact.tier).toBe('P');
  });

  it('/api/fact/:id carries the supersession chain, forward-directed', async () => {
    const { body } = await getJson(base, `/api/fact/${P_OLD}`);
    expect(body.found).toBe(true);
    expect(body.fact.superseded_by).toBe(P_NEW);
    expect(body.supersession).toContain(P_NEW);
  });

  it('/api/fact/:id — unknown id 404s, malformed id 400s, neither leaks a path', async () => {
    const unknown = await getJson(base, '/api/fact/P-ZZZZZZZZ'); // validate-test-ids: ignore
    expect(unknown.status).toBe(404);
    expect(unknown.body.found).toBe(false);

    for (const bad of ['nope', 'P-short', 'P-2DZG7XF4x', '%00', 'C%3A%5CWindows']) {
      const r = await getJson(base, `/api/fact/${bad}`);
      expect([400, 404]).toContain(r.status);
      expect(JSON.stringify(r.body)).not.toContain(projectRoot.replace(/\\/g, '\\\\'));
    }
  });

  it('a dot-segment in the fact path NORMALIZES to a view — it never traverses', async () => {
    // WHATWG URL collapses `..` (and its `%2e%2e` spelling) before the router
    // sees it, so `/api/fact/..` is literally a request for `/api/` — the facts
    // view — not a walk out of anything. Pinned so the behavior is a decision.
    for (const path of ['/api/fact/..', '/api/fact/%2e%2e']) {
      const r = await getJson(base, path);
      expect(r.status).toBe(200);
      expect(r.body.view).toBe('facts');
    }
  });

  it('/api/graph returns kit-semantic nodes + edges (trust colour, supersession direction, anchor hubs)', async () => {
    const { status, body } = await getJson(base, '/api/graph');
    expect(status).toBe(200);
    expect(body.view).toBe('graph');
    const nodes = new Map(body.nodes.map((n) => [n.id, n]));
    expect(nodes.get(P_ALPHA).trust).toBe('high');
    expect(typeof nodes.get(P_ALPHA).trust_score).toBe('number');
    expect(nodes.get(P_ALPHA).tier).toBe('P');
    expect(nodes.get(P_ALPHA).kind).toBe('fact');
    // The anchor hub is a NODE, not a dangling string (§24.1.4 iii).
    expect(nodes.get('anchor:D-414').kind).toBe('anchor');

    const sup = body.edges.find((e) => e.type === 'superseded_by');
    expect(sup).toBeTruthy();
    expect(sup.src).toBe(P_OLD); // direction: old -> new, never the reverse
    expect(sup.dst).toBe(P_NEW);
    expect(nodes.get(P_OLD).superseded).toBe(true);
    expect(nodes.get(P_NEW).superseded).toBe(false);
    // The flag reads off the ROW, not off which walk found the node — a fact
    // whose successor exists but which has not been archived yet is still
    // superseded, and must not be coloured as current.
    expect(body.nodes.filter((n) => n.superseded).map((n) => n.id)).toEqual([P_OLD]);

    // Every edge endpoint must exist as a node, or the page draws into space.
    for (const e of body.edges) {
      expect(nodes.has(e.src)).toBe(true);
      expect(nodes.has(e.dst)).toBe(true);
    }

    // Anchor hubs and DANGLING targets are both ride-along nodes, but they mean
    // opposite things — a hub is structure the corpus earned, a dangler is a
    // reference to a fact that does not exist. Counting them as one number let
    // the page say "N doc anchors" about a set that could be mostly broken.
    expect(body.anchor_count).toBe(body.nodes.filter((n) => n.kind === 'anchor').length);
    expect(body.dangling_count).toBe(body.nodes.filter((n) => n.kind === 'dangling').length);
  });

  it('a dangling link is counted as dangling, never as a doc anchor', async () => {
    // A `related:` slug pointing at a fact that does not exist — the shape that
    // made the conflated count wrong on any real corpus.
    seedFact({
      id: 'P-P9HKNNHY',
      tier: 'P',
      slug: 'dangler',
      body: 'This one references a fact nobody wrote.',
      related: ['ghost-fact-that-does-not-exist'],
    });
    const { body } = await getJson(base, '/api/graph');
    expect(body.dangling_count).toBe(1);
    expect(body.nodes.find((n) => n.id === 'ghost-fact-that-does-not-exist').kind).toBe('dangling');
    // …and the anchor count is unmoved by it (the whole point of the split).
    expect(body.anchor_count).toBe(body.nodes.filter((n) => n.kind === 'anchor').length);
    expect(body.nodes.some((n) => n.kind === 'anchor' && n.id === 'anchor:D-414')).toBe(true);
  });

  it('M4 — the corpus is ONE population: an EXPIRED fact is outside both 56px figures', async () => {
    // The redesign puts a 56px "Corpus / facts on disk" figure in the graph
    // rail and a 56px total on the facts view. They came from different
    // populations: `/api/facts` filters `(expires_at IS NULL OR expires_at >
    // now)`, `/api/graph` counted `deleted_at IS NULL` and nothing else. On any
    // corpus with one expired fact the same product states two different corpus
    // sizes in the same type size — and the graph's was the larger one, naming
    // records no search on the page can reach.
    const before = await getJson(base, '/api/graph');
    const factsBefore = await getJson(base, '/api/facts?limit=200');
    expect(before.body.fact_count).toBe(factsBefore.body.total);

    const EXPIRED = 'P-KVZ7WM3N';
    seedFact({
      id: EXPIRED,
      tier: 'P',
      slug: 'held-until-the-cut',
      body: 'True right up until the release shipped.',
      expiresAt: '2020-01-01',
    });

    const after = await getJson(base, '/api/graph');
    const factsAfter = await getJson(base, '/api/facts?limit=200');
    // The expired fact is on disk and in the index — and in neither figure.
    expect(factsAfter.body.facts.map((f) => f.id)).not.toContain(EXPIRED);
    expect(after.body.fact_count).toBe(before.body.fact_count);
    expect(after.body.fact_count).toBe(factsAfter.body.total);
    // …and it is not DRAWN either. The budget test below pins
    // `nodes(fact, live) === fact_count` at cap; counting a population the node
    // query does not draw from would make that invariant false the moment a
    // real corpus had an expired fact in it.
    expect(after.body.nodes.some((n) => n.id === EXPIRED)).toBe(false);

    // Over-mutation guard: excluding one record excludes exactly one. Every
    // other node the graph drew before is still there.
    expect(after.body.nodes.map((n) => n.id).sort()).toEqual(
      before.body.nodes.map((n) => n.id).sort(),
    );
  });

  it('the graph budget: AT-CAP nodes are returned whole, OVER-CAP truncates and says so', async () => {
    const total = (await getJson(base, '/api/graph')).body.fact_count;
    expect(total).toBeGreaterThan(2);

    // AT-CAP: a limit of exactly the corpus size returns all of it, untruncated.
    const atCap = await getJson(base, `/api/graph?limit=${total}`);
    expect(atCap.body.node_limit).toBe(total);
    expect(atCap.body.truncated).toBe(false);
    expect(atCap.body.nodes.filter((n) => n.kind === 'fact' && !n.superseded).length).toBe(total);

    // OVER-CAP by one: the same corpus, one fact short, and it SAYS so.
    const overByOne = await getJson(base, `/api/graph?limit=${total - 1}`);
    expect(overByOne.body.truncated).toBe(true);
    expect(overByOne.body.nodes.filter((n) => n.kind === 'fact' && !n.superseded).length).toBe(
      total - 1,
    );

    const overCap = await getJson(base, '/api/graph?limit=2');
    expect(overCap.body.truncated).toBe(true);
    // The budget bounds LIVE facts; anchor hubs, dangling targets and archived
    // predecessors ride on top and are each reported separately (route note).
    expect(overCap.body.nodes.length).toBeLessThanOrEqual(
      2 + overCap.body.anchor_count + overCap.body.dangling_count + overCap.body.archived_count,
    );
    expect(overCap.body.nodes.filter((n) => n.kind === 'fact' && !n.superseded).length).toBe(2);

    const clamped = await getJson(base, `/api/graph?limit=${VIEWER_MAX_LIMIT + 1}`);
    expect(clamped.body.node_limit).toBe(VIEWER_MAX_LIMIT);
    expect(clamped.body.clamped).toBe(true);
  });

  it('/api/health renders the doctor checks AND agrees with the 250 health-log evidence', async () => {
    // A deterministic class fires on ONE strike (health-log's own semantics —
    // reused, never re-thresholded here).
    appendHealthEntry(projectRoot, { class: HEALTH_CODES.INDEX_DRIFT, outcome: 'fail' });

    const { status, body } = await getJson(base, '/api/health');
    expect(status).toBe(200);
    expect(body.view).toBe('health');
    expect(body.checks.length).toBe(15);
    for (const c of body.checks) {
      expect(c).toHaveProperty('id');
      expect(c).toHaveProperty('name');
      expect(['pass', 'warn', 'fail', 'skip']).toContain(c.status);
    }
    expect(typeof body.fail_count).toBe('number');

    // The route must not re-derive the warning set — it must BE the same one
    // the whisper uses, or the strip and the nudge can disagree.
    const expected = activeWarnings(projectRoot);
    expect(body.active_warnings).toEqual(expected);
    expect(body.active_warnings.map((w) => w.code)).toContain(HEALTH_CODES.INDEX_DRIFT);

    // The pinned one-line strip: the active warning when there is one.
    expect(body.strip.state).toBe('warn');
    expect(body.strip.text).toContain(expected[0].title);
    expect(body.strip.action).toBe(expected[0].primaryAction);
    // Precedence: with the doctor CLEAN, the health-log warning is the headline.
    // (A doctor FAIL outranks it — pinned by the B1 test below.)
    expect(body.fail_count).toBe(0);
  });

  it('/api/health strip is a quiet green line when nothing is warning', async () => {
    const { body } = await getJson(base, '/api/health');
    expect(body.active_warnings).toEqual([]);
    expect(body.strip.state).toBe('ok');
    expect(body.strip.text).toMatch(/\w/);
    // With the doctor table in hand the positive claim may be absolute…
    expect(body.strip.text).toMatch(/all \d+ health checks passing/);
  });

  it('B1 — a FAILING doctor check turns the strip red, and NAMES the checks', async () => {
    // The strip used to read only the health LOG. A hook that was never
    // registered never runs and therefore never logs, so the log stays silent
    // while the doctor table goes red — and the most prominent line in the UI
    // printed a green all-clear directly above it (the HC-10 false-green
    // class). The full route has the checks in scope; it must fold them in.
    // The reviewer's own reproduction: unwire the hooks. Nothing logs, because
    // a hook that is not registered never runs.
    rmSync(join(projectRoot, '.claude', 'settings.json'), { force: true });

    const { body } = await getJson(base, '/api/health');

    expect(body.fail_count).toBeGreaterThan(0);
    expect(body.checks.find((c) => c.id === 'HC-1').status).toBe('fail');
    // The health LOG is silent — this is exactly the blind spot.
    expect(body.active_warnings).toEqual([]);
    // …and the strip must NOT be green anyway.
    expect(body.strip.state).not.toBe('ok');
    expect(body.strip.text).not.toMatch(/passing|fine/i);
    expect(body.strip.text).toMatch(/FAILING/);
    // It names WHICH checks, so the line is actionable without scrolling.
    const failedIds = body.checks.filter((c) => c.status === 'fail').map((c) => c.id);
    for (const id of failedIds) expect(body.strip.text).toContain(id);
    expect(body.strip.action).toBe('cmk doctor');
  });

  it('B1 — the ?strip=1 quick check never makes a claim it cannot support', async () => {
    // Without the doctor it cannot see an unregistered hook, so its positive
    // wording is bounded to what the log proves: "no failures RECORDED".
    const { body } = await getJson(base, '/api/health?strip=1');
    expect(body.strip.state).toBe('ok');
    expect(body.strip.text).toBe('no failures recorded (quick check)');
    expect(body.strip.text).not.toMatch(/capture|recall|index|fine|healthy/i);
  });

  it('M4 — an UNREADABLE queue reads as unknown, never as a silent all-clear', async () => {
    // A directory where the queue file is expected makes the read throw.
    const queuePath = join(projectRoot, 'context', 'queues', 'conflicts.md');
    rmSync(queuePath, { force: true });
    mkdirSync(queuePath, { recursive: true });

    const { body } = await getJson(base, '/api/health?strip=1');
    expect(body.queues.unreadable).toBe(true);
    expect(body.strip.state).toBe('warn');
    expect(body.strip.text).toMatch(/could not be read/i);
  });

  it('/api/health?strip=1 answers the pinned line WITHOUT running the doctor', async () => {
    // The strip renders on every view; paying the full doctor check list (one
    // of them a subprocess probe) per navigation to draw one line is the
    // difference between a viewer that feels instant and one that feels broken.
    const { status, body } = await getJson(base, '/api/health?strip=1');
    expect(status).toBe(200);
    expect(body.strip).toBeTruthy();
    expect(body.active_warnings).toEqual([]);
    expect(body.queues).toEqual({ conflicts: 0, review: 0, unreadable: false });
    expect(body.checks).toBeUndefined();
    expect(body.fail_count).toBeUndefined();
  });

  it('§24.1 point 8 — a pending conflict queue is COUNTED on the strip, not hidden', async () => {
    // There is no conflict-queue screen in wave 1; the deferral is only honest
    // if the count still reaches the user with the verb that resolves it.
    const w = writeConflictEntry({
      tier: 'P',
      projectRoot,
      newId: P_NEW,
      newText: 'the deploy target is eu-central',
      newTrust: 'high',
      existingId: P_ALPHA,
      existingText: 'the deploy target is eu-west',
      existingTrust: 'high',
      similarity: 0.91,
      similarityBackend: 'jaccard',
    });
    expect(w.action).not.toBe('error');

    const { body } = await getJson(base, '/api/health?strip=1');
    expect(body.queues.conflicts).toBe(1);
    expect(body.strip.state).toBe('queued');
    expect(body.strip.text).toMatch(/1 conflict/);
    expect(body.strip.action).toBe('cmk queue conflicts');

    // …and a REAL failure outranks it — a broken kit is losing memory, a queue
    // is only waiting on a human.
    appendHealthEntry(projectRoot, { class: HEALTH_CODES.INDEX_DRIFT, outcome: 'fail' });
    const after = await getJson(base, '/api/health?strip=1');
    expect(after.body.strip.state).toBe('warn');
    expect(after.body.strip.queues.conflicts).toBe(1); // still reported, just not the headline
  });

  it('/api/decisions is the journal chronologically, retracted entries flagged', async () => {
    const { status, body } = await getJson(base, '/api/decisions');
    expect(status).toBe(200);
    expect(body.view).toBe('decisions');
    expect(body.count).toBe(2);
    expect(body.decisions.map((d) => d.id)).toEqual([P_ALPHA, P_BRAVO]); // journal order
    expect(body.decisions[0].title).toBe('Use median-of-three pivots');
    expect(body.decisions[0].when).toBe('2026-07-01');
    expect(body.decisions[0].why).toMatch(/naive midpoint/);
    expect(body.decisions[0].retracted).toBe(false);
    expect(body.decisions[1].retracted).toBe(true);
    expect(body.decisions[1].source_line).toBeGreaterThan(body.decisions[0].source_line);
  });

  it('a project with no decision journal answers empty, not 500', async () => {
    rmSync(join(projectRoot, 'context', 'DECISIONS.md'), { force: true });
    const { status, body } = await getJson(base, '/api/decisions');
    expect(status).toBe(200);
    expect(body.count).toBe(0);
    expect(body.decisions).toEqual([]);
  });

  it('§24.1.2 — the SAME route answers HTML or JSON three ways', async () => {
    for (const path of ['/facts', '/graph', '/health', '/decisions', `/fact/${P_ALPHA}`]) {
      const html = await fetch(new URL(path, base));
      expect(html.headers.get('content-type')).toMatch(/text\/html/);

      const suffixed = await fetch(new URL(`${path}.json`, base));
      expect(suffixed.headers.get('content-type')).toMatch(/application\/json/);

      const negotiated = await fetch(new URL(path, base), {
        headers: { accept: 'application/json' },
      });
      expect(negotiated.headers.get('content-type')).toMatch(/application\/json/);

      const prefixed = await fetch(new URL(`/api${path}`, base));
      expect(prefixed.headers.get('content-type')).toMatch(/application\/json/);

      // Same payload from both spellings — minus the per-response envelope
      // fields that are, by design, different on every request.
      const strip = ({ generated_at, took_ms, duration_ms, ...rest }) => rest;
      expect(strip(await suffixed.json())).toEqual(strip(await prefixed.json()));
    }
  });

  it('STRUCTURALLY read-only: every method × every route is 405 (§24.1.3)', async () => {
    // I2: capture the CONTENT before, not just the shape — a count survives a
    // rewrite of every row.
    const before = await getJson(base, '/api/facts');
    const tierBefore = snapshotTier(projectRoot);
    const routes = [
      '/',
      '/facts',
      '/api/facts',
      `/api/fact/${P_ALPHA}`,
      '/api/graph',
      '/api/health',
      '/api/decisions',
      '/nope',
    ];
    // Sent RAW: undici rejects TRACE outright, and the point of this test is
    // that the SERVER refuses every method, not that the client does.
    const methods = ['POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'TRACE', 'PROPFIND'];
    for (const path of routes) {
      for (const method of methods) {
        const res = await raw(base, path, { method });
        expect(`${method} ${path} -> ${res.status}`).toBe(`${method} ${path} -> 405`);
        expect(res.headers.allow).toBe('GET, HEAD');
      }
    }
    // Over-mutation guard: every ROW is byte-identical, and so is the tier on
    // disk — not merely the same number of them (I2).
    const after = await getJson(base, '/api/facts');
    expect(after.body.facts).toEqual(before.body.facts);
    expect(snapshotTier(projectRoot).filter((p) => !p.includes('.index'))).toEqual(
      tierBefore.filter((p) => !p.includes('.index')),
    );
  });

  it('HEAD is allowed and carries headers with no body', async () => {
    const res = await fetch(new URL('/api/facts', base), { method: 'HEAD' });
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toMatch(/application\/json/);
    expect(await res.text()).toBe('');
  });

  it('no route reaches a file outside the tier — traversal attempts 404', async () => {
    const attempts = [
      '/../../package.json',
      '/api/fact/..%2F..%2Fpackage.json',
      '/api/../../package.json',
      '/api/facts/../../../../etc/passwd',
      '/%2e%2e%2f%2e%2e%2fpackage.json',
      '/api/fact/%00',
    ];
    for (const path of attempts) {
      const res = await fetch(`${base.replace(/\/$/, '')}${path}`);
      expect([400, 404]).toContain(res.status);
      const text = await res.text();
      expect(text).not.toContain('"@lh8ppl/core-memory-kit"');
      expect(text).not.toContain('root:x:');
    }
  });

  it('a request with a non-loopback Host header is refused (DNS-rebinding guard)', async () => {
    // Binding loopback does NOT stop a hostile page from resolving its own
    // domain to 127.0.0.1 and reading the user's memory through their browser.
    // The Host header is the only thing that tells those apart.
    for (const host of ['evil.example.com', 'memory.attacker.test:80']) {
      const res = await raw(base, '/api/facts', { headers: { host } });
      expect(`${host} -> ${res.status}`).toBe(`${host} -> 403`);
    }
    // …and the legitimate spellings still work.
    for (const host of ['127.0.0.1', 'localhost:1', '[::1]:1']) {
      const res = await raw(base, '/api/facts', { headers: { host } });
      expect(`${host} -> ${res.status}`).toBe(`${host} -> 200`);
    }
  });

  it('Door 5 (negative) — browsing writes NO recall-log entry', async () => {
    const recall = join(projectRoot, 'context', '.locks', 'recall.log');
    const before = existsSync(recall) ? readFileSync(recall, 'utf8') : null;
    await getJson(base, '/api/facts?q=quicksort');
    await getJson(base, '/api/facts');
    await getJson(base, `/api/fact/${P_ALPHA}`);
    const after = existsSync(recall) ? readFileSync(recall, 'utf8') : null;
    // Browse traffic in the recall log would corrupt the ADR-0024 fire-rate.
    expect(after).toBe(before);
  });
});

describe('viewer — the HTML page (255.3)', () => {
  let base;
  let html;
  beforeEach(async () => {
    const r = await boot();
    base = r.url;
    html = await (await fetch(base)).text();
  });

  it('is ONE self-contained file — no framework, no bundler, no CDN (§24.1.7)', async () => {
    // Every subresource reference must be local. A remote one would work on the
    // author's machine and break on a plane, and the CSP would reject it — this
    // catches it at test time instead of in someone's browser console.
    const externals = [...html.matchAll(/(?:src|href)\s*=\s*["']([^"']+)["']/gi)]
      .map((m) => m[1])
      .filter((u) => /^(?:https?:)?\/\//i.test(u));
    expect(externals).toEqual([]);
    expect(html).not.toMatch(/<script[^>]+\ssrc=/i);
    expect(html).not.toMatch(/<link[^>]+rel=["']?stylesheet/i);

    // And the response says so: the CSP permits inline only, no host source.
    const res = await fetch(base);
    const csp = res.headers.get('content-security-policy');
    expect(csp).toMatch(/default-src 'none'/);
    expect(csp).toMatch(/script-src 'unsafe-inline'/);
    expect(csp).not.toMatch(/https?:/);
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('cache-control')).toBe('no-store');
  });

  it('ships all five wave-1 views + the search box (§24.1.4)', () => {
    for (const view of ['facts', 'fact', 'graph', 'health', 'decisions']) {
      expect(html).toContain(`data-view="${view}"`);
    }
    expect(html).toContain('id="q"'); // the search box IS the landing feature
    expect(html).toContain('id="health-strip"'); // pinned, on every view
  });

  it('carries the freshness label + a manual refresh control, and NO live-watch (§24.1.6)', () => {
    expect(html).toContain('id="freshness"');
    expect(html).toContain('id="refresh"');
    // The search box fires per keystroke, so two responses can race; the page
    // must discard a stale one rather than repaint with it.
    expect(html).toContain('factsSeq');
    expect(html).toMatch(/seq !== factsSeq/);
    // Task 259 owns live refresh; wave 1 must not have grown one by accident.
    expect(html).not.toMatch(/EventSource|new WebSocket|text\/event-stream/);
  });

  it('renders the copy-the-command answer to the delete demand, never a write call', () => {
    // The command STRINGS come from the API (pinned in the route test); what
    // the page owes is the affordance that surfaces them.
    expect(html).toContain('commands.forget');
    expect(html).toContain('commands.trust');
    expect(html).toContain('clipboard.writeText');
    // The page is a consumer of its own read API — it must never attempt a
    // mutating request (the structural read-only claim, from the client side).
    expect(html).not.toMatch(/method:\s*['"](?:POST|PUT|PATCH|DELETE)['"]/i);
    expect(html).not.toMatch(/\bfetch\((?:[^)]*),\s*\{[^}]*method/);
  });

  it('I3 — the inline script uses NO HTML-parsing sink, structurally', () => {
    // The page renders untrusted content (fact bodies, FTS snippets, health
    // messages) and is safe today only because every write goes through
    // textContent / createElement / append. That is a DISCIPLINE, and the next
    // editor reaching for `innerHTML` to save three lines would silently turn a
    // fact body into markup. This converts the discipline into enforcement.
    // Tag-matching is case-insensitive and attribute-tolerant (CodeQL
    // js/bad-tag-filter: a filter that only knows lowercase `<script>` is the
    // classic bypass shape — held to the same standard even though this file
    // is kit-authored).
    const script = html.match(/<script\b[^>]*>([\s\S]*?)<\/script\b[^>]*>/i)[1];
    const SINKS = [
      'innerHTML',
      'outerHTML',
      'insertAdjacentHTML',
      'document.write',
      'srcdoc',
      'setHTML',
      'createContextualFragment',
      // `new DOMParser().parseFromString(x, 'text/html')` parses untrusted text
      // into a live tree just as surely as innerHTML does — the fact that it
      // lands in a detached document does not make the markup un-parsed.
      'DOMParser',
    ];
    const found = SINKS.filter((sink) => script.includes(sink));
    expect(
      found,
      `viewer-page.html reaches for an HTML-parsing sink: ${found.join(', ')}. ` +
        'Render untrusted text with textContent/createElement instead — see design §24.1.1.',
    ).toEqual([]);
  });

  it('the inline script PARSES — a syntax error would ship a blank page', () => {
    // The kit has no DOM test environment (adding one would be a new dependency
    // the §24.1.7 zero-dep contract forbids), so this is the floor a unit test
    // can reach: the script is compiled exactly as a browser would compile it,
    // which catches the one failure mode that turns the whole viewer into an
    // empty window. RUNTIME behaviour is covered by live-verify's real fetches
    // against the real bin, and the visual pass needs a human with a browser —
    // stated rather than implied.
    const m = html.match(/<script\b[^>]*>([\s\S]*?)<\/script\b[^>]*>/i);
    expect(m).toBeTruthy();
    expect(() => new Function(m[1])).not.toThrow();
  });

  it('a deep link to any view serves the same page (client-side routing)', async () => {
    for (const path of ['/facts', '/graph', '/health', '/decisions', '/fact/P-2DZG7XF4']) {
      const res = await fetch(new URL(path, base));
      expect(res.status).toBe(200);
      expect(await res.text()).toBe(html);
    }
  });

  it('a 404 page is still a page, and still offline', async () => {
    const res = await fetch(new URL('/no-such-view', base));
    expect(res.status).toBe(404);
    const body = await res.text();
    expect(body).toContain('<!doctype html>');
    expect(body).not.toMatch(/https?:\/\//);
  });
});

/**
 * Task 260 — the visual pass.
 *
 * There is no DOM environment here on purpose (adding one is a dependency the
 * §24.1.7 zero-dep contract forbids), so these are STRUCTURAL assertions over
 * the served bytes: the properties whose ABSENCE is what made the page look
 * undesigned, plus the constraints the pass was not allowed to break. What a
 * page LOOKS like is the user's call in a real browser — stated, not implied.
 */
describe('viewer — the visual pass (260)', () => {
  let html;
  let css;
  let bareCss;
  let script;
  beforeEach(async () => {
    const r = await boot();
    html = await (await fetch(r.url)).text();
    css = html.match(/<style\b[^>]*>([\s\S]*?)<\/style\b[^>]*>/i)[1];
    // Comment-stripped, and the sheet EVERY rule-shaped assertion below reads:
    // the token block's own prose names the selectors, properties and values it
    // is describing (`:root`, the media queries, `data-theme`, the rejected
    // font family, the old `border-color: currentColor` shape), so matching
    // against the raw sheet picks the prose up as if it were code — the M4
    // class, and the reason the D-432 polarity flip first went green against
    // the wrong block entirely. Three ad-hoc copies of this stripper had already
    // appeared in this file; one definition, one place to fix (M6). The single
    // deliberate exception is the "zero fetched bytes" scan in the fonts test,
    // which is a claim about the served bytes and says so at its own line.
    bareCss = css.replace(/\/\*[\s\S]*?\*\//g, '');
    script = html.match(/<script\b[^>]*>([\s\S]*?)<\/script\b[^>]*>/i)[1];
  });

  it('(3) defines a real surface ladder — page ≠ panel ≠ sunken, in BOTH themes', () => {
    // The diagnosis was a 2% delta (#fbfaf8 page on #ffffff panels), which left
    // borders doing 100% of the work and nothing reading as a surface.
    //
    // POLARITY FLIPPED 2026-08-08 (D-432): dark is the `:root` DEFAULT and light
    // is the media-query block. Every assertion below is the same contract with
    // the two roles swapped — not a weakened one. Deleting either block still
    // fails, and the M4 whole-ladder comparison is unchanged.
    const root = bareCss.match(/:root\s*\{([\s\S]*?)\}/)[1];
    for (const token of ['--ground', '--panel', '--sunken', '--line', '--ink', '--ink-2', '--ink-3']) {
      expect(root, `the default (dark) theme is missing ${token}`).toContain(token + ':');
    }
    const hex = (block, name) =>
      (block.match(new RegExp('\\' + name + ':\\s*(#[0-9a-f]{6})', 'i')) || [])[1];
    expect(hex(root, '--ground')).not.toBe(hex(root, '--panel'));

    // Light is DESIGNED, not an inversion: its own ladder, redefined.
    const light = bareCss.match(/@media\s*\(prefers-color-scheme:\s*light\)\s*\{\s*:root\s*\{([\s\S]*?)\}/);
    expect(light, 'no light-theme token block').toBeTruthy();
    for (const token of ['--ground', '--panel', '--sunken', '--line', '--ink', '--ink-3']) {
      expect(light[1], `light theme is missing ${token}`).toContain(token + ':');
    }
    expect(hex(light[1], '--ground')).not.toBe(hex(light[1], '--panel'));
    // Neither theme is an inversion of the other — so compare the whole ladder,
    // not one token: every surface and ink must differ from its counterpart (M4).
    for (const token of ['--ground', '--panel', '--sunken', '--line', '--ink', '--ink-2', '--ink-3']) {
      expect(hex(light[1], token), `${token} is identical in both themes`).not.toBe(hex(root, token));
    }
  });

  it('(I3) an explicit `data-theme` wins in BOTH directions, and cannot drift', () => {
    // D-432 serves each theme on two signals — the system preference and an
    // explicit `data-theme` — which means each palette is written TWICE. The AA
    // test can only compute the block it parses, so a `data-theme` copy could
    // drift out of contrast coverage silently: an override that ships an
    // unmeasured palette is the composition gap this closes.
    const tokens = (block) =>
      Object.fromEntries(
        [...block.matchAll(/(--[a-z0-9-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]),
      );
    const blockAfter = (re) => {
      const m = bareCss.match(re);
      expect(m, `no block matching ${re}`).toBeTruthy();
      return tokens(m[1]);
    };
    // Both directions exist: light over a dark default, dark over a light system.
    const explicitLight = blockAfter(/:root\[data-theme="light"\]\s*\{([\s\S]*?)\n  \}/);
    const explicitDark = blockAfter(/:root\[data-theme="dark"\]\s*\{([\s\S]*?)\n  \}/);
    const mediaLight = blockAfter(
      /@media\s*\(prefers-color-scheme:\s*light\)[\s\S]*?:root\s*\{([\s\S]*?)\n    \}/,
    );
    const defaultDark = blockAfter(/:root\s*\{([\s\S]*?)\n  \}/);

    // The explicit light override IS the media-query light palette, token for token.
    expect(explicitLight).toEqual(mediaLight);
    // …and the DARK override must declare the same SET of tokens — value drift is
    // checked below, but until this line the guard was one-directional on KEYS:
    // a token added to `:root` + the media-light block + `[data-theme="light"]`
    // and forgotten in `[data-theme="dark"]` passed every other assertion here,
    // and rendered its LIGHT value inside a dark page for the one reader who is
    // on an OS-light machine with the dark toggle on. The two sets are identical
    // today, and both palettes cover exactly the theme-varying tokens.
    expect(
      Object.keys(explicitDark).sort(),
      '[data-theme="dark"] and the light palette declare different token SETS',
    ).toEqual(Object.keys(mediaLight).sort());
    // The explicit dark override re-asserts the default; it declares a SUBSET
    // (the theme-varying tokens only — `--g-*`, rhythm and fonts do not vary),
    // and every token it does declare must match the default exactly.
    expect(Object.keys(explicitDark).length).toBeGreaterThan(15);
    for (const [name, value] of Object.entries(explicitDark)) {
      expect(defaultDark[name], `${name} drifted between :root and [data-theme="dark"]`).toBe(value);
    }
    // …and it must actually cover the palette, not a token or two of it.
    for (const token of ['--ground', '--panel', '--sunken', '--ink', '--ink-3', '--accent', '--tint']) {
      expect(explicitDark, `[data-theme="dark"] is missing ${token}`).toHaveProperty(token);
      expect(explicitLight, `[data-theme="light"] is missing ${token}`).toHaveProperty(token);
    }
    // The attribute selector out-specifies the media block by construction
    // (0,2,0 vs 0,1,0) — assert it is not accidentally nested INSIDE the media
    // query, where a dark-preferring machine would never see it.
    const mediaBlock = bareCss.match(/@media\s*\(prefers-color-scheme:\s*light\)\s*\{([\s\S]*?)\n  \}/);
    expect(mediaBlock[1]).not.toContain('data-theme');
  });

  it('(I1b) every `--X-rgb` carries the channels of its OWN `--X` — every block, every pair', () => {
    // The ONE badge rule is `rgba(<hue>-rgb, var(--tint))` under a hairline of
    // the same channels (§24.1.2), so a hue is written TWICE: once as the hex
    // the text is painted in, once as the channels its wash is mixed from. The
    // two are only related by a human keeping them in step — and the dark port
    // shipped `--ink-3: #a59b8c` beside `--ink-3-rgb: 157,147,132`, which is
    // the channels of #9d9384: the value the AA test REJECTED at 4.23:1. So the
    // one token lifted for contrast was painting its own badge wash out of the
    // rejected hue, in both dark blocks, with every test green — the AA test
    // reads the hex and never sees the channels.
    //
    // Every pair, in every block that declares one: with each palette written
    // four times (two themes x two signals), a per-token spot check is exactly
    // the shape that misses the copy nobody looked at.
    const channels = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(',');
    const bad = [];
    let pairs = 0;
    for (const [, sel, body] of bareCss.matchAll(/([^{}]*)\{([^{}]*)\}/g)) {
      const where = sel.trim().replace(/\s+/g, ' ');
      const tok = Object.fromEntries(
        [...body.matchAll(/(--[a-z0-9-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]),
      );
      for (const [name, value] of Object.entries(tok)) {
        if (!name.endsWith('-rgb')) continue;
        // A badge VARIANT aliases (`--hue-rgb: var(--ok-rgb)`) — there is no
        // literal to compare, and the alias is the shape that cannot drift.
        if (!/^\d{1,3},\s*\d{1,3},\s*\d{1,3}$/.test(value)) continue;
        const base = name.slice(0, -'-rgb'.length);
        const hex = tok[base];
        if (!hex || !/^#[0-9a-f]{6}$/i.test(hex)) {
          bad.push(`${where}: ${name} has no literal ${base} beside it`);
          continue;
        }
        pairs += 1;
        const got = value.replace(/\s+/g, '');
        const want = channels(hex);
        if (got !== want) bad.push(`${where}: ${name} = ${got} but ${base} = ${hex} (= ${want})`);
      }
    }
    expect(bad, `a hue's channels disagree with its own hex:\n  ${bad.join('\n  ')}`).toEqual([]);
    // …and the scan actually reached the palettes, rather than passing on zero.
    expect(pairs, 'the rgb-pair scan found almost nothing — the sheet shape moved').toBeGreaterThanOrEqual(40);
  });

  it('(I1) every text/surface pair clears WCAG AA 4.5:1 — in BOTH themes', () => {
    // The visual pass first shipped 15 failing pairs in light, the worst at
    // 2.93:1 — and `--ink-3` alone carries the meta row, .micro, #freshness,
    // .muted, .empty, inactive nav and the READ-ONLY pill. The
    // target is written down in design §24.1.2; this computes it, so lightening
    // a token to taste fails the suite instead of shipping.
    //
    // Badge text does NOT sit on a surface: it sits on its own hue at `--tint`
    // alpha, composited over whichever surface the badge lands on — and a badge
    // lands on both a card (panel) and the page (ground, e.g. the graph legend
    // and the health rows). Both are checked.
    const AA = 4.5;
    const srgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
    const chan = (c) => (c / 255 <= 0.04045 ? c / 255 / 12.92 : ((c / 255 + 0.055) / 1.055) ** 2.4);
    const lum = (c) => 0.2126 * chan(c[0]) + 0.7152 * chan(c[1]) + 0.0722 * chan(c[2]);
    const contrast = (a, b) => {
      const [hi, lo] = lum(a) > lum(b) ? [lum(a), lum(b)] : [lum(b), lum(a)];
      return (hi + 0.05) / (lo + 0.05);
    };
    const over = (fg, alpha, bg) => fg.map((c, i) => c * alpha + bg[i] * (1 - alpha));

    // POLARITY FLIPPED 2026-08-08 (D-432): the `:root` default block is now the
    // DARK palette and the media-query block is LIGHT. Both are still computed —
    // the contract is "AA in both themes", and which one is the default does not
    // change it. (The `data-theme` copies are pinned to these by I3, so a copy
    // cannot ship an unmeasured palette.)
    const themes = {
      dark: bareCss.match(/:root\s*\{([\s\S]*?)\n  \}/)[1],
      light: bareCss.match(/@media\s*\(prefers-color-scheme:\s*light\)[\s\S]*?:root\s*\{([\s\S]*?)\n    \}/)[1],
    };
    const failures = [];
    for (const [theme, block] of Object.entries(themes)) {
      const tok = (name) => {
        const m = block.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`));
        expect(m, `${theme} theme has no --${name}`).toBeTruthy();
        return srgb(m[1]);
      };
      const tint = Number(block.match(/--tint:\s*(\.?[\d.]+)/)[1]);
      expect(tint, `${theme} has no --tint`).toBeGreaterThan(0);

      const panel = tok('panel');
      const ground = tok('ground');
      const sunken = tok('sunken');
      const check = (label, fg, bg) => {
        const r = contrast(fg, bg);
        if (r < AA) failures.push(`${theme}: ${label} = ${r.toFixed(2)}:1`);
      };
      // Plain text on every surface it can land on.
      for (const ink of ['ink', 'ink-2', 'ink-3']) {
        for (const [sn, s] of [['panel', panel], ['ground', ground], ['sunken', sunken]]) {
          check(`${ink} on ${sn}`, tok(ink), s);
        }
      }
      // Badge text on its own tint, over each surface a badge appears on.
      // `tier-l` is in the list because it is a badge/glyph hue exactly like
      // `tier-p`/`tier-u` (`.tier-L` sets `--hue`/`--hue-rgb` from it). It was
      // omitted while it read `var(--accent)` and was AA-safe by aliasing; the
      // D-432 port made all three tiers literal hexes and it fell out of
      // coverage silently — the CHANGELOG's "every pair in both themes" claim
      // was one hue short of true.
      for (const hue of ['ok', 'warn', 'bad', 'accent', 'tier-p', 'tier-l', 'tier-u', 'ink-3']) {
        for (const [sn, s] of [['panel', panel], ['ground', ground]]) {
          check(`badge ${hue} on ${sn}`, tok(hue), over(tok(hue), tint, s));
        }
      }
      // The search-hit mark: ink-2 over the accent wash, on a card.
      check('search hit (ink-2 on accent wash)', tok('ink-2'), over(tok('accent'), 0.22, panel));
    }

    // The archive tokens the `.trust` word and the plain-hue text land on are
    // NOT badges — `.trust-high` / `.trust-medium` paint the hue directly on a
    // row inside a panel, and links paint `--accent` on the page. The badge loop
    // above measures each hue on its own tint, which is a DIFFERENT (harder)
    // pair, so it can pass while the bare-text use of the same hue fails. With
    // dark now the default and every hue re-picked (D-432), pin the bare use too.
    for (const [theme, block] of Object.entries(themes)) {
      const tok = (name) => srgb(block.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`))[1]);
      for (const hue of ['ok', 'warn', 'bad', 'accent']) {
        for (const [sn, s] of [['panel', tok('panel')], ['ground', tok('ground')]]) {
          const r = contrast(tok(hue), s);
          if (r < AA) failures.push(`${theme}: ${hue} as TEXT on ${sn} = ${r.toFixed(2)}:1`);
        }
      }
    }

    // The INSTRUMENT is its own colour space (`--g-*`), fixed in both themes —
    // and the Task-268 redesign put real 11-12.5px text in it: the rail's
    // headings and dl, the corpus sub-line, the legend counts, the peek meta,
    // the SVG labels. The archive tokens above cannot see any of it, so a dark
    // canvas could be lightened to taste with the AA test still green.
    const gBlock = bareCss.match(/:root\s*\{([\s\S]*?)\n  \}/)[1];
    const gTok = (name) => {
      const m = gBlock.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`));
      expect(m, `no --${name} token`).toBeTruthy();
      return srgb(m[1]);
    };
    for (const ink of ['g-ink', 'g-ink-2', 'g-ink-3']) {
      for (const canvas of ['g-canvas', 'g-canvas-2']) {
        const r = contrast(gTok(ink), gTok(canvas));
        if (r < AA) failures.push(`instrument: ${ink} on ${canvas} = ${r.toFixed(2)}:1`);
      }
    }
    expect(failures, `contrast below AA ${AA}:1:\n  ${failures.join('\n  ')}`).toEqual([]);

    // The surface ladder must be ORDERED, not merely distinct: light recedes by
    // getting darker, dark recedes by getting darker too, so `sunken` is never
    // between `panel` and nothing. A lighter-than-ground "sunken" made the graph
    // canvas read as raised (M5).
    const lightBlock = themes.light;
    const hexOf = (block, n) => srgb(block.match(new RegExp(`--${n}:\\s*(#[0-9a-fA-F]{6})`))[1]);
    expect(lum(hexOf(lightBlock, 'sunken'))).toBeLessThan(lum(hexOf(lightBlock, 'ground')));
    expect(lum(hexOf(lightBlock, 'ground'))).toBeLessThan(lum(hexOf(lightBlock, 'panel')));
    const darkBlock = themes.dark;
    expect(lum(hexOf(darkBlock, 'ground'))).toBeLessThan(lum(hexOf(darkBlock, 'sunken')));
    expect(lum(hexOf(darkBlock, 'sunken'))).toBeLessThan(lum(hexOf(darkBlock, 'panel')));
  });

  it('(2) badges are TINTED, not outlined — one rule, literal rgba, no color-mix()', () => {
    const badge = bareCss.match(/\.badge\s*\{([\s\S]*?)\}/);
    expect(badge, 'no .badge rule').toBeTruthy();
    expect(badge[1]).toMatch(/background:\s*rgba\(/);
    expect(badge[1]).toMatch(/border:\s*1px solid rgba\(/);
    // The old shape: `border-color: currentColor` on every pill variant.
    expect(bareCss).not.toMatch(/border-color:\s*currentColor/);
    // color-mix() support was flagged unverified in the survey; both reference
    // implementations use literal rgba pairs, and so do we.
    expect(bareCss).not.toMatch(/color-mix\(/);
  });

  it('(1/4) the card has a title tier, a CSS clamp and a bounded measure', () => {
    expect(bareCss).toMatch(/\.fact-title\s*\{/);
    expect(bareCss).toMatch(/-webkit-line-clamp/);
    // Clamping in CSS keeps the whole string in the DOM (and the a11y tree)
    // rather than asking the server for more "…".
    expect(script).toMatch(/clamp-2/);
    const measure = bareCss.match(/--measure:\s*(\d+)px/);
    expect(measure, 'no --measure token').toBeTruthy();
    expect(Number(measure[1])).toBeLessThanOrEqual(820);
    expect(html).toMatch(/id="facts-out"[^>]*class="measure"/);

    // Four sizes + ONE uppercase micro-label — asserted INSIDE the micro rule,
    // not anywhere in the sheet (M4).
    const micro = bareCss.match(/\.micro[^{]*\{([^}]*)\}/);
    expect(micro, 'no .micro rule').toBeTruthy();
    expect(micro[1]).toMatch(/text-transform:\s*uppercase/);
    expect(micro[1]).toMatch(/letter-spacing:\s*\.12em/);
  });

  it('(4) ids, dates and counts are tabular — a column that does not wobble', () => {
    // Each assertion is scoped to the rule that actually needs the property; a
    // sheet-wide `toMatch` passes even if the one element that wobbles lost it.
    // Escape EVERY regex metacharacter, not just the two a CSS selector
    // usually carries. The `[.#]`-only form was flagged high by CodeQL
    // (js/incomplete-sanitization: backslashes survive), and it is the right
    // call even though every `sel` here is a source literal — a partial
    // escaper is the shape that becomes a bug the first time someone passes
    // it something it did not anticipate.
    const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const rule = (sel) => {
      const m = bareCss.match(new RegExp(`(?:^|\\n)\\s*${escapeRe(sel)}\\s*[^{]*\\{([^}]*)\\}`));
      expect(m, `no ${sel} rule`).toBeTruthy();
      return m[1];
    };
    expect(rule('.meta')).toMatch(/font-variant-numeric:\s*tabular-nums/);
    expect(rule('#freshness')).toMatch(/font-variant-numeric:\s*tabular-nums/);
    // The graph note moved INTO the instrument rail in the Task-268 redesign.
    // The contract is that the rail's figures are tabular, not that a
    // `#graph-note` selector exists — assert the contract, on BOTH of the
    // rail's number columns (the stat list and the legend's per-cluster count).
    expect(rule('.rail dd')).toMatch(/font-variant-numeric:\s*tabular-nums/);
    expect(rule('.key .n')).toMatch(/font-variant-numeric:\s*tabular-nums/);
    // The mono stack carries tabular figures AND slashed-zero for id/hash columns.
    const mono = bareCss.match(/code,\s*\.mono\s*\{([^}]*)\}/);
    expect(mono, 'no code/.mono rule').toBeTruthy();
    expect(mono[1]).toMatch(/tabular-nums/);
    expect(mono[1]).toMatch(/slashed-zero/);
  });

  it('(4b) the graph is the hero — it sizes to the window, above the fold', () => {
    // ORIGINAL BUG: the Task-268 redesign shipped `.instrument { }` with a
    // FIXED `#graph { height: 620px }` under ~350px of eyebrow + headline +
    // explanatory paragraph. On a 900px laptop that put the hero BELOW THE
    // FOLD — you had to scroll down to see the thing the view exists for —
    // and pinned the rail to `max-height: 620px`, hiding its own legend
    // behind an internal scrollbar. The user's report: "i want to see the
    // graph in the page, why do i need to go down and why do i need to move
    // it so i can see the Reading it?"
    //
    // The contract is VIEWPORT-RELATIVE SIZING, not any particular number:
    // a future redesign may retune the subtraction, but it may not go back
    // to a fixed pixel box that ignores the window.
    const instrument = bareCss.match(/\n\s*\.instrument\s*\{([^}]*)\}/);
    expect(instrument, 'no .instrument rule').toBeTruthy();
    // Sizes to the window...
    expect(instrument[1]).toMatch(/height:\s*calc\(100dvh\s*-/);
    // ...with a `vh` fallback first for engines that do not know `dvh`, and a
    // floor so a short window cannot collapse the canvas to nothing.
    expect(instrument[1]).toMatch(/height:\s*calc\(100vh\s*-/);
    expect(instrument[1]).toMatch(/min-height:\s*\d+px/);
    expect(instrument[1].indexOf('100vh')).toBeLessThan(instrument[1].indexOf('100dvh'));

    // The canvas fills that box rather than declaring its own fixed height.
    const graph = bareCss.match(/\n\s*#graph\s*\{([^}]*)\}/);
    expect(graph, 'no #graph rule').toBeTruthy();
    expect(graph[1]).toMatch(/height:\s*100%/);

    // The rail stretches with the instrument instead of clipping its legend.
    const rail = bareCss.match(/\n\s*\.rail\s*\{([^}]*)\}/);
    expect(rail, 'no .rail rule').toBeTruthy();
    expect(rail[1]).not.toMatch(/max-height:\s*\d+px/);

    // Stacked (narrow) layout opts OUT: graph and rail become siblings in one
    // column, so a viewport-height instrument would cramp both.
    const stacked = bareCss.match(/@media \(max-width: 900px\)\s*\{([\s\S]*?)\n\s{2}\}/);
    expect(stacked, 'no 900px breakpoint').toBeTruthy();
    expect(stacked[1]).toMatch(/\.instrument\s*\{[^}]*height:\s*auto/);

    // B1: the subtraction is calibrated against the QUIET health strip. When a
    // check fails the strip becomes a full-width bar and wraps the freshness
    // stamp onto its own line — the status line grows ~45px and the instrument
    // overflows into exactly the scrollbar this rule exists to prevent, a beat
    // after load (the strip paints when the health read lands). So the loud
    // states must subtract MORE, and the two numbers must stay ordered.
    const quiet = Number(instrument[1].match(/calc\(100dvh\s*-\s*(\d+)px\)/)[1]);
    const loud = bareCss.match(
      /body:has\(#health-strip\[data-state="warn"\]\)[\s\S]{0,200}?\{([^}]*)\}/,
    );
    expect(loud, 'no warn/bad instrument-height override').toBeTruthy();
    expect(loud[1]).toMatch(/height:\s*calc\(100vh\s*-/);
    expect(loud[1]).toMatch(/height:\s*calc\(100dvh\s*-/);
    expect(Number(loud[1].match(/calc\(100dvh\s*-\s*(\d+)px\)/)[1])).toBeGreaterThan(quiet);
    // …and it must not reach the stacked layout, where the instrument is
    // `height: auto` — a `:has()` selector out-specifies the media-query rule.
    const guarded = bareCss.match(/@media \(min-width: 901px\)\s*\{([\s\S]*?)\n\s{2}\}/);
    expect(guarded, 'the :has() override is not gated above the stacked breakpoint').toBeTruthy();
    expect(guarded[1]).toContain('#health-strip[data-state="warn"]');
    expect(guarded[1]).toContain('#health-strip[data-state="bad"]');

    // M2: the negative margin that claws back `main`'s footer padding is for
    // windows tall enough for the instrument to fill — below the floor the page
    // scrolls anyway and the rule just eats the footer.
    const tall = bareCss.match(/@media \(min-height: \d+px\)\s*\{([\s\S]*?)\n\s{2}\}/);
    expect(tall, 'the graph margin rule is not inside a min-height media block').toBeTruthy();
    expect(tall[1]).toMatch(/section\[data-view="graph"\]\s*\{[^}]*margin-bottom:\s*-\d+px/);
  });

  it('(5) the record rhythm is sane — rows share a boundary, so nothing floats', () => {
    // ORIGINAL BUG: card padding (13px) was SMALLER than the gap between cards
    // (9px), so cards crowded each other more than their own contents.
    //
    // The Task-268 redesign replaced floating cards with ROWS inside one
    // bounded surface, which makes that failure structurally impossible —
    // there is no inter-card gap left to invert. The surviving contract is
    // that a row has real internal padding and a hairline between rows.
    const row = bareCss.match(/\n\s*\.row\s*\{([^}]*)\}/);
    expect(row, 'no .row rule').toBeTruthy();
    const padY = Number((row[1].match(/padding:\s*(\d+)px/) || [])[1]);
    expect(padY, 'the row has no vertical padding').toBeGreaterThanOrEqual(10);
    expect(row[1]).toMatch(/border-top:\s*1px solid/);
    expect(bareCss).toMatch(/\.rows\s*\{[^}]*overflow:\s*hidden/);
  });

  it('(6) the header is sticky + blurred and the tabs are real pills, not a seam trick', () => {
    // Scoped INSIDE the rule: `header {[\s\S]*?position: sticky` would happily
    // match a `position: sticky` in some later, unrelated rule (M4).
    const header = bareCss.match(/(?:^|\n)\s*header\s*\{([^}]*)\}/);
    expect(header, 'no header rule').toBeTruthy();
    expect(header[1]).toMatch(/position:\s*sticky/);
    expect(header[1]).toMatch(/backdrop-filter:/);
    // The seam trick: a tab that fakes "in front" with `border-bottom: none`.
    expect(bareCss).not.toMatch(/border-bottom:\s*none/);
    expect(bareCss).toMatch(/nav a\[aria-current="page"\]\s*\{[\s\S]*?background:\s*rgba\(var\(--accent-rgb\)/);
  });

  it('(7) the health strip is a PILL when ok and a bar only when it is not', () => {
    const strip = bareCss.match(/#health-strip\s*\{([\s\S]*?)\}/);
    expect(strip, 'no #health-strip rule').toBeTruthy();
    expect(strip[1]).toMatch(/display:\s*inline-flex/);
    const loud = bareCss.match(
      /#health-strip\[data-state="warn"\][\s\S]{0,200}?\{([\s\S]*?)\}/,
    );
    expect(loud[1]).toMatch(/display:\s*flex/);
    expect(loud[1]).toMatch(/width:\s*100%/);
    // The SHAPE changed; the state semantics did not (§24.1.1 B1 fold).
    for (const state of ['ok', 'warn', 'queued', 'bad']) {
      expect(bareCss).toContain(`#health-strip[data-state="${state}"]`);
    }
    expect(script).toMatch(/severity === 'memory-off' \? 'bad' : 'warn'/);
  });

  it('(I2) `queued` keeps the QUIET shape — the ratified call, pinned structurally', () => {
    // Ratified 2026-08-03 (D-420): on §24.1.1's precedence ladder `queued` sits
    // one rung above all-clear, so it stays an inline pill and the bar is
    // reserved for warn/bad. That decision lived only in prose and a CSS
    // comment, which is the D-169 gap — a later editor "fixing" the literal
    // reading of "a bar when not ok" would silently undo it.
    //
    // Every rule that grants the bar treatment must be keyed to warn or bad
    // ONLY; none of them may name `queued`.
    // Comments are stripped first (`bareCss`, hoisted into the beforeEach): the
    // CSS comment ABOVE the bar rule explains why queued is excluded, and
    // matching selector text against the raw sheet picks that prose up as if it
    // were a selector.
    const barRules = [...bareCss.matchAll(/([^{}]*?)\{([^}]*?)\}/g)]
      .filter(([, , body]) => /width:\s*100%/.test(body) && /display:\s*flex/.test(body))
      .map(([, sel]) => sel.trim())
      .filter((sel) => sel.includes('#health-strip'));
    expect(barRules.length, 'no bar-shaped #health-strip rule found at all').toBeGreaterThan(0);
    for (const sel of barRules) {
      expect(sel, `the bar treatment must not reach queued: ${sel}`).not.toMatch(/queued/);
      expect(sel).toMatch(/warn|bad/);
    }
    // …and `queued` must still be styled (colour), just not shaped like an alarm.
    const queued = bareCss.match(/#health-strip\[data-state="queued"\]\s*\{([\s\S]*?)\}/);
    expect(queued, 'queued lost its styling entirely').toBeTruthy();
    expect(queued[1]).not.toMatch(/width:\s*100%/);
    expect(queued[1]).toMatch(/background:\s*rgba\(/);
  });

  it('(8) the graph drops unlinked nodes, halos its labels, and lifts supersession', () => {
    // Degree-0 nodes were a picture-frame of orphan dots the layout never
    // relaxed. They are still COUNTED — nothing disappears silently.
    expect(script).toMatch(/const linked = data\.nodes\.filter/);
    expect(script).toMatch(/unlinked, not drawn/);
    // I6: the hover peek is LIVE feedback and goes ABOVE the static "Reading
    // it" key. Appended last, it landed below the rail's own fold on a rail
    // that just fits — pointing at a node then produced nothing visible at all.
    expect(script).toMatch(/rail\.insertBefore\(box,\s*key\)/);
    expect(script).toMatch(/el\('div', \{ id: 'rail-key' \}/);

    // A standing label is earned by degree; the rest appear on hover/focus.
    expect(script).toMatch(/LABEL_AT/);
    expect(bareCss).toMatch(/#graph text\.lbl\s*\{[\s\S]*?opacity:\s*0/);
    expect(bareCss).toMatch(/#graph \.node:hover text\.lbl/);
    // Halos, so a label survives being drawn over a dot.
    expect(bareCss).toMatch(/paint-order:\s*stroke/);
    // Supersession is the one directed claim on the canvas — it reads louder.
    const base = Number(bareCss.match(/#graph \.edge\s*\{\s*stroke-opacity:\s*([\d.]+)/)[1]);
    const sup = Number(bareCss.match(/#graph \.edge-super\s*\{\s*stroke-opacity:\s*([\d.]+)/)[1]);
    expect(sup).toBeGreaterThan(base);
  });

  it('(B1) the DETAIL view keeps its list markers and its line breaks', () => {
    // The list view flattens to one line and strips markers on purpose; the
    // DETAIL view renders the record's real multi-line body and must not.
    // Shipped bug: `factText` hardcoded the strip, so a 7-line bullet headline
    // rendered as "What changed: Card text" over six UNMARKED lines whose first
    // was the decapitated tail of item 1 — while `richBody`, two blocks lower
    // on the SAME page, printed its markers correctly.
    //
    // Run the page's own rendering code against a ~20-line element shim: no DOM
    // dependency (the §24.1 point 7 contract), but real behaviour instead of a
    // grep. If the region markers ever move, this fails loudly rather than
    // silently testing nothing.
    const region = script.match(/\/\/ #region text-render([\s\S]*?)\/\/ #endregion text-render/);
    expect(region, 'the text-render region markers are gone from viewer-page.html').toBeTruthy();

    const make = (tag) => ({
      tagName: tag,
      className: '',
      childNodes: [],
      set textContent(v) { this.childNodes = [String(v)]; },
      get textContent() {
        return this.childNodes.map((k) => (typeof k === 'string' ? k : k.textContent)).join('');
      },
      setAttribute() {},
      append(...kids) { this.childNodes.push(...kids); },
    });
    const el = (tag, props = {}, kids = []) => {
      const n = make(tag);
      for (const [k, v] of Object.entries(props)) {
        if (k === 'class') n.className = v;
        else if (k === 'text') n.textContent = v;
      }
      for (const kid of [kids].flat()) if (kid) n.append(kid);
      return n;
    };
    const factText = new Function('el', `${region[1]}; return factText;`)(el);

    // A real fact shape from the corpus: a bold lead-in, then a bullet list.
    const headline =
      '**What changed:**\n' +
      '- Card text: 15px semibold titles + muted body\n' +
      '- Badges: tinted fills instead of outlines\n' +
      '- Graph: 160 orphan nodes removed';

    // clamp=false is the DETAIL view.
    const [title, body] = factText(headline, false);
    // The detail title must PRE-WRAP (that is what makes its line breaks
    // render). `.pre` is the class that DOES it — so assert both halves, or the
    // classname is a label with nothing behind it.
    expect(title.className).toMatch(/(^|\s)pre(\s|$)/);
    expect(bareCss).toMatch(/\.pre\s*\{[^}]*white-space:\s*pre-wrap/);
    // …and the title sits in the display tier the redesign introduced (d3 =
    // 20px record title), not in the list's 14.5px `.fact-title`.
    expect(title.className).toMatch(/(^|\s)d3(\s|$)/);
    // The short first line IS the title — it must not swallow the newline and
    // annex the head of the first bullet.
    expect(title.textContent).toBe('What changed:');
    expect(title.textContent).not.toMatch(/Card text/);
    // …and the bold marker became a real element, not literal asterisks.
    expect(title.childNodes.some((k) => k.tagName === 'strong')).toBe(true);
    expect(title.textContent).not.toContain('*');

    expect(body).toBeTruthy();
    // Markers preserved, list structure preserved, and the block is pre-wrapped
    // so the line breaks actually render.
    expect(body.className).toMatch(/\bpre\b/);
    expect(body.textContent.split('\n')).toHaveLength(3);
    for (const line of body.textContent.split('\n')) expect(line).toMatch(/^- /);
    expect(body.textContent).toContain('- Card text: 15px semibold titles + muted body');
    expect(body.textContent).toContain('- Graph: 160 orphan nodes removed');

    // The LIST view (clamp=true) keeps the opposite contract on the same input:
    // one flat line, markers gone, clamped.
    const [lTitle, lBody] = factText(headline, true);
    expect(lTitle.className).toMatch(/clamp-2/);
    expect(lBody.className).toMatch(/clamp-2/);
    expect(lBody.className).not.toMatch(/\bpre\b/);
    expect(lBody.textContent).not.toMatch(/^- /m);

    // Over-mutation guard: splitting a title must not drop or duplicate a
    // single character of the record. Title + separator + body === the input
    // with only its markdown syntax resolved.
    const roundTrip = title.textContent + '\n' + body.textContent;
    expect(roundTrip).toBe(headline.replace(/\*\*/g, ''));
  });

  it('markdown in a snippet is TOKENIZED to elements — never parsed as HTML', () => {
    // `**Global install**:` rendered literally in the user's own screenshot.
    // The fix must not become an HTML parser: every span becomes an element
    // this code created, with its text set as text.
    expect(script).toMatch(/MD_INLINE/);
    expect(script).toMatch(/el\('code', \{ text: seg\.s \}\)/);
    expect(script).toMatch(/el\('strong', \{ text: seg\.s \}\)/);
    expect(script).toMatch(/el\('b', \{ text: seg\.s \}\)/);
    // No markup is ever ASSEMBLED as a string — the shape that precedes an
    // innerHTML. (A bare `'<b>'` literal is fine and is not that: it is the
    // needle the FTS marker is SPLIT on, which is how the highlight became
    // real elements in the first place.)
    expect(script).not.toMatch(/['"`]<\/?\w+[^'"`]*>['"`]\s*\+/);
    expect(script).not.toMatch(/\+\s*['"`]\s*<\/?\w+/);
    expect(script).not.toMatch(/`[^`]*<\w+[^`]*\$\{/);
  });

  it('the tier filter is a control, not a paragraph — prose moved to title=', () => {
    // It rendered 335px wide because its option labels were sentences.
    const options = [...html.matchAll(/<option value="[PLU]"[^>]*>([^<]*)<\/option>/g)].map((m) => m[1]);
    expect(options).toHaveLength(3);
    for (const label of options) expect(label.length).toBeLessThanOrEqual(14);
    expect(html).toMatch(/<option value="P" title="[^"]{10,}"/);
  });

  it('motion is guarded and the focus ring is keyboard-only', () => {
    const guard = bareCss.match(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]*?)\n  \}/);
    expect(guard, 'no prefers-reduced-motion guard').toBeTruthy();
    expect(guard[1]).toMatch(/transition-duration:[^;]*!important/);
    expect(guard[1]).toMatch(/animation-duration:[^;]*!important/);
    // Every transition this page declares lives above the guard, and the guard
    // is a `*` rule — so a new one cannot escape it.
    expect(guard[1]).toMatch(/\*,\s*\*::before,\s*\*::after/);

    expect(bareCss).toMatch(/:focus-visible\s*\{[\s\S]*?outline:/);
    // A mouse click must not leave a ring behind.
    expect(bareCss).toMatch(/:focus\s*\{\s*outline:\s*none/);
    expect(bareCss).not.toMatch(/[^-]:focus\s*\{[^}]*outline:\s*2px/);
  });

  it('the fonts are SYSTEM fonts, with the survey’s two corrections held', () => {
    // Anchored to the `--ui:` DECLARATION, not to "somewhere in the sheet":
    // an unanchored match survives deleting the token it is supposed to pin.
    expect(bareCss).toMatch(/--ui:\s*system-ui,\s*-apple-system,\s*"Segoe UI"/);
    expect(bareCss).toMatch(/--display:\s*system-ui,\s*-apple-system,\s*"Segoe UI"/);
    expect(bareCss).toMatch(/--mono:\s*ui-monospace,\s*SFMono-Regular/);
    // The survey's second correction, and the one design §24.1.2 ratifies:
    // `system-ui` on Windows 11 resolves to Segoe UI, NOT the Variable face
    // (Firefox bug 1732404, RESOLVED WONTFIX — Windows reports Segoe UI as its
    // menu font), so naming the Variable family buys an inconsistent face on
    // the machines that happen to have it and nothing anywhere else. The
    // Task-268 redesign named it first and deleted this line; the contract is
    // in the spec, so the spec wins and the guard comes back.
    // …on the comment-stripped sheet: the token block's own prose NAMES the
    // family it is rejecting ("the Segoe UI *Variable* families deliberately NOT
    // named"), and that line is one asterisk away from failing this assertion
    // for saying the right thing. A rule about CSS reads CSS (M6).
    expect(bareCss).not.toContain('Segoe UI Variable');
    // The ONE assertion here that stays on the RAW sheet, deliberately: "zero
    // fetched bytes" is a claim about the bytes the browser receives, and a
    // CDN URL or an @import parked in a comment is exactly the thing worth
    // failing on — it is a fetch one uncomment away. (Same reasoning as the
    // 404-page test, which scans a whole served body for `http(s)://`.)
    expect(css).not.toMatch(/@font-face|@import|url\(\s*['"]?https?:/i);
  });

  it('the pass changed skin only — every §24 behavior marker is still in place', () => {
    // A visual pass that quietly moved a contract would be the expensive kind
    // of regression, so the markers the behavior tests key on are re-asserted
    // here, in the file that changed.
    expect(script).toMatch(/factsSeq/);
    expect(script).toMatch(/api\('\/health\?strip=1'\)/);
    expect(script).toMatch(/repaintStripFrom/);
    expect(script).toContain('commands.forget');
    expect(script).toContain('commands.trust_options');
    expect(script).toContain('data.state_note');
    expect(script).toMatch(/clipboard\.writeText/);
    expect(script).not.toMatch(/method:\s*['"](?:POST|PUT|PATCH|DELETE)['"]/i);
    expect(script).not.toMatch(/EventSource|new WebSocket/);
    // And no HTML-parsing sink crept in with the new renderer.
    for (const sink of ['innerHTML', 'outerHTML', 'insertAdjacentHTML', 'document.write', 'srcdoc', 'setHTML', 'createContextualFragment', 'DOMParser']) {
      expect(script, `${sink} appeared in the visual pass`).not.toContain(sink);
    }
  });
});

describe('viewer — the `cmk view` CLI glue (255.1)', () => {
  it('is registered as a verb with the documented flags', () => {
    const sub = subcommands.find((s) => s.name === 'view');
    expect(sub).toBeTruthy();
    const flags = sub.optionSpec.map((o) => o.flags);
    expect(flags).toEqual(
      expect.arrayContaining(['--port <n>', '--host <host>', '--no-open', '--project <dir>']),
    );
    // The description must state the two properties a user needs to trust it.
    expect(sub.description).toMatch(/read-only/i);
    expect(sub.description).toMatch(/127\.0\.0\.1/);
  });

  it('passes cwd + the user tier through, holds nothing when deps.hold is false', async () => {
    const seen = [];
    const r = await runView(
      {},
      undefined,
      {
        hold: false,
        userDir,
        log: () => {},
        logError: () => {},
        startViewer: (o) => {
          seen.push(o);
          return { action: 'listening', url: 'http://127.0.0.1:1/', host: o.host, port: 1, close: async () => {} };
        },
      },
    );
    expect(r.action).toBe('listening');
    expect(seen[0].host).toBe('127.0.0.1');
    expect(seen[0].port).toBe(0);
    expect(seen[0].open).toBe(true);
    expect(seen[0].userDir).toBe(userDir);
    expect(seen[0].signals).toEqual(['SIGINT', 'SIGTERM']);
  });

  it('--no-open reaches the module as open:false', async () => {
    const seen = [];
    await runView({ open: false }, undefined, {
      hold: false,
      log: () => {},
      logError: () => {},
      startViewer: (o) => {
        seen.push(o);
        return { action: 'listening', url: 'u', host: o.host, port: 1, close: async () => {} };
      },
    });
    expect(seen[0].open).toBe(false);
  });

  it('a bad --port is rejected before anything binds (exit 2)', async () => {
    const errs = [];
    let started = false;
    for (const bad of ['abc', '-1', '70000', '80.5']) {
      process.exitCode = 0;
      await runView({ port: bad }, undefined, {
        hold: false,
        log: () => {},
        logError: (e) => errs.push(e),
        startViewer: () => {
          started = true;
          return { action: 'listening', url: 'u', host: 'h', port: 1, close: async () => {} };
        },
      });
      expect(process.exitCode).toBe(2);
    }
    process.exitCode = 0;
    expect(started).toBe(false);
    expect(errs.join(' ')).toMatch(/--port must be an integer/);
  });

  it('an error result becomes a printed reason + exit 2, never a stack', async () => {
    const errs = [];
    process.exitCode = 0;
    await runView({ host: '0.0.0.0', project: projectRoot }, undefined, {
      hold: false,
      log: () => {},
      logError: (e) => errs.push(String(e)),
    });
    expect(process.exitCode).toBe(2);
    process.exitCode = 0;
    expect(errs.join(' ')).toMatch(/cmk view: refusing to bind 0\.0\.0\.0/);
    expect(errs.join(' ')).not.toMatch(/at .*viewer\.mjs/); // no stack
  });
});

/**
 * I2 — a read-only guard that compares only PATHS proves nothing: the viewer
 * could rewrite every byte of every fact and the set of filenames would be
 * identical. Snapshot the path AND size AND mtime AND a content hash, so
 * "unchanged" means unchanged.
 */
function snapshotTier(root) {
  const base = join(root, 'context');
  const out = [];
  const walk = (dir, rel) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const next = rel ? `${rel}/${e.name}` : e.name;
      const abs = join(dir, e.name);
      if (e.isDirectory()) {
        walk(abs, next);
        continue;
      }
      const st = statSync(abs);
      out.push(
        [
          next,
          st.size,
          st.mtimeMs,
          createHash('sha256').update(readFileSync(abs)).digest('hex'),
        ].join('|'),
      );
    }
  };
  if (existsSync(base)) walk(base, '');
  return out.sort();
}
