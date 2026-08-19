/**
 * Nav explorations — an INJECTION over the deployed nav-lab bundle.
 * (The eval-orchestra rule: edit the injection, never the generated page.)
 *
 * The base is sanjay-b-chauhan.github.io/zero-nav-lab — the source of truth
 * being implemented in the core product. This script adds three reviewable
 * variants on top of the REAL rail, real chips, real data, forwarding clicks
 * to the app's own buttons so everything stays functional:
 *
 *   ?dock=on         the rail scaled up ~1.7x in height via the bundle's own
 *                    geometry tokens; the base's hover behaviour is untouched
 *   ?portfolio=on    the Portfolio milestone EXTRACTED from the rail into its
 *                    own corner element (bottom-left; `=top` for top-left).
 *                    Clicking it clicks the real (hidden) rail button.
 *   ?home=cards      the city image hidden, plain base, the rail's own chips
 *                    laid out as cards — the scalable home for a focus with
 *                    no city. Cards click through to the real chips.
 *
 * A DEBUG PANEL rides on the surface itself (bottom-right, collapsed to a
 * pill) so a reviewer switches variants in place instead of going back to a
 * menu of five links. It is the only always-on part of this file: with no
 * params nothing else runs, so the plain URL is still the honest reference
 * plus a way in.
 */
