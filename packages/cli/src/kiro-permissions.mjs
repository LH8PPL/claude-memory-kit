// kiro-permissions.mjs — write Kiro IDE 1.0's authoritative trust store so the
// kit's surfaces run prompt-free (Task 50.N.5 / D-203h/D-203i).
//
// On Kiro IDE 1.0, the LIVE trust is `~/.kiro/workspace-roots/<hash>/
// permissions.yaml` (capability/match/effect), NOT `.vscode/settings.json` — Kiro
// auto-MIGRATES the latter into the former at first open (D-203i: proven by the
// `.trust-migration.json` sibling + MCP running prompt-free with no `.vscode`
// trustedMcpTools). There is NO `.vscode` setting for SKILL trust, so the only
// reliable pre-trust for the memory-write skill-load prompt is to write
// permissions.yaml directly.
//
// <hash> = sha256( projectRoot, normalized: forward-slash + no-trailing-slash +
// lowercase ).hexdigest().slice(0,16) — VERIFIED on a real install (D-203h:
// c:/temp/kiro-ide-gate → a7ffdb64ec4c31c8).
//
// Format (ground-truth, read from a real grant — D-203h):
//   rules:
//     - { capability: shell, match: [cmd.exe /c cmk hook *, ...], effect: allow }
//     - { capability: mcp,   match: [core-memory-kit/mk_remember, ...], effect: allow }
//     - { capability: skill, match: [memory-write, memory-search], effect: allow }
//
// Public surface:
//   kiroWorkspaceHash(projectRoot) → string (the 16-hex workspace key)
//   installKiroPermissions({ projectRoot, env? }) → { action, changed, path }
//   uninstallKiroPermissions({ projectRoot, env? }) → { action, changed }
//
// Managed-merge: we own ONLY the rules whose capability+match are ours (matched
// by the kit's known tokens); a user's own rules are byte-preserved on install +
// uninstall (the over-mutation discipline).

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import yaml from 'js-yaml';

import { MCP_AUTO_APPROVE } from './kiro-constants.mjs';

// The kit's MCP tools, namespaced as Kiro's permissions.yaml lists them
// (server/tool). MCP_AUTO_APPROVE is the shared source of the 12 tool names
// (also used for the IDE's mcp.json autoApprove), so the two never drift.
const MCP_MATCH = MCP_AUTO_APPROVE.map((t) => `core-memory-kit/${t}`);
const SHELL_MATCH = Object.freeze(['cmd.exe /c cmk hook *', 'cmd.exe /c cmk-guard-memory*']);
const SKILL_MATCH = Object.freeze(['memory-write', 'memory-search', 'troubleshooting']);

// The kit's owned MATCH ENTRIES, per capability+effect. Ownership is PER-ENTRY
// (not per-rule): Kiro stores ONE rule per (capability, effect) with a combined
// `match` array, so a user can co-locate their own match in the SAME rule as ours.
// We add/remove only OUR entries and never drop a co-located user entry (the
// over-mutation discipline — mirrors kiro-trusted-commands.mjs's per-entry filter,
// skill-review B1).
const OUR_MATCHES = Object.freeze({
  shell: SHELL_MATCH,
  mcp: MCP_MATCH,
  skill: SKILL_MATCH,
});
function isOurMatch(capability, entry) {
  const owned = OUR_MATCHES[capability];
  return Array.isArray(owned) && owned.includes(entry);
}

// Merge our match entries into an existing rules array, PER-ENTRY + PER-(capability,
// effect:allow) rule. Preserves the user's rules + their co-located match entries;
// adds only the missing OUR entries; keeps rule order stable (in-place, no float).
function withOurRules(existing) {
  // clone so we never mutate the parsed input
  const rules = existing.map((r) => ({ ...r, match: Array.isArray(r.match) ? [...r.match] : r.match }));
  for (const [capability, owned] of Object.entries(OUR_MATCHES)) {
    // find the existing allow-rule for this capability (Kiro's convention: one per cap)
    let rule = rules.find((r) => r && r.capability === capability && r.effect === 'allow' && Array.isArray(r.match));
    if (!rule) {
      rule = { capability, match: [], effect: 'allow' };
      rules.push(rule);
    }
    for (const m of owned) if (!rule.match.includes(m)) rule.match.push(m);
  }
  return rules;
}

