// Granular-archive pointer-index writer (Task 8, refactored in
// cleanup-layer-2-cross-module-drift). Single public boundary:
// reindex(opts) → result. See design §2.3.
//
// Uses shared modules: tier-paths (path resolution), frontmatter (js-yaml
// parse). See CLAUDE.md "Shared modules" rule.

import {
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { VALID_TIERS, resolveTierRoot, resolveFactDir } from './tier-paths.mjs';
import { parse } from './frontmatter.mjs';
// The shared fact-file lister (Task 241). Its sort uses the same explicit
// code-unit comparator this module needed: these filenames order INDEX.md, a
// COMMITTED file, and locale-dependent collation would make the same corpus
// produce different diffs on different machines.
import { listFactFiles, MAP_FILENAME } from './fact-store.mjs';
import { buildVaultMap } from './vault-map.mjs';
// Task 250 (D-412) — the `index-drift` warning CLEARS here, because this is the
// one function that actually rebuilds the INDEX. Putting the clear anywhere
// narrower (writeFact's inline rebuild) left the whisper's own prescribed fix —
// `cmk reindex` — unable to clear the warning it prescribes.
// The TRANSITION form, not the plain append: a fact-writing process reindexes
// once per fact, and one `ok` per write is exactly the cadence flood that was
// evicting sparse classes from the shared tail (review finding B2).
import { appendHealthTransition, HEALTH_CODES } from './health-log.mjs';

const INDEX_SIZE_WARN_BYTES = 25 * 1024;
const HOOK_MAX_LEN = 80;

const TIER_LABEL = {
  P: 'project tier',
  L: 'local tier',
  U: 'user tier',
};

function extractHook(body) {
  for (const raw of body.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith('#')) continue;
    if (line.length > HOOK_MAX_LEN) {
      return line.slice(0, HOOK_MAX_LEN).trimEnd() + '...';
    }
    return line;
  }
  return '';
}

// Wrap any bare http(s):// URL in angle brackets so it doesn't trip markdownlint
// MD034 (no-bare-urls) when the INDEX ships in a user's committed repo. A URL
// already inside `<…>` or `](…)` is left alone (the char before it isn't `<`/`(`).
function autolinkBareUrls(text) {
  return text.replace(/(^|[^<(])\b(https?:\/\/[^\s<>)\]]+)/g, '$1<$2>');
}

function formatIndexLine({ id, type, title, filename, hook }) {
  // Lint-clean the rendered INDEX line:
  //   - the title goes inside `[title]` link text: trim + collapse internal
  //     whitespace so a trailing space before `]` doesn't trip MD039
  //     (no-space-in-links).
  //   - the hook is trailing prose: wrap bare URLs (MD034).
  const linkTitle = String(title ?? '').replace(/\s+/g, ' ').trim();
  const head = `- (${id}) [${type}] [${linkTitle}](${filename})`;
  return hook ? `${head} — ${autolinkBareUrls(hook)}` : head;
}

export function reindex(opts = {}) {
  const { tier, projectRoot, userDir, warn } = opts;
  if (!tier || !VALID_TIERS.has(tier)) {
    throw new Error(
      `reindex: invalid tier ${JSON.stringify(tier)}. Must be 'U', 'P', or 'L'.`,
    );
  }
  const emit = warn ?? ((msg) => process.stderr.write(msg + '\n'));
  const warnings = [];
  function pushWarning(msg) {
    warnings.push(msg);
    emit(msg);
  }

  const tierRoot = resolveTierRoot({ tier, projectRoot, userDir });
  const factDir = resolveFactDir(tier, tierRoot);
  mkdirSync(factDir, { recursive: true });

  const entries = [];
  for (const filename of listFactFiles(factDir)) {
    const path = join(factDir, filename);
    let text;
    try {
      text = readFileSync(path, 'utf8');
    } catch (e) {
      pushWarning(`reindex: failed to read ${filename}: ${e.message}`);
      continue;
    }
    const { frontmatter, body, parseError } = parse(text);
    if (!frontmatter) {
      pushWarning(
        `reindex: ${filename} skipped — ${parseError ?? 'no YAML frontmatter'}`,
      );
      continue;
    }
    if (!frontmatter.id || !frontmatter.type || !frontmatter.title) {
      pushWarning(
        `reindex: ${filename} skipped — missing required frontmatter field(s) (id/type/title)`,
      );
      continue;
    }
    if (frontmatter.deleted_at) continue;
    entries.push({
      id: frontmatter.id,
      type: frontmatter.type,
      title: frontmatter.title,
      filename,
      hook: extractHook(body),
      // Task 254: carry the parsed frontmatter + body so the vault map renders
      // from the SAME walk (no second file read). Consumed only by buildVaultMap.
      frontmatter,
      body,
    });
  }

  entries.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  const header = `# Granular memory index — ${TIER_LABEL[tier]}\n\n## Files\n`;
  const bodyLines = entries.map(formatIndexLine).join('\n');
  const content = entries.length
    ? `${header}\n${bodyLines}\n`
    : `${header}\n`;

  const indexPath = join(factDir, 'INDEX.md');
  writeFileSync(indexPath, content, 'utf8');

  const bytes = Buffer.byteLength(content, 'utf8');
  if (bytes > INDEX_SIZE_WARN_BYTES) {
    pushWarning(
      `reindex: ${indexPath} is ${(bytes / 1024).toFixed(1)} KB (>25 KB); consider consolidation`,
    );
  }

  // Task 254: the Obsidian vault map, beside INDEX.md, from the SAME walk.
  // Best-effort: the facts are already durably on disk and INDEX.md is written,
  // so a map-render hiccup must NEVER turn a successful reindex (and thus a
  // capture) into an error — the next reindex regenerates it (it's a derived,
  // regenerable view, ADR-0002).
  const mapPath = join(factDir, MAP_FILENAME);
  let mapBytes = null;
  try {
    const mapContent = buildVaultMap(entries, { tier });
    writeFileSync(mapPath, mapContent, 'utf8');
    mapBytes = Buffer.byteLength(mapContent, 'utf8');
  } catch (mapErr) {
    pushWarning(`reindex: vault map (${MAP_FILENAME}) not written: ${mapErr.message}`);
  }

  // Task 250 (B1) — THE INDEX IS IN STEP AGAIN, so the `index-drift` warning
  // clears. This sits at the ONE place that rebuilds INDEX.md, which is what
  // makes the whisper's prescribed fix actually work: `cmk reindex`,
  // `cmk repair --index`, the boot reindex, and writeFact's inline rebuild all
  // arrive here. Previously only writeFact's call site appended the `ok`, so an
  // agent that did exactly what the whisper told it to could not clear the
  // warning — the Tailscale #19241 stuck-warning class the design claims is
  // structurally impossible. `appendHealthEntry` no-ops without a kit project
  // root, so a user-tier reindex (no projectRoot) writes nothing.
  appendHealthTransition(projectRoot, { class: HEALTH_CODES.INDEX_DRIFT, outcome: 'ok' });

  return {
    tier,
    indexPath,
    factCount: entries.length,
    bytes,
    mapPath,
    mapBytes,
    warnings,
  };
}
