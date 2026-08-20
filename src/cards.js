/**
 * nav-explorations — THE CARDS LANE.
 *
 * ✅ OWNED BY THE CARDS CHAT. The city chat does not edit this file.
 *
 * The plain-base home: no city, no rail. A horizontal deck of scenario cards
 * IS the navigation, on the onboarding's warm whites, with the journey's
 * position read from carousel indicators at the bottom instead of a bar.
 *
 * ── Where the look comes from ─────────────────────────────────────────────
 * The palette is lifted verbatim from the onboarding prototype's own :root
 * (`sanjay-v3-vision-board.html`) rather than re-mixed by eye, so this screen
 * and onboarding are the same white — page #FAFAF9, card #FFF, wash #F7F7F5,
 * hairline rgba(13,13,13,.08), ink #111113 with its two greys.
 *
 * ── Where the card comes from ─────────────────────────────────────────────
 * The information architecture is the product's own scenario card: a company
 * lockup, the title, a rule, three stat rows, one CTA. Which three rows depend
 * on the state, exactly as the product does it — a finished scenario reports
 * how it went, an unstarted one advertises what it is worth.
 *
 * Data comes from the journey fixture the rail itself reads (exposed by
 * tools/rules-cards.mjs), so the deck and the rail cannot disagree.
 *
 * ── The chrome ────────────────────────────────────────────────────────────
 * Zero's wordmark, the streak and XP pills, settings and the portfolio all
 * survive — but every one of them is drawn for a dark map. On white they are
 * invisible or wrong, so this file re-skins them light while it owns the
 * screen. It restores nothing: the class is scoped to `[data-nx-home=cards]`
 * and the City home never sets it.
 */
