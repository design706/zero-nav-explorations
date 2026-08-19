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

  /* ── ?dock=on — the macOS-dock treatment ────────────────────────────────
     REAL BOX SIZING, never `transform: scale()` on the pill.

     A transform was the first attempt and it was wrong twice over: it scales
     every DESCENDANT — including the hover detail card, which is an absolutely
     positioned child of each chip (`bottom-full … w-[318px]`) — and it does not
     reflow, so the painted box overflowed the rail's container and rode over
     the settings gear and the side icons.

     So the size lives in CSS on the chips' own geometry. Everything reflows:
     the pill grows around its content, stays centred inside the nav's own
     left/right-40px box, and the detail card keeps its authored 318px because
     nothing scales it any more.

     Geometry is driven by one custom property, `--nx-h`, defaulting to the
     resting size. Magnification then just writes that property per chip, so
     growth is real width/height and neighbours are PUSHED rather than
     overlapped — which is what the Mac dock actually does. It also survives
     React re-renders: React diffs the style properties it declares and leaves
     an unknown custom property alone, where a `style.height` write would be
     reverted on the next paint.

     Sized by MEASUREMENT, not by taste. The binding constraint is the rail's
     worst case — the segment hover-expanded on the longest category name
     ("Operational Efficiency & Cost Reduction") plus three company labels —
     against the settings gear at the bottom-left. Measured clearance there:

         chip 40px →  8px   too tight
         chip 36px → 28px   ← chosen
         chip 34px → 38px

     So 36px: a 1.38× bar that still clears every neighbour with room in the
     state that pushes hardest. */
  var DOCK_H = 36; // resting chip diameter, canvas px (base: 26)
  var DOCK_PEAK = 1.5; // dead-under-cursor multiplier

  function installDockCss() {
    var PILL = 'nav[aria-label$="timeline"] > div';
    var css = [
      /* The bar itself. Note the spacing is tightened, not inflated, relative
         to the icon growth: the constraint is the worst-case hover expansion
         against the gear and the compass, and close-packed icons is what the
         Mac dock actually looks like — the SIZE carries the significance, not
         the gaps. */
      PILL + '{padding:9px!important;gap:9px!important;}',
      /* segments: the category clusters */
      PILL + '>div{gap:6px!important;padding-left:9px!important;padding-right:9px!important;}',
      /* the connectors between clusters */
      PILL + '>span{width:14px!important;height:3px!important;}',
      /* chips. Height only — width follows the logo, so the base keeps owning
         the hover expansion (padding + label). The base's own height
         transition is dropped so magnification tracks the cursor exactly;
         padding/background/shadow keep theirs, so its hover still animates. */
      PILL +
        '>div>button{height:var(--nx-h,' +
        DOCK_H +
        'px)!important;transition:padding 420ms cubic-bezier(.32,.72,0,1),background-color 420ms cubic-bezier(.32,.72,0,1),box-shadow 420ms cubic-bezier(.32,.72,0,1)!important;}',
      /* the logo disc — `>span` only, so the detail card (a >div) is untouched */
      PILL +
        '>div>button>span:first-child{width:var(--nx-h,' +
        DOCK_H +
        'px)!important;height:var(--nx-h,' +
        DOCK_H +
        'px)!important;}',
      PILL +
        '>div>button>span:first-child>img{width:calc(var(--nx-h,' +
        DOCK_H +
        'px)*.66)!important;height:calc(var(--nx-h,' +
        DOCK_H +
        'px)*.66)!important;}',
      /* milestones (Portfolio / Job Portal) ride the same rhythm: 38 → 56 */
      PILL + '>button{height:50px!important;min-width:50px!important;}',
      PILL + '>button svg{width:25px!important;height:25px!important;}',
      /* labels: the base's type is sized for a 26px bar and reads small in a
         40px one. Nudged, not restyled — and scoped to the chips' own spans so
         the detail card's typography is left exactly as authored. */
      PILL + '>div>button>span{font-size:13px!important;}',
      PILL + '>button>span{font-size:13px!important;}',
    ].join('\n');
    var style = document.createElement('style');
    style.id = 'nx-dock-css';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function initDock(nav, rail) {
    installDockCss();
    if (REDUCE) return; // resting size only; no magnification

    var buttons = Array.prototype.slice.call(rail.pill.querySelectorAll(':scope > div > button'));

    // Sigma in units of real chip PITCH, so the falloff feels the same at any
    // window scale — the canvas transform changes viewport px under us. 2.4
    // pitches is wide enough that neighbours visibly participate (the dock
    // ripple) rather than one icon popping alone.
    function pitch() {
      var a = buttons[1] && buttons[1].getBoundingClientRect();
      var b = buttons[2] && buttons[2].getBoundingClientRect();
      return a && b ? Math.max(12, b.left - a.left) : 24;
    }

    var raf = null;
    var pending = null;

    function apply() {
      raf = null;
      if (pending == null) {
        buttons.forEach(function (b) {
          b.style.removeProperty('--nx-h');
        });
        return;
      }
      var sigma = pitch() * 2.4;
      buttons.forEach(function (b) {
        var r = b.getBoundingClientRect();
        var d = Math.abs(pending - (r.left + r.width / 2));
        var k = 1 + (DOCK_PEAK - 1) * Math.exp(-(d / sigma) * (d / sigma));
        b.style.setProperty('--nx-h', (DOCK_H * k).toFixed(1) + 'px');
      });
    }

    function schedule(x) {
      pending = x;
      if (raf == null) raf = requestAnimationFrame(apply);
    }

    // rAF-batched: one layout pass per frame however fast the cursor moves.
    nav.addEventListener('mousemove', function (e) {
      schedule(e.clientX);
    });
    nav.addEventListener('mouseleave', function () {
      schedule(null);
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
      }, WANT_DOCK ? 'On — click to restore' : 'Mac-dock size + magnify')
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
      if (WANT_DOCK) initDock(nav, rail);
    } catch (err) {
      // An injection must never take the base down with it.
      console.warn('[nav-explorations] failed:', err);
    }
  }, 200);
})();
