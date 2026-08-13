#!/usr/bin/env node
// validate-install-consent.mjs — NFR-10's structural half (Task 48).
//
// THE RULE (requirements.md NFR-10): the kit shall never invoke a system-level
// install command — `npm install`, `pip install`, `winget install`, `brew
// install` — without explicit user consent, granted by a flag the user typed
// or a prompt the user answered.
//
// WHY A VALIDATOR AND NOT ANOTHER PARAGRAPH. Prose accumulates faster than
// discipline, and this rule had already proved it: it sat in design §14 for
// over a year as an unsourced assertion citing the WRONG NFR, and nothing
// anywhere would have failed if a module had quietly started shelling out to
// npm.
//
// TWO CHECKS, AND THEIR STRENGTHS ARE NOT EQUAL — stated plainly, because a
// validator that oversells itself is the thing this repo calls a false green.
//
//   1. THE EXECUTION SURFACE (precise, and the one that matters). Exactly one
//      module in the kit executes a recovery command: doctor-repair.mjs. It
//      exports `EXECUTABLE_BINS`, the complete set of binaries it will launch.
//      This check reads that export and requires every entry to be declared
//      below with its NFR-10 consent channel — both directions, so a stale
//      declaration fails too. Growing the kit's install-execution surface is
//      therefore an edit somebody has to make HERE, next to a sentence saying
//      how consent is obtained.
//
//   2. THE EMISSION SURFACE (a declaration, not a proof). Several modules
//      CONSTRUCT installer command text — HC-8's remediation string, the
//      stale-global upgrade nag — without ever running it. That distinction is
//      exactly what NFR-10 turns on, so the emitters are enumerated below and
//      checked both directions. What this cannot do is prove an emitter never
//      becomes an executor; a regex has no data flow. What it does is make the
//      list exist, so a reviewer has something to check the diff against.
//
// A FIRST ATTEMPT AT (2) ALONE WAS A LINE-WINDOW HEURISTIC AND IT FAILED
// USEFULLY, so the failure is recorded rather than quietly fixed: it flagged
// three modules that only emit, and MISSED the single real executor, because
// doctor-repair spawns `item.exec.bin` thirty lines away from the `npm` literal
// that produced it. Any check precise enough to trace that is a data-flow
// analysis; any check loose enough to catch it flags everything. That is why
// the real guard is an exported contract rather than a scan.
//
// WHAT CHECK (2) CANNOT SEE — stated so nobody reads a green run as a proof
// (M9). Three limits, each with the same shape: the scan knows about text in
// files it looks at.
//
//   • SCOPE. It walks ONLY `ROOTS` below — packages/cli/src, packages/cli/bin,
//     plugin/bin — and only `*.mjs`. An installer spawned from `scripts/`, from
//     a `.js`/`.cjs` file, from a hook shipped in `template/`, or from a
//     dependency is invisible to it. Those are out of scope on purpose (they
//     are not the kit's runtime), but "out of scope" is not "checked and
//     clean".
//   • LITERAL NAMES ONLY. `INSTALLER` matches the manager's name spelled out in
//     source. A command assembled at runtime — from config, from a health
//     check's `recoveryCommand` string, from `['np','m'].join('')` — matches
//     nothing. The exported-contract check (1) is what actually covers the one
//     path where a command IS assembled at runtime, which is precisely why it
//     is check (1) and this is check (2).
//   • NO DATA FLOW. Being listed in INSTALL_EMITTERS asserts that a human read
//     the file and found it emits without executing. The scan cannot verify
//     that claim, and it will not notice if the file later starts executing
//     what it used to only print — the spawn and the installer token were
//     already both present, so the verdict does not change.
//
// In short: check (1) is a guarantee about doctor-repair's executable set;
// check (2) is a tripwire that makes a new install-shaped module require a
// deliberate declaration. Neither is a proof that the kit never installs
// anything without consent — the consent branches in
// tests/cli-doctor-repair.test.js are the closest thing to that.
//
// Run: `node scripts/validate-install-consent.mjs`   (wired into `npm test`)

import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXECUTABLE_BINS } from '../packages/cli/src/doctor-repair.mjs';

const repoRoot = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const ROOTS = ['packages/cli/src', 'packages/cli/bin', 'plugin/bin'];

/**
 * Check 1 — every binary `cmk doctor --repair` may launch, and the NFR-10
 * channel that gates it. Adding a row here is the deliberate act the rule
 * exists to force.
 */
