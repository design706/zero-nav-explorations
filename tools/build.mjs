#!/usr/bin/env node
/**
 * Build the prototype: pristine base + every lane's rules + every lane's script.
 *
 *   node tools/build.mjs [--out dist]
 *
 * WHY THIS EXISTS
 * Two chats work on this prototype at once — one on the City home, one on the
 * Cards home — and both publish to the same link. The bundle is PATCHED, so if
 * each chat regenerated and committed it, whichever pushed last would silently
 * revert the other's bundle-level work. So the bundle is never committed: CI
 * builds it here from ALL lanes' rule files, which means a build can only ever
 * contain more than either lane alone, never less.
 *
 * Each rule is [name, RegExp, replacement] and MUST match exactly once. A miss
 * aborts the whole build — a half-applied patch is precisely the "scaled discs
 * next to unscaled details" class of bug this pipeline exists to prevent.
 */
import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { RULES as CORE } from './rules-core.mjs';
import { RULES as CITY } from './rules-city.mjs';
import { RULES as CARDS } from './rules-cards.mjs';
import { CORE_TOKENS, CITY_TOKENS, CARDS_TOKENS } from './tokens.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, process.argv.includes('--out') ? process.argv[process.argv.indexOf('--out') + 1] : 'dist');
const BASE = join(ROOT, 'base');

/* Order is load-bearing: the token prelude in rules-core defines __NXD, and
   `titleWrap` anchors on text that `headerTrans` has already rewritten. */
const RULES = [...CORE, ...CITY, ...CARDS];

const html = readFileSync(join(BASE, 'index.html'), 'utf8');
const entry = html.match(/src="[^"]*\/(index-[A-Za-z0-9_-]+\.js)"/)?.[1];
if (!entry) throw new Error('could not find the module entry in base/index.html');

let out = readFileSync(join(BASE, 'assets', entry), 'utf8');
if (out.includes('__NXD')) throw new Error('base/ is not pristine — it already carries a patch');

const applied = [];
for (const [name, re, rep] of RULES) {
  const n = (out.match(new RegExp(re.source, 'g')) || []).length;
  if (n !== 1) {
    throw new Error(
      `RULE "${name}" matched ${n} times, expected exactly 1.\n` +
        `  pattern: ${re.source}\n` +
        `  The upstream build has drifted. Refusing to write a partial patch.`
    );
  }
  out = out.replace(re, rep);
  applied.push(name);
}

/* dist = the pristine base, then our additions on top. */
cpSync(BASE, OUT, { recursive: true });
writeFileSync(join(OUT, 'assets', entry), out);
mkdirSync(join(OUT, 'src'), { recursive: true });
for (const f of ['core.js', 'city.js', 'cards.js']) {
  cpSync(join(ROOT, 'src', f), join(OUT, 'src', f));
}
if (existsSync(join(ROOT, 'start.html'))) cpSync(join(ROOT, 'start.html'), join(OUT, 'start.html'));
// scenario title art (cards lane) — repo-root art/, never base/
if (existsSync(join(ROOT, 'art'))) cpSync(join(ROOT, 'art'), join(OUT, 'nx-art'), { recursive: true });

const v = Date.now(); // the patched bundle keeps its hashed name, so version it
const KNOB = `  <script>
    (function () {
      var q = new URLSearchParams(location.search);
      if ((q.get('dock') || '').split(',').indexOf('off') !== -1) return;
      var pf = (q.get('pf') || 'unlocked').toLowerCase();
      var NODE = 56, MARK = 38, OPEN_PILL = 44, PAD_Y = 17, GAP = 10;
      window.__NX_DOCK = {${CORE_TOKENS}${CITY_TOKENS}${CARDS_TOKENS}
      };
      var railH = NODE + 2 * PAD_Y + 2;
      document.documentElement.style.setProperty('--nx-lift', (36 + railH + 6) + 'px');
      document.documentElement.dataset.nxDock = '1';
    })();
  </script>
`;

let page = html
  .replace(/(src="[^"]*index-[A-Za-z0-9_-]+\.js)"/, `$1?v=${v}"`)
  .replace('  <script type="module"', KNOB + '  <script type="module"')
  .replace(
    '</body>',
    `  <script src="./src/core.js?v=${v}"></script>\n` +
      `  <script src="./src/city.js?v=${v}"></script>\n` +
      `  <script src="./src/cards.js?v=${v}"></script>\n</body>`
  );
writeFileSync(join(OUT, 'index.html'), page);

console.log(`built ${applied.length} rules → ${OUT}`);
console.log(`  core: ${CORE.length}  city: ${CITY.length}  cards: ${CARDS.length}`);
