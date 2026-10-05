/**
 * HSEP case study: scroll reveals, stat counters, and chart draw-ins
 * Scoped to .hsep-case-study (projects/hsep/)
 */
(function () {
  'use strict';

  var root = document.querySelector('.hsep-case-study');
  if (!root) return;

  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
  }

  var prefersReduced =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function easeOut(p) {
    return 1 - Math.pow(1 - p, 3);
  }

  function animate(duration, onUpdate, onComplete) {
    if (prefersReduced) {
      onUpdate(1);
      if (onComplete) onComplete();
      return;
    }
    var start = null;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min(1, (ts - start) / duration);
      onUpdate(easeOut(p));
      if (p < 1) {
        requestAnimationFrame(step);
      } else if (onComplete) {
        onComplete();
      }
    }
    requestAnimationFrame(step);
  }

  function onceInView(el, cb) {
    if (!('IntersectionObserver' in window)) {
      cb();
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            cb();
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.35 }
    );
    io.observe(el);
  }

  function initScrollReveals() {
    var reveals = root.querySelectorAll('[data-hsep-reveal]');
    if (!reveals.length) return;

    if (prefersReduced || !window.gsap || !window.ScrollTrigger) {
      reveals.forEach(function (el) {
        el.style.opacity = '1';
      });
      return;
    }

    gsap.set(reveals, { opacity: 0, y: 24 });
    ScrollTrigger.batch(reveals, {
      start: 'top 85%',
      once: true,
      onEnter: function (batch) {
        gsap.to(batch, {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: 'power2.out',
          stagger: 0.08,
          clearProps: 'transform'
        });
      }
    });
  }

  function initStatCounters() {
    var stats = root.querySelectorAll('[data-count]');

    stats.forEach(function (el) {
      var target = parseFloat(el.getAttribute('data-count'));
      if (isNaN(target)) return;

      onceInView(el, function () {
        animate(1100, function (p) {
          el.textContent = Math.round(target * p).toLocaleString('en-US');
        });
      });
    });
  }

  function initCliffChart() {
    var chart = root.querySelector('.hsep-cliff__rows');
    if (!chart) return;
    var rows = chart.querySelectorAll('.hsep-cliff__row');
    var max = parseFloat(chart.getAttribute('data-max')) || 1;

    onceInView(chart, function () {
      rows.forEach(function (row, i) {
        var fill = row.querySelector('.hsep-cliff__row-fill');
        var valueEl = row.querySelector('.hsep-cliff__row-value');
        var value = parseFloat(row.getAttribute('data-value')) || 0;
        var pct = Math.max((value / max) * 100, value > 0 ? 2 : 1.5);

        setTimeout(function () {
          animate(700, function (p) {
            fill.style.width = (pct * p) + '%';
            if (valueEl) valueEl.textContent = Math.round(value * p);
          });
        }, i * 110);
      });
    });
  }

  function initLineChart() {
    var chart = root.querySelector('.hsep-linechart');
    if (!chart) return;
    var lines = chart.querySelectorAll('.hsep-linechart__line');
    var dots = chart.querySelectorAll('.hsep-linechart__dot');
    var labels = chart.querySelectorAll('.hsep-linechart__value-label');
    if (!lines.length) return;

    lines.forEach(function (line) {
      var len = line.getTotalLength();
      line.style.strokeDasharray = len;
      line.style.strokeDashoffset = len;
    });
    dots.forEach(function (dot) { dot.style.opacity = '0'; });
    labels.forEach(function (label) { label.style.opacity = '0'; });

    onceInView(chart, function () {
      lines.forEach(function (line) {
        var len = line.getTotalLength();
        animate(900, function (p) {
          line.style.strokeDashoffset = len * (1 - p);
        });
      });
      setTimeout(function () {
        dots.forEach(function (dot) { dot.style.transition = 'opacity 0.4s'; dot.style.opacity = '1'; });
        labels.forEach(function (label) { label.style.transition = 'opacity 0.4s'; label.style.opacity = '1'; });
      }, 900);
    });
  }

  function initBarChart() {
    var rows = root.querySelectorAll('.hsep-barchart__row');
    if (!rows.length) return;

    rows.forEach(function (row, i) {
      var fill = row.querySelector('.hsep-barchart__fill');
      var pct = parseFloat(fill.getAttribute('data-pct')) || 0;

      onceInView(row, function () {
        setTimeout(function () {
          animate(800, function (p) {
            fill.style.width = (pct * p) + '%';
          });
        }, i * 70);
      });
    });
  }

  function initPeerRing() {
    var ring = root.querySelector('.hsep-peer-stat__ring svg circle.hsep-peer-stat__ring-fg');
    if (!ring) return;
    var pct = parseFloat(ring.getAttribute('data-pct')) || 0;
    var r = parseFloat(ring.getAttribute('r'));
    var circumference = 2 * Math.PI * r;
    ring.style.strokeDasharray = circumference;
    ring.style.strokeDashoffset = circumference;

    onceInView(ring, function () {
      animate(1100, function (p) {
        ring.style.strokeDashoffset = circumference * (1 - (pct / 100) * p);
      });
    });
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

  initBackLink();
  initScrollReveals();
  initStatCounters();
  initCliffChart();
  initLineChart();
  initBarChart();
  initPeerRing();
})();
