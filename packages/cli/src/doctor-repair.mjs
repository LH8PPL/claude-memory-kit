// doctor-repair.mjs — the prompt-then-fix half of `cmk doctor --repair`
// (Task 47; the consent gate it implements is NFR-10, Task 48).
//
// WHY THIS IS OPT-IN, AND WHY PLAIN `cmk doctor` DID NOT CHANGE. Every
// doctor-style CLI surveyed for this task is report-only, and each hands the
// user a separately-named command instead: `brew doctor` never fixes,
// `flutter doctor` prints "to resolve this, run: flutter doctor
// --android-licenses", `npm doctor` diagnoses while `npm audit fix` repairs.
// That convergence is a real signal, so the default stays exactly as it was and
// `--repair` has to earn its place — which it does, because the kit's
// recoveries are overwhelmingly its OWN idempotent verbs (`cmk reindex`,
// `cmk register-crons`, `cmk repair --hooks`), not the user's package manager.
//
// THE THREE RULES, each from a verified primary source:
//
//   1. NO TERMINAL IS NEVER AN IMPLICIT YES. `gh` refuses outright when stdin
//      is not a TTY, naming the flag that would have worked. Silent-yes is
//      dangerous; silent-no exits 0 while leaving the system broken, which is
//      the HC-10 false-green class this repo keeps re-learning. We print the
//      commands and name `--yes` — doctor's own non-zero exit already stands,
//      so the run cannot be mistaken for success.
//   2. `--yes` DOES NOT COVER EVERYTHING. `gh repo delete` ignores `--yes` when
//      the target is ambiguous; `apt -y` aborts anyway on held / unauthenticated
//      / essential packages. Anything off the executable allowlist stays
//      print-only under `--yes`, exactly as it is without it.
//   3. DEFAULT-DENY, NOT DENY-LIST. A recovery string the planner does not
//      RECOGNISE is print-only. A deny-list would execute every recovery a
//      future health check invents until someone remembered to add it — and
//      the failure direction of a missed entry would be "we ran it".
//
// CONSIDERED AND REJECTED: npm audit's tiered model, where the safe subset is
// applied with no prompt at all and only the range-changing tier needs a flag.
// It is a good model for a package manager, and it is the wrong one here: the
// whole reason Task 48 exists is that this kit's ask-before-you-change-my-
// machine rule had no requirement backing it, and shipping a no-prompt tier in
// the same change that finally writes that requirement down would be arguing
// both sides. Every runnable repair is offered; none is assumed.
//
// WHAT THIS MODULE DOES NOT DO: decide what "healthy" means, or invent impact
// prose. The plan is built from the checks doctor already produced, and each
// offer shows THAT CHECK'S OWN message. A parallel impact table would drift
// from the messages, and the drifted copy is the one the user would read.

