// install.mjs — implementation of `cmk install`.
//
// Public contract (tests assert this; internals can change freely):
//
//   install({
//     projectRoot,   // <repo> root for project + local tiers
//     userTier,      // resolved user-tier path (defaults via resolveUserTier())
//     force,         // currently unused; reserved for Task 4 CLAUDE.md downgrade override
//     dryRun,        // currently unused; print-only mode reserved for Task 32
//   }) → {
//     projectRoot,   // resolved
//     userTier,      // resolved
//     created: string[],   // absolute paths newly written
//     skipped: string[],   // absolute paths that already existed (untouched)
//     refreshed: string[], // KIT-OWNED paths rewritten to the current template
//                          // (Task 230 — skills only today; never user memory).
//                          // Any installTier call with `overwrite: true` MUST
//                          // also pass a `refreshed` array — a refresh is
//                          // never silent.
//     gitignore: { action: 'created' | 'replaced' | 'unchanged', path: string },
//     errors: { path: string, error: string }[],
//   }
//
// Design notes:
//   - Deep module: the boundary above is the only public surface. Internal
//     helpers walk the kit's template/ tree, strip .template suffixes,
//     and copy files. Tests verify the contract, not the internals.
//   - Never overwrites existing files in the target. If MEMORY.md (or any
//     other tier seed) already has user edits, we skip it and log to
//     `skipped`. This is what makes re-installs safe.
//   - The .gitignore block is delimited so re-runs refresh in place
//     without duplicating lines and without touching unrelated entries.
//   - In dev (running from the cloned repo), the kit's template/ lives
//     at repo root. When packaged for npm publish (Task 36), template/
//     ships inside @lh8ppl/core-memory-kit — `resolveTemplateDir()`
//     handles both.

import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { injectClaudeMdBlock, findManagedBlock, compareVersions } from './claude-md.mjs';
import { checkKitBinding, npmSupportsAllowScripts } from './native-binding.mjs';
import { writeKitHooks, writeKitMcpServer } from './settings-hooks.mjs';
import { appendAuditEntry, nowIso, REASON_CODES } from './audit-log.mjs';
import { recoverMemory } from './memory-recovery.mjs';

const __filename = fileURLToPath(import.meta.url);
const CLI_SRC_DIR = dirname(__filename);
// Walk up: packages/cli/src → packages/cli → packages → repo root
const REPO_ROOT_DEV = resolve(CLI_SRC_DIR, '..', '..', '..');
const CLI_PKG_DIR = resolve(CLI_SRC_DIR, '..');

// The start marker carries the install version (matching the CLAUDE.md block,
// which is load-bearing for upgrade detection). The replace-regex in
// injectGitignore ignores the version, so it's cosmetic for idempotency — but
// it must not show a stale hardcode (was `v0.1.0` in every install). Built per
// install from the kit version; see gitignoreStartMarker().
const GITIGNORE_END = '# core-memory-kit:gitignore:end';
// D-126 CRLF-prevention: the .gitattributes managed block uses the SAME
// marker discipline as .gitignore (version-stamped start, in-place refresh).
const GITATTRIBUTES_END = '# core-memory-kit:gitattributes:end';

function gitattributesStartMarker(version) {
  return `# core-memory-kit:gitattributes:start v${version}`;
}

function gitignoreStartMarker(version) {
  return `# core-memory-kit:gitignore:start v${version}`;
}

/**
 * Read the kit version from the cli package's package.json.
 * Used as the default version for the CLAUDE.md marker.
 */
export function getKitVersion() {
  const pkg = JSON.parse(readFileSync(join(CLI_PKG_DIR, 'package.json'), 'utf8'));
  return pkg.version;
}

/**
 * Locate the kit's template/ directory.
 *
 * Two scenarios:
 *   1. Dev (running from cloned repo): template/ at repo root.
 *   2. Published (Task 36): template/ shipped inside the cli package.
 *
 * For v0.1.0 dev, scenario 1 is the only working path. Scenario 2 is
 * handled with a fallback so a future npm-published install still works
 * after Task 36 wires the publish step.
 */
export function resolveTemplateDir() {
  const devPath = join(REPO_ROOT_DEV, 'template');
  if (existsSync(devPath) && statSync(devPath).isDirectory()) return devPath;

  // Published-package fallback: template/ alongside the cli package's src.
  const packagedPath = resolve(CLI_SRC_DIR, '..', 'template');
  if (existsSync(packagedPath) && statSync(packagedPath).isDirectory()) return packagedPath;

  throw new Error(
    `cmk install: could not locate template/ (checked ${devPath} and ${packagedPath}). ` +
      `If you are running from a checkout, ensure template/ exists at the repo root.`
  );
}

