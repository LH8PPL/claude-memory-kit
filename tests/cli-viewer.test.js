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

function seedFact({ id, tier, slug, body, related, root }) {
  const r = writeFact({
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

    const none = await getJson(base, '/api/facts?q=zzzznotpresent');
    expect(none.body.count).toBe(0);
    expect(none.body.facts).toEqual([]);
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
    expect(body.checks.length).toBe(14);
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
    // The strip renders on every view; paying 14 checks (one of them a
    // subprocess probe) per navigation to draw one line is the difference
    // between a viewer that feels instant and one that feels broken.
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
    const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
    const SINKS = [
      'innerHTML',
      'outerHTML',
      'insertAdjacentHTML',
      'document.write',
      'srcdoc',
      'setHTML',
      'createContextualFragment',
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
    const m = html.match(/<script>([\s\S]*?)<\/script>/);
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
