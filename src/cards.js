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

  /* Art exists for one scenario today. The slot is real, not decorative: drop
     a file in base/nx-art/<scenario id>.png and it renders instead of the
     serif title, which is what the product does when the asset query resolves.
     The nav-lab primes that query empty, so the rest fall back — honestly. */
  var ART = { 'ba-06': './nx-art/ba-06.png' };

  var DIFFICULTY_STEPS = { Beginner: 2, Intermediate: 3, Advanced: 4 };

  function hhmm(mins) {
    if (!mins) return '—';
    var h = Math.floor(mins / 60),
      m = mins % 60;
    return h ? (m ? h + 'h ' + m + 'm' : '~' + h + ' hr') : m + 'm';
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
          status: s.sequence_order <= done ? 'completed' : s.sequence_order === done + 1 ? 'current' : 'locked',
          // the roadmap's own reveal law: disclosed up to and including current
          revealed: s.sequence_order <= done + 1,
        });
      });
    });
    return out.sort(function (a, b) { return a.s.sequence_order - b.s.sequence_order; });
  }

  function statRow(label, valueNode) {
    var r = styleEl(document.createElement('div'), {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
    });
    var l = styleEl(document.createElement('span'), {
      font: '500 11px/1 ' + MONO, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.tx3,
    });
    l.textContent = label;
    r.appendChild(l);
    r.appendChild(valueNode);
    return r;
  }

  function value(text, weight) {
    var v = styleEl(document.createElement('span'), {
      font: (weight || 500) + ' 14px/1.2 ' + SANS, color: C.tx,
      fontFeatureSettings: "'lnum' 1, 'tnum' 1", textAlign: 'right',
    });
    v.textContent = text;
    return v;
  }

  function xpPill(n) {
    var p = styleEl(document.createElement('span'), {
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      padding: '5px 11px', borderRadius: '999px',
      background: 'rgba(138,109,0,.08)', boxShadow: '0 0 0 1px rgba(138,109,0,.18) inset',
      font: '600 13px/1 ' + SANS, color: '#8a6d00', fontFeatureSettings: "'lnum' 1, 'tnum' 1",
    });
    p.innerHTML = '<span style="font-size:12px">✦</span>' + n;
    return p;
  }

  function difficultyDots(level) {
    var wrap = styleEl(document.createElement('span'), {
      display: 'inline-flex', alignItems: 'center', gap: '10px',
    });
    var dots = styleEl(document.createElement('span'), { display: 'inline-flex', gap: '4px' });
    var on = DIFFICULTY_STEPS[level] || 3;
    for (var i = 0; i < 4; i++) {
      dots.appendChild(styleEl(document.createElement('span'), {
        width: i < on ? '16px' : '14px', height: '6px', borderRadius: '999px',
        background: i < on ? C.tx : C.tx4,
      }));
    }
    wrap.appendChild(dots);
    wrap.appendChild(value(level || 'Intermediate'));
    return wrap;
  }

  function buildCard(item, logos) {
    var s = item.s;
    var card = styleEl(document.createElement('article'), {
      flex: '0 0 auto', width: '330px', scrollSnapAlign: 'center',
      display: 'flex', flexDirection: 'column',
      background: C.card, borderRadius: '26px', border: '1px solid ' + C.line,
      boxShadow: '0 14px 40px -18px rgba(13,13,13,.16)',
      padding: '22px', gap: '16px',
      opacity: item.status === 'locked' ? '0.78' : '1',
      transition: 'transform 260ms cubic-bezier(.22,.61,.36,1), box-shadow 260ms ease',
    });
    if (item.status === 'current') {
      card.style.boxShadow = '0 20px 52px -18px rgba(13,13,13,.22), 0 0 0 1.5px ' + C.tx + ' inset';
    }

    /* company lockup — the product leads with whose problem this is */
    var top = styleEl(document.createElement('div'), {
      display: 'flex', alignItems: 'center', gap: '9px', alignSelf: 'flex-start',
      padding: '6px 14px 6px 6px', borderRadius: '999px',
      background: C.wash, border: '1px solid ' + C.line2,
    });
    var name = item.revealed && s.company ? s.company.name : 'Revealed on arrival';
    var logo = logos[name];
    top.innerHTML =
      '<span style="width:26px;height:26px;border-radius:999px;background:#fff;border:1px solid ' + C.line +
      ';display:grid;place-items:center;overflow:hidden">' +
      (logo ? '<img src="' + logo + '" alt="" style="width:16px;height:16px;object-fit:contain"/>' : '') +
      '</span><span style="font:600 13px/1 ' + SANS + ';color:' + (item.revealed ? C.tx : C.tx3) + '">' +
      name + '</span>';
    card.appendChild(top);

    /* the headline: real title art where it exists, the serif title otherwise */
    var art = ART[s.id];
    var head = styleEl(document.createElement('div'), {
      display: 'flex', flexDirection: 'column', gap: '10px', flex: '1 1 auto',
    });
    if (art) {
      var img = styleEl(document.createElement('img'), {
        width: '100%', height: '132px', objectFit: 'contain', display: 'block',
      });
      img.src = art;
      img.alt = '';
      head.appendChild(img);
    }
    var h = styleEl(document.createElement('h3'), {
      font: '400 ' + (art ? '20px' : '25px') + '/1.14 ' + SERIF,
      letterSpacing: '-0.01em', color: C.tx, margin: '0',
    });
    h.textContent = s.title;
    head.appendChild(h);
    if (!art) {
      var p = styleEl(document.createElement('p'), {
        font: '400 13.5px/1.45 ' + SANS, color: C.tx2, margin: '0',
        display: '-webkit-box', WebkitLineClamp: '3', WebkitBoxOrient: 'vertical', overflow: 'hidden',
      });
      p.textContent = item.revealed ? s.problem_statement : 'The brief opens when you get here.';
      head.appendChild(p);
    }
    card.appendChild(head);

    card.appendChild(styleEl(document.createElement('div'), { height: '1px', background: C.line }));

    /* three rows — a finished scenario reports, an unstarted one advertises */
    var stats = styleEl(document.createElement('div'), {
      display: 'flex', flexDirection: 'column', gap: '13px',
    });
    if (item.status === 'completed') {
      stats.appendChild(statRow('Performance', value(s.outcome ? s.outcome.band : '—', 600)));
      stats.appendChild(statRow('Time spent', value(hhmm(s.outcome && s.outcome.minutes))));
      stats.appendChild(statRow('XP earned', xpPill(s.outcome ? s.outcome.xp : 0)));
    } else if (item.status === 'current') {
      stats.appendChild(statRow('Performance', value('In Progress', 600)));
      stats.appendChild(statRow('Time', value(hhmm(s.estimated_minutes))));
      stats.appendChild(statRow('Difficulty', difficultyDots(s.difficulty)));
    } else {
      stats.appendChild(statRow('Earn XP upto', xpPill(750)));
      stats.appendChild(statRow('Time', value(hhmm(s.estimated_minutes))));
      stats.appendChild(statRow('Difficulty', difficultyDots(s.difficulty)));
    }
    card.appendChild(stats);

    var cta = styleEl(document.createElement('button'), {
      font: '600 15px/1 ' + SANS, border: '0', borderRadius: '999px', padding: '15px',
      cursor: item.status === 'locked' ? 'default' : 'pointer',
      background: item.status === 'locked' ? C.field : C.tx,
      color: item.status === 'locked' ? C.tx3 : '#fff',
      transition: 'transform 160ms ease',
    });
    cta.type = 'button';
    cta.textContent =
      item.status === 'locked' ? '🔒  Locked' : item.status === 'completed' ? 'Review' : '▶  Continue';
    if (item.status !== 'locked') {
      cta.addEventListener('mouseenter', function () { cta.style.transform = 'scale(1.02)'; });
      cta.addEventListener('mouseleave', function () { cta.style.transform = 'none'; });
    }
    card.appendChild(cta);
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

    // the city is the other home's subject; hide it, do not remove it
    var city = document.querySelector('img[src*="zero-city"]');
    if (city) city.style.visibility = 'hidden';

    // company logos come from the rail's own chips, so the marks always match
    var logos = {};
    (rail.segments || []).forEach(function (seg) {
      seg.chips.forEach(function (c) { if (c.company && c.logo) logos[c.company] = c.logo; });
    });

    var items = deck();
    if (!items.length) return;

    var layer = styleEl(document.createElement('div'), {
      position: 'absolute', inset: '0', zIndex: '15', background: C.page,
      display: 'flex', flexDirection: 'column', pointerEvents: 'auto',
    });

    /* Zero's own wordmark lives in a container that stacks BELOW this layer's
       canvas, so it cannot simply be re-skinned into view — the deck would
       cover it. Draw it here instead, from the app's own asset, inverted for
       paper. Same mark, right stacking order. */
    var appMark = document.querySelector('img[alt="Zero"]');
    var head = styleEl(document.createElement('div'), {
      padding: '46px 64px 0', display: 'flex', flexDirection: 'column', gap: '6px', flex: '0 0 auto',
    });
    if (appMark) {
      var mark = styleEl(document.createElement('img'), {
        height: '30px', width: 'auto', display: 'block',
        // flex-start, or the column's default `stretch` blows a `width:auto`
        // image out to the full container width and squashes its height
        alignSelf: 'flex-start',
        filter: 'invert(1)', opacity: '.92', marginBottom: '30px',
      });
      mark.src = appMark.getAttribute('src');
      mark.alt = 'Zero';
      head.appendChild(mark);
    }
    var doneN = window.__NX_ROADMAP.completedCount;
    head.innerHTML +=
      '<span style="font:500 12px/1 ' + MONO + ';letter-spacing:.12em;text-transform:uppercase;color:' +
      C.tx3 + ';font-feature-settings:\'lnum\' 1,\'tnum\' 1">Your journey · ' +
      String(doneN + 1).padStart(2, '0') + ' / ' + String(items.length).padStart(2, '0') + '</span>' +
      '<h1 style="font:400 40px/1 ' + SERIF + ';letter-spacing:-.02em;color:' + C.tx + ';margin:0">' +
      window.__NX_ROADMAP.journeyTitle + '</h1>';
    layer.appendChild(head);

    var scroller = styleEl(document.createElement('div'), {
      flex: '1 1 auto', display: 'flex', alignItems: 'center', gap: '20px',
      padding: '0 64px', overflowX: 'auto', overflowY: 'hidden',
      scrollSnapType: 'x mandatory', scrollbarWidth: 'none',
    });
    items.forEach(function (item) { scroller.appendChild(buildCard(item, logos)); });
    layer.appendChild(scroller);

    /* Carousel indicators, not a bar: the active scenario is a lozenge and the
       rest are dots, so the deck's length is countable at a glance. */
    var dockRow = styleEl(document.createElement('div'), {
      flex: '0 0 auto', display: 'flex', justifyContent: 'center', alignItems: 'center',
      gap: '7px', padding: '26px 0 40px',
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
      d.addEventListener('click', function () {
        scroller.children[i].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      });
      return d;
    });
    pips.forEach(function (d) { dockRow.appendChild(d); });
    layer.appendChild(dockRow);

    // the lozenge follows whichever card is centred
    scroller.addEventListener('scroll', function () {
      var mid = scroller.scrollLeft + scroller.clientWidth / 2;
      var best = 0, bestD = Infinity;
      Array.prototype.forEach.call(scroller.children, function (c, i) {
        var d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid);
        if (d < bestD) { bestD = d; best = i; }
      });
      pips.forEach(function (p, i) { p.style.width = i === best ? '28px' : '7px'; });
    });

    var host = nav.parentElement || document.body;
    host.insertBefore(layer, host.firstChild);

    // open on the scenario you are actually on
    requestAnimationFrame(function () {
      var el = scroller.children[doneN];
      if (el) scroller.scrollLeft = el.offsetLeft + el.offsetWidth / 2 - scroller.clientWidth / 2;
    });
  }

  NX.onRail(function (nav, rail) { initCardsHome(nav, rail); });
})();
