/**
 * TenTen case study: GSAP reveals, Lottie corner mascots, surface flow videos
 * Scoped to .tenten-case-study (projects/tenten/)
 */
(function () {
  'use strict';

  var root = document.querySelector('.tenten-case-study');
  if (!root) return;

  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
  }

  var prefersReduced =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function cubicBezier(p1x, p1y, p2x, p2y) {
    var cx = 3 * p1x;
    var bx = 3 * (p2x - p1x) - cx;
    var ax = 1 - cx - bx;
    var cy = 3 * p1y;
    var by = 3 * (p2y - p1y) - cy;
    var ay = 1 - cy - by;

    function sampleCurveX(t) {
      return ((ax * t + bx) * t + cx) * t;
    }
    function sampleCurveY(t) {
      return ((ay * t + by) * t + cy) * t;
    }
    function sampleCurveDerivativeX(t) {
      return (3 * ax * t + 2 * bx) * t + cx;
    }
    function solveCurveX(x) {
      var t2 = x;
      for (var i = 0; i < 8; i++) {
        var x2 = sampleCurveX(t2) - x;
        if (Math.abs(x2) < 1e-6) return t2;
        var d2 = sampleCurveDerivativeX(t2);
        if (Math.abs(d2) < 1e-6) break;
        t2 = t2 - x2 / d2;
      }
      var t0 = 0;
      var t1 = 1;
      t2 = x;
      while (t0 < t1) {
        var x2b = sampleCurveX(t2);
        if (Math.abs(x2b - x) < 1e-6) return t2;
        if (x > x2b) t0 = t2;
        else t1 = t2;
        t2 = (t1 - t0) * 0.5 + t0;
      }
      return t2;
    }
    return function (p) {
      if (p <= 0) return 0;
      if (p >= 1) return 1;
      return sampleCurveY(solveCurveX(p));
    };
  }

  var easePremium = cubicBezier(0.16, 1, 0.3, 1);

  function lottieMount(el, containerClass) {
    var container = containerClass ? el.querySelector('.' + containerClass) : null;
    if (!container) {
      container = document.createElement('div');
      container.style.width = '100%';
      container.style.height = '100%';
      if (containerClass) container.className = containerClass;
      el.insertBefore(container, el.firstChild);
    }
    return container;
  }

  function initLottie(el, path, loop) {
    if (!window.lottie || prefersReduced) return null;
    var fallback = el.querySelector('.tenten-mascot-crest__fallback, .tenten-hero__mascot-fallback');
    if (fallback) fallback.hidden = true;
    var containerClass = el.classList.contains('tenten-mascot-crest') ? 'tenten-mascot-crest__lottie' : null;
    return window.lottie.loadAnimation({
      container: lottieMount(el, containerClass),
      renderer: 'svg',
      loop: loop !== false,
      autoplay: true,
      path: path
    });
  }

  function initHeroMascot() {
    var hero = root.querySelector('[data-tenten-hero-mascot]');
    if (!hero) return;
    var json = hero.getAttribute('data-lottie');
    if (!json) return;
    initLottie(hero, json, true);

    if (prefersReduced || !window.gsap) {
      hero.style.opacity = '';
      return;
    }

    gsap.set(hero, { x: 280, y: 0 });

    // X + fade: slide in from right
    gsap.to(hero, { x: 0, opacity: 1, duration: 1.0, ease: easePremium, delay: 0.15 });

    // Y: independent arc, rises slightly mid-flight then settles, creating the curve
    gsap.to(hero, {
      delay: 0.15,
      keyframes: [
        { y: -32, duration: 0.38, ease: 'sine.out' },
        { y: 0, duration: 0.62, ease: 'sine.in' }
      ]
    });
  }

  function revealLottieScroll(el, trigger, fromVars, toVars, duration) {
    if (prefersReduced) return;
    var json = el.getAttribute('data-lottie');
    var anim = json ? initLottie(el, json, true) : null;
    var endVars = Object.assign({ opacity: 1, x: 0, y: 0 }, toVars || {});

    if (window.gsap) {
      gsap.set(el, fromVars);
    }

    if (!window.gsap || !window.ScrollTrigger) {
      if (anim) anim.play();
      window.gsap && gsap.set(el, endVars);
      return;
    }

    ScrollTrigger.create({
      trigger: trigger || el,
      start: 'top 78%',
      once: true,
      onEnter: function () {
        gsap.to(el, Object.assign({
          duration: duration || 0.75,
          ease: easePremium,
          onStart: function () {
            if (anim) anim.play();
          }
        }, endVars));
      }
    });
  }

  function initMascotCrests() {
    var crests = root.querySelectorAll('.tenten-mascot-crest[data-lottie]');
    if (!crests.length) return;

    crests.forEach(function (crest) {
      var isSolution = crest.classList.contains('tenten-mascot-crest--solution');
      var crestPose = isSolution
        ? { rotation: 14, transformOrigin: '45% 72%' }
        : { rotation: -14, transformOrigin: '55% 72%' };
      var fromX = isSolution ? 18 : -18;

      revealLottieScroll(
        crest,
        crest.closest('.tenten-problem-stage, .tenten-solution-stage, .tenten-work-card-stage, .tenten-usage-chart-stage') || crest,
        Object.assign({ opacity: 0, x: fromX, y: 90 }, crestPose),
        crestPose,
        1.1
      );
    });
  }

  function initScrollReveals() {
    if (prefersReduced || !window.gsap || !window.ScrollTrigger) return;

    var reveals = root.querySelectorAll('[data-tenten-reveal]');
    if (!reveals.length) return;

    ScrollTrigger.batch(reveals, {
      start: 'top 82%',
      once: true,
      onEnter: function (batch) {
        gsap.fromTo(
          batch,
          { opacity: 0, y: 28 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: easePremium,
            stagger: 0.08,
            clearProps: 'transform'
          }
        );
      }
    });

    var heroItems = root.querySelectorAll(
      '.tenten-hero__mascot, .tenten-hero__title, .tenten-hero__lead, .tenten-hero__rule, .tenten-hero__meta, .tenten-hero__actions'
    );
    if (heroItems.length) {
      gsap.fromTo(
        heroItems,
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.85,
          ease: easePremium,
          stagger: 0.1,
          delay: 0.08,
          clearProps: 'transform'
        }
      );
    }
  }

  function formatStat(n, decimals) {
    if (typeof decimals === 'number' && !isNaN(decimals) && decimals > 0) {
      return n.toFixed(decimals).replace(/\.0+$/, '');
    }
    if (n >= 1000) {
      var k = n / 1000;
      if (k >= 100) return Math.round(k) + 'K';
      if (k === Math.floor(k)) return Math.floor(k) + 'K';
      return k.toFixed(1).replace(/\.0$/, '') + 'K';
    }
    if (n === Math.floor(n)) return String(Math.floor(n));
    return String(Math.round(n));
  }

  function initStatCounters() {
    if (!window.gsap || !window.ScrollTrigger) return;
    var stats = root.querySelectorAll('[data-count]');
    if (!stats.length) return;

    stats.forEach(function (el) {
      var target = parseFloat(el.getAttribute('data-count'));
      var suffix = el.getAttribute('data-suffix') || '';
      var prefix = el.getAttribute('data-prefix') || '';
      var decimals = parseInt(el.getAttribute('data-decimals'), 10);
      if (isNaN(target)) return;

      var obj = { val: 0 };
      ScrollTrigger.create({
        trigger: el.closest('.tenten-impact, .tenten-callout') || el,
        start: 'top 80%',
        once: true,
        onEnter: function () {
          if (prefersReduced) {
            el.textContent = prefix + formatStat(target, decimals) + suffix;
            return;
          }
          gsap.to(obj, {
            val: target,
            duration: 1.4,
            ease: 'power2.out',
            onUpdate: function () {
              el.textContent = prefix + formatStat(obj.val, decimals) + suffix;
            }
          });
        }
      });
    });
  }

  var USAGE_CHART_MAX = 70;

  function initUsageChart() {
    var section = root.querySelector('.tenten-usage-chart');
    if (!section) return;

    var bars = section.querySelectorAll('.tenten-usage-chart__bar');
    var values = section.querySelectorAll('.tenten-usage-chart__value');
    if (!bars.length) return;

    function barWidth(pct) {
      return (pct / USAGE_CHART_MAX) * 100 + '%';
    }

    function setFinalState() {
      bars.forEach(function (bar) {
        bar.style.width = barWidth(parseFloat(bar.getAttribute('data-pct')));
      });
      section.classList.add('is-chart-ready');
    }

    if (prefersReduced || !window.gsap || !window.ScrollTrigger) {
      setFinalState();
      return;
    }

    gsap.set(values, { opacity: 0 });

    var played = false;

    function playUsageChart() {
      if (played) return;
      played = true;
      bars.forEach(function (bar, index) {
        var pct = parseFloat(bar.getAttribute('data-pct'));
        gsap.to(bar, {
          width: barWidth(pct),
          duration: 1.1,
          delay: index * 0.07,
          ease: 'power2.out'
        });
      });
      gsap.to(values, {
        opacity: 1,
        duration: 0.5,
        delay: 0.35,
        stagger: 0.05,
        onComplete: function () {
          section.classList.add('is-chart-ready');
        }
      });
    }

    ScrollTrigger.create({
      trigger: section,
      start: 'top 78%',
      once: true,
      onEnter: playUsageChart
    });

    ScrollTrigger.refresh();
    if (ScrollTrigger.isInViewport(section, 0.22)) {
      playUsageChart();
    }
  }

  function initBackLink() {
    var back = root.querySelector('[data-case-study-back]');
    if (!back) return;
    back.addEventListener('click', function (e) {
      if (history.length < 2) return;
      try {
        var ref = document.referrer;
        if (!ref) return;
        var refUrl = new URL(ref);
        if (refUrl.origin !== location.origin) return;
        var path = refUrl.pathname.replace(/\/$/, '') || '/';
        if (path === '/' || path.endsWith('/index.html')) {
          e.preventDefault();
          history.back();
        }
      } catch (err) {
        /* use href */
      }
    });
  }

  function initSurfaceVideos(onLayoutChange) {
    var videos = root.querySelectorAll('.tenten-surface-card__video');
    if (!videos.length) return;

    var layoutQueued = false;
    function queueLayoutChange() {
      if (!onLayoutChange || layoutQueued) return;
      layoutQueued = true;
      requestAnimationFrame(function () {
        layoutQueued = false;
        onLayoutChange();
      });
    }

    videos.forEach(function (video) {
      if (prefersReduced) {
        video.removeAttribute('autoplay');
        video.pause();
        return;
      }

      function play() {
        var p = video.play();
        if (p && typeof p.catch === 'function') p.catch(function () {});
      }

      if (video.readyState >= 2) {
        play();
      } else {
        video.addEventListener(
          'loadeddata',
          function () {
            play();
            queueLayoutChange();
          },
          { once: true }
        );
      }
    });
  }

  function initSurfaceScrollReveals() {
    if (!window.gsap || !window.ScrollTrigger) return;

    var viewport = root.querySelector('.tenten-surfaces-viewport');
    var track = root.querySelector('.tenten-surfaces-grid');
    var cards = root.querySelectorAll('[data-tenten-surface-card]');
    if (!viewport || !track || cards.length < 2) return;

    var surfaceRevealX = 28;
    var surfacesSection = root.querySelector('.tenten-surfaces-section');

    var navClearance = 16;

    function getPinTop() {
      var header = document.getElementById('mh-header');
      if (!header) return 88 + navClearance;

      var hadStrict = header.classList.contains('nav-strict');
      if (!hadStrict) header.classList.add('nav-strict');
      var pinTop = Math.ceil(header.getBoundingClientRect().bottom) + navClearance;
      if (!hadStrict) header.classList.remove('nav-strict');
      return Math.max(72, pinTop);
    }

    function getSurfaceGap() {
      return parseFloat(getComputedStyle(viewport).getPropertyValue('--tenten-surface-gap')) || 20;
    }

    function getSurfaceViewportWidth() {
      var w = viewport.clientWidth;
      if (w > 0) return w;
      if (surfacesSection && surfacesSection.clientWidth > 0) return surfacesSection.clientWidth;
      return Math.min(window.innerWidth - 32, 1080);
    }

    function isSingleCardLayout() {
      if (window.innerWidth < 768) return true;
      var vw = getSurfaceViewportWidth();
      if (vw < 768) return true;
      return (vw - getSurfaceGap()) / 2 < 260;
    }

    function syncNavOffset() {
      if (!surfacesSection || isSingleCardLayout()) return;
      surfacesSection.style.setProperty('--tenten-nav-offset', getPinTop() + 'px');
    }

    function syncSurfaceLayout() {
      var vw = getSurfaceViewportWidth();
      if (!vw) return;

      syncNavOffset();
      var singleCard = isSingleCardLayout();
      var basis = singleCard ? Math.max(0, vw - 16) : Math.max(0, (vw - getSurfaceGap()) / 2);
      viewport.style.setProperty('--tenten-surface-card-basis', basis + 'px');
    }

    var dotsEl = null;

    function syncDots() {
      if (!dotsEl) return;
      var cardWidth = cards[0] ? cards[0].offsetWidth : 0;
      var gap = getSurfaceGap();
      var idx = Math.round(viewport.scrollLeft / (cardWidth + gap));
      dotsEl.querySelectorAll('.tenten-surface-dot').forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === idx);
      });
    }

    function ensureDots() {
      if (dotsEl) return;
      dotsEl = document.createElement('div');
      dotsEl.className = 'tenten-surface-dots';
      cards.forEach(function (_, i) {
        var dot = document.createElement('button');
        dot.className = 'tenten-surface-dot' + (i === 0 ? ' is-active' : '');
        dot.setAttribute('aria-label', 'Go to card ' + (i + 1));
        dot.addEventListener('click', function () {
          var cardWidth = cards[i] ? cards[i].offsetWidth : 0;
          viewport.scrollTo({ left: i * (cardWidth + getSurfaceGap()), behavior: 'smooth' });
        });
        dotsEl.appendChild(dot);
      });
      viewport.insertAdjacentElement('afterend', dotsEl);
      viewport.addEventListener('scroll', syncDots, { passive: true });
    }

    function removeDots() {
      if (!dotsEl) return;
      viewport.removeEventListener('scroll', syncDots);
      if (dotsEl.parentElement) dotsEl.parentElement.removeChild(dotsEl);
      dotsEl = null;
    }

    function setStripMode(enabled) {
      viewport.classList.toggle('tenten-surfaces-viewport--strip', enabled);
      if (enabled) ensureDots(); else removeDots();
    }

    function showAllSurfaceCards() {
      gsap.set(cards, { opacity: 1, x: 0, y: 0 });
    }

    function setPeekCards(progress) {
      if (isSingleCardLayout()) {
        showAllSurfaceCards();
        return;
      }

      if (progress == null) {
        if (cards[2]) gsap.set(cards[2], { opacity: 0.2, x: surfaceRevealX });
        if (cards[3]) gsap.set(cards[3], { opacity: 0.2, x: surfaceRevealX });
        return;
      }

      if (cards[2]) {
        var p3 = gsap.utils.clamp(0, 1, (progress - 0.08) / 0.4);
        gsap.set(cards[2], { opacity: 0.2 + p3 * 0.8, x: surfaceRevealX * (1 - p3) });
      }
      if (cards[3]) {
        var p4 = gsap.utils.clamp(0, 1, (progress - 0.38) / 0.4);
        gsap.set(cards[3], { opacity: 0.2 + p4 * 0.8, x: surfaceRevealX * (1 - p4) });
      }
    }

    function applySurfaceCardInitialState() {
      if (isSingleCardLayout()) {
        showAllSurfaceCards();
        return;
      }

      gsap.set(cards[0], { opacity: 0, y: 16 });
      gsap.set(cards[1], { opacity: 0.35, x: 20 });
      setPeekCards(null);
    }

    function trackShift() {
      return Math.max(0, track.scrollWidth - viewport.clientWidth);
    }

    function applyStaticSurfaceLayout() {
      syncSurfaceLayout();
      setStripMode(isSingleCardLayout());
    }

    if (prefersReduced) {
      gsap.set(track, { x: 0 });
      showAllSurfaceCards();
      applyStaticSurfaceLayout();

      var reducedResizeTimer;
      window.addEventListener('resize', function () {
        clearTimeout(reducedResizeTimer);
        reducedResizeTimer = setTimeout(applyStaticSurfaceLayout, 150);
      });

      return applyStaticSurfaceLayout;
    }

    applySurfaceCardInitialState();

    if (!isSingleCardLayout()) {
      ScrollTrigger.create({
        trigger: viewport,
        start: 'top 82%',
        once: true,
        onEnter: function () {
          gsap.to(cards[0], {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: easePremium,
            clearProps: 'transform'
          });
          gsap.to(cards[1], {
            opacity: 1,
            x: 0,
            duration: 0.75,
            ease: easePremium,
            delay: 0.08,
            clearProps: 'transform'
          });
        }
      });
    }

    var surfaceScrollTween = null;

    function resetSurfaceScroll() {
      gsap.set(track, { x: 0 });
      setPeekCards(null);
    }

    function releaseSurfacePin(hard) {
      viewport.classList.remove('is-surface-pinned');
      if (hard) {
        gsap.set(viewport, { clearProps: 'top,left,width,maxWidth,maxHeight,transform' });
      }
    }

    function collapseSurfacePinSpacer(st) {
      var spacer = (st && st.pinSpacer) || viewport.parentElement;
      if (!spacer || !spacer.classList.contains('pin-spacer')) return;
      spacer.style.paddingBottom = '0';
      spacer.style.minHeight = '';
    }

    function finishSurfaceScroll(st) {
      releaseSurfacePin(false);
      collapseSurfacePinSpacer(st);
      syncSurfaceLayout();
      gsap.set(track, { x: 0 });
      showAllSurfaceCards();
    }

    function reconcileSurfacePinState() {
      var st = surfaceScrollTween && surfaceScrollTween.scrollTrigger;
      if (!st || !st.isActive) {
        if (!st) {
          releaseSurfacePin(true);
          return;
        }

        releaseSurfacePin(false);
        if (window.scrollY >= st.end) {
          finishSurfaceScroll(st);
        } else if (window.scrollY <= st.start) {
          resetSurfaceScroll();
        }
        return;
      }

      syncSurfaceLayout();
      showAllSurfaceCards();
      viewport.classList.add('is-surface-pinned');
      setPeekCards(st.progress);
    }

    function buildSurfaceScroll() {
      if (surfaceScrollTween) {
        surfaceScrollTween.kill();
        surfaceScrollTween = null;
      }

      releaseSurfacePin(true);
      syncSurfaceLayout();
      showAllSurfaceCards();
      gsap.set(track, { clearProps: 'transform' });

      if (isSingleCardLayout()) {
        collapseSurfacePinSpacer(null);
        setStripMode(true);
        return;
      }

      setStripMode(false);

      if (!trackShift()) return;

      surfaceScrollTween = gsap.to(track, {
        x: function () {
          return -trackShift();
        },
        ease: 'none',
        scrollTrigger: {
          trigger: viewport,
          start: function () {
            syncSurfaceLayout();
            return 'top ' + getPinTop() + 'px';
          },
          end: function () {
            return '+=' + trackShift();
          },
          scrub: true,
          pin: viewport,
          pinSpacing: true,
          anticipatePin: 0,
          invalidateOnRefresh: true,
          onRefresh: function (self) {
            syncSurfaceLayout();
            if (!self.isActive) viewport.classList.remove('is-surface-pinned');
          },
          onToggle: function (self) {
            if (self.isActive) {
              syncSurfaceLayout();
              showAllSurfaceCards();
              viewport.classList.add('is-surface-pinned');
            } else {
              releaseSurfacePin(false);
            }
          },
          onUpdate: function (self) {
            setPeekCards(self.progress);
          },
          onLeave: function (self) {
            finishSurfaceScroll(self);
            requestAnimationFrame(function () {
              if (window.ScrollTrigger) ScrollTrigger.refresh();
            });
          },
          onLeaveBack: function () {
            releaseSurfacePin(false);
            resetSurfaceScroll();
          }
        }
      });
    }

    function rebuildSurfaceScroll() {
      buildSurfaceScroll();
      if (!window.ScrollTrigger) return;
      ScrollTrigger.refresh();
      if (!isSingleCardLayout()) {
        ScrollTrigger.update();
        reconcileSurfacePinState();
      }
    }

    rebuildSurfaceScroll();
    requestAnimationFrame(rebuildSurfaceScroll);

    var resizeTimer;
    window.addEventListener('load', rebuildSurfaceScroll);
    window.addEventListener('pageshow', function (event) {
      if (event.persisted) rebuildSurfaceScroll();
    });
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(rebuildSurfaceScroll, 150);
    });

    return rebuildSurfaceScroll;
  }

  initBackLink();
  initHeroMascot();
  initMascotCrests();
  var rebuildSurfaceScroll = initSurfaceScrollReveals();
  initSurfaceVideos(rebuildSurfaceScroll);
  initScrollReveals();
  initStatCounters();
  initUsageChart();
})();
