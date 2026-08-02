// kiro-skills.mjs — install the kit's memory skills into Kiro (Task 50.I, skills leg).
//
// Kiro's skill surface is Claude-Code-style <name>/SKILL.md with YAML frontmatter
// (verified from real installs: .kiro/skills/<name>/SKILL.md project-tier,
// ~/.kiro/skills/<name>/SKILL.md user-tier). The kit already ships memory-search
// + memory-write as SKILL.md under template/.claude/skills/ — they port directly.
// The only transform: drop the Claude-Code-specific frontmatter keys Kiro doesn't
// honor (`context`, `allowed-tools`) while keeping `name` + `description` + the
// instruction body. The cmk MCP tools the skills reference are wired by the MCP
// leg, so the skill body works unchanged.
//
// Public surface:
//   installKiroSkills({ projectRoot, templateDir? }) → { action, changed, skills }
//   uninstallKiroSkills({ projectRoot }) → { action, changed, skills }

import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { resolveTemplateDir } from './install.mjs';

// The kit skills that map to Kiro — every skill the kit scaffolds for Claude
// Code (recall, capture, and the Task-250 failure-code repair book).
const KIT_SKILLS = ['memory-search', 'memory-write', 'troubleshooting'];

// Frontmatter keys Kiro does NOT use — dropped on translation. Everything else
// in the frontmatter (name, description) + the whole body is preserved.
const DROP_KEYS = new Set(['context', 'allowed-tools']);

export function installKiroSkills({ projectRoot, templateDir } = {}) {
  if (!projectRoot) throw new Error('installKiroSkills: projectRoot is required');
  const tpl = templateDir || resolveTemplateDir();
  const skillsRoot = join(projectRoot, '.kiro', 'skills');

  let changed = false;
  const installed = [];
  for (const name of KIT_SKILLS) {
    const src = join(tpl, '.claude', 'skills', name, 'SKILL.md');
    if (!existsSync(src)) continue; // skill not in this template — skip, don't fail
    const translated = translateFrontmatter(readFileSync(src, 'utf8'));
    const destDir = join(skillsRoot, name);
    const dest = join(destDir, 'SKILL.md');

    const existing = existsSync(dest) ? readFileSync(dest, 'utf8') : null;
    if (existing !== translated) {
      mkdirSync(destDir, { recursive: true });
      writeFileSync(dest, translated, 'utf8');
      changed = true;
    }
    installed.push(name);
  }
  return { action: 'installed', changed, skills: installed };
}

export function uninstallKiroSkills({ projectRoot } = {}) {
  if (!projectRoot) throw new Error('uninstallKiroSkills: projectRoot is required');
  const skillsRoot = join(projectRoot, '.kiro', 'skills');
  let changed = false;
  const removed = [];
  for (const name of KIT_SKILLS) {
    const dir = join(skillsRoot, name);
    if (existsSync(dir)) {
      rmSync(dir, { recursive: true, force: true });
      changed = true;
      removed.push(name);
    }
  }
  return { action: 'uninstalled', changed, skills: removed };
}

// ── internal ─────────────────────────────────────────────────────────────────

// Drop the Claude-Code-only frontmatter keys, keep the rest of the frontmatter +
// the entire body. Operates on the leading `---` … `---` block only; the body is
// byte-preserved. Multi-line values (e.g. a wrapped description) are kept whole —
// a dropped key's continuation lines (indented) are dropped with it.
function translateFrontmatter(content) {
  const m = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) return content; // no frontmatter — pass through unchanged
  const [, fm, body] = m;

  const lines = fm.split('\n');
  const kept = [];
  let dropping = false;
  for (const line of lines) {
    const keyMatch = line.match(/^([A-Za-z0-9_-]+):/);
    if (keyMatch) {
      // a new top-level key — decide whether to drop it (+ its continuation)
      dropping = DROP_KEYS.has(keyMatch[1]);
      if (!dropping) kept.push(line);
    } else if (!dropping) {
      // continuation line of a kept key (indented / blank) — preserve
      kept.push(line);
    }
    // else: continuation of a dropped key — skip
  }
  return `---\n${kept.join('\n')}\n---\n${body}`;
}
