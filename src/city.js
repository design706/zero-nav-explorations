/**
 * nav-explorations — THE CITY LANE.
 *
 * ✅ OWNED BY THE CITY CHAT. The cards chat does not edit this file.
 *
 * Everything specific to the rendered-world home: the grown rail's chrome
 * (focus compression, connector tightening, the milestone-label rule), the
 * category-title fitting, and keeping the map camera on the scenario the rail
 * is pointing at.
 *
 * The rail's GEOMETRY lives in the bundle, driven by tokens the build injects
 * (tools/rules-city.mjs + the CITY block in tools/tokens.mjs). This file is
 * only the parts CSS and the DOM can reach.
 */
(function () {
  'use strict';
  var NX = window.NX;
  if (!NX || !NX.state.enabled) return;

  var styleEl = NX.styleEl,
    REDUCE = NX.REDUCE;

  /* The rail's chrome — the parts of the grown bar that CSS can reach.
     (Its GEOMETRY lives in the bundle, driven by tokens; see
     tools/rules-city.mjs and CITY_TOKENS in tools/tokens.mjs.) */
  function installFocusCss() {
    var style = document.createElement('style');
    style.id = 'nx-focus';
    style.textContent = [
      /* The title box must never shrink. It is a flex item, and shrinking is
         what makes it re-wrap while the button reveals; the per-title width
         comes from fitTitles(), falling back to the cap. */
      'nav[aria-label$="timeline"] > div > div > button[aria-expanded] > span' +
        '{flex-shrink:0!important;width:var(--nx-title-w,168px)!important;}',

      /* The prototype's own debug button (a compass, fixed bottom-right) is
         hidden: that corner belongs to the portfolio now, and a debug control
         belongs in the debug panel. Its wrapper stays mounted. */
      'button[aria-label="Prototype tour"]{display:none!important;}',

      /* The hover card hangs off the CHIP's top edge by a fixed 13px, which
         was right when the bar was 54px tall — the card's bottom met the bar's
         top edge and read as attached to it. At 92px the bar's own padding and
         the segment inset push the chip down, so that same 13px leaves the
         card's bottom 22px INSIDE the bar (measured). Lifted clear: still
         connected by the arrow pointing down at its chip, no longer sitting on
         top of the navigation. */
      'nav[aria-label$="timeline"] div[class*="w-[318px]"]' +
        '{margin-bottom:var(--nx-card-gap,13px)!important;}',

      /* Focus mode — while any node is open the rail tightens, which is what
         buys the width for a 92px bar without ever touching the settings pill.
         Connectors first. */
      'nav[data-nx-focus="1"] > div > span' +
        '{width:var(--nx-conn-focus,12px)!important;}',

      /* …then the segments that are NOT the open one. `:has()` is how CSS can
         finally tell them apart: the open segment is the one whose header
         button carries aria-expanded="true". The shipped design already does
         this in miniature (the open segment's own padding drops 8 -> 4). */
      'nav[data-nx-focus="1"] > div > div:not(:has(> button[aria-expanded="true"]))' +
        '{padding-left:var(--nx-seg-pad-focus,8px)!important;' +
        'padding-right:var(--nx-seg-pad-focus,8px)!important;' +
        'gap:var(--nx-seg-gap-focus,5px)!important;}',

      /* A milestone owns its own open flag, independent of the rail's single
         openIndex — so a milestone could sit expanded WHILE a cluster is
         expanded. Measured, that worst case ran 58px over the settings pill
         and 83px off the right. The rail's authored model already says
         "exactly one cluster open"; this extends it to milestones. Targeted by
         CLASS, not child index: Job Portal carries an extra pulse overlay. */
      'nav[data-nx-focus="1"] > div > button' +
        '{padding-left:0!important;padding-right:0!important;}',
      'nav[data-nx-focus="1"] > div > button > span[class*="whitespace-nowrap"]' +
        '{max-width:0!important;margin-left:0!important;opacity:0!important;}',
    ].join('\n');
    document.head.appendChild(style);
  }

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

  /* ── keep the map on the scenario the rail is pointing at ────────────────
     The rail derives "current" from the journey's completedCount, but the
     camera targets `user.currentScenario`, which the lab's fixture seeds
     separately. Wind the clock back and the two disagree: the card names one
     company while the view frames another's neighbourhood, so the pin sits far
     off at the edge of the screen with a long leader line to the card.

     The company is read from the rail itself — the current chip's own
     aria-label ("Title, Company") — so the view follows whatever the rail
     says is current and the two cannot drift apart again. */
  function currentCompanyFromRail() {
    var pill = document.querySelector('nav[aria-label$="timeline"] > div');
    if (!pill) return null;
    var chips = pill.querySelectorAll(':scope > div > button[aria-label]');
    for (var i = 0; i < chips.length; i++) {
      var b = chips[i];
      if (b.hasAttribute('aria-expanded')) continue;
      // the current scenario is the one wearing the green ring
      if (!/73,\s*186,\s*97/.test(getComputedStyle(b).boxShadow)) continue;
      var label = b.getAttribute('aria-label') || '';
      var at = label.lastIndexOf(', ');
      if (at > 0) return label.slice(at + 2);
    }
    return null;
  }

  function frameCurrentScenario() {
    var company = currentCompanyFromRail();
    if (!company || !window.__NX_FLY) return false;
    return window.__NX_FLY(company);
  }

  function initDock() {
    var pill = document.querySelector('nav[aria-label$="timeline"]').firstElementChild;
    scheduleFits(pill);
    // after the map's own intro settles, put the view on the current scenario
    setTimeout(frameCurrentScenario, 1200);
    // 40px lands the card ~16px clear of the bar — near the bar's own 17px
    // internal padding, so the air outside it echoes the air inside it rather
    // than being an arbitrary number. (Measured: 13px overlapped by 22.)
    document.documentElement.style.setProperty('--nx-card-gap', '40px');
    document.documentElement.style.setProperty('--nx-conn-focus', '12px');
    document.documentElement.style.setProperty('--nx-seg-pad-focus', '8px');
    document.documentElement.style.setProperty('--nx-seg-gap-focus', '5px');
    installFocusCss();
  }


  NX.onRail(function () { initDock(); });
})();