(function () {
  'use strict';

  var q = new URLSearchParams(location.search);
  var dockFacets = (q.get('dock') || '').toLowerCase().split(',');
  var pfFacets = (q.get('portfolio') || '').toLowerCase().split(',');
  var WANT_DOCK = dockFacets.indexOf('on') !== -1;
  var WANT_PF = pfFacets.indexOf('on') !== -1 || pfFacets.indexOf('top') !== -1;
  var PF_TOP = pfFacets.indexOf('top') !== -1;
  var WANT_CARDS = (q.get('home') || '').toLowerCase() === 'cards';
  var ANY_VARIANT = WANT_DOCK || WANT_PF || WANT_CARDS;

  /* The deployed base also carries the first-run injection (firstrun.js —
     welcome → journey → morph into the dock). It lands a milestone on the very
     Portfolio pill the ?portfolio variant hides, so the two cannot share a
     screen: on a VARIANT link the first-run overlay is removed on sight, and
     the plain URL keeps the full flow. */
  function suppressFirstRun() {
    var kill = function () {
      var el = document.getElementById('zfr');
      if (el) el.remove();
      // Its beat attribute lives on <html> and pins the dock at opacity 0 —
      // clear it every pass or the rail never fades in.
      document.documentElement.removeAttribute('data-zfr-beat');
      return !!el;
    };
    if (!kill()) {
      var mo = new MutationObserver(function () {
        if (kill()) mo.disconnect();
      });
      mo.observe(document.documentElement, { childList: true, subtree: true });
      setTimeout(function () {
        mo.disconnect();
      }, 60000);
    }
  }
  if (ANY_VARIANT) suppressFirstRun();

  var REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var EASE = 'cubic-bezier(0.32, 0.72, 0, 1)'; // the rail's own ease, verbatim
  var GLASS = {
    background: 'rgba(24,22,20,0.78)',
    backdropFilter: 'blur(18px) saturate(1.1)',
    WebkitBackdropFilter: 'blur(18px) saturate(1.1)',
    boxShadow: '0 24px 60px -18px rgba(0,0,0,0.55)',
  };

  function styleEl(el, styles) {
    for (var k in styles) el.style[k] = styles[k];
    return el;
  }

  /* ── the rail's data, read from its own DOM ─────────────────────────────
     Segments carry aria "Category, N of M complete"; chips carry
     "Title, Company" and a logo <img>. Nothing is re-authored here. */
  function readRail(nav) {
    var pill = nav.firstElementChild;
    var segments = [];
    var milestones = [];
    Array.prototype.forEach.call(pill.children, function (child) {
      if (child.tagName === 'BUTTON') {
        milestones.push(child);
        return;
      }
      var head = child.querySelector('button[aria-label*="complete"]');
      if (!head) return;
      var m = /^(.*), (\d+) of (\d+) complete$/.exec(head.getAttribute('aria-label') || '');
      var chips = Array.prototype.filter.call(child.querySelectorAll('button'), function (b) {
        return b !== head && /,/.test(b.getAttribute('aria-label') || '');
      });
      segments.push({
        title: m ? m[1] : '',
        done: m ? +m[2] : 0,
        total: m ? +m[3] : chips.length,
        chips: chips.map(function (b) {
          var label = b.getAttribute('aria-label') || '';
          var at = label.lastIndexOf(', ');
          return {
            button: b,
            title: at > 0 ? label.slice(0, at) : label,
            company: at > 0 ? label.slice(at + 2) : '',
            logo: (b.querySelector('img') || {}).src || '',
          };
        }),
      });
    });
    return { pill: pill, segments: segments, milestones: milestones };
  }

  /* ── ?dock=on — the taller rail ──────────────────────────────────────────
     Almost nothing happens here any more, and that is the point.

     The geometry lives in the BUNDLE now: `patch-dock.mjs` turned the rail's
     own token table (`NODE/MARK/OPEN_PILL`) and ~12 literal sites into
     `__NXD.X ?? <original>`, and the knob script in index.html sets those
     tokens before the module evaluates. So the component's own layout logic
     reflows every state — collapsed vs expanded, completed vs current vs
     locked — instead of a stylesheet trying to guess at states that only exist
     as inline styles. Two earlier attempts failed exactly there.

     What is left for this file is the one thing the bundle cannot know: a rule
     in the COMPILED css lifts a right-hand card by a hard-coded 96px, which is
     `36 (nav bottom) + 54 (old rail height) + 6 (gap)`. Grow the rail and that
     card sits 38px too low — straight through it. The knob computed the right
     value into `--nx-lift`; this rule consumes it.

     Specificity: one extra `html` beats the compiled rule (0-2-2 vs 0-2-1)
     without `!important`. `--nx-lift` defaults to the shipped 96px, so this is
     inert when the variant is off and can be installed unconditionally. */
  function installCardLift() {
    var style = document.createElement('style');
    style.id = 'nx-card-lift';
    style.textContent =
      'html body[data-navlab-roadmap-rail] .pointer-events-auto>div[class*=absolute][class*=right-]' +
      '{transform:translateY(calc(-1 * var(--nx-lift, 96px)))}';
    document.head.appendChild(style);
  }

  /* Connector compression. The rail exposes `data-nx-focus` while any node is
     open (patched into CapsuleRail, which owns that state). Everything else in
     focus mode is driven from the bundle; the connector's width is an inline
     style on a component that never learns about its siblings, so it is
     reached from here instead. Scoped to the rail and gated on the attribute,
     which only ever appears when the variant is on. */
  function installFocusCss() {
    var style = document.createElement('style');
    style.id = 'nx-focus';
    style.textContent =
      // connectors tighten while focused
      // The title box: never shrink (it is a flex item, and shrinking is what
      // makes it re-wrap while the button reveals), and take the per-title
      // width measured by fitTitles(), falling back to the cap.
      'nav[aria-label$="timeline"] > div > div > button[aria-expanded] > span' +
      '{flex-shrink:0!important;width:var(--nx-title-w,168px)!important;}' +
      // connectors tighten while focused
      'nav[data-nx-focus="1"] > div > span{width:var(--nx-conn-focus,12px)!important;}' +
      // and so do the segments that are NOT the open one. `:has()` is how CSS
      // finally can tell them apart: the open segment is the one whose header
      // button carries aria-expanded="true". The shipped design already does
      // this in miniature (the open segment's own padding drops 8 -> 4); this
      // extends the same idea to its neighbours, which is what buys the width
      // for a 92px bar without ever touching the settings pill.
      'nav[data-nx-focus="1"] > div > div:not(:has(> button[aria-expanded="true"]))' +
      '{padding-left:var(--nx-seg-pad-focus,8px)!important;' +
      'padding-right:var(--nx-seg-pad-focus,8px)!important;' +
      'gap:var(--nx-seg-gap-focus,5px)!important;}' +
      // A milestone owns its own open flag, independent of the rail's single
      // openIndex — so today a milestone can sit expanded WHILE a cluster is
      // expanded. Measured, that worst case is 1839.7px: it runs 58px over the
      // settings pill and 83px off the right. The rail's authored model already
      // says "exactly one cluster open"; this extends the same rule to
      // milestones, collapsing their labels whenever a cluster takes focus.
      // Rides the milestone's own 420ms padding transition, so it animates.
      'nav[data-nx-focus="1"] > div > button' +
      '{padding-left:0!important;padding-right:0!important;}' +
      // by CLASS, not position: Job Portal mounts an extra pulsing overlay
      // span, so its label is not the same child index as Portfolio's.
      'nav[data-nx-focus="1"] > div > button > span[class*="whitespace-nowrap"]' +
      '{max-width:0!important;margin-left:0!important;opacity:0!important;}';
    document.head.appendChild(style);
  }

  /* The category title box, sized to its OWN longest wrapped line.

     The box has to be a fixed width — sized against the button's animating
     max-width the text would re-wrap all through the 420ms reveal. But one
     fixed width for every title leaves the short ones with a lot of dead box:
     "Growth & Revenue Optimization" only needs ~128px of the 168px cap, and
     that ~40px gap is what reads as a padding bug between the title and the
     first company chip.

     So: let it wrap at the cap, measure the longest line it actually produced,
     then pin the box to that. `Range.getClientRects()` returns one rect PER
     LINE, which gives the longest line exactly rather than by estimation.

     Re-wrapping is provably safe. Greedy wrapping at width W gives lines Li;
     set W' = max|Li|. Every line still fits, and no word can climb to the line
     above, because at W >= W' it already didn't fit. Same break, snug box.

     Written as a CUSTOM PROPERTY, not an inline width: React re-renders this
     element (hover, selection, the pulse) and would revert a style property it
     manages, but it never touches an unknown custom property. */
  var TITLE_CUSHION = 3; // canvas px — see (1) below

  function fitTitles(pill) {
    var nav = pill.parentElement;
    var k = 1840 / nav.getBoundingClientRect().width;
    var spans = pill.querySelectorAll(':scope > div > button[aria-expanded] > span');
    Array.prototype.forEach.call(spans, function (span) {
      // Measure at the CAP first, so the wrap we pin to is the cap's wrap.
      span.style.removeProperty('--nx-title-w');
      var longest = longestLine(span);
      if (!longest) return;

      // (1) CUSHION. Pinning to the measurement exactly is unstable: the line
      // that measured 127.3 gets a 126px box after unit conversion, no longer
      // fits, re-breaks to three lines, and the clamp ellipsises it — which is
      // the truncation in the screenshot. A few px of slack absorbs that, and
      // cannot reintroduce a wrap, because a wider box never breaks more.
      // Fractional px on purpose; rounding down is what caused the bug.
      span.style.setProperty('--nx-title-w', (longest * k + TITLE_CUSHION).toFixed(2) + 'px');

      // (3) VERIFY, and fall back to the proven cap. A title must NEVER
      // truncate, so the pin is treated as an optimisation that has to earn
      // itself: if the pinned box is not still exactly two clean lines, drop it
      // and let the 168px cap take over — measured, all five shipped titles
      // wrap to two un-clipped lines there (longest line 166.6).
      if (linesOf(span) > 2 || span.scrollHeight > span.clientHeight + 1) {
        span.style.removeProperty('--nx-title-w');
      }
    });
  }

  function longestLine(span) {
    var range = document.createRange();
    range.selectNodeContents(span);
    var rects = range.getClientRects();
    var longest = 0;
    for (var i = 0; i < rects.length; i++) longest = Math.max(longest, rects[i].width);
    return longest;
  }

  function linesOf(span) {
    var range = document.createRange();
    range.selectNodeContents(span);
    return range.getClientRects().length;
  }

  /* (2) RE-FIT WHENEVER THE METRICS CAN STILL MOVE. One measurement is not
     enough: the two type families load from the Google Fonts CDN, so a swap
     after the first pass silently invalidates every pinned box. Cheap enough to
     just re-run at each moment metrics can change. */
  function scheduleFits(pill) {
    var run = function () { fitTitles(pill); };
    run();
    if (document.fonts) {
      if (document.fonts.ready) document.fonts.ready.then(run);
      document.fonts.addEventListener('loadingdone', run);
    }
    if (document.readyState === 'complete') setTimeout(run, 0);
    else window.addEventListener('load', run);
    window.addEventListener('resize', run);
  }

  function initDock() {
    var pill = document.querySelector('nav[aria-label$="timeline"]').firstElementChild;
    scheduleFits(pill);
    document.documentElement.style.setProperty('--nx-conn-focus', '12px');
    document.documentElement.style.setProperty('--nx-seg-pad-focus', '8px');
    document.documentElement.style.setProperty('--nx-seg-gap-focus', '5px');
    installFocusCss();
  }

  /* ── ?portfolio=on — extract the milestone into its own element ─────────
     The portfolio grows with every scenario forever; the journey rail is
     finite. So it comes OUT of the rail: the real button is hidden (never
     removed) and the corner element forwards clicks to it, so the app's own
     behaviour is untouched. */
  function initPortfolio(nav, rail) {
    var pfButton = null;
    rail.milestones.forEach(function (b) {
      if (/^portfolio/i.test(b.innerText || '')) pfButton = b;
    });
    if (!pfButton) return;

    // Hide the in-rail button and its leading separator dot.
    var sep = pfButton.previousElementSibling;
    if (sep && sep.tagName === 'SPAN') sep.style.display = 'none';
    pfButton.style.display = 'none';

    var done = rail.segments.reduce(function (n, s) {
      return n + s.done;
    }, 0);
    var status = (pfButton.innerText || '').split('·')[1];

    var card = styleEl(document.createElement('button'), {
      position: 'absolute',
      left: '40px',
      cursor: 'pointer',
      pointerEvents: 'auto',
      border: '0',
      textAlign: 'left',
      padding: '18px 22px',
      borderRadius: '24px',
      zIndex: '6',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      width: '250px',
      transition: REDUCE ? 'none' : 'transform 200ms ' + EASE,
    });
    card.style[PF_TOP ? 'top' : 'bottom'] = PF_TOP ? '120px' : '110px';
    for (var g in GLASS) card.style[g] = GLASS[g];

    card.innerHTML =
      '<span class="font-pp-supply-mono" style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.55)">Portfolio</span>' +
      '<span style="display:flex;align-items:baseline;gap:9px">' +
      '<span class="font-stk-bureau-serif" style="font-size:38px;line-height:1;color:#fff">' +
      String(done).padStart(2, '0') +
      '</span>' +
      '<span class="font-google-sans-flex" style="font-size:13.5px;font-weight:500;color:rgba(255,255,255,0.7)">artifacts banked</span>' +
      '</span>' +
      (status
        ? '<span class="font-google-sans-flex" style="font-size:12px;color:rgba(255,255,255,0.5)">Unlocks in' +
          status.replace(/more to go/i, 'scenarios') +
          '</span>'
        : '');

    card.addEventListener('click', function () {
      pfButton.click();
    });
    card.addEventListener('mouseenter', function () {
      if (!REDUCE) card.style.transform = 'translateY(-2px)';
    });
    card.addEventListener('mouseleave', function () {
      card.style.transform = 'none';
    });

    nav.parentElement.appendChild(card);
  }

  /* ── ?home=cards — plain base, the chips laid out as cards ──────────────
     The city needs a building modelled per company; the cards need only the
     data the rail already carries. Hide the city image, keep everything else
     (panel, rail, HUD) alive, and click through to the real chips. */
  function initCardsHome(nav, rail) {
    var city = document.querySelector('img[src*="zero-city"]');
    if (city) {
      city.style.visibility = 'hidden';
      var host = city.parentElement;
      if (host) host.style.background = '#141210';
    }

    /* Selection is driven through the app's own panel chevrons ("Previous
       company"/"Next company") — a chip click only previews. Each card knows
       its global position; step the panel to it with the app's own controls. */
    function currentPosition() {
      var m = /(\d+)\s+of\s+\d+/.exec(document.body.innerText || '');
      return m ? +m[1] : null;
    }
    function stepTo(target) {
      // KNOWN GAP, deliberate: the panel's chevron handler is user-activation
      // gated AND advances one step per gesture (stale-closure increment), so
      // an injection cannot jump the panel N companies. One hop per click is
      // what the base grants; full jump-to-scenario is a one-line hook in the
      // source when this is built for real. Meanwhile a card click also
      // forwards to the company's own rail chip, which is the base's native
      // affordance for "look at this one".
      var cur = currentPosition();
      if (cur == null || cur === target) return;
      var btn = document.querySelector(
        'button[aria-label="' + (target > cur ? 'Next company' : 'Previous company') + '"]'
      );
      if (btn) btn.click();
    }

    var layer = styleEl(document.createElement('div'), {
      position: 'absolute',
      inset: '0',
      zIndex: '1',
      pointerEvents: 'none',
      background:
        '#141210 radial-gradient(ellipse 70% 55% at 42% 28%, rgba(255,255,255,0.05), transparent)',
    });

    var grid = styleEl(document.createElement('div'), {
      position: 'absolute',
      left: '60px',
      right: '640px', // the scenario panel owns the right edge
      top: '120px',
      bottom: '140px', // the rail owns the bottom
      display: 'grid',
      gridTemplateColumns: 'repeat(' + rail.segments.length + ', 1fr)',
      gap: '18px',
      alignItems: 'start',
      pointerEvents: 'auto',
    });

    // The current scenario: first not-done chip of the first unfinished segment.
    var currentChip = null;
    rail.segments.some(function (s) {
      if (s.done < s.total) {
        currentChip = s.chips[s.done];
        return true;
      }
      return false;
    });

    // Global 1-based position per chip, in rail order — the panel's own count.
    var position = 0;
    rail.segments.forEach(function (s) {
      s.chips.forEach(function (chip) {
        chip.pos = ++position;
      });
    });

    rail.segments.forEach(function (seg) {
      var col = styleEl(document.createElement('div'), {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      });
      var head = document.createElement('div');
      head.innerHTML =
        '<span class="font-google-sans-flex" style="font-size:12.5px;font-weight:500;color:rgba(255,255,255,0.7)">' +
        seg.title +
        '</span> <span class="font-pp-supply-mono" style="font-size:10.5px;color:rgba(255,255,255,0.4)">' +
        seg.done +
        '/' +
        seg.total +
        '</span>';
      styleEl(head, {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        gap: '8px',
        padding: '0 4px',
      });
      col.appendChild(head);

      seg.chips.forEach(function (chip, i) {
        var isDone = i < seg.done;
        var isNow = chip.button === currentChip;
        var c = styleEl(document.createElement('button'), {
          border: '0',
          textAlign: 'left',
          cursor: 'pointer',
          borderRadius: '20px',
          padding: isNow ? '16px' : '13px 14px',
          display: 'flex',
          gap: '11px',
          alignItems: 'center',
          opacity: isDone || isNow ? '1' : '0.55',
          outline: isNow ? '1.5px solid rgba(255,255,255,0.4)' : 'none',
          transition: REDUCE ? 'none' : 'transform 180ms ' + EASE + ', opacity 180ms ease',
        });
        for (var g in GLASS) c.style[g] = GLASS[g];

        c.innerHTML =
          '<span style="position:relative;flex-shrink:0;width:34px;height:34px;border-radius:999px;display:grid;place-items:center;background:rgba(255,255,255,' +
          (isDone || isNow ? '0.94' : '0.5') +
          ')' +
          (isDone || isNow ? '' : ';filter:grayscale(1)') +
          '">' +
          (chip.logo ? '<img src="' + chip.logo + '" style="width:20px;height:20px;object-fit:contain" alt=""/>' : '') +
          (isDone
            ? '<span style="position:absolute;right:-3px;bottom:-3px;width:14px;height:14px;border-radius:999px;background:#4ade80;display:grid;place-items:center;font-size:9px;color:#000;font-weight:700">✓</span>'
            : '') +
          '</span>' +
          '<span style="display:flex;flex-direction:column;gap:2px;min-width:0">' +
          '<span class="font-pp-supply-mono" style="font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.5)">' +
          chip.company +
          (isNow ? ' · now' : '') +
          '</span>' +
          '<span class="font-google-sans-flex" style="font-size:' +
          (isNow ? '15px' : '13px') +
          ';font-weight:500;line-height:1.25;color:rgba(255,255,255,' +
          (isNow ? '1' : '0.85') +
          ')">' +
          chip.title +
          '</span>' +
          '</span>';

        c.addEventListener('click', function () {
          chip.button.click(); // the base's own cluster highlight
          stepTo(chip.pos); // and one panel hop toward it (see the note above)
        });
        c.addEventListener('mouseenter', function () {
          if (!REDUCE) c.style.transform = 'translateY(-2px)';
        });
        c.addEventListener('mouseleave', function () {
          c.style.transform = 'none';
        });
        col.appendChild(c);
      });
      grid.appendChild(col);
    });

    layer.appendChild(grid);
    // Into the HUD canvas layer, FIRST child — under the rail and pills that
    // share it, over the (hidden) city.
    nav.parentElement.insertBefore(layer, nav.parentElement.firstChild);
  }

  /* ── the debug panel ────────────────────────────────────────────────────
     Rides on the surface so variants are compared in place. Every control
     rewrites the URL and reloads: the variants mutate the app's own DOM
     (hiding the city, extracting a rail pill), and unwinding that live would
     be a second, less trustworthy implementation of each variant. A reload is
     ~1s here and always shows the true state.

     Collapsed to a pill by default — a review is about the screen, not about
     the panel. State is remembered in sessionStorage so it survives the
     reloads it causes. Anchored to the VIEWPORT (fixed, own stacking context
     at z 9500) so it clears the app's canvas transform and the first-run
     overlay both. */
  function initDebugPanel() {
    var KEY = 'nav-exp:panel-open';
    var open = sessionStorage.getItem(KEY) === '1';

    /* TOP CENTRE — the only region no variant claims. The scenario card owns
       the right, the wordmark the top-left, streak/XP the top-right, the rail
       the bottom, and the extracted portfolio the bottom-left. A panel that
       covers the element under review is worse than no panel. */
    var host = styleEl(document.createElement('div'), {
      position: 'fixed',
      left: '50%',
      top: '14px',
      transform: 'translateX(-50%)',
      zIndex: '9500',
      fontFamily: 'ui-sans-serif, system-ui, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px',
    });

    function chip(label, active, onClick, sub) {
      var b = styleEl(document.createElement('button'), {
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        alignItems: 'flex-start',
        width: '100%',
        textAlign: 'left',
        cursor: 'pointer',
        border: '1px solid ' + (active ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.13)'),
        background: active ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.05)',
        color: '#fff',
        borderRadius: '12px',
        padding: '9px 11px',
        font: '500 12.5px/1.25 inherit',
        transition: 'background 120ms ease, border-color 120ms ease',
      });
      b.innerHTML =
        '<span>' +
        label +
        '</span>' +
        (sub
          ? '<span style="font-size:10.5px;font-weight:400;color:rgba(255,255,255,0.5)">' +
            sub +
            '</span>'
          : '');
      b.addEventListener('click', onClick);
      b.addEventListener('mouseenter', function () {
        if (!active) b.style.background = 'rgba(255,255,255,0.1)';
      });
      b.addEventListener('mouseleave', function () {
        if (!active) b.style.background = 'rgba(255,255,255,0.05)';
      });
      return b;
    }

    /* One writer for the URL, so a control can never express a state the
       links cannot. Passing null drops a param. */
    function go(params) {
      var u = new URL(location.href);
      for (var k in params) {
        if (params[k] == null) u.searchParams.delete(k);
        else u.searchParams.set(k, params[k]);
      }
      location.href = u.toString();
    }

    var body = styleEl(document.createElement('div'), {
      width: '212px',
      borderRadius: '18px',
      padding: '14px',
      display: open ? 'flex' : 'none',
      flexDirection: 'column',
      gap: '9px',
    });
    for (var g in GLASS) body.style[g] = GLASS[g];
    body.style.border = '1px solid rgba(255,255,255,0.12)';

    function section(title) {
      var s = styleEl(document.createElement('div'), {
        font: '500 9.5px/1 inherit',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.4)',
        marginTop: '2px',
      });
      s.textContent = title;
      return s;
    }

    body.appendChild(section('Home'));
    body.appendChild(
      chip('City', !WANT_CARDS, function () {
        go({ home: null });
      }, 'The rendered world')
    );
    body.appendChild(
      chip('Cards', WANT_CARDS, function () {
        go({ home: 'cards' });
      }, 'Plain base, scales to any focus')
    );

    body.appendChild(section('Navigation'));
    body.appendChild(
      chip('Dock grown', WANT_DOCK, function () {
        go({ dock: WANT_DOCK ? null : 'on' });
      }, WANT_DOCK ? 'On — click to restore' : 'Taller bar, dock presence')
    );

    body.appendChild(section('Portfolio'));
    body.appendChild(
      chip('In the rail', !WANT_PF, function () {
        go({ portfolio: null });
      }, 'As it is today')
    );
    body.appendChild(
      chip('Own element · bottom left', WANT_PF && !PF_TOP, function () {
        go({ portfolio: 'on' });
      })
    );
    body.appendChild(
      chip('Own element · top left', PF_TOP, function () {
        go({ portfolio: 'top' });
      })
    );

    var reset = chip('Reset to base', !ANY_VARIANT, function () {
      go({ dock: null, portfolio: null, home: null });
    });
    reset.style.marginTop = '4px';
    reset.style.opacity = '0.75';
    body.appendChild(reset);

    // The collapsed handle. Names the live variant count so a screenshot of a
    // variant is never mistaken for the base.
    var count = (WANT_CARDS ? 1 : 0) + (WANT_DOCK ? 1 : 0) + (WANT_PF ? 1 : 0);
    var toggle = styleEl(document.createElement('button'), {
      cursor: 'pointer',
      border: '1px solid rgba(255,255,255,0.14)',
      color: '#fff',
      borderRadius: '999px',
      padding: '8px 14px',
      font: '500 11.5px/1 inherit',
      letterSpacing: '0.04em',
      display: 'flex',
      alignItems: 'center',
      gap: '7px',
      order: '-1', // handle above, menu drops beneath it
    });
    for (var g2 in GLASS) toggle.style[g2] = GLASS[g2];
    toggle.innerHTML =
      '<span style="width:6px;height:6px;border-radius:999px;background:' +
      (count ? '#4ade80' : 'rgba(255,255,255,0.35)') +
      '"></span><span>' +
      (count ? 'Variants · ' + count : 'Variants') +
      '</span>';
    toggle.addEventListener('click', function () {
      open = !open;
      body.style.display = open ? 'flex' : 'none';
      sessionStorage.setItem(KEY, open ? '1' : '0');
    });

    host.appendChild(body);
    host.appendChild(toggle);
    document.body.appendChild(host);
  }

  installCardLift();

  if (document.body) initDebugPanel();
  else addEventListener('DOMContentLoaded', initDebugPanel);

  if (!ANY_VARIANT) return; // panel only; the base stays untouched

  /* ── boot: wait for the React app to mount the rail ─────────────────────── */
  var tries = 0;
  var timer = setInterval(function () {
    var nav = document.querySelector('nav.pointer-events-auto');
    if (!nav || !nav.firstElementChild || nav.querySelectorAll('button').length < 10) {
      if (++tries > 150) clearInterval(timer); // 30s — give up silently
      return;
    }
    clearInterval(timer);
    try {
      var rail = readRail(nav);
      if (WANT_CARDS) initCardsHome(nav, rail);
      if (WANT_PF) initPortfolio(nav, rail);
      if (WANT_DOCK) initDock();
    } catch (err) {
      // An injection must never take the base down with it.
      console.warn('[nav-explorations] failed:', err);
    }
  }, 200);
})();