/**
 * Resolve the user-tier path.
 *
 * Precedence:
 *   1. $MEMORY_KIT_USER_DIR if set (any non-empty value).
 *   2. ~/.core-memory-kit/  (default).
 *
 * Per design §1.1: "User-tier path override: the user tier path defaults
 * to ~/.core-memory-kit/ but can be overridden via the MEMORY_KIT_USER_DIR
 * environment variable."
 */
export function resolveUserTier() {
  const env = process.env.MEMORY_KIT_USER_DIR;
  if (env && env.trim().length > 0) return env;
  return join(homedir(), '.core-memory-kit');
}

/* ------------------------------------------------------------------ */
/* Internal helpers (not exported; tests don't depend on these names) */
/* ------------------------------------------------------------------ */

/**
 * Walk a directory recursively, returning a list of file entries.
 * Each entry: { absSrc, relPath, isGitkeep }
 */
function walkFiles(rootDir) {
  const out = [];
  function recurse(current) {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) {
        recurse(full);
      } else if (entry.isFile()) {
        out.push({
          absSrc: full,
          relPath: relative(rootDir, full).replace(/\\/g, '/'),
          isGitkeep: entry.name === '.gitkeep',
        });
      }
    }
  }
  recurse(rootDir);
  return out;
}

/**
 * Compute the target file name from a kit-template source name.
 *   "SOUL.md.template"  → "SOUL.md"
 *   "INDEX.md.template" → "INDEX.md"
 *   "machine-paths.md.template" → "machine-paths.md"
 *   (.gitkeep files are filtered out before this is called)
 */
function targetName(srcName) {
  if (srcName.endsWith('.template')) return srcName.slice(0, -'.template'.length);
  return srcName;
}

/**
 * Install one tier: copy every non-.gitkeep file from srcDir into destDir,
 * stripping the .template suffix. Skips existing files.
 *
 * Side effects:
 *   - Creates destDir + any needed subdirs
 *   - Writes new files
 *   - Mutates the supplied `created` / `skipped` / `errors` arrays
 */
// Substitute the kit's template placeholders. Templates ship with
// `{{TODAY}}` / `{{PROJECT_NAME}}` / `{{VERSION}}`; without this, the
// scaffolded scratchpads leaked a literal `{{TODAY}}` into MEMORY.md et al.
// (live-test finding #4). Only the three known tokens are replaced.
function renderTemplate(content, vars) {
  return content
    .replaceAll('{{TODAY}}', vars.today)
    .replaceAll('{{PROJECT_NAME}}', vars.projectName)
    .replaceAll('{{VERSION}}', vars.version);
}

/**
 * Task 230 (D-343) — detect KIT-OWNED scaffold files whose on-disk content is
 * behind the installed binary's template. Doctor's HC-9 uses this to close the
 * false-green D-343 hit: the CLAUDE.md marker matched the binary while a
 * scaffolded skill was stale from a pre-update install (the marker only proves
 * `cmk install` ran at this version — not that every kit-owned file matches).
 *
 * Scope: the kit-owned installTier targets — `.claude/skills/` and
 * `.claude/commands/` (the Task-175 slash-command scaffold joined the
 * Task-230 class). A MISSING file is NOT drift — a skipClaudeFiles
 * (Kiro/Cursor) project legitimately has no Claude skills; HC-9's marker
 * semantics cover not-installed. Only exists-and-differs is flagged.
 *
 * @param {object} o
 * @param {string} o.projectRoot
 * @returns {string[]} relative paths (from projectRoot) of drifted files
 */
export function kitOwnedScaffoldDrift({ projectRoot }) {
  const drifted = [];
  let templateDir;
  try {
    templateDir = resolveTemplateDir();
  } catch {
    return drifted; // no template (broken install) — nothing to compare against
  }
  // Render with the same defaults installTier uses; skill templates carry no
  // placeholders today, so this is a byte-passthrough (asserted by the fact
  // that a just-installed project produces zero drift — the tests pin it).
  const v = {
    today: new Date().toISOString().slice(0, 10),
    projectName: basename(projectRoot),
    version: getKitVersion(),
  };
  for (const dirName of ['skills', 'commands']) {
    const src = join(templateDir, '.claude', dirName);
    if (!existsSync(src)) continue;
    for (const file of walkFiles(src)) {
      if (file.isGitkeep) continue;
      const targetRel = join('.claude', dirName, dirname(file.relPath), targetName(file.relPath.split('/').pop()));
      const targetAbs = join(projectRoot, targetRel);
      if (!existsSync(targetAbs)) continue; // missing ≠ drift (see above)
      try {
        const expected = renderTemplate(readFileSync(file.absSrc, 'utf8'), v);
        const actual = readFileSync(targetAbs, 'utf8');
        // EOL-normalized (the D-126 class — a CRLF checkout is not drift) and
        // reported with '/' separators (walkFiles' convention) so the HC-9
        // message reads the same on every OS.
        if (actual.replaceAll('\r\n', '\n') !== expected.replaceAll('\r\n', '\n')) {
          drifted.push(targetRel.replaceAll('\\', '/'));
        }
      } catch {
        // unreadable file — leave to the install/repair path, not a drift flag
      }
    }
  }
  return drifted;
}

