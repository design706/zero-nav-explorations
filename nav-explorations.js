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
  var PF_STATE = (q.get('pf') || 'docked').toLowerCase();
  var WANT_DOCK = dockFacets.indexOf('on') !== -1;

  var WANT_CARDS = (q.get('home') || '').toLowerCase() === 'cards';
  var ANY_VARIANT = WANT_DOCK || WANT_CARDS;

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
      // The prototype's own debug button (a compass, fixed bottom-right) is
      // hidden: that corner belongs to the portfolio now, and a debug control
      // belongs in the debug panel. The WRAPPER stays mounted so its menu can
      // still be driven programmatically from the Variants panel.
      'button[aria-label="Prototype tour"]{display:none!important;}' +
      // connectors tighten while focused
      // The title box: never shrink (it is a flex item, and shrinking is what
      // makes it re-wrap while the button reveals), and take the per-title
      // width measured by fitTitles(), falling back to the cap.
      'nav[aria-label$="timeline"] > div > div > button[aria-expanded] > span' +
      '{flex-shrink:0!important;width:var(--nx-title-w,168px)!important;}' +
      // The prototype's own debug button (a compass, fixed bottom-right) is
      // hidden: that corner belongs to the portfolio now, and a debug control
      // belongs in the debug panel. The WRAPPER stays mounted so its menu can
      // still be driven programmatically from the Variants panel.
      'button[aria-label="Prototype tour"]{display:none!important;}' +
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

  /* ── the portfolio, docked in the corner ─────────────────────────────────
     The portfolio is not a stop on the journey — the journey is finite and the
     portfolio keeps growing after it. So once it unlocks it leaves the rail and
     takes the bottom-right corner: always present, filling as work lands.

     It occupies the slot the prototype's own debug button was using (a compass
     at fixed bottom-[22px] right-[24px]); that button is hidden and its screen
     switcher moves into the Variants panel, which is where debug belongs.

     Chrome is the SettingsPill recipe verbatim — same PILL_SURFACE colours,
     same 58px, same opacity .55 rising to 1 on hover — so the two bottom
     corners read as one pair of controls rather than two unrelated buttons. */
  var PILL = 58;
  var PF_ICON_PATH =
    'M15.5406 18.3526L8.46061 18.3626H8.45961C8.35061 18.3626 8.24661 18.3196 8.16961 18.2426C8.09261 18.1656 8.04861 18.0606 8.04861 17.9516C8.04861 16.4556 9.27061 14.9456 12.0006 14.9456C14.7296 14.9456 15.9516 16.4506 15.9516 17.9416C15.9516 18.1686 15.7676 18.3526 15.5406 18.3526ZM11.9996 8.54766C13.4136 8.54766 14.5636 9.69766 14.5636 11.1116C14.5636 12.5256 13.4136 13.6756 11.9996 13.6756C10.5866 13.6756 9.43661 12.5256 9.43661 11.1116C9.43661 9.69766 10.5866 8.54766 11.9996 8.54766ZM10.9296 4.11466C10.9296 3.94866 11.0636 3.81466 11.2296 3.81466H12.7706C12.9366 3.81466 13.0706 3.94866 13.0706 4.11466V5.87566C13.0706 6.04066 12.9366 6.17566 12.7706 6.17566H11.2296C11.0636 6.17566 10.9296 6.04066 10.9296 5.87566V4.11466ZM15.6996 4.34766H14.4996V4.04766C14.4996 3.14766 13.7996 2.34766 12.8996 2.34766H11.1996C10.2996 2.34766 9.49961 3.04766 9.49961 4.04766V4.34766H8.29961C5.39961 4.34766 3.59961 6.04766 3.59961 8.94766V16.9476C3.59961 19.8476 5.39961 21.6476 8.29961 21.6476H15.6996C18.5996 21.6476 20.3996 19.9476 20.3996 17.0476V8.94766C20.2996 6.04766 18.5996 4.34766 15.6996 4.34766Z';

  /* Progress is read from the rail's OWN aria-labels ("N of M complete") so
     the ring can never disagree with the bar it came out of. */
  function journeyProgress() {
    var heads = document.querySelectorAll(
      'nav[aria-label$="timeline"] button[aria-expanded][aria-label]'
    );
    var done = 0,
      total = 0;
    Array.prototype.forEach.call(heads, function (h) {
      var m = /(\d+)\s+of\s+(\d+)\s+complete/.exec(h.getAttribute('aria-label') || '');
      if (m) {
        done += +m[1];
        total += +m[2];
      }
    });
    return total ? { done: done, total: total } : { done: 5, total: 16 };
  }

  function buildDockedPortfolio() {
    var host = styleEl(document.createElement('div'), {
      position: 'fixed',
      right: '24px',
      bottom: '22px',
      zIndex: '200',
      width: PILL + 'px',
      height: PILL + 'px',
      pointerEvents: 'auto',
    });
    host.id = 'nx-portfolio-dock';

    // The ring lives OUTSIDE the button so the button keeps the gear's exact
    // 58px footprint and the arc reads as a collar around it, not a border.
    var R = 32,
      C = 2 * Math.PI * R;
    var p = journeyProgress();
    var ring = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    ring.setAttribute('viewBox', '0 0 70 70');
    ring.setAttribute('aria-hidden', 'true');
    styleEl(ring, {
      position: 'absolute',
      left: '-6px',
      top: '-6px',
      width: '70px',
      height: '70px',
      transform: 'rotate(-90deg)',
      pointerEvents: 'none',
    });
    ring.innerHTML =
      '<circle cx="35" cy="35" r="' + R + '" fill="none" ' +
      'stroke="rgba(255,255,255,0.12)" stroke-width="3"/>' +
      '<circle class="nx-ring-arc" cx="35" cy="35" r="' + R + '" fill="none" ' +
      'stroke="rgb(73, 186, 97)" stroke-width="3" stroke-linecap="round" ' +
      'stroke-dasharray="' + C.toFixed(2) + '" ' +
      'stroke-dashoffset="' + C.toFixed(2) + '" ' +
      'style="transition:stroke-dashoffset 600ms cubic-bezier(.32,.72,0,1)"/>';

    var btn = styleEl(document.createElement('button'), {
      position: 'absolute',
      inset: '0',
      display: 'grid',
      placeItems: 'center',
      borderRadius: '999px',
      cursor: 'pointer',
      padding: '0',
      // PILL_SURFACE, verbatim from the bundle
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      background: 'rgba(0,0,0,0.2)',
      border: '2px solid rgba(255,255,255,0.1)',
      opacity: '0.55', // === SettingsPill
      transition: 'opacity 200ms ease',
    });
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Portfolio · ' + p.done + ' of ' + p.total + ' projects');
    btn.innerHTML =
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
      '<path fill-rule="evenodd" clip-rule="evenodd" fill="#fff" d="' + PF_ICON_PATH + '"/></svg>';
    btn.addEventListener('mouseenter', function () { btn.style.opacity = '1'; });
    btn.addEventListener('mouseleave', function () { btn.style.opacity = '0.55'; });

    host.appendChild(ring);
    host.appendChild(btn);
    document.body.appendChild(host);
    return { host: host, btn: btn, ring: ring, circumference: C, progress: p };
  }

  /* Draw the arc to the current fraction. Split from the build so the unlock
     flight can hold it at zero and then fill it as the arrival beat. */
  function drawRing(dock, animate) {
    var arc = dock.ring.querySelector('.nx-ring-arc');
    if (!arc) return;
    var frac = dock.progress.done / dock.progress.total;
    var to = dock.circumference * (1 - frac);
    if (!animate || REDUCE) arc.style.transition = 'none';
    arc.style.strokeDashoffset = to.toFixed(2);
    if (!animate || REDUCE) {
      void arc.getBoundingClientRect();
      arc.style.transition = 'stroke-dashoffset 600ms cubic-bezier(.32,.72,0,1)';
    }
  }

  function initPortfolioDock() {
    var dock = buildDockedPortfolio();
    requestAnimationFrame(function () { drawRing(dock, true); });
    return dock;
  }

  /* ── the unlock moment ───────────────────────────────────────────────────
     Played live from the in-rail state, no reload: the chip acknowledges, a
     clone flies to the corner, the rail closes the gap behind it, and the ring
     fills on arrival. Reduced motion gets the same outcome as a crossfade. */
  function playUnlock() {
    var pillEl = document.querySelector('nav[aria-label$="timeline"] > div');
    if (!pillEl) return;
    var chip = Array.prototype.filter.call(pillEl.children, function (c) {
      return c.tagName === 'BUTTON' && /portfolio/i.test(c.getAttribute('aria-label') || '');
    })[0];
    var existing = document.getElementById('nx-portfolio-dock');
    if (existing) existing.remove();

    var dock = buildDockedPortfolio();
    var target = dock.btn.getBoundingClientRect();
    dock.host.style.opacity = '0';

    if (!chip || REDUCE) {
      dock.host.style.transition = 'opacity 400ms ease';
      requestAnimationFrame(function () {
        dock.host.style.opacity = '1';
        drawRing(dock, true);
      });
      return;
    }

    var from = chip.getBoundingClientRect();
    var clone = styleEl(document.createElement('div'), {
      position: 'fixed',
      left: from.left + 'px',
      top: from.top + 'px',
      width: from.width + 'px',
      height: from.height + 'px',
      borderRadius: '999px',
      background: 'rgba(73,186,97,0.24)',
      boxShadow: '0 0 0 2px rgb(73, 186, 97), 0 0 26px -6px rgb(73, 186, 97)',
      zIndex: '300',
      pointerEvents: 'none',
      display: 'grid',
      placeItems: 'center',
      transition:
        'left 700ms cubic-bezier(.32,.72,0,1), top 700ms cubic-bezier(.32,.72,0,1), ' +
        'width 700ms cubic-bezier(.32,.72,0,1), height 700ms cubic-bezier(.32,.72,0,1), ' +
        'transform 260ms cubic-bezier(.32,.72,0,1), opacity 200ms ease 620ms',
    });
    clone.innerHTML =
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
      '<path fill-rule="evenodd" clip-rule="evenodd" fill="#fff" d="' + PF_ICON_PATH + '"/></svg>';
    document.body.appendChild(clone);

    // 1. acknowledge in place
    clone.style.transform = 'scale(1.12)';
    setTimeout(function () { clone.style.transform = 'scale(1)'; }, 220);

    // 2. the rail closes the gap it leaves behind
    setTimeout(function () {
      chip.style.transition = 'max-width 700ms cubic-bezier(.32,.72,0,1), ' +
        'opacity 240ms ease, margin 700ms cubic-bezier(.32,.72,0,1)';
      chip.style.maxWidth = '0px';
      chip.style.minWidth = '0px';
      chip.style.opacity = '0';
      chip.style.marginLeft = '-' + (window.__NX_DOCK.GAP || 10) + 'px';
      var sep = chip.previousElementSibling;
      if (sep && sep.tagName === 'SPAN') {
        sep.style.transition = 'width 700ms cubic-bezier(.32,.72,0,1), opacity 240ms ease';
        sep.style.width = '0px';
        sep.style.opacity = '0';
      }
    }, 240);

    // 3. fly
    setTimeout(function () {
      clone.style.left = target.left + 'px';
      clone.style.top = target.top + 'px';
      clone.style.width = target.width + 'px';
      clone.style.height = target.height + 'px';
      clone.style.opacity = '0';
    }, 260);

    // 4. arrive: the corner takes over and the ring fills
    setTimeout(function () {
      dock.host.style.transition = 'opacity 240ms ease';
      dock.host.style.opacity = '1';
      drawRing(dock, true);
      clone.remove();
    }, 940);
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
      chip('In the rail · locked', PF_STATE === 'locked', function () {
        go({ dock: 'on', pf: 'locked' });
      }, 'Before the first category lands')
    );
    body.appendChild(
      chip('In the rail · unlocked', PF_STATE === 'rail', function () {
        go({ dock: 'on', pf: 'rail' });
      }, 'The moment it opens')
    );
    body.appendChild(
      chip('Docked · corner', PF_STATE === 'docked', function () {
        go({ dock: 'on', pf: 'docked' });
      }, 'Where it lives, ring filling')
    );
    var play = chip('▶  Play unlock', false, function () {
      if (PF_STATE !== 'rail') {
        // needs the chip on screen to fly FROM, so land there first and
        // autoplay on arrival
        sessionStorage.setItem('nx-autoplay-unlock', '1');
        go({ dock: 'on', pf: 'rail' });
        return;
      }
      playUnlock();
    }, 'Rail → corner, with the ring');
    play.style.marginTop = '2px';
    body.appendChild(play);

    /* The prototype's screen switcher, relocated. Its own button is hidden, so
       drive it: open the menu, then click the row by its text on the next
       frame. `.click()` works on a display:none button. */
    function tourAction(label) {
      var trigger = document.querySelector('button[aria-label="Prototype tour"]');
      if (!trigger) return;
      trigger.click();
      requestAnimationFrame(function () {
        var rows = document.querySelectorAll('[role="menu"] button, [role="menuitem"]');
        for (var i = 0; i < rows.length; i++) {
          if ((rows[i].textContent || '').trim().toLowerCase() === label.toLowerCase()) {
            rows[i].click();
            return;
          }
        }
        trigger.click(); // nothing matched — close it again
      });
    }
    body.appendChild(section('Screens'));
    body.appendChild(chip('Home', false, function () { tourAction('Home'); }));
    body.appendChild(chip('Stage screen', false, function () { tourAction('Stage screen'); }));

    var reset = chip('Reset to base', !ANY_VARIANT, function () {
      go({ dock: null, pf: null, home: null });
    });
    reset.style.marginTop = '4px';
    reset.style.opacity = '0.75';
    body.appendChild(reset);

    // The collapsed handle. Names the live variant count so a screenshot of a
    // variant is never mistaken for the base.
    var count = (WANT_CARDS ? 1 : 0) + (WANT_DOCK ? 1 : 0);
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
      if (WANT_DOCK) initDock();
      // The corner portfolio only exists in the dock variant, and only once it
      // has left the rail.
      if (WANT_DOCK && PF_STATE === 'docked') initPortfolioDock();
      // "Play unlock" pressed from a state without the chip on screen: it
      // routed here first, so play on arrival.
      if (WANT_DOCK && PF_STATE === 'rail' && sessionStorage.getItem('nx-autoplay-unlock')) {
        sessionStorage.removeItem('nx-autoplay-unlock');
        setTimeout(playUnlock, 600);
      }
    } catch (err) {
      // An injection must never take the base down with it.
      console.warn('[nav-explorations] failed:', err);
    }
  }, 200);
})();
