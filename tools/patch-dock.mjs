#!/usr/bin/env node
/**
 * patch-dock.mjs — make the nav rail's geometry tokens runtime-settable.
 *
 *   node patch-dock.mjs <pristine-root> <target-root>
 *
 * WHY A BUNDLE PATCH AND NOT CSS
 * The rail's states live in INLINE styles produced by ternaries in the
 * component (`height: open ? OPEN_PILL : MARK`, `maxWidth: open ? 150 : 0`,
 * and a segment padding that INVERTS on open, `open ? 4 : 8`). CSS has no
 * selector for "this element's inline height is currently 30 rather than 26",
 * so any `height:X!important` necessarily flattens both branches into one —
 * which is exactly the breakage this replaces. Patching the constants instead
 * leaves every ternary intact and lets the component's own flex layout reflow
 * each state correctly. Same idea as changing sizing on a Figma component and
 * letting auto-layout resolve it.
 *
 * WHAT IT DOES NOT TOUCH, DELIBERATELY
 *  · className strings — inline style already wins the cascade, so every value
 *    here is reachable via the style object. Leaving classes alone keeps the
 *    DOM structure `firstrun.js` classifies (SPAN vs aria-label) byte-identical.
 *  · ScenarioPreview, the hover detail card. Its geometry is Tailwind
 *    (`w-[318px]`) and NO rule below matches inside it, so its 318px is
 *    protected structurally rather than by a flag someone can forget.
 *  · The nav's own `bottom-[36px] left-[40px] right-[40px]` — screen-edge
 *    margins, not rail geometry.
 *
 * PARITY WHEN OFF
 * Every injected value is `__NXD.X ?? <the original literal>`, and the optional
 * ones fall back to `void 0` (React omits undefined style properties). With
 * `window.__NX_DOCK` unset the emitted styles are identical to the shipped
 * build — verified by a computed-style snapshot diff, not by inspection.
 */
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync } from 'node:fs';
import { join, basename } from 'node:path';

const [, , PRISTINE, TARGET] = process.argv;
if (!PRISTINE || !TARGET) {
  console.error('usage: patch-dock.mjs <pristine-root> <target-root>');
  process.exit(2);
}

/* The entry filename is content-hashed and changes on every upstream build, so
   discover it from index.html rather than hardcoding it. */
const html = readFileSync(join(PRISTINE, 'index.html'), 'utf8');
const entry = html.match(/src="[^"]*\/(index-[A-Za-z0-9_-]+\.js)"/)?.[1];
if (!entry) throw new Error('could not find the module entry in index.html');

const srcPath = join(PRISTINE, 'assets', entry);
const outPath = join(TARGET, 'assets', entry);
const src = readFileSync(srcPath, 'utf8');

if (src.includes('__NXD')) {
  console.log('already patched — no-op');
  process.exit(0);
}

/** A minified local identifier, captured so it can be re-emitted verbatim. */
const ID = '([A-Za-z_$][A-Za-z0-9_$]*)';

/* The token prelude. `__NXD` is read once at module scope; the rail is the only
   consumer of NODE/MARK/OPEN_PILL anywhere in the bundle (verified: 4/8/3 refs,
   all inside the rail region). */
const PRELUDE =
  'const __NXD=(typeof window<"u"&&window.__NX_DOCK)||{},' +
  'NODE=__NXD.NODE??38,MARK=__NXD.MARK??26,OPEN_PILL=__NXD.OPEN_PILL??30,';

