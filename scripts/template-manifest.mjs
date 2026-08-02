// Source of truth for the contents of template/.
// Used by both scripts/validate-template.mjs (kit dev lint) and the
// tests in tests/template-scaffolding.test.js.
//
// Layout reflects design §1.1 (three tiers): project, local, user
// + a support/ subtree for files the installer copies into the target
// project but that aren't tier content per se (cron job definitions).
//
// Conventions:
//   - Tier seed files use the .template suffix and are copied (minus
//     the suffix) by `cmk install` / `cmk init-user-tier`.
//   - .gitkeep marks an otherwise-empty directory that must exist.
//   - Files marked emptyOk: true are allowed to have zero bytes
//     (i.e., .gitkeep markers). Everything else must be non-empty.

/** @typedef {{ path: string, emptyOk?: boolean, description: string }} ManifestFile */
/** @typedef {{ path: string, description: string }} ManifestDir */

/** @type {ManifestDir[]} */
export const requiredDirs = [
  { path: 'template', description: 'root of all template content' },
  { path: 'template/project', description: 'project tier seeds (copied to <repo>/context/)' },
  { path: 'template/project/memory', description: 'project granular archive' },
  { path: 'template/project/memory/archive', description: 'archive root for superseded + tombstones' },
  { path: 'template/project/memory/archive/superseded', description: 'merged/replaced facts (history)' },
  { path: 'template/project/memory/archive/tombstones', description: 'deleted facts (audit trail)' },
  { path: 'template/project/sessions', description: 'rolling-window session files' },
  { path: 'template/project/transcripts', description: 'verbatim turn captures' },
  { path: 'template/project/queues', description: 'review + conflict queues' },
  { path: 'template/project/.index', description: 'SQLite + FTS5 cache (gitignored at install)' },
  { path: 'template/local', description: 'local tier seeds (copied to <repo>/context.local/)' },
  { path: 'template/user', description: 'user tier seeds (copied to ~/.core-memory-kit/)' },
  { path: 'template/user/fragments', description: 'user-tier granular archive' },
  { path: 'template/support', description: 'support files installed alongside tier seeds' },
  { path: 'template/support/cron-jobs', description: 'cron job definitions for daily + weekly memory compression' },
  { path: 'template/.claude', description: 'Claude Code config scaffolded into <project>/.claude/' },
  { path: 'template/.claude/skills', description: 'skills scaffolded by cmk install (Task 69)' },
  { path: 'template/.claude/skills/memory-write', description: 'the memory-write skill (canonical source)' },
  { path: 'template/.claude/skills/memory-search', description: 'the memory-search skill (canonical source)' },
  { path: 'template/.claude/skills/troubleshooting', description: 'the troubleshooting skill (canonical source)' },
];

/** @type {ManifestFile[]} */
export const requiredFiles = [
  // Root of template/
  { path: 'template/CLAUDE.md.template', description: 'kit CLAUDE.md block injected by cmk install (Task 4)' },
  { path: 'template/.gitignore.fragment', description: 'gitignore lines injected into target .gitignore' },

  // Project tier
  { path: 'template/project/SOUL.md.template', description: 'project persona seed (≤1,800 chars)' },
  { path: 'template/project/MEMORY.md.template', description: 'working memory seed (≤2,500 chars)' },
  { path: 'template/project/memory/INDEX.md.template', description: 'pointer index for granular archive' },
  { path: 'template/project/memory/archive/superseded/.gitkeep', emptyOk: true, description: 'ensures dir exists' },
  { path: 'template/project/memory/archive/tombstones/.gitkeep', emptyOk: true, description: 'ensures dir exists' },
  { path: 'template/project/sessions/.gitkeep', emptyOk: true, description: 'ensures dir exists' },
  { path: 'template/project/transcripts/.gitkeep', emptyOk: true, description: 'ensures dir exists' },
  { path: 'template/project/queues/.gitkeep', emptyOk: true, description: 'ensures dir exists' },
  { path: 'template/project/.index/.gitkeep', emptyOk: true, description: 'ensures dir exists' },

  // Local tier
  { path: 'template/local/machine-paths.md.template', description: 'absolute paths for this machine (≤1,000 chars)' },
  { path: 'template/local/overrides.md.template', description: 'machine-specific overrides (≤1,000 chars)' },
  { path: 'template/local/private.md.template', description: 'sensitive-but-useful facts routed local-only by the sensitivity screen (Task 148.5, ≤1,500 chars)' },

  // User tier
  { path: 'template/user/USER.md.template', description: 'identity seed (≤1,375 chars)' },
  { path: 'template/user/HABITS.md.template', description: 'cross-project working style (≤1,800 chars)' },
  { path: 'template/user/LESSONS.md.template', description: 'cross-project lessons (≤1,800 chars)' },
  { path: 'template/user/fragments/INDEX.md.template', description: 'user-tier pointer index' },

  // Skills (Task 69) — scaffolded by cmk install into <project>/.claude/skills/.
  // Plain .md (no .template suffix; no placeholders). Canonical source mirrored
  // to plugin/skills/ by scripts/sync-plugin-skills.mjs; guarded by
  // scripts/validate-skill-sources.mjs.
  { path: 'template/.claude/skills/memory-write/SKILL.md', description: 'memory-write skill — safe cmk-routed capture' },
  { path: 'template/.claude/skills/memory-search/SKILL.md', description: 'memory-search skill — recall from project memory' },
  { path: 'template/.claude/skills/troubleshooting/SKILL.md', description: 'troubleshooting skill — the kit failure-code repair book' },
];

/** Flatten to absolute-like paths for grep-friendly output. */
export function manifestSummary() {
  return {
    dirCount: requiredDirs.length,
    fileCount: requiredFiles.length,
    paths: [...requiredDirs.map((d) => d.path + '/'), ...requiredFiles.map((f) => f.path)],
  };
}