// Remove our match entries PER-ENTRY; drop a rule only if its match becomes empty
// AND it was an allow-rule for a capability we own (never delete a user's rule).
function withoutOurRules(existing) {
  const out = [];
  let changed = false;
  for (const r of existing) {
    if (!r || r.capability == null || r.effect !== 'allow' || !Array.isArray(r.match) || !OUR_MATCHES[r.capability]) {
      out.push(r); // not a rule we touch
      continue;
    }
    const kept = r.match.filter((m) => !isOurMatch(r.capability, m));
    if (kept.length !== r.match.length) changed = true;
    if (kept.length > 0) out.push({ ...r, match: kept }); // user entries survive
    // else: the rule was ours-only → drop it
  }
  return { rules: out, changed };
}

/**
 * Kiro IDE 1.0's workspace-roots hash for a project path.
 * sha256(forward-slash + no-trailing-slash + lowercase).slice(0,16). (D-203h)
 */
export function kiroWorkspaceHash(projectRoot) {
  // resolve() a RELATIVE input to absolute (defense — Kiro keys on the absolute
  // workspace root; a relative path would hash to a dir Kiro never reads, review
  // M1). An ALREADY-absolute path (drive-letter `C:\…` or POSIX `/…`) is passed
  // through verbatim — so a Windows path stays correct even when this runs on a
  // POSIX CI (resolve() there would wrongly prepend cwd to `c:/…`). NOTE: only
  // ordinary drive-letter paths are ground-truth-verified (D-203h); UNC/extended-
  // length are untested.
  const p = String(projectRoot);
  const isAbsolute = /^[a-zA-Z]:[\\/]/.test(p) || /^[\\/]/.test(p);
  const abs = isAbsolute ? p : resolve(p);
  const norm = abs.replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase();
  return createHash('sha256').update(norm).digest('hex').slice(0, 16);
}

function permissionsPath(projectRoot, env) {
  const home = env.USERPROFILE || env.HOME || homedir();
  return join(home, '.kiro', 'workspace-roots', kiroWorkspaceHash(projectRoot), 'permissions.yaml');
}

// Parse an existing permissions.yaml → its rules array. A missing file → []. A
// MALFORMED file → { malformed: true } so the caller REFUSES to overwrite it
// (mirrors kiro-trusted-commands' don't-clobber-a-corrupt-file posture, review
// M3 — this writes to the user's HOME; never destroy content we couldn't parse).
function readRules(path) {
  if (!existsSync(path)) return { rules: [], existed: false };
  let parsed;
  try {
    parsed = yaml.load(readFileSync(path, 'utf8'));
  } catch {
    return { rules: [], existed: true, malformed: true };
  }
  // a parse that yields a non-object (e.g. a stray scalar) is also unsafe to clobber.
  if (parsed != null && typeof parsed !== 'object') return { rules: [], existed: true, malformed: true };
  const rules = parsed && Array.isArray(parsed.rules) ? parsed.rules : [];
  return { rules, existed: true };
}

function serialize(rules) {
  // js-yaml dump; flow-style for the compact match arrays Kiro uses is optional —
  // block style is equally valid YAML and is what Kiro itself wrote.
  return yaml.dump({ rules }, { lineWidth: -1, noRefs: true });
}

export function installKiroPermissions({ projectRoot, env = process.env } = {}) {
  if (!projectRoot) throw new Error('installKiroPermissions: projectRoot is required');
  const path = permissionsPath(projectRoot, env);
  const { rules: existing, malformed } = readRules(path);
  if (malformed) return { action: 'skipped', changed: false, path, reason: 'malformed-permissions-yaml' };
  const merged = withOurRules(existing); // per-entry merge — preserves order + user entries
  const serialized = serialize(merged);

  const prior = existsSync(path) ? readFileSync(path, 'utf8') : null;
  let changed = false;
  if (prior !== serialized) {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, serialized, 'utf8');
    changed = true;
  }
  return { action: 'installed', changed, path };
}

export function uninstallKiroPermissions({ projectRoot, env = process.env } = {}) {
  if (!projectRoot) throw new Error('uninstallKiroPermissions: projectRoot is required');
  const path = permissionsPath(projectRoot, env);
  if (!existsSync(path)) return { action: 'uninstalled', changed: false };
  const { rules: existing } = readRules(path);
  const { rules: kept, changed: removed } = withoutOurRules(existing); // per-entry removal
  if (!removed) return { action: 'uninstalled', changed: false }; // none of ours present
  // preserve the user's rules + co-located entries; write back without ours (never
  // delete the file — it may hold the user's own + Kiro's migration data).
  writeFileSync(path, serialize(kept), 'utf8');
  return { action: 'uninstalled', changed: true };
}
