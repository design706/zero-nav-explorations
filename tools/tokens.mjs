/**
 * The runtime token table, emitted into a classic inline script that runs
 * BEFORE the deferred module bundle — which is the only way the values are set
 * before the rail component evaluates.
 *
 * Split by lane so the two chats never edit the same block.
 */
export const CORE_TOKENS = `
      // ── CORE (shared — coordinate before changing) ──────────────────────
      // Portfolio sits right after the FIRST category. In this data model
      // position and unlock are the same number, so this both moves it and
      // unlocks it — which is the intent, not a coincidence.
      PF_AFTER: 1,
      PF_DOCKED: pf !== 'locked',
      // The clock. At 4 the first category is 3-of-4 with the active scenario
      // inside it, so the portfolio is locked by the real derivation and
      // nothing past category 1 is active. CURRENT_SEQUENCE derives from this
      // same number in the bundle, so the rail, the card and the map cannot
      // drift apart.
      DONE: pf === 'locked' ? 4 : 5,`;

export const CITY_TOKENS = `
      // ── CITY LANE (owned by the city chat) ─────────────────────────────
      // Scale the objects, hold the air: 16 discs against a 1840px band cost
      // ~23px of rail width per 1px of MARK, so the rail cannot get 1.7x
      // BIGGER — it gets 1.7x TALLER. Height is bought on the glass padding.
      NODE: NODE, MARK: MARK, OPEN_PILL: OPEN_PILL,
      BAR_PAD: PAD_Y,            // UNIFORM — concentric pills need equal insets
      GAP: GAP, GAP_FOCUS: 6,
      SEG_PAD_O: (NODE - OPEN_PILL) / 2, SEG_PAD_C: (NODE - MARK) / 2, SEG_GAP: 7,
      // the collapsed header is a zero-width flex item that still costs a gap,
      // and it sits first — this negative margin cancels it while closed
      TITLE_MR_O: 0, TITLE_MR_C: -7,
      TITLE_TRANS: ['max-width', 'opacity', 'padding', 'margin'],
      TITLE_FS: '14px', TITLE_MAX: 192, TITLE_PL: 12, TITLE_PR: 12,
      TITLE_WS: 'normal', TITLE_LH: '17.5px', TITLE_DISPLAY: 'flex', TITLE_AI: 'center',
      TITLE_W: 168, TITLE_BOX: '-webkit-box', TITLE_ORIENT: 'vertical',
      TITLE_CLAMP: 2, TITLE_OF: 'hidden', TITLE_TA: 'left', TITLE_FLEX: 0,
      CHIP_PL: (OPEN_PILL - MARK) / 2, CHIP_PR: 13,
      LABEL_FS: '14px', LABEL_GAP: 8, LABEL_MAX: 150, LABEL_ML: 9,
      CHECK: 16, RING: '2px', GLOW: '26px', GLOW_IN: '6px',
      CONN_W: MARK - 2 * GAP, CONN_H: 3,
      MS_PL: 19, MS_PR: 21, MS_ICON: NODE / 2, MS_ML: 12, MS_LBL_MAX: 240,
      // Job Portal in WHITE: green means active/achieved in this rail, and a
      // second green for "special but locked" reads as the same signal.
      JP_BG: 'rgba(255,255,255,0.10)', JP_GLOW: 'rgba(255,255,255,0.34)',
      JP_HAIR: 'rgba(255,255,255,0.26)', JP_PULSE: 'rgba(255,255,255,0.28)',
      JP_BLOOM: 'rgba(255,255,255,0.50)', JP_ICON: 'rgba(255,255,255,0.92)',`;

/** CARDS LANE — owned by the cards chat. Add tokens here, not in CITY_TOKENS. */
export const CARDS_TOKENS = ``;