(function () {
  'use strict';
  var NX = window.NX;
  if (!NX || !NX.state.enabled || !NX.state.cards) return;

  var styleEl = NX.styleEl;

  /* The onboarding palette, verbatim. */
  var C = {
    page: '#FAFAF9',
    shell: '#F1F1EF',
    card: '#FFF',
    wash: '#F7F7F5',
    field: '#F0F0EE',
    line: 'rgba(13,13,13,.08)',
    line2: 'rgba(13,13,13,.045)',
    tx: '#111113',
    tx2: '#63636a',
    tx3: '#9a9aa0',
    tx4: '#c4c4ca',
    ok: '#3fb968',
    commit: '#4ade80',
  };
  var MONO = '"PP Supply Mono", ui-monospace, SFMono-Regular, Menlo, monospace';
  var SERIF = '"STK_Bureau_Serif", Georgia, serif';
  var SANS = '"Google Sans Flex", system-ui, sans-serif';

  /* The real title art, keyed by company (each company appears once in this
     journey). Downscaled copies live in art/ at the repo root; the build ships
     them as nx-art/. A company without art falls back to the serif title in
     the same box — the product's own behavior when the asset query is empty. */
  var ART = {
    Airbnb: './nx-art/airbnb.png',
    Spotify: './nx-art/spotify.png',
    Netflix: './nx-art/netflix.png',
    Slack: './nx-art/slack.png',
    Amazon: './nx-art/amazon.png',
    Uber: './nx-art/uber.png',
    // Google's only art (gen-1 DRAFT DOCTOR) is baked on black — unusable on
    // white, so Google falls back to the serif title like the other uncovered
    // companies. Airbnb uses gen-2 HOST GHOSTED for the same reason: gen-1
    // CANCEL CRISIS has no alpha channel.
    Duolingo: './nx-art/duolingo.png',
  };

  var DIFFICULTY_LEVEL = { Beginner: 1, Intermediate: 2, Advanced: 3 };

  /* The product's formatTimeSpent: largest unit, hours may pair with minutes. */
  function hhmm(mins) {
    if (!mins) return '';
    var h = Math.floor(mins / 60),
      m = mins % 60;
    if (!h) return m + ' min';
    return m ? h + ' hr ' + m + ' min' : h + ' hr';
  }

  /** Journey → a flat, ordered deck with each scenario's real status. */
  function deck() {
    var rm = window.__NX_ROADMAP;
    if (!rm) return [];
    var done = rm.completedCount;
    var out = [];
    rm.categories.forEach(function (cat) {
      cat.scenarios.forEach(function (s) {
        out.push({
          s: s,
          category: cat.title,
          status:
            s.sequence_order <= done ? 'completed' : s.sequence_order === done + 1 ? 'current' : 'locked',
        });
      });
    });
    return out.sort(function (a, b) { return a.s.sequence_order - b.s.sequence_order; });
  }

  /* ── the card, ScenarioIntroV1's own anatomy on white ─────────────────────
     Geometry is the product's, verbatim: counter pill 46h mono16, key art in a
     336×210 box with a blur(90px) twin behind it, name 24px/1.35 medium sans,
     MetaRow 30h with mono16 uppercase labels, gold XP pill r40 px10 py6 with
     tracking −1.62px, difficulty as four 23×10 segments, glossy 62h CTA.
     Only the COLORS are translated; every opacity in the dark card was tuned
     against rgba(0,0,0,.5) glass, so each gets a considered ink equivalent,
     not a blind inversion. */

  function metaRow(label, valueNode) {
    var r = styleEl(document.createElement('div'), {
      display: 'flex', height: '30px', alignItems: 'center',
      justifyContent: 'space-between', padding: '0 20px', width: '100%',
    });
    var l = styleEl(document.createElement('span'), {
      font: '400 16px/1 ' + MONO, textTransform: 'uppercase',
      color: C.tx3, whiteSpace: 'nowrap',
    });
    l.textContent = label;
    r.appendChild(l);
    r.appendChild(valueNode);
    return r;
  }

  function metaValue(text) {
    var v = styleEl(document.createElement('span'), {
      font: '500 18px/1.2 ' + SANS, color: C.tx,
      fontFeatureSettings: "'lnum' 1, 'tnum' 1",
    });
    v.textContent = text;
    return v;
  }

  /* The product's star.svg is a 157KB raster in an svg wrapper — substitute a
     clean four-point star in the canonical XP gold (#FFB73A, ScenarioReward). */
  var STAR =
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="#FFB73A" aria-hidden="true">' +
    '<path d="M12 1c.6 5.8 4.2 9.4 11 11-6.8 1.6-10.4 5.2-11 11-.6-5.8-4.2-9.4-11-11C7.8 10.4 11.4 6.8 12 1z"/></svg>';

  function xpPill(n) {
    var p = styleEl(document.createElement('span'), {
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      borderRadius: '40px', padding: '6px 10px',
      background: 'rgba(255,183,58,0.14)',
      boxShadow: '0 0 0 1px rgba(255,183,58,0.45)',
    });
    p.innerHTML =
      STAR +
      '<span style="font:400 18px/1 ' + MONO + ';letter-spacing:-1.62px;color:#8a6d00;' +
      "font-feature-settings:'lnum' 1,'tnum' 1\">" + Number(n).toLocaleString() + '</span>';
    return p;
  }

  function difficultyDots(label) {
    var level = DIFFICULTY_LEVEL[label] != null ? DIFFICULTY_LEVEL[label] : 2;
    var wrap = styleEl(document.createElement('span'), {
      display: 'flex', alignItems: 'center', gap: '20px',
    });
    var dots = styleEl(document.createElement('span'), { display: 'inline-flex', gap: '2px' });
    for (var i = 0; i < 4; i++) {
      dots.appendChild(styleEl(document.createElement('span'), {
        height: '10px', width: '23px', borderRadius: '30px',
        background: C.tx, opacity: i <= level ? '1' : '0.12',
      }));
    }
    wrap.appendChild(dots);
    wrap.appendChild(metaValue(label || 'Intermediate'));
    return wrap;
  }

  /* StartButtonV1's glossy CTA, verbatim CSS with two light-tuning changes:
     the #c8c8c8 ledge and #e6e6e6 ring each go one step darker so the button
     keeps its physical edge on a white card. Holo label, triple shine, press
     travel and reduced-motion behavior are the product's own. */
  function installCtaCss() {
    if (document.getElementById('nx-sbtn-css')) return;
    var css = document.createElement('style');
    css.id = 'nx-sbtn-css';
    css.textContent = [
      '.nx-sbtn{height:62px;width:100%;border-radius:100px;display:flex;align-items:center;justify-content:center;gap:10px;padding:15px 40px;cursor:pointer;position:relative;overflow:hidden;user-select:none;border:0;outline:none;',
      'background-image:linear-gradient(90deg,rgba(255,255,255,.4),rgba(255,255,255,.4)),linear-gradient(180deg,rgba(229,229,229,.8),rgb(226,226,226));',
      'box-shadow:0 6px 0 #bfbfbf,0 12px 18px -6px rgba(0,0,0,.28),0 0 0 1.33px #dcdcdc,inset 0 1.33px 0 rgba(255,255,255,.75);',
      'transition:transform .1s cubic-bezier(.34,1.56,.64,1),box-shadow .1s}',
      '.nx-sbtn:hover{transform:translateY(-1px)}',
      '.nx-sbtn:active{transform:translateY(5px);box-shadow:0 1px 0 #bfbfbf,0 3px 8px -4px rgba(0,0,0,.28),0 0 0 1.33px #dcdcdc,inset 0 1.33px 0 rgba(255,255,255,.75)}',
      '.nx-sbtn-label{font-family:"Google Sans Flex","Google_Sans_Flex",sans-serif;font-weight:600;font-size:23px;letter-spacing:-.48px;',
      'background:linear-gradient(100deg,#121212 0%,#121212 34%,#ff5ec0 42%,#8b7bff 50%,#37dcc4 58%,#121212 66%,#121212 100%);',
      'background-size:300% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;',
      'animation:nx-holotext 3s ease-in-out infinite}',
      '@keyframes nx-holotext{0%{background-position:130% 0}55%,100%{background-position:-30% 0}}',
      '.nx-sbtn::after{content:"";position:absolute;top:-25%;bottom:-25%;left:0;width:120%;z-index:1;pointer-events:none;',
      'background:linear-gradient(100deg,transparent 33%,rgba(255,255,255,.9) 38%,transparent 41%,transparent 46%,rgba(255,255,255,.9) 51%,transparent 54%,transparent 59%,rgba(255,255,255,.9) 64%,transparent 67%);',
      'transform:translateX(-100%) skewX(-14deg);animation:nx-shine 3s ease-in-out infinite}',
      '@keyframes nx-shine{0%{transform:translateX(-100%) skewX(-14deg)}55%,100%{transform:translateX(100%) skewX(-14deg)}}',
      '.nx-sbtn:hover::after{animation-duration:1s}',
      '@media (prefers-reduced-motion: reduce){.nx-sbtn-label{background:none;color:#121212;animation:none}.nx-sbtn::after{opacity:0;animation:none}}',
    ].join('');
    document.head.appendChild(css);
  }

  function cta(status) {
    if (status === 'current') {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'nx-sbtn';
      b.innerHTML =
        '<svg width="17" height="17" viewBox="0 0 24 24" fill="#121212" style="position:relative;z-index:2" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>' +
        '<span class="nx-sbtn-label" style="position:relative;z-index:2">Continue</span>';
      return b;
    }
    var isDone = status === 'completed';
    var d = styleEl(document.createElement('div'), {
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      borderRadius: '100px', width: '100%', gap: '8px', padding: '18px 0',
      background: isDone ? C.wash : C.field,
      boxShadow: isDone ? 'inset 0 0 0 1.5px rgba(63,185,104,0.5)' : 'none',
    });
    var ICONS = {
      lock: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="' + C.tx3 + '" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
      check: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="' + C.tx + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>',
    };
    d.innerHTML =
      (isDone ? ICONS.check : ICONS.lock) +
      '<span style="font:500 20px/1.3 ' + SANS + ';letter-spacing:-0.03em;color:' +
      (isDone ? C.tx : C.tx3) + ';white-space:nowrap">' + (isDone ? 'Completed' : 'Locked') + '</span>';
    return d;
  }

  function buildCard(item, index, total, logos, scrollToIndex) {
    var s = item.s;
    var active = item.status === 'current';
    var card = styleEl(document.createElement('article'), {
      flex: '0 0 auto', width: '460px', height: '700px', scrollSnapAlign: 'center',
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      alignItems: 'center', gap: '18px',
      background: active ? '#FFFFFF' : 'rgba(255,255,255,0.55)',
      border: '1px solid ' + (active ? C.line : C.line2),
      borderRadius: '28px', padding: '24px 24px 28px',
      boxShadow: active
        ? '0 24px 64px -24px rgba(13,13,13,0.20)'
        : '0 12px 36px -22px rgba(13,13,13,0.12)',
      transition: 'background 300ms ease, box-shadow 300ms ease, border-color 300ms ease',
    });
    card.dataset.nxIdx = index;

    /* ── top: chevrons + counter — the product's own row, driving the deck ── */
    var top = styleEl(document.createElement('div'), {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
    });
    function chev(dir) {
      var b = styleEl(document.createElement('button'), {
        display: 'flex', width: '46px', height: '46px', alignItems: 'center',
        justifyContent: 'center', borderRadius: '999px', border: '0', padding: '0',
        background: 'transparent', color: C.tx2, cursor: 'pointer',
        transition: 'background 160ms ease',
        opacity: (dir < 0 && index === 0) || (dir > 0 && index === total - 1) ? '0.2' : '1',
        pointerEvents: (dir < 0 && index === 0) || (dir > 0 && index === total - 1) ? 'none' : 'auto',
      });
      b.type = 'button';
      b.setAttribute('aria-label', dir < 0 ? 'Previous scenario' : 'Next scenario');
      b.innerHTML =
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' +
        (dir < 0 ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6') + '"/></svg>';
      b.addEventListener('mouseenter', function () { b.style.background = 'rgba(13,13,13,0.06)'; });
      b.addEventListener('mouseleave', function () { b.style.background = 'transparent'; });
      b.addEventListener('click', function () { scrollToIndex(index + dir); });
      return b;
    }
    var counter = styleEl(document.createElement('div'), {
      display: 'flex', height: '46px', alignItems: 'center', gap: '10px',
      borderRadius: '999px', background: C.field, padding: '0 20px',
    });
    counter.innerHTML =
      '<span style="font:400 16px/1 ' + MONO + ';color:' + C.tx + ";font-feature-settings:'lnum' 1,'tnum' 1\">" +
      String(index + 1).padStart(2, '0') + '</span>' +
      '<span style="font:400 16px/1 ' + MONO + ';color:' + C.tx4 + '">/</span>' +
      '<span style="font:400 16px/1 ' + MONO + ';color:' + C.tx3 + ";font-feature-settings:'lnum' 1,'tnum' 1\">" +
      String(total).padStart(2, '0') + '</span>';
    top.appendChild(chev(-1));
    top.appendChild(counter);
    top.appendChild(chev(1));
    card.appendChild(top);

    /* ── middle: company pill · key art with halo · scenario name ────────── */
    var mid = styleEl(document.createElement('div'), {
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px',
      flex: '1 1 auto', justifyContent: 'center', minHeight: '0', width: '100%',
    });

    var companyName = s.company ? s.company.name : '';
    var pill = styleEl(document.createElement('div'), {
      display: 'flex', alignItems: 'center', gap: '8px', flexShrink: '0',
      padding: '7px 16px 7px 9px', borderRadius: '999px',
      background: '#FFFFFF', border: '1px solid ' + C.line,
      boxShadow: '0 4px 14px -8px rgba(13,13,13,0.18)',
    });
    var logo = logos[companyName];
    pill.innerHTML =
      (logo ? '<img src="' + logo + '" alt="" style="width:18px;height:18px;object-fit:contain" aria-hidden="true"/>' : '') +
      '<span style="font:600 14px/1 ' + SANS + ';color:' + C.tx + '">' + companyName + '</span>';
    mid.appendChild(pill);

    var art = ART[companyName];
    var artBox = styleEl(document.createElement('div'), {
      position: 'relative', display: 'grid', placeItems: 'center', flexShrink: '0',
      height: '190px', width: '336px',
    });
    if (art) {
      // the product's signature: a blur(90px) twin behind the sharp art —
      // softened to .3 on white, where .65 reads as a wash instead of a halo
      artBox.innerHTML =
        '<img src="' + art + '" aria-hidden="true" style="position:absolute;height:190px;width:336px;object-fit:contain;filter:blur(90px);opacity:0.3"/>' +
        '<img src="' + art + '" alt="Scenario" style="position:relative;height:190px;width:336px;object-fit:contain"/>';
    } else {
      artBox.innerHTML =
        '<h3 style="font:400 40px/0.98 ' + SERIF + ';letter-spacing:-0.03em;color:' + C.tx +
        ';text-align:center;margin:0;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden">' +
        item.category + '</h3>';
    }
    mid.appendChild(artBox);

    var name = styleEl(document.createElement('p'), {
      font: '500 24px/1.35 ' + SANS, color: C.tx, textAlign: 'center',
      maxWidth: '360px', padding: '0 10px', margin: '0', flexShrink: '0',
      display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden',
    });
    name.textContent = s.title;
    mid.appendChild(name);
    card.appendChild(mid);

    /* ── bottom: divider · the state's rows · CTA ─────────────────────────── */
    var bottom = styleEl(document.createElement('div'), {
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '26px', width: '100%',
    });
    bottom.appendChild(styleEl(document.createElement('div'), {
      height: '1px', width: '100%', background: C.line,
    }));
    var rows = styleEl(document.createElement('div'), {
      display: 'flex', flexDirection: 'column', gap: '20px', width: '100%',
    });
    if (item.status === 'completed') {
      rows.appendChild(metaRow('Performance', metaValue(s.outcome ? s.outcome.band : '—')));
      rows.appendChild(metaRow('Time spent', metaValue(hhmm(s.outcome && s.outcome.minutes))));
      rows.appendChild(metaRow('XP earned', xpPill(s.outcome ? s.outcome.xp : 0)));
    } else {
      rows.appendChild(metaRow('Earn XP upto', xpPill(750)));
      if (s.estimated_minutes) rows.appendChild(metaRow('Time', metaValue('~' + hhmm(s.estimated_minutes))));
      rows.appendChild(metaRow('Difficulty', difficultyDots(s.difficulty)));
    }
    bottom.appendChild(rows);
    bottom.appendChild(cta(item.status));
    card.appendChild(bottom);
    return card;
  }

  /* Re-skin the chrome for a light ground. Everything Zero draws here is built
     for a dark map; on white it either vanishes or reads as a hole. Scoped to
     the cards home so the City home is untouched. */
  function lightChrome() {
    var css = document.createElement('style');
    css.id = 'nx-cards-chrome';
    css.textContent = [
      'html[data-nx-home="cards"] body{background:' + C.page + ' !important}',
      // the wordmark and the HUD pills are white-on-dark by design
      'html[data-nx-home="cards"] nav[aria-label$="timeline"]{display:none !important}',
      // the wordmark is a white SVG data-URI — invert it for paper
      'html[data-nx-home="cards"] img[alt="Zero"]{filter:invert(1) !important;opacity:.92}',
      // The app's own dark scenario card is the CITY home's subject; on the
      // deck every scenario already has a card, so it is a duplicate. Its real
      // wrapper is the right-hand column, not the inner card.
      'html[data-nx-home="cards"] div[class*="right-[90px]"][class*="inset-y-0"]{display:none !important}',
      // glass pills → paper cards
      'html[data-nx-home="cards"] button[aria-label="Settings"],' +
        'html[data-nx-home="cards"] #nx-portfolio-dock button,' +
        'html[data-nx-home="cards"] [aria-label^="Level "],' +
        'html[data-nx-home="cards"] [aria-label*="day streak"]{' +
        'background:' + C.card + ' !important;border-color:' + C.line + ' !important;' +
        'box-shadow:0 8px 24px -12px rgba(13,13,13,.18) !important;opacity:1 !important;' +
        'backdrop-filter:none !important;-webkit-backdrop-filter:none !important}',
      'html[data-nx-home="cards"] button[aria-label="Settings"] svg path,' +
        'html[data-nx-home="cards"] #nx-portfolio-dock button svg path{fill:' + C.tx + ' !important}',
      'html[data-nx-home="cards"] [aria-label^="Level "] *,' +
        'html[data-nx-home="cards"] [aria-label*="day streak"] *{color:' + C.tx + ' !important}',
      // the portfolio ring's empty track needs to be visible on paper
      'html[data-nx-home="cards"] #nx-portfolio-dock circle[stroke="rgba(255,255,255,0.16)"]{' +
        'stroke:rgba(13,13,13,.14) !important}',
      // the debug panel keeps its dark treatment — it is not part of the design
    ].join('\n');
    document.head.appendChild(css);
    document.documentElement.dataset.nxHome = 'cards';
  }

  function initCardsHome(nav, rail) {
    lightChrome();
    installCtaCss();

    var city = document.querySelector('img[src*="zero-city"]');
    if (city) city.style.visibility = 'hidden';

    // company logos come from the rail's own chips, so the marks always match
    var logos = {};
    (rail.segments || []).forEach(function (seg) {
      seg.chips.forEach(function (c) { if (c.company && c.logo) logos[c.company] = c.logo; });
    });

    var items = deck();
    if (!items.length) return;
    var doneN = window.__NX_ROADMAP.completedCount;

    var layer = styleEl(document.createElement('div'), {
      position: 'absolute', inset: '0', zIndex: '15',
      display: 'flex', flexDirection: 'column', pointerEvents: 'auto',
      /* The stage from the mock: white falling into a soft mint→aqua wash.
         Quiet on purpose — the cards carry the color, the ground carries air. */
      background:
        'linear-gradient(180deg,#FAFAF9 0%,#F3F8F3 45%,#DDF0E5 74%,#C3E4E7 100%)',
    });

    /* header — same position as before; the deck grew, the chrome did not */
    var appMark = document.querySelector('img[alt="Zero"]');
    var head = styleEl(document.createElement('div'), {
      padding: '40px 64px 0', display: 'flex', flexDirection: 'column', gap: '5px', flex: '0 0 auto',
    });
    if (appMark) {
      var mark = styleEl(document.createElement('img'), {
        height: '28px', width: 'auto', display: 'block', alignSelf: 'flex-start',
        filter: 'invert(1)', opacity: '.92', marginBottom: '18px',
      });
      mark.src = appMark.getAttribute('src');
      mark.alt = 'Zero';
      head.appendChild(mark);
    }
    head.innerHTML +=
      '<span style="font:500 12px/1 ' + MONO + ';letter-spacing:.12em;text-transform:uppercase;color:' +
      C.tx3 + ";font-feature-settings:'lnum' 1,'tnum' 1\">Your journey · " +
      String(doneN + 1).padStart(2, '0') + ' / ' + String(items.length).padStart(2, '0') + '</span>' +
      '<h1 style="font:400 34px/1 ' + SERIF + ';letter-spacing:-.02em;color:' + C.tx + ';margin:0">' +
      window.__NX_ROADMAP.journeyTitle + '</h1>';
    layer.appendChild(head);

    var scroller = styleEl(document.createElement('div'), {
      flex: '1 1 auto', display: 'flex', alignItems: 'center', gap: '44px',
      padding: '18px 64px', overflowX: 'auto', overflowY: 'hidden',
      scrollSnapType: 'x mandatory', scrollbarWidth: 'none',
    });
    function scrollToIndex(i) {
      var el = scroller.children[Math.max(0, Math.min(items.length - 1, i))];
      if (el) el.scrollIntoView({ behavior: REDUCE ? 'auto' : 'smooth', inline: 'center', block: 'nearest' });
    }
    items.forEach(function (item, i) {
      scroller.appendChild(buildCard(item, i, items.length, logos, scrollToIndex));
    });
    layer.appendChild(scroller);

    /* Carousel indicators, not a bar: the centred scenario is a lozenge and
       the rest are dots, so the deck's length is countable at a glance. */
    var dockRow = styleEl(document.createElement('div'), {
      flex: '0 0 auto', display: 'flex', justifyContent: 'center', alignItems: 'center',
      gap: '7px', padding: '18px 0 34px',
    });
    var pips = items.map(function (item, i) {
      var d = styleEl(document.createElement('button'), {
        width: i === doneN ? '28px' : '7px', height: '7px', borderRadius: '999px', border: '0',
        padding: '0', cursor: 'pointer',
        background: i <= doneN ? C.tx : C.tx4,
        transition: 'width 260ms cubic-bezier(.22,.61,.36,1), background 260ms ease',
      });
      d.type = 'button';
      d.setAttribute('aria-label', 'Scenario ' + (i + 1) + ' of ' + items.length);
      d.addEventListener('click', function () { scrollToIndex(i); });
      return d;
    });
    pips.forEach(function (d) { dockRow.appendChild(d); });
    layer.appendChild(dockRow);

    /* The centred card is the solid one — the mock's read. Solidity follows
       the scroll, not the scenario state, so browsing feels physical. */
    function setCentred(idx) {
      Array.prototype.forEach.call(scroller.children, function (c, i) {
        var on = i === idx;
        c.style.background = on ? '#FFFFFF' : 'rgba(255,255,255,0.55)';
        c.style.borderColor = on ? C.line : C.line2;
        c.style.boxShadow = on
          ? '0 24px 64px -24px rgba(13,13,13,0.20)'
          : '0 12px 36px -22px rgba(13,13,13,0.12)';
        if (pips[i]) pips[i].style.width = on ? '28px' : '7px';
      });
    }
    scroller.addEventListener('scroll', function () {
      var mid = scroller.scrollLeft + scroller.clientWidth / 2;
      var best = 0, bestD = Infinity;
      Array.prototype.forEach.call(scroller.children, function (c, i) {
        var d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid);
        if (d < bestD) { bestD = d; best = i; }
      });
      setCentred(best);
    });

    var host = nav.parentElement || document.body;
    host.insertBefore(layer, host.firstChild);

    // open on the scenario you are actually on
    requestAnimationFrame(function () {
      var el = scroller.children[doneN];
      if (el) scroller.scrollLeft = el.offsetLeft + el.offsetWidth / 2 - scroller.clientWidth / 2;
      setCentred(doneN);
    });
  }

  NX.onRail(function (nav, rail) { initCardsHome(nav, rail); });
})();