import { spawnSync } from 'node:child_process';
import { appendFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

export const REPAIR_LOG_SCHEMA_VERSION = 1;

/**
 * Every binary `--repair` is willing to launch.
 *
 * EXPORTED SO A VALIDATOR CAN READ IT (scripts/validate-install-consent.mjs).
 * This is the one place in the kit that executes a recovery command, so this
 * list IS the kit's install-execution surface — and NFR-10 says that surface
 * must not grow without someone stating which consent channel gates the
 * addition. Keeping the set as data rather than as `if (bin === 'npm')`
 * scattered through `execRepair` is what makes that checkable at lint time
 * instead of at review time.
 */
export const EXECUTABLE_BINS = Object.freeze(['cmk', 'npm']);

/** A repair is a whole command; a wedged one must not wedge doctor with it. */
const REPAIR_TIMEOUT_MS = 10 * 60 * 1000;

/** `<projectRoot>/context/.locks/doctor-repair.log` — the gitignored run-state tier. */
export function repairLogPath(projectRoot) {
  return join(projectRoot, 'context', '.locks', 'doctor-repair.log');
}

/**
 * A token safe to hand to an exec'd argv. No quote, no space, no shell
 * metacharacter, no angle bracket — so nothing here can be a placeholder, a
 * chained command, a substitution, or a redirect. Since we never use a shell
 * for the kit's own verbs, this is belt AND braces; the braces are the point,
 * because the npm leg does need a shell on Windows to reach `npm.cmd`.
 */
const SAFE_TOKEN = /^[A-Za-z0-9@._/:=-]+$/;

/** Commands whose job is to remove things. Never run automatically, ever. */
const DESTRUCTIVE_HEADS = new Set([
  'rm', 'rmdir', 'del', 'erase', 'unlink', 'truncate',
  'remove-item', 'remove-itemproperty', 'clear-content',
]);

/**
 * The `cmk` verbs `--repair` may run — an ALLOWLIST, not a deny-list.
 *
 * WHY AN ALLOWLIST (the I5 fix, and a deliberate departure from the deny-set
 * that was proposed). Before this, the classifier asked only "is this a
 * registered verb?", so all 42 of them — `purge --all`, `uninstall`, `forget`,
 * `redact` — classified runnable. Nothing reachable emitted those, so the bug
 * was latent; but design §14.1's default-DENY claim rested on a check that did
 * not exist.
 *
 * A deny-set would close today's hole and leave tomorrow's open: a verb added
 * next year would default IN, silently, exactly the failure direction the
 * default-DENY rule was written to avoid. An allowlist defaults OUT. New verbs
 * become print-only until someone adds them here on purpose, and the partition
 * test in tests/cli-doctor-repair.test.js asserts every registered verb lands
 * on one side or the other, so the decision shows up in a diff.
 *
 * Membership rule: the verb must be a REPAIR — idempotent, non-destructive,
 * and something a health check actually prescribes. Every entry below is a
 * literal `recoveryCommand` emitted somewhere in this package (a test scrapes
 * the source and pins that both ways, so an over-eager deny here cannot
 * quietly turn `--repair` into a printer).
 */
export const REPAIR_VERBS = Object.freeze([
  'install', // HC-1 (agent variants), HC-9 scaffold drift, HC-13 stray tiers
  'reindex', // HC-4 INDEX drift, HC-15 vector mapping (--full)
  'repair', // HC-1 --hooks
  'register-crons', // HC-5
  'daily-distill', // HC-2, HC-10
]);

/**
 * Verbs that mutate or remove the user's memory. Not merely absent from
 * REPAIR_VERBS — named, so the printed line says WHY this one is theirs to run
 * rather than the unhelpful "not a shape --repair will execute".
 */
const DESTRUCTIVE_VERBS = new Set(['purge', 'uninstall', 'forget', 'redact', 'roll', 'prune']);

function tokenize(command) {
  // Quoted runs stay whole so a quoted path is ONE token; that is all the
  // parsing this needs, because the allowlist below rejects anything with a
  // quote in it anyway. The tokenizer exists to identify the shape, not to
  // faithfully emulate a shell — emulating a shell is how you end up running
  // one.
  return String(command).match(/"[^"]*"|\S+/g) ?? [];
}

/**
 * Classify one recovery command.
 *
 * @returns {{runnable: true, exec: {bin: 'node'|'npm', args: string[]}}
 *          |{runnable: false, reason: string}}
 */
function classify(command, knownVerbs) {
  const raw = String(command ?? '').trim();
  if (!raw) return { runnable: false, reason: 'not-a-command' };
  // A placeholder is checked FIRST: `cmk redact <id> --pattern "<the leaked
  // text>"` is otherwise a well-formed kit verb, and running it verbatim would
  // file a fact about the angle brackets.
  if (/[<>]/.test(raw)) return { runnable: false, reason: 'placeholder' };

  const tokens = tokenize(raw);
  const head = tokens[0].toLowerCase();
  // Named explicitly rather than left to fall through to `unrecognized`: the
  // user deserves to be told WHY this one is theirs to run, and "it deletes
  // something" is a better answer than "we did not recognise it".
  if (DESTRUCTIVE_HEADS.has(head)) return { runnable: false, reason: 'destructive' };

  // HC-3's recovery is an instruction to a human ("reopen this project as the
  // primary cwd in Claude Code"), not a command line.
  if (head !== 'cmk' && head !== 'npm') {
    return { runnable: false, reason: tokens.length > 3 && !raw.includes('-') ? 'not-a-command' : 'unrecognized' };
  }
  if (!tokens.every((t) => SAFE_TOKEN.test(t))) return { runnable: false, reason: 'unrecognized' };

  if (head === 'cmk') {
    const verb = tokens[1];
    // Two gates, in this order. The registry check rejects a verb the kit does
    // not have; the REPAIR_VERBS check rejects a verb it has but which is not a
    // repair. Only the second one closes I5 — the first was passing all 42.
    if (!verb || !knownVerbs.includes(verb)) return { runnable: false, reason: 'unrecognized' };
    if (DESTRUCTIVE_VERBS.has(verb)) return { runnable: false, reason: 'destructive' };
    if (!REPAIR_VERBS.includes(verb)) return { runnable: false, reason: 'not-a-repair-verb' };
    return { runnable: true, exec: { bin: 'cmk', args: tokens.slice(1) } };
  }

  // npm: ONLY the global-install shape HC-8 and HC-9 emit. `npm run <script>`,
  // a relative path and a URL all fail here, which is the intent — this is not
  // a general npm passthrough.
  const [, sub, flag, pkg, ...rest] = tokens;
  // The `@version` suffix is allowed (I4): HC-9's real recovery is
  // `npm install -g @lh8ppl/core-memory-kit@latest`, and rejecting it printed a
  // "not a shape --repair will execute" line about the kit's own most likely
  // repair. The version part is a restricted charset — no slash, no colon — so
  // `@file:/tmp/x`, `@../../evil` and a tarball URL are all still refused.
  const okPkg = typeof pkg === 'string'
    && /^@?[a-z0-9][a-z0-9._-]*(\/[a-z0-9][a-z0-9._-]*)?(@[a-z0-9][a-z0-9.^~*-]*)?$/i.test(pkg);
  const okRest = rest.every((t) => /^--allow-scripts=[@a-z0-9._/-]+$/i.test(t));
  if (sub === 'install' && flag === '-g' && okPkg && okRest) {
    return { runnable: true, exec: { bin: 'npm', args: tokens.slice(1) } };
  }
  return { runnable: false, reason: 'unrecognized' };
}

/**
 * Turn a doctor result's checks into the list of repairs to offer. PURE.
 *
 * WARN checks are included: advisory does not mean there is nothing to offer,
 * it means the exit code stays clean (HC-5's stale scheduler posture is the
 * case in point — worth fixing, not worth reddening a build).
 *
 * @param {Array<object>} checks
 * @param {{knownVerbs: string[]}} opts  the live `cmk` verb list
 * @returns {Array<{id,name,problem,command,runnable,reason?,requiresInstall,exec?}>}
 */
export function planRepairs(checks, { knownVerbs = [] } = {}) {
  const plan = [];
  for (const c of checks ?? []) {
    if (c?.status !== 'fail' && c?.status !== 'warn') continue;
    if (!c.recoveryCommand) continue;
    const verdict = classify(c.recoveryCommand, knownVerbs);
    plan.push({
      id: c.id,
      name: c.name,
      problem: c.message,
      command: c.recoveryCommand,
      requiresInstall: c.requiresInstall === true,
      ...verdict,
    });
  }
  return plan;
}

function appendRepairLog(projectRoot, entry) {
  try {
    if (typeof projectRoot !== 'string' || !projectRoot) return;
    mkdirSync(join(projectRoot, 'context', '.locks'), { recursive: true });
    appendFileSync(
      repairLogPath(projectRoot),
      `${JSON.stringify({ ts: new Date().toISOString(), schema: REPAIR_LOG_SCHEMA_VERSION, ...entry })}\n`,
      'utf8',
    );
  } catch {
    // Best-effort, like every other kit log. Losing the journal entry is a
    // cost; failing the repair because the journal could not be written is a
    // bug — the user asked for the fix, not for the paperwork.
  }
}

const YES = new Set(['y', 'yes']);

/**
 * Offer each planned repair and, with consent, run it.
 *
 * @param {object} opts
 * @param {Array} opts.plan          from planRepairs
 * @param {string} opts.projectRoot
 * @param {string} opts.cliEntry     absolute path to this cmk's bin entry
 * @param {boolean} opts.interactive is stdin a terminal?
 * @param {boolean} [opts.assumeYes] the user's `--yes`
 * @param {Function} opts.prompt     async (question) => answer
 * @param {Function} [opts.spawn]    test seam; defaults to spawnSync
 * @param {Function} [opts.log]      test seam; defaults to console.log
 * @returns {Promise<{outcomes: Array, counts: object}>}
 */
export async function runRepairs({
  plan = [],
  projectRoot,
  cliEntry,
  interactive,
  assumeYes = false,
  prompt,
  spawn = spawnSync,
  log = console.log,
} = {}) {
  const outcomes = [];
  for (const item of plan) {
    let decision;
    if (!item.runnable) {
      // Never prompted for, under any flag. There is nothing to consent to: the
      // string is not a command we are willing to run.
      decision = 'print-only';
    } else if (assumeYes) {
      decision = 'auto-accepted';
    } else if (!interactive) {
      decision = 'print-only';
    } else {
      log('');
      log(`  ${item.id}: ${item.name}`);
      log(`    problem: ${item.problem}`);
      if (item.requiresInstall) {
        log('    NOTE: this one installs software on your machine.');
      }
      log(`    would run: ${item.command}`);
      const answer = await prompt('    Run it now? [y/N] ');
      decision = YES.has(String(answer ?? '').trim().toLowerCase()) ? 'accepted' : 'declined';
    }

    if (decision === 'print-only') {
      const why = item.runnable
        ? 'no terminal to ask on — pass --yes to apply it, or run it yourself'
        : MANUAL_REASONS[item.reason] ?? 'this one is yours to run';
      log('');
      log(`  ${item.id}: ${item.name}`);
      log(`    problem: ${item.problem}`);
      log(`    run this yourself: ${item.command}`);
      log(`    (${why})`);
    }

    let outcome = 'not-run';
    let exitCode;
    if (decision === 'accepted' || decision === 'auto-accepted') {
      // M6: the install NOTE is printed on the `--yes` path too. Consent was
      // given in advance, which is a reason not to ASK — not a reason to stop
      // SAYING that something is being installed on the user's machine. Under
      // `--yes` the prompt block above never runs, so without this line the one
      // signal that distinguishes an install from an index rebuild vanished
      // exactly where the user was least able to intervene.
      if (item.requiresInstall) {
        log(`  ${item.id}: NOTE — this installs software on your machine.`);
      }
      log(`  ${item.id}: running ${item.command} …`);
      const r = execRepair({ item, cliEntry, projectRoot, spawn });
      outcome = r.ok ? 'fixed' : 'failed';
      exitCode = r.exitCode;
      log(r.ok ? `  ${item.id}: done.` : `  ${item.id}: FAILED (${r.detail}) — run it yourself to see the error.`);
    }

    const row = {
      id: item.id, command: item.command, decision, outcome,
      ...(exitCode === undefined ? {} : { exitCode }),
      ...(item.runnable ? {} : { reason: item.reason }),
    };
    outcomes.push(row);
    appendRepairLog(projectRoot, {
      hc: item.id, command: item.command, decision, outcome,
      ...(exitCode === undefined ? {} : { exit_code: exitCode }),
      ...(item.runnable ? {} : { reason: item.reason }),
    });
  }

  const counts = { fixed: 0, failed: 0, declined: 0, 'not-run': 0 };
  for (const o of outcomes) {
    if (o.outcome === 'fixed') counts.fixed += 1;
    else if (o.outcome === 'failed') counts.failed += 1;
    else if (o.decision === 'declined') counts.declined += 1;
    else counts['not-run'] += 1;
  }

  // M7 — THE EXIT-CODE POLICY, stated rather than left to fall out of the
  // health checks' own verdict.
  //
  // The problem it fixes: a WARN-only plan (HC-5's stale scheduler posture, say)
  // leaves doctor's failCount at 0, so `cmk doctor --repair` in a script printed
  // "here are 2 repairs you could apply" and exited 0 — indistinguishable from
  // a clean run. That is the false-green shape, arriving through the exit code
  // instead of the report.
  //
  // The rule: `--repair` is an explicit REQUEST to fix things, so its exit code
  // answers "did the thing you asked for happen?"
  //   • a repair that FAILED                         → unfinished  (exit 1)
  //   • a runnable repair withheld for want of consent (no terminal, no --yes)
  //                                                  → unfinished  (exit 1)
  //   • a repair the user DECLINED                   → finished    (exit 0)
  //     — they were asked and they answered; honouring that is not a failure.
  //   • a MANUAL-class item (delete / placeholder / prose)
  //                                                  → finished    (exit 0)
  //     — nothing was withheld; those are never runnable by design.
  //
  // Plain `cmk doctor` is untouched: WARN still never reddens an exit code
  // there, which keeps HC-13/HC-14's advisory posture intact.
  const unfinished = outcomes.filter(
    (o) => o.outcome === 'failed' || (o.decision === 'print-only' && !o.reason),
  ).length;

  return { outcomes, counts, unfinished };
}

const MANUAL_REASONS = Object.freeze({
  destructive: 'this one DELETES or rewrites your memory — the kit never runs that for you',
  placeholder: 'fill in the <placeholder> first — only you know what belongs there',
  'not-a-command': 'this is an instruction, not a command',
  'not-a-repair-verb': 'a real `cmk` command, but not one `--repair` treats as a fix',
  unrecognized: 'not a shape `--repair` is willing to execute',
});

function execRepair({ item, cliEntry, projectRoot, spawn }) {
  try {
    // The constant is the GATE, not a description of one. Without this line the
    // validator that reads `EXECUTABLE_BINS` would be checking a comment: the
    // list could say one thing while `execRepair`'s branches did another, and
    // the lint pass would report OK the whole time — the exact false-green
    // shape the health checks in this same command exist to remove.
    if (!EXECUTABLE_BINS.includes(item?.exec?.bin)) {
      return { ok: false, exitCode: undefined, detail: `refusing to launch '${item?.exec?.bin}' (not a declared executable, NFR-10)` };
    }
    if (item.exec.bin === 'cmk') {
      // THIS node running THIS entry — never `cmk` off PATH. A PATH `cmk`
      // resolves to whatever is installed globally, which is exactly the stale
      // binary HC-9 exists to warn about; repairing with the wrong version
      // would be its own bug class.
      const r = spawn(process.execPath, [cliEntry, ...item.exec.args], {
        cwd: projectRoot,
        encoding: 'utf8',
        timeout: REPAIR_TIMEOUT_MS,
        windowsHide: true,
      });
      return { ok: r?.status === 0, exitCode: r?.status ?? undefined, detail: `exit ${r?.status}` };
    }
    // npm. `shell` on Windows only, and only because the global npm entry point
    // is `npm.cmd`, which CreateProcess will not exec directly. Safe here and
    // nowhere else: every token has already passed SAFE_TOKEN, so there is no
    // quote, space or metacharacter for the shell to interpret.
    const r = spawn(item.exec.bin, item.exec.args, {
      encoding: 'utf8',
      timeout: REPAIR_TIMEOUT_MS,
      windowsHide: true,
      shell: process.platform === 'win32',
    });
    return { ok: r?.status === 0, exitCode: r?.status ?? undefined, detail: `exit ${r?.status}` };
  } catch (err) {
    return { ok: false, exitCode: undefined, detail: err?.message ?? String(err) };
  }
}
