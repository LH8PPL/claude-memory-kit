// @doors: 1, 2
// Door 3 N/A: copies SKILL.md files on disk; no subprocess spawn.
// Door 4 N/A: no NDJSON/audit surface at this leg (the install summary is the
//   CLI's concern).
// Door 5 N/A: no message-queue interaction.

// Tests for Task 50.I (skills leg) — install the kit's memory skills into Kiro.
//
// Kiro skills = Claude-Code-style <name>/SKILL.md with YAML frontmatter (verified
// from real files: ~/.kiro/skills/<name>/SKILL.md, .kiro/skills/<name>/SKILL.md).
// The kit's memory-search + memory-write skills port directly — translating the
// Claude-Code-specific frontmatter (drop context:fork / allowed-tools; keep
// name + description, the fields Kiro honors). This leg copies them.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import yaml from 'js-yaml';
import { installKiroSkills, uninstallKiroSkills } from '../packages/cli/src/kiro-skills.mjs';

let sandbox;
let projectRoot;

beforeEach(() => {
  sandbox = mkdtempSync(join(tmpdir(), 'cmk-kiro-skills-'));
  projectRoot = join(sandbox, 'proj');
});

afterEach(() => {
  rmSync(sandbox, { recursive: true, force: true });
});

describe('Task 50.I — Kiro skills leg', () => {
  describe('installKiroSkills copies the kit memory skills as Kiro SKILL.md', () => {
    it('writes memory-search + memory-write to .kiro/skills/<name>/SKILL.md', () => {
      const r = installKiroSkills({ projectRoot });

      // Door 1 — Response
      expect(r.action).toBe('installed');
      expect(r.skills.sort()).toEqual(['memory-search', 'memory-write', 'troubleshooting']);

      // Door 2 — State
      for (const name of ['memory-search', 'memory-write', 'troubleshooting']) {
        const p = join(projectRoot, '.kiro', 'skills', name, 'SKILL.md');
        expect(existsSync(p)).toBe(true);
      }
    });

    it('keeps name + description, drops Claude-Code-specific frontmatter', () => {
      installKiroSkills({ projectRoot });
      const body = readFileSync(
        join(projectRoot, '.kiro', 'skills', 'memory-write', 'SKILL.md'),
        'utf8',
      );
      // kept
      expect(body).toMatch(/^name:\s*memory-write/m);
      expect(body).toMatch(/^description:/m);
      // dropped — these are Claude Code skill frontmatter keys Kiro doesn't use
      expect(body).not.toMatch(/^context:\s*fork/m);
      expect(body).not.toMatch(/^allowed-tools:/m);
      // the skill BODY (instructions) is preserved
      expect(body).toMatch(/Poison_Guard|cmk remember|durable fact/i);
    });

    it('the translated frontmatter is VALID YAML — Kiro strict-parses it and rejects invalid (the cut-gate-kiro 7th cut-blocker)', () => {
      // Kiro validates SKILL.md frontmatter with a strict YAML parser; an invalid
      // description (e.g. an unquoted `: ` colon-space) makes it reject the skill
      // ("Invalid SKILL.md frontmatter"). Claude Code reads leniently and never
      // surfaced it. So assert the TRANSLATED output (what Kiro consumes) parses.
      installKiroSkills({ projectRoot });
      for (const name of ['memory-search', 'memory-write', 'troubleshooting']) {
        const text = readFileSync(join(projectRoot, '.kiro', 'skills', name, 'SKILL.md'), 'utf8');
        const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
        expect(fm, `${name}: has frontmatter`).not.toBeNull();
        // strict-parse — throws on the colon-space class Kiro rejects
        const parsed = yaml.load(fm[1]);
        expect(parsed, `${name}: frontmatter is a mapping`).toBeTypeOf('object');
        expect(parsed.name).toBe(name);
        expect(typeof parsed.description).toBe('string');
        expect(parsed.description.length).toBeGreaterThan(0);
      }
    });

    it('is idempotent — a second install reports no change', () => {
      installKiroSkills({ projectRoot });
      const r2 = installKiroSkills({ projectRoot });
      expect(r2.changed).toBe(false);
    });
  });

  describe('uninstallKiroSkills removes only our skill dirs', () => {
    it('removes the kit skills, preserves a user skill in the same dir', () => {
      installKiroSkills({ projectRoot });
      // user has their own skill alongside
      const userSkill = join(projectRoot, '.kiro', 'skills', 'my-skill', 'SKILL.md');
      mkdirSync(join(projectRoot, '.kiro', 'skills', 'my-skill'), { recursive: true });
      writeFileSync(userSkill, '---\nname: my-skill\n---\nmine', 'utf8');

      uninstallKiroSkills({ projectRoot });

      // ours gone, theirs preserved
      expect(existsSync(join(projectRoot, '.kiro', 'skills', 'memory-search'))).toBe(false);
      expect(existsSync(join(projectRoot, '.kiro', 'skills', 'memory-write'))).toBe(false);
      expect(existsSync(userSkill)).toBe(true);
    });
  });
});