function installTier(srcDir, destDir, { created, skipped, errors, vars, overwrite, refreshed }) {
  // Self-sufficient default so no caller can crash renderTemplate by omitting
  // vars (e.g. initUserTier). install() passes an explicit vars with the real
  // projectName; standalone callers fall back to a sensible default (the user
  // tier's scratchpads only carry {{TODAY}} anyway).
  const v = vars ?? {
    today: new Date().toISOString().slice(0, 10),
    projectName: basename(destDir),
    version: getKitVersion(),
  };
  if (!existsSync(srcDir)) {
    errors.push({ path: srcDir, error: 'template tier missing from kit' });
    return;
  }

  // Ensure root destDir exists (covers fresh installs).
  mkdirSync(destDir, { recursive: true });

  for (const file of walkFiles(srcDir)) {
    if (file.isGitkeep) {
      // .gitkeep marks an empty kit dir; mirror just the directory in target.
      const targetDir = join(destDir, dirname(file.relPath));
      mkdirSync(targetDir, { recursive: true });
      continue;
    }

    const targetRel = join(dirname(file.relPath), targetName(file.relPath.split('/').pop()));
    const targetAbs = join(destDir, targetRel);

    if (existsSync(targetAbs)) {
      // Task 230 (D-343): the skip-if-exists rule exists for USER DATA — a
      // MEMORY.md/USER.md with the user's edits must never be clobbered. For
      // KIT-OWNED scaffold (the skills — kit-authored code, not user data),
      // callers pass `overwrite: true` so a kit update actually propagates:
      // pre-230, a changed shipped skill NEVER reached an existing install
      // (the v0.5.4 rename left every update-in-place project firing the
      // recall skill on a dead hint string, with HC-9 green over it).
      if (!overwrite) {
        skipped.push(targetAbs);
        continue;
      }
      try {
        const next = renderTemplate(readFileSync(file.absSrc, 'utf8'), v);
        const existing = readFileSync(targetAbs, 'utf8');
        // EOL-normalized compare (the D-126 class): a Windows autocrlf
        // checkout turns LF into CRLF on disk — that is NOT content drift,
        // and rewriting it every install would flap forever against the
        // next checkout. The gitattributes fragment pins eol=lf going
        // forward; existing CRLF checkouts are simply left alone.
        if (existing.replaceAll('\r\n', '\n') === next.replaceAll('\r\n', '\n')) {
          skipped.push(targetAbs);
        } else {
          writeFileSync(targetAbs, next, 'utf8');
          (refreshed ?? []).push(targetAbs);
        }
      } catch (err) {
        errors.push({ path: targetAbs, error: err && err.message ? err.message : String(err) });
      }
      continue;
    }

    try {
      mkdirSync(dirname(targetAbs), { recursive: true });
      // Read → render placeholders → write (was a raw copyFileSync, which left
      // `{{TODAY}}` literal in the scaffolded scratchpads). All template files
      // are text (.gitkeep is handled above), so utf8 round-trip is safe.
      writeFileSync(targetAbs, renderTemplate(readFileSync(file.absSrc, 'utf8'), v), 'utf8');
      created.push(targetAbs);
    } catch (err) {
      errors.push({ path: targetAbs, error: err && err.message ? err.message : String(err) });
    }
  }
}

/**
 * Build the canonical .gitignore managed block from template/.gitignore.fragment.
 * Adds start/end markers around the fragment so we can refresh in place.
 */
function buildGitignoreBlock(templateDir, version = getKitVersion()) {
  const fragmentPath = join(templateDir, '.gitignore.fragment');
  const fragment = existsSync(fragmentPath)
    ? readFileSync(fragmentPath, 'utf8').trim()
    : 'context.local/\ncontext/.index/\ncontext/.locks/';
  return `${gitignoreStartMarker(version)}\n${fragment}\n${GITIGNORE_END}\n`;
}

/**
 * Refresh the managed .gitignore block to the CURRENT kit version, outside a
 * full install. Task 225 (skill-review B1): `cmk import-sessions` writes raw
 * UN-screened extracts to context/transcripts/imported/ — a path only the
 * v0.6.0 fragment gitignores. On an upgraded-but-not-reinstalled project the
 * old block lacks that line and the transcripts tier is COMMITTED by design,
 * so the import verb must refresh the block itself before touching the raw
 * floor (fail-closed: its caller verifies coverage and skips the raw write
 * when this can't be confirmed).
 *
 * Returns { action: 'created'|'replaced'|'unchanged'|'error', path, error? }.
 */
