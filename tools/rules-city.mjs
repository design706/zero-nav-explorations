/**
 * Bundle rules — THE CITY LANE.
 *
 * ✅ OWNED BY THE CITY CHAT. The cards chat does not edit this file.
 * 
 * The rail's geometry tokens: the glass bar, segments, chips, the category
 * header, the connector, the milestones, and the job-portal colours.
 */
export const ID = '([A-Za-z_$][A-Za-z0-9_$]*)';

export const RULES = [
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

  [
    'focusAttr',
    /className:"pointer-events-auto absolute bottom-\[36px\] left-\[40px\] right-\[40px\] z-20 flex justify-center",/,
    'className:"pointer-events-auto absolute bottom-[36px] left-[40px] right-[40px] z-20 flex justify-center",' +
      '"data-nx-focus":__NXD.GAP&&$!==null?"1":void 0,',
  ],

  [
    'seg',
    new RegExp(`height:NODE,paddingLeft:${ID}\\?4:8,paddingRight:\\1\\?4:8,`),
    'height:NODE,gap:__NXD.SEG_GAP??void 0,' +
      'paddingLeft:$1?(__NXD.SEG_PAD_O??4):(__NXD.SEG_PAD_C??8),' +
      'paddingRight:$1?(__NXD.SEG_PAD_O??4):(__NXD.SEG_PAD_C??8),',
  ],

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

  [
    'chip',
    new RegExp(`height:${ID}\\?OPEN_PILL:MARK,paddingLeft:\\1\\?2:0,paddingRight:\\1\\?10:0,`),
    'height:$1?OPEN_PILL:MARK,paddingLeft:$1?(__NXD.CHIP_PL??2):0,' +
      'paddingRight:$1?(__NXD.CHIP_PR??10):0,',
  ],

  [
    'ring',
    new RegExp(
      `boxShadow:${ID}&&${ID}\\?\`inset 0 0 0 1\\.5px \\$\\{${ID}\\}\`:${ID}\\?\`0 0 0 1\\.5px \\$\\{\\3\\}\`:"none"`
    ),
    'boxShadow:$1&&$2?`inset 0 0 0 ${__NXD.RING??"1.5px"} ${$3}`' +
      ':$4?`0 0 0 ${__NXD.RING??"1.5px"} ${$3}`:"none"',
  ],

  [
    'label',
    new RegExp(`maxWidth:${ID}\\?150:0,opacity:\\1\\?1:0,marginLeft:\\1\\?7:0,`),
    'fontSize:__NXD.LABEL_FS??void 0,gap:__NXD.LABEL_GAP??void 0,' +
      'maxWidth:$1?(__NXD.LABEL_MAX??150):0,opacity:$1?1:0,' +
      'marginLeft:$1?(__NXD.LABEL_ML??7):0,',
  ],

  [
    'check',
    new RegExp(`Check,\\{size:12,strokeWidth:3,color:${ID},`),
    'Check,{size:__NXD.CHECK??12,strokeWidth:__NXD.CHECK_SW??3,color:$1,',
  ],

  [
    'pulse',
    new RegExp(`boxShadow:\`0 0 0 1\\.5px \\$\\{${ID}\\}, 0 0 18px -4px \\$\\{\\1\\}\``),
    'boxShadow:`0 0 0 ${__NXD.RING??"1.5px"} ${$1}, 0 0 ${__NXD.GLOW??"18px"} ' +
      '-${__NXD.GLOW_IN??"4px"} ${$1}`',
  ],

  [
    'connector',
    new RegExp(`style:\\{width:12,height:2,background:${ID}\\?${ID}:"rgba\\(255,255,255,0\\.12\\)"\\}`),
    'style:{width:__NXD.CONN_W??12,height:__NXD.CONN_H??2,' +
      'background:$1?$2:"rgba(255,255,255,0.12)"}',
  ],

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
];
