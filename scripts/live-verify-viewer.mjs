#!/usr/bin/env node
// Live-verify: `cmk view`, the read-only memory viewer (Task 255, design §24).
//
// WHY THIS EXISTS SEPARATELY FROM THE SUITE. Every unit test in
// tests/cli-viewer.test.js calls `startViewer` in-process. That structurally
// cannot see the things that actually break a CLI server: the bin's argv
// parsing, commander's `--no-open` negation reaching the module, whether the
// process STAYS ALIVE after the action returns, whether the port is released on
// Ctrl-C, and whether the committed HTML file is even present in the tree the
// bin resolves. Those are exactly the unit-green-integration-broken class the
// live-test rule exists for — so this drives the REAL bin as a subprocess and
// talks to it over REAL HTTP.
//
// Sandboxed throughout: a throwaway project dir + an isolated MEMORY_KIT_USER_DIR,
// so it can never touch real memory. Zero LLM calls, zero network beyond
// loopback — the whole viewer path is deterministic, so this is cheap and safe
// to run any time.
//
// Run: npm run live-verify:viewer   [--keep] [--verbose]

import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { request as httpRequest } from 'node:http';
import { connect as netConnect } from 'node:net';
import { tmpdir, platform } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const IS_WIN = platform() === 'win32';
const REPO_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const CMK = join(REPO_ROOT, 'packages', 'cli', 'bin', 'cmk.mjs');
const KEEP = process.argv.includes('--keep');
const VERBOSE = process.argv.includes('--verbose');

const log = (...a) => console.log('[live-verify:viewer]', ...a);
const vlog = (...a) => VERBOSE && console.log('[live-verify:viewer]', ...a);

const results = [];
function check(label, ok, detail = '') {
  results.push({ label, ok, detail });
  log(`  ${ok ? 'PASS' : 'FAIL'} — ${label}${ok || !detail ? '' : ` (${detail})`}`);
}

/** One raw HTTP request. Raw on purpose: `fetch` refuses to send a Host
 *  override or a TRACE method, and both are under test here. */
function http(url, { method = 'GET', headers = {} } = {}) {
  const u = new URL(url);
  return new Promise((resolve, reject) => {
    const req = httpRequest(
      { host: u.hostname, port: u.port, path: u.pathname + u.search, method, headers, timeout: 20_000 },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          let json = null;
          try { json = JSON.parse(body); } catch { /* html or error page */ }
          resolve({ status: res.statusCode, headers: res.headers, body, json });
        });
      },
    );
    req.on('timeout', () => req.destroy(new Error('request timed out')));
    req.on('error', reject);
    req.end();
  });
}

/**
 * Write a request line to a RAW socket, byte for byte, and return the whole
 * response text. Needed because every HTTP client in Node normalizes `..` out
 * of a path before sending — so a traversal test built on one of them never
 * actually asks the server the question it thinks it is asking (M6).
 */
function rawLine(base, requestLine) {
  const u = new URL(base);
  return new Promise((resolve, reject) => {
    const sock = netConnect({ host: u.hostname, port: Number(u.port) }, () => {
      sock.write(`${requestLine}\r\nHost: 127.0.0.1:${u.port}\r\nConnection: close\r\n\r\n`);
    });
    let body = '';
    sock.setTimeout(15_000, () => sock.destroy(new Error('raw request timed out')));
    sock.on('data', (c) => { body += c; });
    sock.on('end', () => resolve(body));
    sock.on('error', reject);
  });
}

function runCmk(args, { cwd, env, timeout = 120_000 } = {}) {
  const r = spawnSync(process.execPath, [CMK, ...args], { cwd, env, encoding: 'utf8', timeout });
  vlog(`cmk ${args.join(' ')} -> exit=${r.status}\n${r.stdout ?? ''}${r.stderr ?? ''}`);
  return r;
}