export function refreshGitignoreBlock(projectRoot) {
  try {
    const templateDir = resolveTemplateDir();
    return injectGitignore(projectRoot, buildGitignoreBlock(templateDir, getKitVersion()));
  } catch (err) {
    return {
      action: 'error',
      path: join(projectRoot, '.gitignore'),
      error: err?.message ?? String(err),
    };
  }
}

/**
 * Build the canonical .gitattributes managed block from
 * template/.gitattributes.fragment (D-126 CRLF prevention — force LF on the
 * committed memory tiers so default Windows git doesn't mangle the bytes at
 * clone). Same marker discipline as the .gitignore block.
 */
function buildGitattributesBlock(templateDir, version = getKitVersion()) {
  const fragmentPath = join(templateDir, '.gitattributes.fragment');
  const fragment = existsSync(fragmentPath)
    ? readFileSync(fragmentPath, 'utf8').trim()
    : 'context/**/*.md text eol=lf\ncontext/**/*.json text eol=lf';
  return `${gitattributesStartMarker(version)}\n${fragment}\n${GITATTRIBUTES_END}\n`;
}

/**
 * Inject (or refresh) the managed .gitattributes block. Same algorithm as
 * injectGitignore (create / append-if-no-markers / replace-in-place),
 * byte-preserving everything outside the markers.
 *
 * Returns: { action: 'created' | 'replaced' | 'unchanged', path: string }
 */
function injectGitattributes(projectRoot, block) {
  const gaPath = join(projectRoot, '.gitattributes');
  const startRe = /# core-memory-kit:gitattributes:start[^\n]*\n/;
  const endRe = /# core-memory-kit:gitattributes:end\n?/;

  if (!existsSync(gaPath)) {
    writeFileSync(gaPath, block, 'utf8');
    return { action: 'created', path: gaPath };
  }
  const existing = readFileSync(gaPath, 'utf8');
  const startMatch = existing.match(startRe);
  const endMatch = existing.match(endRe);
  if (!startMatch || !endMatch || startMatch.index > endMatch.index) {
    const sep = existing.endsWith('\n') ? '\n' : '\n\n';
    writeFileSync(gaPath, existing + sep + block, 'utf8');
    return { action: 'created', path: gaPath };
  }
  const before = existing.slice(0, startMatch.index);
  const after = existing.slice(endMatch.index + endMatch[0].length);
  const next = before + block + after;
  if (next === existing) return { action: 'unchanged', path: gaPath };
  writeFileSync(gaPath, next, 'utf8');
  return { action: 'replaced', path: gaPath };
}

/**
 * Inject (or refresh) the managed .gitignore block in `<projectRoot>/.gitignore`.
 *
 * Algorithm:
 *   - No .gitignore: create one containing only the managed block.
 *   - Has .gitignore, no markers: append the managed block at EOF.
 *   - Has .gitignore, markers present: replace the marker-delimited block
 *     in place (refresh). Everything outside the markers is byte-preserved.
 *
 * Returns: { action: 'created' | 'replaced' | 'unchanged', path: string }
 */
function injectGitignore(projectRoot, block) {
  const giPath = join(projectRoot, '.gitignore');
  const startRe = /# core-memory-kit:gitignore:start[^\n]*\n/;
  const endRe = /# core-memory-kit:gitignore:end\n?/;

  if (!existsSync(giPath)) {
    writeFileSync(giPath, block, 'utf8');
    return { action: 'created', path: giPath };
  }

  const existing = readFileSync(giPath, 'utf8');
  const startMatch = existing.match(startRe);
  const endMatch = existing.match(endRe);

  if (!startMatch || !endMatch || startMatch.index > endMatch.index) {
    // No managed block (or markers malformed) — append.
    const sep = existing.endsWith('\n') ? '\n' : '\n\n';
    writeFileSync(giPath, existing + sep + block, 'utf8');
    return { action: 'created', path: giPath };
  }

  // Markers present — replace the slice between (and including) them.
  const before = existing.slice(0, startMatch.index);
  const after = existing.slice(endMatch.index + endMatch[0].length);
  const next = before + block + after;

  if (next === existing) {
    return { action: 'unchanged', path: giPath };
  }
  writeFileSync(giPath, next, 'utf8');
  return { action: 'replaced', path: giPath };
}

/* ------------------------------------------------------------------ */
/* Public entry point                                                  */
/* ------------------------------------------------------------------ */