const CONSENT_CHANNELS = new Map([
  [
    'cmk',
    'Not a system-level installer: this is the kit running its own idempotent verb, in the same ' +
      'process tree and the same version the user invoked. Still gated by NFR-10 channels 2/3 ' +
      '(per-repair [y/N] defaulting to No, or an explicit --yes) — the kit does not silently run ' +
      'its own commands either.',
  ],
  [
    'npm',
    'NFR-10 channels 2 + 3: HC-8 emits `npm install -g … --allow-scripts=…` when a native binding ' +
      'is missing. `--repair` prompts [y/N] (default No) before running it, or the user passes ' +
      '--yes. Non-interactive without --yes prints the command and installs nothing, naming the flag.',
  ],
]);

/**
 * Check 2 — modules that BUILD installer command text without executing it.
 * Path → what it emits and why it never runs it.
 */
const INSTALL_EMITTERS = new Map([
  [
    'packages/cli/src/doctor.mjs',
    'HC-8 puts the native-binding remediation in `recoveryCommand` with `requiresInstall: true`; ' +
      'HC-9 puts the stale-global upgrade line there. doctor reports — it never spawns a recovery.',
  ],
  [
    'packages/cli/src/semantic-backend.mjs',
    'Names the embedder install command in its unavailable-backend message so the user can run it.',
  ],
  [
    'packages/cli/src/subcommands.mjs',
    'Prints install guidance (the `--with-semantic` path, the upgrade hint). The repair EXECUTION it ' +
      'triggers is delegated wholly to doctor-repair.mjs, which owns the consent gate.',
  ],
]);

const SPAWN_FAMILY = /\b(spawn|spawnSync|exec|execSync|execFile|execFileSync)\s*\(/;
const INSTALLER = /\b(npm|pnpm|yarn|pip|pip3|winget|brew|choco|apt-get)\b[^\n]{0,80}\binstall\b|\binstall\b[^\n]{0,80}\b(npm|pnpm|yarn|pip|winget|brew|choco)\b/;

function walk(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.mjs$/.test(e.name)) out.push(p);
  }
  return out;
}

const errors = [];

// --- Check 1: the execution surface ----------------------------------------
for (const bin of EXECUTABLE_BINS) {
  if (!CONSENT_CHANNELS.has(bin)) {
    errors.push(
      `doctor-repair.mjs may launch '${bin}', but no NFR-10 consent channel is declared for it in ` +
        `scripts/validate-install-consent.mjs. State how the user consents before widening the ` +
        `kit's install-execution surface.`,
    );
  }
}
for (const bin of CONSENT_CHANNELS.keys()) {
  if (!EXECUTABLE_BINS.includes(bin)) {
    errors.push(
      `'${bin}' has a declared consent channel but doctor-repair.mjs no longer launches it — ` +
        `remove the row (a stale allowlist is how a real one stops being read).`,
    );
  }
}

// --- Check 2: the emission surface -----------------------------------------
const EXECUTORS = new Set(['packages/cli/src/doctor-repair.mjs']);
const foundEmitters = new Set();
for (const root of ROOTS) {
  for (const file of walk(join(repoRoot, root))) {
    const rel = relative(repoRoot, file).replace(/\\/g, '/');
    if (EXECUTORS.has(rel)) continue; // covered, precisely, by check 1
    let text;
    try {
      text = readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    // Comment lines are dropped first: this rule is explained in prose inside
    // the very files it governs, and a check that trips on its own
    // documentation trains people to work around it.
    const code = text
      .split('\n')
      .filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l))
      .join('\n');
    if (!(SPAWN_FAMILY.test(code) && INSTALLER.test(code))) continue;
    foundEmitters.add(rel);
    if (!INSTALL_EMITTERS.has(rel)) {
      errors.push(
        `${rel}: names a system-level installer AND spawns subprocesses, but is not declared in ` +
          `INSTALL_EMITTERS. Under NFR-10 a module may EMIT an install command for the user to run; ` +
          `it may not RUN one. Declare it (saying what it emits and that it never executes it), or ` +
          `route the execution through doctor-repair.mjs's consent gate.`,
      );
    }
  }
}
for (const rel of INSTALL_EMITTERS.keys()) {
  if (!foundEmitters.has(rel)) {
    errors.push(`${rel}: declared in INSTALL_EMITTERS but no longer matches — remove the stale entry.`);
  }
}

if (errors.length > 0) {
  console.error('validate-install-consent: FAILED (NFR-10)\n');
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}
console.log(
  `validate-install-consent: OK — ${EXECUTABLE_BINS.length} executable bin(s) with declared consent channels, ` +
    `${foundEmitters.size} emit-only module(s) (NFR-10)`,
);
