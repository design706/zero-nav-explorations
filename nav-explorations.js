/**
 * Nav explorations — an INJECTION over the deployed nav-lab bundle.
 * (The eval-orchestra rule: edit the injection, never the generated page.)
 *
 * The base is sanjay-b-chauhan.github.io/zero-nav-lab — the source of truth
 * being implemented in the core product. This script adds three reviewable
 * variants on top of the REAL rail, real chips, real data, forwarding clicks
 * to the app's own buttons so everything stays functional:
 *
 *   ?dock=on         the bottom rail grows like the macOS dock: bigger at
 *                    rest, chips magnify under the cursor, name label above
 *   ?portfolio=on    the Portfolio milestone EXTRACTED from the rail into its
 *                    own corner element (bottom-left; `=top` for top-left).
 *                    Clicking it clicks the real (hidden) rail button.
 *   ?home=cards      the city image hidden, plain base, the rail's own chips
 *                    laid out as cards — the scalable home for a focus with
 *                    no city. Cards click through to the real chips.
 *
 * No param → the script exits before touching anything; the plain URL stays
 * the honest reference.
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
  if (!WANT_DOCK && !WANT_PF && !WANT_CARDS) return;

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
  suppressFirstRun();

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

  /* ── ?dock=on — the macOS-dock treatment ──────────────────────────────── */
  function initDock(nav, rail) {
    // Bigger at rest: the ask verbatim — "grow in size like a MacBook dock at
    // the bottom so that it feels like it's important and it's big".
    rail.pill.style.transformOrigin = '50% 100%';
    rail.pill.style.transform = 'scale(1.45)';
    if (!REDUCE) rail.pill.style.transition = 'transform 420ms ' + EASE;

    if (REDUCE) return; // resting size only; no magnification

    // The base already grows the HOVERED chip into a labelled pill and opens
    // its own detail card — that behaviour stays untouched. What it lacks is
    // the dock feel: NEIGHBOURS swelling in proportion as the cursor travels.
    // So the gaussian here is deliberately gentle — it composes with the
    // base's own growth rather than competing with it.
    var buttons = Array.prototype.slice.call(
      rail.pill.querySelectorAll(':scope > div > button, :scope > button')
    );
    buttons.forEach(function (b) {
      b.style.transformOrigin = '50% 100%';
      var t = b.style.transition;
      b.style.transition = (t ? t + ', ' : '') + 'transform 160ms ' + EASE;
    });

    // Sigma in units of real chip pitch, so magnification feels identical at
    // any window scale — the canvas transform changes viewport px under us.
    function pitch() {
      var a = buttons[1] && buttons[1].getBoundingClientRect();
      var b = buttons[2] && buttons[2].getBoundingClientRect();
      return a && b ? Math.max(12, b.left - a.left) : 24;
    }

    var AMP = 0.55;
    nav.addEventListener('mousemove', function (e) {
      var sigma = pitch() * 2.1;
      buttons.forEach(function (b) {
        var r = b.getBoundingClientRect();
        var d = Math.abs(e.clientX - (r.left + r.width / 2));
        var s = 1 + AMP * Math.exp(-(d / sigma) * (d / sigma));
        b.style.transform = 'scale(' + s.toFixed(3) + ')';
      });
    });
    nav.addEventListener('mouseleave', function () {
      buttons.forEach(function (b) {
        b.style.transform = 'scale(1)';
      });
    });
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
      if (WANT_DOCK) initDock(nav, rail);
    } catch (err) {
      // An injection must never take the base down with it.
      console.warn('[nav-explorations] failed:', err);
    }
  }, 200);
})();