/**
 * Install the kit scaffold into a project + user tier.
 * Idempotent. Never overwrites existing target files. Refreshes the
 * managed .gitignore block in place when re-run.
 */
export async function install(options = {}) {
  const projectRoot = options.projectRoot
    ? resolve(options.projectRoot)
    : resolve(process.cwd());
  const userTier = options.userTier ? resolve(options.userTier) : resolveUserTier();
  const force = !!options.force;
  const version = options.version || getKitVersion();

  const templateDir = resolveTemplateDir();

  const created = [];
  const skipped = [];
  // Task 230: kit-owned scaffold files rewritten to the current template on a
  // re-install (skills only today) — reported so the refresh is never silent.
  const refreshed = [];
  const errors = [];

  const vars = {
    today: new Date().toISOString().slice(0, 10), // YYYY-MM-DD
    projectName: basename(projectRoot),
    version,
  };

  // USER-DATA tiers — skip-if-exists is the CONTRACT here (Task 230 boundary):
  // context/, context.local/ and the user tier hold the user's MEMORY; a
  // re-install must never clobber an edited MEMORY.md/USER.md/fact file.
  installTier(join(templateDir, 'project'), join(projectRoot, 'context'), { created, skipped, errors, vars });
  installTier(join(templateDir, 'local'), join(projectRoot, 'context.local'), { created, skipped, errors, vars });
  installTier(join(templateDir, 'user'), userTier, { created, skipped, errors, vars });

  // Skills — Task 69. Scaffold the kit's Claude Code skills from
  // template/.claude/skills/ into <projectRoot>/.claude/skills/. This is what
  // makes model-invoked capture (the memory-write skill) ship with the npm
  // `cmk install` route, not only the plugin route — route-equivalence per
  // design §1.3. The skill files carry no {{placeholders}}, so renderTemplate
  // is a byte-passthrough.
  //
  // **Original contract (Tasks 69–229): skip-existing, "a hand-edited skill
  // survives a re-install."** PIVOTED by Task 230 (D-343): skills are
  // KIT-OWNED CODE, not user data — the skip rule (written for MEMORY safety)
  // over-applied here, so a kit update that changed a shipped skill never
  // propagated to an existing install (the v0.5.4 rename left every
  // update-in-place project firing recall on the dead `[claude-memory-kit]`
  // hint, HC-9 green over it). Skills now REFRESH to the current template on
  // every install (`overwrite: true`, reported via `refreshed`); a hand-edited
  // skill is deliberately overwritten — kit updates win on kit-owned files.
  //
  // `.claude/skills/` is CLAUDE-CODE-SPECIFIC. A `--ide kiro` install gets its
  // skills at `.kiro/skills/` (written by the Kiro orchestrator), so it passes
  // skipClaudeFiles to avoid leaving a dead Claude skills dir on a Kiro project
  // (the cut-gate find: a Kiro user shouldn't carry Claude Code's skill files).
  // Downgrade guard (skill-review Blocking, mirrors the CLAUDE.md --force
  // rule): if the project's existing marker is NEWER than this binary, an
  // un-forced install must NOT quietly downgrade the skills to an older
  // template — the same benign-downgrade case checkVersionDrift deliberately
  // passes (an older global cli on machine B must not clobber a newer
  // scaffold). `--force` opts into the downgrade, exactly like the block.
  const skillsOverwrite = (() => {
    if (force) return true;
    try {
      const cmPath = join(projectRoot, 'CLAUDE.md');
      if (!existsSync(cmPath)) return true;
      const block = findManagedBlock(readFileSync(cmPath, 'utf8'));
      if (!block || !block.version) return true;
      return compareVersions(version, block.version) >= 0; // not a downgrade
    } catch {
      return true; // unreadable marker — behave like a normal install
    }
  })();
  const skillsSrc = join(templateDir, '.claude', 'skills');
  if (!options.skipClaudeFiles && existsSync(skillsSrc)) {
    installTier(skillsSrc, join(projectRoot, '.claude', 'skills'), {
      created,
      skipped,
      errors,
      vars,
      overwrite: skillsOverwrite,
      refreshed,
    });
  }

  // Slash commands — Task 175. `.claude/commands/` is KIT-OWNED (the Task-230
  // class, same refresh/downgrade rules as skills): the /tour command file
  // lets the agent run the onboarding tour in-conversation. Claude-Code-
  // specific like skills (a --ide install gets its agent's own surface).
  const commandsSrc = join(templateDir, '.claude', 'commands');
  if (!options.skipClaudeFiles && existsSync(commandsSrc)) {
    installTier(commandsSrc, join(projectRoot, '.claude', 'commands'), {
      created,
      skipped,
      errors,
      vars,
      overwrite: skillsOverwrite,
      refreshed,
    });
  }

  const gitignore = injectGitignore(projectRoot, buildGitignoreBlock(templateDir, version));
  // D-126 CRLF prevention: pin LF on the committed memory tiers so default
  // Windows git can't mangle the bytes at clone (the read-side self-heal
  // shipped in v0.3.0; this prevents the mangling in the first place).
  const gitattributes = injectGitattributes(projectRoot, buildGitattributesBlock(templateDir, version));

  // CLAUDE.md loader block — Task 4. Read the block content from the kit's
  // template/ and inject (or refresh) it inside marker delimiters. Never
  // touches content outside the markers. CLAUDE.md is CLAUDE-CODE-SPECIFIC
  // (Kiro reads AGENTS.md + steering, not CLAUDE.md) — a --ide kiro install
  // passes skipClaudeFiles so it doesn't drop a CLAUDE.md the Kiro user can't
  // use (D-188). An EXISTING CLAUDE.md from a prior Claude-Code install is left
  // untouched regardless (we simply don't write a fresh one).
  const claudeMdTemplatePath = join(templateDir, 'CLAUDE.md.template');
  let claudeMd = { action: 'skipped', path: join(projectRoot, 'CLAUDE.md') };
  if (options.skipClaudeFiles) {
    // a non-Claude-Code (--ide kiro) install: CLAUDE.md is intentionally not
    // written; an existing one is left untouched. NOT an error.
    claudeMd = { action: 'skipped', reason: 'non-claude-code-agent', path: join(projectRoot, 'CLAUDE.md') };
  } else if (existsSync(claudeMdTemplatePath)) {
    const content = readFileSync(claudeMdTemplatePath, 'utf8');
    try {
      claudeMd = injectClaudeMdBlock({ projectRoot, content, version, force });
    } catch (err) {
      errors.push({
        path: join(projectRoot, 'CLAUDE.md'),
        error: err && err.message ? err.message : String(err),
      });
    }
  } else {
    errors.push({
      path: claudeMdTemplatePath,
      error: 'CLAUDE.md.template missing from kit template/',
    });
  }

  // Hook wiring — Task 49. This is what makes `npm install -g
  // @lh8ppl/core-memory-kit` + `cmk install` a COMPLETE entry point
  // (no separate `/plugin install` step needed). Writes the npm-route
  // hooks block (PATH-resolved bare bin names, shell form) into
  // <projectRoot>/.claude/settings.json via the shared writeKitHooks
  // boundary — same boundary `cmk repair --hooks` uses, so install and
  // repair never drift. Idempotent: a re-run with already-canonical
  // hooks is a no-op. Opt out with {noHooks:true} (CLI: --no-hooks) for
  // scaffold-only installs.
  let hooks = { action: 'skipped', path: join(projectRoot, '.claude', 'settings.json') };
  // Task 108b — register the kit's MCP server (.mcp.json) so the model can drive
  // memory ops as allow-listed tools (the `mcp__cmk__*` rule writeKitHooks adds),
  // not just `cmk` bash. Same {noHooks} opt-out as the hooks (it's Claude Code
  // wiring). R2 / D-80 fix.
  let mcpServer = { action: 'skipped', path: join(projectRoot, '.mcp.json') };
  if (!options.noHooks) {
    const settingsPath = join(projectRoot, '.claude', 'settings.json');
    const r = writeKitHooks(settingsPath);
    if (r.error) {
      errors.push({ path: settingsPath, error: r.error });
      hooks = { action: 'error', path: settingsPath, error: r.error };
    } else {
      hooks = {
        action: r.changed ? 'wired' : 'unchanged',
        path: settingsPath,
        events: r.events,
      };
      // Door-4 audit entry — install wires user-visible Claude Code
      // config; a "cmk install changed my settings.json" report needs a
      // trail. Emitted ONLY when something actually changed: a no-op
      // re-install has nothing to audit, and emitting on no-op would make
      // the append-only audit.log grow on every run, breaking install's
      // idempotency guarantee (re-run = byte-identical project tree).
      // Best-effort: never block install on an audit-log failure.
      if (r.changed) {
        try {
          appendAuditEntry(join(projectRoot, 'context'), {
            ts: nowIso(),
            action: 'install',
            tier: 'P',
            id: 'P-NSTLHKWR', // synthetic stable id for install-hooks events (base32 alphabet)
            reasonCode: REASON_CODES.INSTALL_HOOKS_WIRED,
            extra: { settingsPath, events: r.events },
          });
        } catch {
          // best-effort
        }
      }
    }
  }

  if (!options.noHooks) {
    const r = writeKitMcpServer(projectRoot);
    if (r.error) {
      errors.push({ path: r.path, error: r.error });
      mcpServer = { action: 'error', path: r.path, error: r.error };
    } else {
      mcpServer = { action: r.changed ? 'registered' : 'unchanged', path: r.path };
    }
  }

  // Task 46 — semantic-recall opt-in/out. `--with-semantic`: install the
  // optional embedder (~260 MB once, fully local), flip the project's
  // default search mode to hybrid, and pre-warm the model so the one-time
  // download happens NOW, not as a surprise on the first search.
  // `--no-semantic`: pin keyword explicitly. Neither flag → settings
  // untouched (keyword by absence). The npm spawn is injectable
  // (options.spawnNpm) so tests assert the argv without touching the host.
  // Both flags together → withSemantic wins (the affirmative opt-in beats
  // the pin-off; checked first below).
  let semantic = { action: 'skipped' };
  if (options.withSemantic) {
    semantic = await enableSemantic({
      projectRoot,
      spawnNpm: options.spawnNpm,
      warm: options.warmEmbedder,
      probeEmbedder: options.probeEmbedder,
    });
    if (semantic.action === 'error') errors.push({ path: 'semantic', error: semantic.error });
  } else if (options.noSemantic) {
    const r = mergeProjectSettings(projectRoot, { search: { default_mode: 'keyword' } });
    semantic = r.ok
      ? { action: 'disabled', path: r.path }
      : { action: 'error', error: r.error };
    if (!r.ok) errors.push({ path: r.path, error: r.error });
  }

  // Task 141a (D-129): probe the kit's native binding so the CLI can ask the
  // user to fix it INLINE (npm 12 blocks better-sqlite3's binding build on a
  // fresh install). Reported, never an installer error — scaffold + hooks
  // are fully functional without it; only search/reindex need the binding.
  const bindingProbe = options.bindingProbe ?? checkKitBinding;
  const nativeBinding = bindingProbe();

  // Task 248 — AUTO-RECOVERY of pre-existing orphaned memory tiers + malformed
  // fact files (D-389 / D-394). Runs AFTER the tiers are scaffolded (the root
  // `context/memory/` must exist to relocate into) and is deliberately the LAST
  // filesystem step, so a hiccup here can't leave a half-scaffolded project.
  //
  // FAIL-OPEN by contract: `recoverMemory` never throws, and its outcome NEVER
  // joins `errors` — a failed recovery must not set the install's exit code.
  // The result rides the return value so the CLI can print the report; the
  // `_recoverFn` seam is test-only.
  const runRecovery = options._recoverFn ?? recoverMemory;
  let recovery;
  try {
    recovery = runRecovery({ projectRoot, userDir: userTier });
  } catch (err) {
    recovery = {
      action: 'error',
      strays: [],
      repaired: [],
      quarantined: [],
      reindexed: [],
      errors: [`memory recovery: ${err?.message ?? err}`],
    };
  }

  return { projectRoot, userTier, created, skipped, refreshed, gitignore, gitattributes, claudeMd, hooks, mcpServer, semantic, nativeBinding, recovery, errors };
}

