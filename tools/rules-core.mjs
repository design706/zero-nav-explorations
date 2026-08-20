/**
 * Bundle rules — CORE.
 *
 * ⚠️ SHARED BY BOTH LANES. Owned by neither; coordinate before changing.
 * 
 * The token prelude (which defines __NXD and must run FIRST), the fixture clock,
 * the portfolio placement, and the camera handles. Everything here is about the
 * journey data, not about either home.
 */
export const ID = '([A-Za-z_$][A-Za-z0-9_$]*)';

/* The token prelude. `__NXD` is read once at module scope; the rail is the only
   consumer of NODE/MARK/OPEN_PILL anywhere in the bundle (verified: 4/8/3 refs,
   all inside the rail region). */
const PRELUDE =
  'const __NXD=(typeof window<"u"&&window.__NX_DOCK)||{},' +
  'NODE=__NXD.NODE??38,MARK=__NXD.MARK??26,OPEN_PILL=__NXD.OPEN_PILL??30,';

export const RULES = [

  ['tokens', /const NODE=38,MARK=26,OPEN_PILL=30,/, PRELUDE],

  // ── the glass bar: padding drives rail HEIGHT, gap drives width ────────
  // Vertical padding is where the "dock presence" is bought (7 -> 17, x2.43);
  // horizontal padding and gap only get the rhythm factor (x1.43). Splitting
  // the shipped `padding:7` on its two axes is the single move that buys 1.7x
  // HEIGHT at a width the 1840 band can actually hold.
  // The gap also compresses while any node is open (focus mode) - the shipped
  // design already does this in miniature (open segment padding 8 -> 4).


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
];
