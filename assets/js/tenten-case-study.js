/**
 * TenTen case study — GSAP reveals, Lottie corner mascots, surface flow videos
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

  function lottieMount(el) {
    var mountClass = el.classList.contains('tenten-mascot-peek')
      ? 'tenten-mascot-peek__lottie'
      : el.classList.contains('tenten-mascot-crest')
        ? 'tenten-mascot-crest__lottie'
        : null;
    var container = mountClass ? el.querySelector('.' + mountClass) : null;
    if (!container) {
      container = document.createElement('div');
      container.style.width = '100%';
      container.style.height = '100%';
      if (mountClass) container.className = mountClass;
      el.insertBefore(container, el.firstChild);
    }
    return container;
  }

  function initLottie(el, path, loop) {
    if (!window.lottie || prefersReduced) return null;
    var fallback = el.querySelector(
      el.classList.contains('tenten-mascot-peek')
        ? '.tenten-mascot-peek__fallback'
        : el.classList.contains('tenten-mascot-crest')
          ? '.tenten-mascot-crest__fallback'
          : '.tenten-hero__mascot-fallback'
    );
    if (fallback) fallback.hidden = true;
    return window.lottie.loadAnimation({
      container: lottieMount(el),
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
  }

  function peekOffset(corner) {
    return corner === 'bl' ? { x: -40, y: 40 } : { x: 40, y: 40 };
  }

  function revealLottieScroll(el, trigger, fromVars, toVars) {
    if (prefersReduced) return;
    var json = el.getAttribute('data-lottie');
    var anim = json ? initLottie(el, json, true) : null;
    var endVars = Object.assign({ opacity: 1, scale: 1, x: 0, y: 0 }, toVars || {});

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
          duration: 0.75,
          ease: easePremium,
          onStart: function () {
            if (anim) anim.play();
          }
        }, endVars));
      }
    });
  }

  function initProblemCrest() {
    var crest = root.querySelector('.tenten-mascot-crest[data-lottie]');
    if (!crest) return;

    var crestPose = { rotation: -14, transformOrigin: '55% 72%' };
    revealLottieScroll(
      crest,
      crest.closest('.tenten-problem-stage') || crest,
      Object.assign({ opacity: 0, scale: 0.82, x: -18, y: -36 }, crestPose),
      crestPose
    );
  }

  function initMascotPeeks() {
    var peeks = root.querySelectorAll('.tenten-mascot-peek[data-lottie]');
    if (!peeks.length) return;

    peeks.forEach(function (peek) {
      var corner = peek.classList.contains('tenten-mascot-peek--bl') ? 'bl' : 'br';
      var off = peekOffset(corner);
      revealLottieScroll(
        peek,
        peek.closest('.tenten-callout') || peek,
        { opacity: 0, scale: 0.75, x: off.x, y: off.y }
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

  function initStatCounters() {
    if (!window.gsap || !window.ScrollTrigger) return;
    var stats = root.querySelectorAll('.tenten-stat__value[data-count]');
    if (!stats.length) return;

    stats.forEach(function (el) {
      var target = parseFloat(el.getAttribute('data-count'));
      var suffix = el.getAttribute('data-suffix') || '';
      var prefix = el.getAttribute('data-prefix') || '';
      if (isNaN(target)) return;

      var obj = { val: 0 };
      ScrollTrigger.create({
        trigger: el.closest('.tenten-stats') || el,
        start: 'top 80%',
        once: true,
        onEnter: function () {
          if (prefersReduced) {
            el.textContent = prefix + formatStat(target) + suffix;
            return;
          }
          gsap.to(obj, {
            val: target,
            duration: 1.4,
            ease: 'power2.out',
            onUpdate: function () {
              el.textContent = prefix + formatStat(obj.val) + suffix;
            }
          });
        }
      });
    });
  }

  function formatStat(n) {
    if (n >= 1000) {
      var k = n / 1000;
      if (k >= 100) return Math.round(k) + 'K';
      if (k === Math.floor(k)) return Math.floor(k) + 'K';
      return k.toFixed(1).replace(/\.0$/, '') + 'K';
    }
    if (n === Math.floor(n)) return String(Math.floor(n));
    return String(Math.round(n));
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

    function trackShift() {
      return Math.max(0, track.scrollWidth - viewport.clientWidth);
    }

    if (prefersReduced) {
      gsap.set(track, { x: 0 });
      gsap.set(cards, { opacity: 1 });
      return;
    }

    gsap.set(cards[0], { opacity: 0, y: 20 });
    gsap.set(cards[1], { opacity: 0.35, x: 40 });
    if (cards[2]) gsap.set(cards[2], { opacity: 0.2, x: 72 });
    if (cards[3]) gsap.set(cards[3], { opacity: 0.2, x: 72 });

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

    var surfacePinTrigger = null;

    function updateSurfaceCards(progress, distance) {
      gsap.set(track, { x: -(distance * progress) });

      if (cards[2]) {
        var p3 = gsap.utils.clamp(0, 1, (progress - 0.12) / 0.45);
        gsap.set(cards[2], { opacity: 0.2 + p3 * 0.8, x: 72 * (1 - p3) });
      }
      if (cards[3]) {
        var p4 = gsap.utils.clamp(0, 1, (progress - 0.42) / 0.45);
        gsap.set(cards[3], { opacity: 0.2 + p4 * 0.8, x: 72 * (1 - p4) });
      }
    }

    function buildSurfacePin() {
      if (surfacePinTrigger) {
        surfacePinTrigger.kill();
        surfacePinTrigger = null;
      }

      gsap.set(viewport, { clearProps: 'transform' });

      var distance = trackShift();
      if (!distance) return;

      surfacePinTrigger = ScrollTrigger.create({
        trigger: cards[0],
        start: 'bottom bottom',
        end: '+=' + distance,
        scrub: true,
        pin: viewport,
        pinSpacing: true,
        anticipatePin: 0,
        invalidateOnRefresh: false,
        onUpdate: function (self) {
          updateSurfaceCards(self.progress, distance);
        },
        onLeave: function () {
          updateSurfaceCards(1, distance);
          if (cards[2]) gsap.set(cards[2], { opacity: 1, x: 0 });
          if (cards[3]) gsap.set(cards[3], { opacity: 1, x: 0 });
        },
        onLeaveBack: function () {
          gsap.set(track, { x: 0 });
          if (cards[2]) gsap.set(cards[2], { opacity: 0.2, x: 72 });
          if (cards[3]) gsap.set(cards[3], { opacity: 0.2, x: 72 });
        }
      });
    }

    buildSurfacePin();

    var rebuildSurfacePin = function () {
      if (window.ScrollTrigger) ScrollTrigger.refresh();
      buildSurfacePin();
    };

    var resizeTimer;
    window.addEventListener('load', rebuildSurfacePin);
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(rebuildSurfacePin, 150);
    });

    return rebuildSurfacePin;
  }

  initBackLink();
  initHeroMascot();
  initProblemCrest();
  initMascotPeeks();
  var rebuildSurfacePin = initSurfaceScrollReveals();
  initSurfaceVideos(rebuildSurfacePin);
  initScrollReveals();
  initStatCounters();
})();