/**
 * Read-merge-write <projectRoot>/context/settings.json, preserving every
 * key the user already has (over-mutation-safe; deep-merges one level).
 */
export function mergeProjectSettings(projectRoot, patch) {
  const path = join(projectRoot, 'context', 'settings.json');
  try {
    let current = {};
    if (existsSync(path)) {
      current = JSON.parse(readFileSync(path, 'utf8'));
    }
    const next = { ...current };
    for (const [key, value] of Object.entries(patch)) {
      next[key] =
        value && typeof value === 'object' && !Array.isArray(value)
          ? { ...(current[key] ?? {}), ...value }
          : value;
    }
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, JSON.stringify(next, null, 2) + '\n', 'utf8');
    return { ok: true, path };
  } catch (err) {
    return { ok: false, path, error: err?.message ?? String(err) };
  }
}

/**
 * The production npm-spawn closure, as an injectable-seam factory
 * (Task 125.4) so its argv/shell/timeout contract is testable without
 * running a real `npm install -g` (which stays a machine-level step
 * tests must never take).
 */
export function buildDefaultNpmRunner({ spawnSyncImpl = spawnSync } = {}) {
  return () => {
    // Task 141a (D-129): on npm ≥ 11.16 the `allow-scripts` config exists
    // and npm 12 BLOCKS onnxruntime-node's install script without it — the
    // kit runs this install itself, so it carries the allow flag itself
    // (no user friction). Older npm: plain command, no unknown-config noise.
    const { supported } = npmSupportsAllowScripts({ spawnSyncImpl });
    const cmd = supported
      ? 'npm install -g @huggingface/transformers --allow-scripts=onnxruntime-node'
      : 'npm install -g @huggingface/transformers';
    // One constant command string under shell:true (no user input — and
    // an args array + shell:true trips Node's DEP0190). npm is npm.cmd
    // on Windows; the shell resolves it cross-platform.
    const r = spawnSyncImpl(cmd, {
      encoding: 'utf8',
      stdio: 'inherit',
      shell: true,
      // spawn-discipline (design §8.5): a hung registry shouldn't hang
      // install forever; 10 min covers the ~46 MB package on slow links.
      timeout: 600_000,
    });
    return { status: r.status, error: r.error?.message };
  };
}

