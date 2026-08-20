/**
 * nav-explorations — THE CARDS LANE.
 *
 * ✅ OWNED BY THE CARDS CHAT. The city chat does not edit this file.
 *
 * The plain-base home where the rail's own cards ARE the navigation — the
 * scalable answer for a focus that has no city rendered for it yet.
 *
 * Available from core: NX.styleEl, NX.GLASS, NX.EASE, NX.REDUCE,
 * NX.onRail(fn), NX.panelRow(order, builder), NX.go(params), NX.state.
 * To add bundle-level changes, use tools/rules-cards.mjs — it is applied
 * alongside the other lanes' rules, so neither lane can revert the other.
 */
(function () {
  'use strict';
  var NX = window.NX;
  if (!NX || !NX.state.enabled || !NX.state.cards) return;

  var styleEl = NX.styleEl,
    GLASS = NX.GLASS,
    EASE = NX.EASE,
    REDUCE = NX.REDUCE;

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


  NX.onRail(function (nav, rail) { initCardsHome(nav, rail); });
})();