const RULES = [
  // ── the token table ────────────────────────────────────────────────────
  ['tokens', /const NODE=38,MARK=26,OPEN_PILL=30,/, PRELUDE],

  // ── the glass bar: padding drives rail HEIGHT, gap drives width ────────
  // Vertical padding is where the "dock presence" is bought (7 -> 17, x2.43);
  // horizontal padding and gap only get the rhythm factor (x1.43). Splitting
  // the shipped `padding:7` on its two axes is the single move that buys 1.7x
  // HEIGHT at a width the 1840 band can actually hold.
  // The gap also compresses while any node is open (focus mode) - the shipped
  // design already does this in miniature (open segment padding 8 -> 4).
  [
    'bar',
    /className:"relative flex items-center rounded-full",style:\{padding:7,gap:7,/,
    'className:"relative flex items-center rounded-full",style:{padding:__NXD.BAR_PAD??7,' +
      'gap:($!==null?__NXD.GAP_FOCUS:__NXD.GAP)??__NXD.GAP??7,',
  ],

  // Expose "is any node open" to CSS so the connectors can compress too.
  // Undefined when the variant is off, so React omits the attribute entirely.
  [
    'focusAttr',
    /className:"pointer-events-auto absolute bottom-\[36px\] left-\[40px\] right-\[40px\] z-20 flex justify-center",/,
    'className:"pointer-events-auto absolute bottom-[36px] left-[40px] right-[40px] z-20 flex justify-center",' +
      '"data-nx-focus":__NXD.GAP&&$!==null?"1":void 0,',
  ],

  // ── segment: height from NODE; padding INVERTS on open, preserved ──────
  [
    'seg',
    new RegExp(`height:NODE,paddingLeft:${ID}\\?4:8,paddingRight:\\1\\?4:8,`),
    'height:NODE,gap:__NXD.SEG_GAP??void 0,' +
      'paddingLeft:$1?(__NXD.SEG_PAD_O??4):(__NXD.SEG_PAD_C??8),' +
      'paddingRight:$1?(__NXD.SEG_PAD_O??4):(__NXD.SEG_PAD_C??8),',
  ],

  // ── category header: the two-line treatment lives here ─────────────────
  // whiteSpace/lineHeight/fontSize override the nowrap + leading-none + 12px
  // classes purely via inline style; display/alignContent fall back to void 0
  // so React omits them entirely when the variant is off.
  [
    'header',
    new RegExp(
      `height:OPEN_PILL,maxWidth:${ID}\\?240:0,opacity:\\1\\?1:0,paddingLeft:\\1\\?10:0,paddingRight:\\1\\?8:0,`
    ),
    'height:OPEN_PILL,fontSize:__NXD.TITLE_FS??void 0,whiteSpace:__NXD.TITLE_WS??void 0,' +
      'lineHeight:__NXD.TITLE_LH??void 0,display:__NXD.TITLE_DISPLAY??void 0,' +
      'alignContent:__NXD.TITLE_ALIGN??void 0,alignItems:__NXD.TITLE_AI??void 0,' +
      'maxWidth:$1?(__NXD.TITLE_MAX??240):0,opacity:$1?1:0,' +
      'paddingLeft:$1?(__NXD.TITLE_PL??10):0,paddingRight:$1?(__NXD.TITLE_PR??8):0,',
  ],

  // The title must lay out at a FIXED width, not against the animating
  // max-width - otherwise it reflows from many lines down to two during the
  // 420ms reveal and the whole 92px rail visibly pumps in height. So wrap it
  // in a span whose width is a constant. With the variant off every style is
  // `void 0`, so this is a bare inline span around the same text node.
  [
    'titleWrap',
    new RegExp(
      `transition:slide\\(${ID},\\["max-width","opacity","padding"\\]\\)\\},children:${ID}\\.title\\}\\),`
    ),
    'transition:slide($1,["max-width","opacity","padding"])},' +
      'children:jsxRuntimeExports.jsx("span",{style:{width:__NXD.TITLE_W??void 0,' +
      'whiteSpace:__NXD.TITLE_WS??void 0,lineHeight:__NXD.TITLE_LH??void 0,' +
      'display:__NXD.TITLE_BOX??void 0,WebkitBoxOrient:__NXD.TITLE_ORIENT??void 0,' +
      'WebkitLineClamp:__NXD.TITLE_CLAMP??void 0,overflow:__NXD.TITLE_OF??void 0,' +
      'textAlign:__NXD.TITLE_TA??void 0},children:$2.title})}),',
  ],

  // ── chip: the collapsed/expanded height ternary is preserved verbatim ──
  [
    'chip',
    new RegExp(`height:${ID}\\?OPEN_PILL:MARK,paddingLeft:\\1\\?2:0,paddingRight:\\1\\?10:0,`),
    'height:$1?OPEN_PILL:MARK,paddingLeft:$1?(__NXD.CHIP_PL??2):0,' +
      'paddingRight:$1?(__NXD.CHIP_PR??10):0,',
  ],

  // ── chip selection ring: 1.5px hairline, scaled sublinearly ────────────
  [
    'ring',
    new RegExp(
      `boxShadow:${ID}&&${ID}\\?\`inset 0 0 0 1\\.5px \\$\\{${ID}\\}\`:${ID}\\?\`0 0 0 1\\.5px \\$\\{\\3\\}\`:"none"`
    ),
    'boxShadow:$1&&$2?`inset 0 0 0 ${__NXD.RING??"1.5px"} ${$3}`' +
      ':$4?`0 0 0 ${__NXD.RING??"1.5px"} ${$3}`:"none"',
  ],

  // ── chip label block ───────────────────────────────────────────────────
  [
    'label',
    new RegExp(`maxWidth:${ID}\\?150:0,opacity:\\1\\?1:0,marginLeft:\\1\\?7:0,`),
    'fontSize:__NXD.LABEL_FS??void 0,gap:__NXD.LABEL_GAP??void 0,' +
      'maxWidth:$1?(__NXD.LABEL_MAX??150):0,opacity:$1?1:0,' +
      'marginLeft:$1?(__NXD.LABEL_ML??7):0,',
  ],

  // ── the completed-scenario check glyph ─────────────────────────────────
  [
    'check',
    new RegExp(`Check,\\{size:12,strokeWidth:3,color:${ID},`),
    'Check,{size:__NXD.CHECK??12,strokeWidth:__NXD.CHECK_SW??3,color:$1,',
  ],

  // ── the current-scenario breathing ring ────────────────────────────────
  [
    'pulse',
    new RegExp(`boxShadow:\`0 0 0 1\\.5px \\$\\{${ID}\\}, 0 0 18px -4px \\$\\{\\1\\}\``),
    'boxShadow:`0 0 0 ${__NXD.RING??"1.5px"} ${$1}, 0 0 ${__NXD.GLOW??"18px"} ' +
      '-${__NXD.GLOW_IN??"4px"} ${$1}`',
  ],

  // ── the connector between clusters ─────────────────────────────────────
  [
    'connector',
    new RegExp(`style:\\{width:12,height:2,background:${ID}\\?${ID}:"rgba\\(255,255,255,0\\.12\\)"\\}`),
    'style:{width:__NXD.CONN_W??12,height:__NXD.CONN_H??2,' +
      'background:$1?$2:"rgba(255,255,255,0.12)"}',
  ],

  // ── milestones (Portfolio / Job Portal) ────────────────────────────────
  [
    'milestone',
    new RegExp(`height:NODE,minWidth:NODE,paddingLeft:${ID}\\?13:0,paddingRight:\\1\\?14:0,`),
    'height:NODE,minWidth:NODE,paddingLeft:$1?(__NXD.MS_PL??13):0,' +
      'paddingRight:$1?(__NXD.MS_PR??14):0,',
  ],
  [
    'milestoneIcon',
    new RegExp(`jsxRuntimeExports\\.jsx\\(${ID},\\{size:19,color:`),
    'jsxRuntimeExports.jsx($1,{size:__NXD.MS_ICON??19,color:',
  ],
  [
    'milestoneLabel',
    new RegExp(`maxWidth:${ID}\\?240:0,opacity:\\1\\?1:0,marginLeft:\\1\\?8:0,`),
    'fontSize:__NXD.LABEL_FS??void 0,maxWidth:$1?(__NXD.MS_LBL_MAX??240):0,opacity:$1?1:0,' +
      'marginLeft:$1?(__NXD.MS_ML??8):0,',
  ],
];

let out = src;
const applied = [];
for (const [name, re, rep] of RULES) {
  const n = (src.match(new RegExp(re.source, 'g')) || []).length;
  if (n !== 1) {
    // All-or-nothing: a partially applied patch IS the "scaled discs beside
    // unscaled details" bug we are eliminating, so it must be unproducible.
    const probe = re.source.replace(/\\/g, '').slice(0, 28);
    const at = src.indexOf(probe.replace(/[()[\]?*+|^$]/g, ''));
    throw new Error(
      `RULE "${name}" matched ${n} times, expected exactly 1.\n` +
        `  pattern: ${re.source}\n` +
        (at >= 0 ? `  nearest context @${at}: …${src.slice(at - 100, at + 180)}…\n` : '') +
        `  The upstream build has drifted. Refusing to write a partial patch.`
    );
  }
  out = out.replace(re, rep);
  applied.push(name);
}

mkdirSync(join(TARGET, 'assets'), { recursive: true });
writeFileSync(outPath, out);
console.log(`patched ${applied.length}/${RULES.length} sites → ${basename(outPath)}`);
console.log(`  ${applied.join(', ')}`);