async function enableSemantic({ projectRoot, spawnNpm, warm, probeEmbedder }) {
  // 1. Install the optional embedder globally (it resolves as a sibling of
  // the globally-installed kit). Injectable for tests.
  const runNpm = spawnNpm ?? buildDefaultNpmRunner();
  const npm = runNpm();

  // Task 170 (the v0.4.1 cut-gate find): gate on whether the embedder ACTUALLY
  // IMPORTS, NOT on npm's exit code — verify the thing worked, not the command's
  // exit (the D-199 class). Two failure modes the exit code gets wrong, BOTH
  // sides:
  //   - npm exits NON-ZERO but the package installed fine: on Windows a benign
  //     cleanup-EBUSY (npm failing to unlink a leftover temp DLL still locked by
  //     a running process — sharp-win32-x64 / libvips) makes npm exit non-zero
  //     AFTER a successful install. Trusting the exit FALSELY reported "NOT
  //     enabled" while the embedder was present + importable (the live find).
  //   - npm exits ZERO but the import is BROKEN (partial/corrupt native module):
  //     trusting the exit would wrongly write a hybrid default with no working
  //     embedder — every search would degrade to the fallback warning (the
  //     half-state this function exists to avoid).
  // So PROBE the import once, and enable hybrid IFF it imports — regardless of
  // npm's exit. The install must be AUTOMATIC: the user does nothing and never
  // needs a manual `cmk config set` to recover from a benign npm warning.
  const probe = probeEmbedder ?? (async () => {
    const { checkEmbedderBinding } = await import('./native-binding.mjs');
    return checkEmbedderBinding();
  });
  let imported;
  try {
    imported = await probe();
  } catch {
    imported = { ok: false };
  }
  if (!imported?.ok) {
    const detail = npm.status !== 0 ? (npm.error ?? `exit ${npm.status}`) : (imported?.reason ?? 'embedder import failed');
    return {
      action: 'error',
      error: `semantic embedder not usable after install (${detail}) — semantic recall NOT enabled; keyword search is unaffected`,
    };
  }
  // 2. Flip the project default to hybrid ONLY after the dependency landed
  // (no half-state: a hybrid default without an embedder would degrade
  // every search to a fallback warning).
  const settings = mergeProjectSettings(projectRoot, { search: { default_mode: 'hybrid' } });
  if (!settings.ok) {
    return { action: 'error', error: settings.error };
  }
  // 3. Pre-warm (best-effort): the one-time model download happens during
  // install, not on the first search. Injectable for tests.
  let warmed = { ok: false, reason: 'skipped' };
  try {
    const warmFn =
      warm ??
      (async () => {
        const { warmEmbedder } = await import('./semantic-backend.mjs');
        return warmEmbedder();
      });
    warmed = await warmFn();
  } catch (err) {
    warmed = { ok: false, reason: err?.message ?? String(err) };
  }
  return { action: 'enabled', path: settings.path, defaultMode: 'hybrid', warmed };
}

/**
 * `cmk init-user-tier` — user-tier-only install. Task 14.
 *
 * Scaffolds the user-tier seeds (USER.md, HABITS.md, LESSONS.md, fragments/)
 * at the resolved user-tier path. Does NOT touch project tier, local tier,
 * .gitignore, or CLAUDE.md. Useful when:
 *   - A user wants to set up user-tier independently of any project install
 *   - A user wants to refresh user-tier seeds without re-running `cmk install`
 *     (which would also re-evaluate project tier + CLAUDE.md block)
 *
 * Path precedence (same as install()): explicit option > $MEMORY_KIT_USER_DIR
 * > ~/.core-memory-kit/. Re-runs are idempotent — existing files are
 * skipped, not overwritten.
 *
 * Returns {userTier, created, skipped, errors}.
 */
export function initUserTier(options = {}) {
  const userTier = options.userTier
    ? resolve(options.userTier)
    : resolveUserTier();
  const templateDir = resolveTemplateDir();
  const created = [];
  const skipped = [];
  const errors = [];
  installTier(join(templateDir, 'user'), userTier, { created, skipped, errors });
  return { userTier, created, skipped, errors };
}
