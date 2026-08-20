/**
 * Zero — first run. A VARIATION ON SANJAY'S NAV LAB, not a rebuild of it.
 *
 * This file is the only thing added to his deployed build. Everything the
 * learner ends up looking at — world map, HUD, scenario card, and the capsule
 * dock along the bottom — is his, untouched, still driven by his own bundle.
 * The flow plays on top and then gets out of the way.
 *
 * The roadmap it shows is lifted VERBATIM from zero-onboarding-mvp.html:
 * `CURRICULUM` (8 briefs, 12 weeks), its card markup, and its stylesheet. That
 * is deliberate and is the whole point of the brief — Dhruv asked for "the
 * exact roadmap that we designed for them in the first section of the
 * onboarding", so this shows that one, not the app's internal 16-scenario list.
 *
 * ── The morph ──────────────────────────────────────────────────────────────
 * The two ends rhyme, which is what makes it honest rather than decorative:
 *
 *   onboarding roadmap                 the dock
 *   ──────────────────                 ────────
 *   8 company briefs        ────────►  logos inside the category clusters
 *   "Your portfolio goes live"  ────►  the Portfolio milestone pill
 *   "The job portal opens"      ────►  the Job Portal milestone pill
 *   the vertical rail + segments ───►  the 8px connectors between clusters
 *
 * So the sheet does not close and a navbar does not appear. The company marks
 * fly out of the briefs into the dock, the two milestones land on the two pills
 * that were already there, and everything that was detail — problem statement,
 * manager, tools, "you hand in" — falls away, because that is the sheet's job
 * and not the dock's. What survives is the order and the two milestones.
 */