/** Start `cmk view` for real and wait for it to print its URL. */
function startView(args, { cwd, env }) {
  const child = spawn(process.execPath, [CMK, 'view', ...args], { cwd, env });
  let out = '';
  let err = '';
  child.stdout.on('data', (c) => { out += c; });
  child.stderr.on('data', (c) => { err += c; });
  const url = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`no URL printed in 30s. stdout=${out} stderr=${err}`)), 30_000);
    const scan = () => {
      const m = out.match(/http:\/\/[^\s]+/);
      if (m) { clearTimeout(timer); resolve(m[0]); }
    };
    child.stdout.on('data', scan);
    child.on('exit', (code) => {
      clearTimeout(timer);
      reject(new Error(`cmk view exited early (${code}). stdout=${out} stderr=${err}`));
    });
    scan();
  });
  return { child, url, get out() { return out; }, get err() { return err; } };
}

async function main() {
  const root = mkdtempSync(join(tmpdir(), 'cmk-viewer-live-'));
  const userDir = join(root, 'userdir');
  const proj = join(root, 'project');
  const bare = join(root, 'not-a-kit-project');
  mkdirSync(userDir, { recursive: true });
  mkdirSync(proj, { recursive: true });
  mkdirSync(bare, { recursive: true });
  log(`sandbox: ${root}`);

  const env = { ...process.env, MEMORY_KIT_USER_DIR: userDir, CMK_PROJECT_DIR: proj };
  let server = null;

  try {
    // ---- a REAL corpus, written through the REAL write path ----------------
    const inst = runCmk(['install'], { cwd: proj, env });
    if (inst.status !== 0) throw new Error(`cmk install failed: ${inst.stderr}`);
    runCmk([
      'remember', 'We pin the release toolchain to the .nvmrc version',
      '--why', 'a benchmark once measured a different runtime than production',
      '--how', 'every CI setup-node block reads node-version-file',
      '--type', 'project', '--title', 'toolchain pinning',
    ], { cwd: proj, env });
    runCmk(['remember', 'The deploy target is the eu-west region'], { cwd: proj, env });
    runCmk(['digest'], { cwd: proj, env }); // populates context/DECISIONS.md

    // A REAL supersession edge, so the graph check below is not vacuous: an
    // `edges.every(...)` over an EMPTY array passes no matter what the route
    // returns, which is exactly the kind of green that means nothing. The
    // successor is a genuine fact the real bin just wrote; only the archived
    // predecessor is a fixture, written where the kit itself archives one.
    const factsDir = join(proj, 'context', 'memory');
    const successorId = readdirSync(factsDir)
      .filter((n) => n.endsWith('.md') && n !== 'INDEX.md' && n !== 'MAP.md')
      .map((n) => /^id:\s*([PUL]-\S+)$/m.exec(readFileSync(join(factsDir, n), 'utf8'))?.[1])
      .find(Boolean);
    if (!successorId) throw new Error('no seeded fact id found — the corpus did not write');
    const archDir = join(factsDir, 'archive', 'superseded');
    mkdirSync(archDir, { recursive: true });
    const predecessorId = 'P-2DZG7XF4';
    writeFileSync(
      join(archDir, `${predecessorId}.md`),
      [
        '---',
        `id: ${predecessorId}`,
        'type: project',
        'title: the previous toolchain rule',
        'created_at: 2026-07-01T09:00:00Z',
        'write_source: user-explicit',
        'trust: high',
        'source_file: user-explicit',
        'source_line: 1',
        `source_sha1: ${'a'.repeat(64)}`,
        `superseded_by: ${successorId}`,
        '---',
        '',
        'We used to pin the toolchain by hand in each workflow.',
        '',
      ].join('\n'),
      'utf8',
    );
    runCmk(['reindex', '--full'], { cwd: proj, env }); // build the edges table
    log(`corpus seeded through the real bins (supersession ${predecessorId} → ${successorId})`);

    // ---- 1. the real bin serves, and STAYS UP ------------------------------
    server = startView(['--no-open'], { cwd: proj, env });
    const url = await server.url;
    const base = url.replace(/\/$/, '');
    check('the real bin binds loopback and prints its URL', /^http:\/\/127\.0\.0\.1:\d+\/$/.test(url), url);

    // The property no in-process test can see: commander's action returned and
    // the process did NOT exit. Give it a beat, then prove it still answers.
    // (The banner's second line lands on a separate stdout chunk — read it
    // after the settle, not in the same tick the URL arrived.)
    await new Promise((r) => setTimeout(r, 400));
    check(
      '--no-open still prints the URL + the read-only banner (the fallback contract)',
      server.out.includes(url) && server.out.includes('read-only') && server.out.includes('Ctrl-C'),
      server.out.trim(),
    );
    const page = await http(`${base}/`);
    check(
      'GET / serves the committed HTML page from the real install tree',
      page.status === 200 && /text\/html/.test(page.headers['content-type']) && page.body.includes('data-view="graph"'),
      `status=${page.status} len=${page.body.length}`,
    );
    check(
      'the page is fully offline — no external src/href survives into the served bytes',
      [...page.body.matchAll(/(?:src|href)\s*=\s*["']([^"']+)["']/gi)].every((m) => !/^(?:https?:)?\/\//i.test(m[1])),
    );

    // ---- 2. all five API routes answer on real data ------------------------
    const facts = await http(`${base}/api/facts`);
    check(
      '/api/facts returns the facts the real bins just wrote',
      facts.status === 200 && facts.json.count >= 2 && facts.json.facts.every((f) => 'PLU'.includes(f.tier)),
      `count=${facts.json?.count}`,
    );
    const search = await http(`${base}/api/facts?q=toolchain`);
    check(
      '/api/facts?q= finds it through the real FTS index',
      search.status === 200 && search.json.mode === 'search' && search.json.count >= 1,
      `count=${search.json?.count}`,
    );

    const id = facts.json.facts[0].id;
    const detail = await http(`${base}/api/fact/${id}`);
    check(
      '/api/fact/:id returns the body and commands that are REAL as pasted (M8)',
      detail.status === 200 && detail.json.found === true &&
        detail.json.commands.forget === `cmk forget ${id} --yes` &&
        detail.json.commands.trust_options.length === 3 &&
        detail.json.commands.trust_options.filter((o) => !o.current).length === 2,
      `id=${id} status=${detail.status} cmds=${JSON.stringify(detail.json.commands)}`,
    );
    const archived = await http(`${base}/api/fact/${predecessorId}`);
    check(
      'I1: an ARCHIVED fact answers with a state note and NO dead commands',
      archived.status === 200 && archived.json.found === true &&
        archived.json.fact.from_archive === true &&
        archived.json.commands === null &&
        archived.json.state_note.superseded_by === successorId,
      `status=${archived.status} note=${JSON.stringify(archived.json.state_note)}`,
    );
    check(
      'M1: the archived fact reports a tier-prefixed path, like a live row',
      archived.json.fact.source_file === `context/memory/archive/superseded/${predecessorId}.md`,
      `source_file=${archived.json.fact.source_file}`,
    );

    const graph = await http(`${base}/api/graph`);
    check(
      '/api/graph returns a NON-EMPTY edge set, every endpoint present as a node',
      graph.status === 200 &&
        Array.isArray(graph.json.nodes) &&
        graph.json.edges.length > 0 && // an every() over [] is a green that means nothing
        graph.json.edges.every((e) => graph.json.nodes.some((n) => n.id === e.src) && graph.json.nodes.some((n) => n.id === e.dst)),
      `nodes=${graph.json?.nodes?.length} edges=${graph.json?.edges?.length}`,
    );
    check(
      'the seeded supersession appears as a DIRECTED edge, old → new',
      graph.json.edges.some((e) => e.type === 'superseded_by' && e.src === predecessorId && e.dst === successorId) &&
        graph.json.nodes.find((n) => n.id === predecessorId)?.superseded === true,
      `edges=${JSON.stringify(graph.json.edges?.filter((e) => e.type === 'superseded_by'))}`,
    );

    const health = await http(`${base}/api/health`);
    check(
      '/api/health runs the REAL doctor (14 checks) and pins a health strip',
      health.status === 200 && health.json.checks.length === 14 && ['ok', 'warn'].includes(health.json.strip.state),
      `checks=${health.json?.checks?.length} strip=${health.json?.strip?.state}`,
    );
    // M7 was tautological: it compared the strip against a doctor line on a
    // sandbox where BOTH were clean, so it passed by matching nothing to
    // nothing. B1 is the real question — does the pinned line stay green while
    // the doctor table under it turns red? Seed a doctor-VISIBLE failure the
    // health log cannot know about (an unregistered hook never runs, so it
    // never logs) and demand the strip follows.
    const stripBefore = await http(`${base}/api/health?strip=1`);
    check(
      'baseline: the quick-check strip is green and says only what it can prove',
      stripBefore.json.strip.state === 'ok' &&
        stripBefore.json.strip.text === 'no failures recorded (quick check)',
      `strip=${JSON.stringify(stripBefore.json.strip)}`,
    );

    rmSync(join(proj, '.claude', 'settings.json'), { force: true }); // unwire the hooks
    const broken = await http(`${base}/api/health`);
    const doctor = runCmk(['doctor'], { cwd: proj, env });
    const doctorOut = `${doctor.stdout ?? ''}${doctor.stderr ?? ''}`;
    const hc1Failed = broken.json.checks.find((c) => c.id === 'HC-1')?.status === 'fail';
    check(
      'B1: a doctor FAIL turns the pinned strip non-green, and NAMES the failing check',
      hc1Failed &&
        broken.json.fail_count > 0 &&
        broken.json.strip.state !== 'ok' &&
        broken.json.strip.text.includes('HC-1') &&
        !/passing|fine/i.test(broken.json.strip.text),
      `hc1=${hc1Failed} fails=${broken.json.fail_count} strip=${JSON.stringify(broken.json.strip)}`,
    );
    check(
      'B1: the health LOG is silent about it — which is exactly why the fold was needed',
      Array.isArray(broken.json.active_warnings) && broken.json.active_warnings.length === 0,
      `active_warnings=${JSON.stringify(broken.json.active_warnings)}`,
    );
    check(
      'the viewer and `cmk doctor` agree that HC-1 is failing (one source, two surfaces)',
      // `formatDoctorReport` prints `[FAIL] HC-1: …` — the status leads.
      /\[FAIL\s*\]\s*HC-1:/.test(doctorOut),
      `doctor HC-1 line: ${doctorOut.split(/\r?\n/).filter((l) => /HC-1:/.test(l)).join(' | ')}`,
    );
    // Put it back so the later read-only + shutdown checks run against a normal install.
    runCmk(['repair', '--hooks'], { cwd: proj, env });

    const decisions = await http(`${base}/api/decisions`);
    check(
      '/api/decisions reads the real DECISIONS.md journal',
      decisions.status === 200 && decisions.json.count >= 1 &&
        decisions.json.decisions.some((d) => /toolchain/i.test(d.title ?? '')),
      `count=${decisions.json?.count}`,
    );

    // ---- 3. READ-ONLY, on the real socket ----------------------------------
    const paths = ['/', '/api/facts', `/api/fact/${id}`, '/api/graph', '/api/health', '/api/decisions'];
    const methods = ['POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'TRACE'];
    const refusals = [];
    for (const p of paths) {
      for (const m of methods) {
        const r = await http(base + p, { method: m });
        if (r.status !== 405 || r.headers.allow !== 'GET, HEAD') refusals.push(`${m} ${p} -> ${r.status}`);
      }
    }
    check(
      `read-only: all ${paths.length * methods.length} method×route combinations answer 405 with Allow: GET, HEAD`,
      refusals.length === 0,
      refusals.join('; '),
    );

    // And the tier is untouched by the attempts.
    const stillThere = await http(`${base}/api/facts`);
    check('the corpus survived every write attempt intact', stillThere.json.count === facts.json.count);

    // ---- 4. the two refusals that keep this safe ---------------------------
    const rebind = await http(`${base}/api/facts`, { headers: { host: 'evil.example.com' } });
    check('a request under a foreign Host is refused 403 (DNS-rebinding guard)', rebind.status === 403, `status=${rebind.status}`);

    // M6: sent down a RAW SOCKET. Both `fetch` and node:http normalize `..`
    // out of the path before a byte leaves the process, so the previous check
    // was asking the server about `/package.json` — a path it was never going
    // to serve — and could not have caught a traversal even if one existed.
    // A hand-written request line is the only way the dot segments arrive.
    const traversals = [
      '/../../package.json',
      '/api/fact/../../../package.json',
      '/%2e%2e%2f%2e%2e%2fpackage.json',
      '/..%5c..%5cpackage.json',
    ];
    const leaks = [];
    for (const path of traversals) {
      const r = await rawLine(base, `GET ${path} HTTP/1.1`);
      const leaked = /"name"\s*:\s*"@lh8ppl\/core-memory-kit"/.test(r) || /root:x:/.test(r);
      const ok = / 200 /.test(r.split('\n')[0]) === false || !leaked;
      if (!ok || leaked) leaks.push(`${path} -> ${r.split('\r\n')[0]}`);
    }
    check(
      `no traversal reaches a file — ${traversals.length} raw dot-segment request(s), unnormalized`,
      leaks.length === 0,
      leaks.join('; '),
    );

    // ---- 5. the CLI-level refusals (exit codes, not exceptions) ------------
    const nonLoopback = runCmk(['view', '--host', '0.0.0.0', '--no-open'], { cwd: proj, env, timeout: 30_000 });
    check(
      '`cmk view --host 0.0.0.0` exits 2 with a stated reason, and never binds',
      nonLoopback.status === 2 && /loopback/i.test(nonLoopback.stderr) && /no auth/i.test(nonLoopback.stderr),
      `exit=${nonLoopback.status} stderr=${(nonLoopback.stderr ?? '').trim().slice(0, 200)}`,
    );

    const uninstalled = runCmk(['view', '--no-open'], { cwd: bare, env, timeout: 30_000 });
    check(
      '`cmk view` in a non-kit project explains, exits 2, and scaffolds NOTHING',
      uninstalled.status === 2 &&
        /cmk install/.test(uninstalled.stderr) &&
        !existsSync(join(bare, 'context')) &&
        readdirSync(bare).length === 0,
      `exit=${uninstalled.status} left=${readdirSync(bare).join(',')}`,
    );

    // ---- 6. Ctrl-C releases the port ---------------------------------------
    const port = new URL(url).port;
    const exited = new Promise((resolve) => server.child.once('exit', (code, signal) => resolve({ code, signal })));
    server.child.kill('SIGINT');
    const end = await Promise.race([exited, new Promise((r) => setTimeout(() => r(null), 15_000))]);
    server = null;
    check('SIGINT ends the process (no daemon is left behind)', end !== null, `exit=${JSON.stringify(end)}`);
    let released = false;
    try {
      await http(`http://127.0.0.1:${port}/`);
    } catch {
      released = true;
    }
    check('…and the port is released — the next `cmk view` is not fighting a ghost', released);
    if (IS_WIN) {
      log('  note: Windows has no real SIGINT delivery to a child — the kill is a terminate,');
      log('        so the GRACEFUL half of shutdown (the handler running) is POSIX-only here.');
    } else {
      check('graceful shutdown: the signal handler ran and the process exited 0', end && end.code === 0, JSON.stringify(end));
    }
  } finally {
    if (server) { try { server.child.kill(); } catch { /* already gone */ } }
    if (KEEP) {
      log(`--keep set; sandbox preserved at ${root}`);
    } else {
      try {
        rmSync(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
      } catch (e) {
        log(`cleanup: could not remove ${root} (${e?.code ?? e?.message}); OS will reclaim tmpdir`);
      }
    }
  }

  console.log('');
  log('================ CMK VIEW LIVE VERIFY ================');
  for (const r of results) log(`  ${r.ok ? 'PASS' : 'FAIL'} — ${r.label}`);
  log('=====================================================');
  const failed = results.filter((r) => !r.ok);
  if (failed.length === 0) {
    log('The real bin serves all five views read-only on a real corpus, and lets go of the port.');
    log('NOT covered here (needs a human with a browser): the rendered page itself — layout,');
    log('the graph drawing, the copy buttons, and the actual browser auto-open.');
    process.exit(0);
  }
  log(`${failed.length} check(s) FAILED.`);
  process.exit(1);
}

main().catch((err) => {
  console.error('[live-verify:viewer] ERROR:', err?.stack ?? err);
  process.exit(2);
});
