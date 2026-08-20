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
      'marginRight:$1?(__NXD.TITLE_MR_O??void 0):(__NXD.TITLE_MR_C??void 0),' +
      'lineHeight:__NXD.TITLE_LH??void 0,display:__NXD.TITLE_DISPLAY??void 0,' +
      'alignContent:__NXD.TITLE_ALIGN??void 0,alignItems:__NXD.TITLE_AI??void 0,' +
      'maxWidth:$1?(__NXD.TITLE_MAX??240):0,opacity:$1?1:0,' +
      'paddingLeft:$1?(__NXD.TITLE_PL??10):0,paddingRight:$1?(__NXD.TITLE_PR??8):0,',
  ],

  [
    'headerTrans',
    new RegExp(
      `transition:slide\\(${ID},\\["max-width","opacity","padding"\\]\\)\\},children:${ID}\\.title`
    ),
    'transition:slide($1,__NXD.TITLE_TRANS??["max-width","opacity","padding"])},children:$2.title',
  ],

  // The title must lay out at a FIXED width, not against the animating
  // max-width - otherwise it reflows from many lines down to two during the
  // 420ms reveal and the whole 92px rail visibly pumps in height. So wrap it
  // in a span whose width is a constant. With the variant off every style is
  // `void 0`, so this is a bare inline span around the same text node.
  [
    'titleWrap',
    new RegExp(
      `transition:slide\\(${ID},__NXD\\.TITLE_TRANS\\?\\?\\["max-width","opacity","padding"\\]\\)\\},children:${ID}\\.title\\}\\),`
    ),
    'transition:slide($1,__NXD.TITLE_TRANS??["max-width","opacity","padding"])},' +
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
  /* ── the portfolio lifecycle ─────────────────────────────────────────────
     `JOURNEY_MILESTONES` and `buildJourneyTrack` sit OUTSIDE the rail region,
     so they cannot see the rail's `__NXD` binding — these rules read
     `window.__NX_DOCK` directly, guarded, and fall back to the shipped literal.

     Position is data, not layout: a milestone is pushed after the category
     whose 1-based index equals its `afterCategories`, and `unlocked` is derived
     from the same number. Moving Portfolio to 1 therefore ALSO unlocks it on
     this fixture (category 1 is complete) — which is the product logic asked
     for, not a side effect. */
  [
    'pfAfter',
    /code:"portfolio",label:"Portfolio",afterCategories:3/,
    'code:"portfolio",label:"Portfolio",' +
      'afterCategories:(typeof window<"u"&&window.__NX_DOCK&&window.__NX_DOCK.PF_AFTER)||3',
  ],

  /* Docked state: drop the Portfolio node from the rail entirely (its
     connector goes with it, because connectors are emitted per node). */
  [
    'pfDock',
    new RegExp(
      `const ${ID}=${ID}\\+1;for\\(const ${ID} of JOURNEY_MILESTONES\\)\\3\\.afterCategories===\\1&&${ID}\\.push\\(\\{kind:"milestone",id:\`milestone-\\$\\{\\3\\.code\\}\`,milestone:\\3,unlocked:${ID}>=\\3\\.afterCategories,remaining:Math\\.max\\(0,\\3\\.afterCategories-\\5\\)\\}\\)`
    ),
    'const $1=$2+1;const __nxd=(typeof window<"u"&&window.__NX_DOCK)||{};' +
      'for(const $3 of JOURNEY_MILESTONES)$3.afterCategories===$1&&' +
      '!(__nxd.PF_DOCKED&&$3.code==="portfolio")&&' +
      '$4.push({kind:"milestone",id:`milestone-${$3.code}`,milestone:$3,' +
      'unlocked:__nxd.PF_LOCKED&&$3.code==="portfolio"?!1:$5>=$3.afterCategories,' +
      'remaining:__nxd.PF_LOCKED&&$3.code==="portfolio"?1:Math.max(0,$3.afterCategories-$5)})',
  ],

  /* ── job portal: green -> white ──────────────────────────────────────────
     Green in this rail means ACTIVE/achieved. The job-portal chip used a
     second green to mean "special but locked", which reads as the same
     signal. Each of its seven colour sites becomes a token so the knob can
     restate it in white without touching the unlocked-green semantics. */
  [
    'jpBg',
    /background:([A-Za-z_$][\w$]*)\.unlocked\?"rgba\(73,186,97,0\.24\)":([A-Za-z_$][\w$]*)\?"rgba\(72,202,122,0\.13\)":"rgba\(255,255,255,0\.05\)"/,
    'background:$1.unlocked?(__NXD.JP_UNLOCKED_BG??"rgba(73,186,97,0.24)")' +
      ':$2?(__NXD.JP_BG??"rgba(72,202,122,0.13)"):"rgba(255,255,255,0.05)"',
  ],
  [
    'jpRing',
    /boxShadow:([A-Za-z_$][\w$]*)\?"inset 0 0 16px -2px rgba\(72,202,122,0\.62\), inset 0 0 0 1px rgba\(72,202,122,0\.42\)":IDLE_RING/,
    'boxShadow:$1?`inset 0 0 16px -2px ${__NXD.JP_GLOW??"rgba(72,202,122,0.62)"}, ' +
      'inset 0 0 0 1px ${__NXD.JP_HAIR??"rgba(72,202,122,0.42)"}`:IDLE_RING',
  ],
  [
    'jpPulse',
    /boxShadow:"inset 0 0 20px 1px rgba\(72,202,122,0\.55\), 0 0 16px -4px rgba\(72,202,122,0\.9\)"/,
    'boxShadow:`inset 0 0 20px 1px ${__NXD.JP_PULSE??"rgba(72,202,122,0.55)"}, ' +
      '0 0 16px -4px ${__NXD.JP_BLOOM??"rgba(72,202,122,0.9)"}`',
  ],
  [
    'jpIcon',
    /color:([A-Za-z_$][\w$]*)\.unlocked\?GREEN\$1:([A-Za-z_$][\w$]*)\?"rgba\(150,240,190,0\.95\)":"rgba\(255,255,255,0\.55\)"/,
    // NB: `$$1` emits a literal `$1` — the bundle's palette constant is named
    // GREEN$1, and an unescaped `$1` would splice in capture group 1 instead.
    'color:$1.unlocked?GREEN$$1:$2?(__NXD.JP_ICON??"rgba(150,240,190,0.95)"):"rgba(255,255,255,0.55)"',
  ],
  /* The fixture's clock. A locked portfolio cannot coexist with activity past
     category 1 — the portfolio unlocks after category 1, so that state is
     unreachable. `completedCount` is the single input every status derives
     from (11 readers, one object), so winding it back is the honest fix. At 4,
     category 1 is 3-of-4 and the active scenario is inside it, which makes the
     portfolio locked BY DERIVATION rather than by an override. */
  [
    'completedCount',
    /completedCount:5,categories:\[/,
    'completedCount:(typeof window<"u"&&window.__NX_DOCK&&window.__NX_DOCK.DONE)||5,categories:[',
  ],
  /* Expose the map's own camera helpers.

     The rail derives "current" from completedCount, but the camera targets
     `user.currentScenario` — a value the lab's fixture seeds independently. So
     winding the clock back moved the rail to Slack while the camera stayed
     framing the previous scenario's neighbourhood, which is why the card and
     the building ended up on opposite sides of the screen.

     Rather than rewrite the fixture's scenario wiring, this hands the
     injection the same two functions the rail's own hover uses, so the view
     can be told to follow the rail. Assignment only — nothing renders
     differently when the variant is off. */
  [
    'exposeCamera',
    // at MODULE scope (before releaseCamera), not inside flyToCompany — the
    // latter only runs on hover, long after the injection needs it.
    /function releaseCamera\(\)\{setMapCamera\(null\)\}/,
    'typeof window<"u"&&(window.__NX_FLY=flyToCompany,window.__NX_PLACE=companyPlace,' +
      'window.__NX_CAM=setMapCamera);function releaseCamera(){setMapCamera(null)}',
  ],
  /* The fixture's current scenario, tied to the same clock.

     The lab seeds `CURRENT_SEQUENCE=6` while the roadmap carries
     `completedCount:5` — one invariant expressed as two literals:
     CURRENT_SEQUENCE === completedCount + 1. Winding one back without the
     other is what put the card on Slack while the pin and the camera stayed on
     the old scenario's building, which is the "map is not on Slack" bug.
     Deriving it removes the chance of them drifting again. */
  [
    'currentSequence',
    /CURRENT_SEQUENCE=6/,
    'CURRENT_SEQUENCE=((typeof window<"u"&&window.__NX_DOCK&&window.__NX_DOCK.DONE)||5)+1',
  ],
];

let out = src;
const applied = [];
for (const [name, re, rep] of RULES) {
  // Count against the PROGRESSIVELY PATCHED text, not the original: some rules
  // deliberately depend on an earlier rule's output (titleWrap anchors on the
  // transition list that headerTrans has already tokenised).
  const n = (out.match(new RegExp(re.source, 'g')) || []).length;
  if (n !== 1) {
    // All-or-nothing: a partially applied patch IS the "scaled discs beside
    // unscaled details" bug we are eliminating, so it must be unproducible.
    const probe = re.source.replace(/\\/g, '').slice(0, 28);
    const at = out.indexOf(probe.replace(/[()[\]?*+|^$]/g, ''));
    throw new Error(
      `RULE "${name}" matched ${n} times, expected exactly 1.\n` +
        `  pattern: ${re.source}\n` +
        (at >= 0 ? `  nearest context @${at}: …${out.slice(at - 100, at + 180)}…\n` : '') +
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