(function () {
  'use strict';

  var DOCK = 'nav[aria-label$="timeline"]';
  var REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function mk(tag, cls, txt) {
    var el = document.createElement(tag);
    if (cls) el.className = cls;
    if (txt != null) el.textContent = txt;
    return el;
  }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, REDUCE ? 0 : ms); }); }

  /* His dock mounts after the map and the fixtures resolve, so poll rather than
     assume. Without the dock there is nothing to morph into and the flow should
     stay out of the way entirely. */
  function waitForDock(timeout) {
    var t0 = Date.now();
    return new Promise(function (resolve) {
      (function poll() {
        var el = document.querySelector(DOCK);
        if (el && el.getBoundingClientRect().width > 0) return resolve(el);
        if (Date.now() - t0 > timeout) return resolve(null);
        setTimeout(poll, 250);
      })();
    });
  }

  /* ── The roadmap card, rebuilt from the onboarding prototype's own markup ──
     Same class names, same order, same strings. The stylesheet that paints it
     is that file's, lifted and scoped to #zfr. */
  function scCard(c) {
    var el = mk('div', 'mvsc open');
    var top = mk('div', 'mtop');
    var lg = mk('span', 'mlg'); lg.innerHTML = ZFR_LOGO[c.co] || '';
    top.appendChild(lg);
    top.appendChild(mk('span', 'mco', c.co));
    top.appendChild(mk('span', 'mwk', c.weeks + (c.weeks > 1 ? ' weeks' : ' week')));
    el.appendChild(top);
    el.appendChild(mk('div', 'mprob', c.prob));

    var body = mk('div', 'mvbody');
    var mg = mk('div', 'mmgr');
    var cl = mk('span', 'mavs');
    var ma = mk('span', 'ma');
    ma.innerHTML = '<img src="' + (MFACE[c.mgr[0]] || '') + '" alt="" onerror="this.remove()"><i>' +
      c.mgr[0].charAt(0) + '</i>';
    cl.appendChild(ma);
    if (c.team) TFACES.forEach(function (u) {
      var t = mk('span', 'ma'); t.innerHTML = '<img src="' + u + '" alt="">'; cl.appendChild(t);
    });
    mg.appendChild(cl);
    mg.appendChild(mk('span', null, 'with ' + c.mgr[0] +
      (c.team ? (' and ' + (c.her ? 'her' : 'his') + ' team') : (' · ' + c.mgr[1]))));
    body.appendChild(mg);

    var row = mk('div', 'mrow2');
    c.tools.forEach(function (t) {
      var g = mk('span', 'mtag');
      if (ZFR_LOGO[t]) g.innerHTML = ZFR_LOGO[t] + '<span>' + t + '</span>'; else g.textContent = t;
      row.appendChild(g);
    });
    c.skills.forEach(function (s) { row.appendChild(mk('span', 'mtag sk', s)); });
    body.appendChild(row);

    if (c.deliver) {
      var d = mk('div', 'mvdel');
      d.innerHTML = '<b>You hand in</b> ' + c.deliver;
      body.appendChild(d);
    }
    el.appendChild(body);
    el._logo = lg;
    return el;
  }

  function unlockCard(u) {
    var el = mk('div', 'mvunlock');
    el.innerHTML = '<span class="mvuico">' + u[0] + '</span>' +
      '<span class="mvutx"><b>' + u[1] + '</b><i>' + u[2] + '</i></span>';
    el._logo = el.querySelector('.mvuico');
    return el;
  }

  /* ── Build ──────────────────────────────────────────────────────────────── */
  var root, scrim, stage, rowsHost, cards = [];

  function buildJourney() {
    var totW = CURRICULUM.reduce(function (a, c) { return a + c.weeks; }, 0);
    var wrap = mk('div', 'rmwrap');
    wrap.style.cssText =
      'width:min(760px,92vw);max-height:66vh;overflow:auto;background:#f4f2ef;' +
      'border-radius:26px;padding:4px 22px 22px;box-shadow:0 40px 110px rgba(0,0,0,.55);';
    var head = mk('div', 'rmhead sticky');
    head.innerHTML = '<span class="rmtitle">Your journey</span>' +
      '<span class="rmweeks">' + ZFR_CLOCK + ' ' + totW + ' weeks to build</span>' +
      '<span class="rmfade"></span>';
    wrap.appendChild(head);
    rowsHost = mk('div', 'rmrows');
    wrap.appendChild(rowsHost);

    var wk = 1;
    CURRICULUM.forEach(function (c) {
      var w0 = wk, w1 = wk + c.weeks - 1; wk += c.weeks;
      var row = mk('div', 'rmrow on done');
      row.innerHTML = '<div class="rmrail"><span class="rmnode"></span><i class="rmseg"><b></b></i>' +
        '<span class="rmwk">' + (w0 === w1 ? ('Week ' + w0) : ('Weeks ' + w0 + '–' + w1)) + '</span></div>';
      var slot = mk('div', 'rmslot');
      var card = scCard(c);
      slot.appendChild(card);
      cards.push({ el: card, kind: 'co' });
      row.appendChild(slot);
      rowsHost.appendChild(row);

      /* The portfolio unlock is authored INSIDE Notion's entry in CURRICULUM,
         so it renders where the prototype puts it — right after that brief. */
      if (c.unlock) {
        var ur = mk('div', 'rmrow on done');
        ur.innerHTML = '<div class="rmrail"><span class="rmnode"></span><i class="rmseg"><b></b></i>' +
          '<span class="rmwk">Unlock</span></div>';
        var us = mk('div', 'rmslot');
        var uc = unlockCard(c.unlock);
        us.appendChild(uc);
        cards.push({ el: uc, kind: 'portfolio' });
        ur.appendChild(us);
        rowsHost.appendChild(ur);
      }
    });

    /* RM_FINALE — "every road ends at it". */
    var fr = mk('div', 'rmrow on done');
    fr.innerHTML = '<div class="rmrail"><span class="rmnode"></span><span class="rmwk">Unlock</span></div>';
    var fs = mk('div', 'rmslot');
    var fc = unlockCard(RM_FINALE);
    fc.classList.add('green');
    fs.appendChild(fc);
    cards.push({ el: fc, kind: 'jobportal' });
    fr.appendChild(fs);
    rowsHost.appendChild(fr);

    return wrap;
  }

  /* ── Morph targets ──────────────────────────────────────────────────────── */
  function dockTargets(dock) {
    var rail = dock.firstElementChild;
    var kids = [].slice.call(rail.children);
    var clusters = kids.filter(function (k) { return k.tagName !== 'SPAN' && !k.getAttribute('aria-label'); });
    var milestones = kids.filter(function (k) { return k.getAttribute('aria-label'); });
    var portfolio = milestones.find(function (m) { return /portfolio/i.test(m.getAttribute('aria-label')); });
    var jobportal = milestones.find(function (m) { return /job/i.test(m.getAttribute('aria-label')); });
    return { clusters: clusters, portfolio: portfolio, jobportal: jobportal };
  }

  function centre(el) {
    var b = el.getBoundingClientRect();
    return { x: b.left + b.width / 2, y: b.top + b.height / 2, w: b.width, h: b.height };
  }

  /* A portal-cloned mark, flown from the brief to its place on the dock. Cloned
     rather than moved so the sheet can keep dissolving behind it, and appended
     to <body> so no ancestor's overflow or transform can clip the path. */
  function fly(sourceEl, targetEl, delay) {
    var a = centre(sourceEl), b = centre(targetEl);
    var clone = sourceEl.cloneNode(true);
    var s = clone.style;
    s.position = 'fixed'; s.left = (a.x - a.w / 2) + 'px'; s.top = (a.y - a.h / 2) + 'px';
    s.width = a.w + 'px'; s.height = a.h + 'px'; s.margin = '0'; s.zIndex = '100000';
    s.pointerEvents = 'none';
    document.body.appendChild(clone);
    var scale = Math.max(0.28, Math.min(1, (b.h || 20) / (a.h || 20)));
    var anim = clone.animate([
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: 'translate(' + (b.x - a.x) + 'px,' + (b.y - a.y) + 'px) scale(' + scale + ')', opacity: 0.9 }
    ], {
      duration: REDUCE ? 0 : 820, delay: REDUCE ? 0 : delay,
      easing: 'cubic-bezier(0.16,1,0.3,1)', fill: 'forwards'
    });
    anim.onfinish = function () {
      clone.animate([{ opacity: 0.9 }, { opacity: 0 }],
        { duration: REDUCE ? 0 : 220, fill: 'forwards' }).onfinish = function () { clone.remove(); };
    };
  }

  /* ── Beats ──────────────────────────────────────────────────────────────── */
  function setBeat(b) { root.dataset.beat = b; document.documentElement.dataset.zfrBeat = b; }

  async function morph(dock) {
    setBeat('morph');
    var t = dockTargets(dock);

    /* 1. The detail goes first, and fast. Problem statements, managers, tools,
          "you hand in", the week rail — none of it has a home on a 36px dock,
          and holding it while the marks travel makes the flight look like a
          screen sliding rather than a thing changing. */
    stage.classList.add('zfr-dissolve');
    await wait(300);

    /* 2. The marks fly. Companies spread across the category clusters in
          journey order; the two milestones land on the two pills that were
          already sitting in the dock waiting for them. */
    var coCards = cards.filter(function (c) { return c.kind === 'co'; });
    coCards.forEach(function (c, i) {
      var target = t.clusters[Math.floor(i * t.clusters.length / coCards.length)] || t.clusters[0];
      if (c.el._logo && target) fly(c.el._logo, target, i * 55);
    });
    var pf = cards.find(function (c) { return c.kind === 'portfolio'; });
    var jp = cards.find(function (c) { return c.kind === 'jobportal'; });
    if (pf && t.portfolio) fly(pf.el._logo, t.portfolio, coCards.length * 55);
    if (jp && t.jobportal) fly(jp.el._logo, t.jobportal, coCards.length * 55 + 90);

    /* 3. The sheet itself leaves while the marks are still in the air, so the
          dock is what they arrive onto rather than what replaces the sheet. */
    await wait(220);
    setBeat('landing');
    await wait(900);
    setBeat('settled');
    await wait(700);
    root.remove();
    delete document.documentElement.dataset.zfrBeat;
  }

  async function boot() {
    var dock = await waitForDock(30000);
    if (!dock) return;                       // no dock, no flow — leave his lab alone

    root = mk('div'); root.id = 'zfr';
    /* Structural geometry is set INLINE, not in the stylesheet.
       His bundle paints inside a transformed wrapper, which becomes the
       containing block for any `position: fixed` descendant — so a stylesheet
       `inset: 0` (and even an explicit 100vw/100vh) resolved to a zero-sized
       box while still computing as `position: fixed`. Inline styles sidestep
       the whole question: the overlay is sized against the viewport directly
       and cannot be reached by his cascade or ours. */
    root.style.cssText =
      'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:9000;' +
      'display:grid;place-items:center;';
    scrim = mk('div', 'zfr-scrim');
    scrim.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;';
    stage = mk('div', 'zfr-stage');
    stage.style.cssText =
      'position:relative;display:grid;place-items:center;' +
      'width:min(920px,92vw);max-height:88vh;';
    root.appendChild(scrim); root.appendChild(stage);
    document.body.appendChild(root);

    /* Beat 1 — welcome. Confirms the download landed and that what they were
       promised on the web followed them here. It does not explain the product;
       onboarding already did that. */
    var w = mk('div', 'zfr-welcome');
    w.innerHTML = '<span class="zfr-eyebrow">WELCOME TO ZERO</span>' +
      '<h1>You made it.</h1>' +
      '<p>We mapped a year of real work for you. Here it is.</p>';
    var b1 = mk('button', 'zfr-cta', 'Show me');
    w.appendChild(b1);
    stage.appendChild(w);
    setBeat('welcome');

    b1.onclick = function () {
      stage.innerHTML = '';
      var j = mk('div', 'zfr-journey');
      j.style.cssText = 'display:grid;justify-items:center;width:100%;';
      j.appendChild(buildJourney());
      var foot = mk('div', 'zfr-foot');
      foot.innerHTML = '<p>Real companies, real briefs, in the order that builds on itself.</p>';
      var b2 = mk('button', 'zfr-cta', "Let's begin");
      foot.appendChild(b2);
      j.appendChild(foot);
      stage.appendChild(j);
      setBeat('journey');
      b2.onclick = function () { morph(dock); };
    };
  }

  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', boot);
  else boot();
})();
