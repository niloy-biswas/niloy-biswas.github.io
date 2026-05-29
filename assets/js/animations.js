/**
 * Premium motion system: GSAP + ScrollTrigger (static site).
 * Respects prefers-reduced-motion and disables hover motion on touch devices.
 */
(function () {
  "use strict";

  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  var prefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) {
    if (window.ServiceShowcase) {
      window.ServiceShowcase.init({ canHover: false });
    }
    return;
  }

  function cubicBezier(p1x, p1y, p2x, p2y) {
    // Minimal cubic-bezier easing for GSAP ease callback.
    // Adapted from common bezier implementations (Newton-Raphson + subdivision).
    var cx = 3 * p1x, bx = 3 * (p2x - p1x) - cx, ax = 1 - cx - bx;
    var cy = 3 * p1y, by = 3 * (p2y - p1y) - cy, ay = 1 - cy - by;

    function sampleCurveX(t) { return ((ax * t + bx) * t + cx) * t; }
    function sampleCurveY(t) { return ((ay * t + by) * t + cy) * t; }
    function sampleCurveDerivativeX(t) { return (3 * ax * t + 2 * bx) * t + cx; }

    function solveCurveX(x) {
      var t2 = x;
      for (var i = 0; i < 8; i++) {
        var x2 = sampleCurveX(t2) - x;
        if (Math.abs(x2) < 1e-6) return t2;
        var d2 = sampleCurveDerivativeX(t2);
        if (Math.abs(d2) < 1e-6) break;
        t2 = t2 - x2 / d2;
      }
      var t0 = 0, t1 = 1;
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

  var mm = gsap.matchMedia();

  function heroEntrance(distanceY) {
    var hero = document.querySelector("#mh-home");
    if (!hero) return;

    // Avoid navbar; target hero content only.
    var items = [
      ".mh-home .mh-promo",
      ".mh-home .mh-header-info h1",
      ".mh-home .mh-header-info h4",
      ".mh-home .mh-header-info > ul",
      ".mh-home .mh-header-info .social-icon",
      ".mh-home .hero-img"
    ]
      .map(function (sel) { return document.querySelector(sel); })
      .filter(Boolean);

    if (!items.length) return;

    gsap.set(items, { opacity: 0, y: distanceY });
    gsap.to(items, {
      opacity: 1,
      y: 0,
      duration: 0.9,
      ease: easePremium,
      stagger: 0.12,
      delay: 0.1,
      clearProps: "transform"
    });
  }

  function initStatCounters() {
    var grid = document.querySelector(".mh-quote-stats .stats-grid");
    if (!grid) return;

    var numbers = Array.prototype.slice.call(grid.querySelectorAll(".stat-number"));
    if (!numbers.length) return;

    function yearsSince(dateStr) {
      if (!dateStr) return null;
      var d = new Date(dateStr);
      if (isNaN(d.getTime())) return null;
      var now = new Date();
      var diffMs = now.getTime() - d.getTime();
      if (diffMs <= 0) return 0;
      // Use average tropical year length for stable year rollovers.
      return Math.floor(diffMs / (365.2425 * 24 * 60 * 60 * 1000));
    }

    function parseStat(text) {
      var t = (text || "").trim();
      if (t === "∞") return { type: "infinity" };

      // Examples: "4+", "100+", "10M+", "250K", "12"
      var m = t.match(/^(\d+)([a-zA-Z]+)?(\+)?$/);
      if (!m) return { type: "raw", raw: t };

      var value = parseInt(m[1], 10);
      var unit = m[2] || "";
      var plus = m[3] || "";
      return { type: "number", value: value, unit: unit, plus: plus };
    }

    function formatStat(val, meta) {
      return String(Math.round(val)) + (meta.unit || "") + (meta.plus || "");
    }

    function clamp(n, min, max) {
      return Math.max(min, Math.min(max, n));
    }

    function unitScale(unit) {
      // Used only for pacing (not for display).
      var u = (unit || "").toUpperCase();
      if (u === "K") return 1e3;
      if (u === "M") return 1e6;
      if (u === "B") return 1e9;
      return 1;
    }

    function counterDuration(meta) {
      // Make small numbers readable and large-unit numbers not feel instant.
      // Example: "4+" gets ~2.0s, "100+" ~2.2s, "10M+" ~2.6s (paced by unit scale).
      var effective = meta.value * unitScale(meta.unit);
      var d = 1.45 + Math.log10(effective + 1) * 0.28;
      return clamp(d, 1.8, 2.8);
    }

    ScrollTrigger.create({
      trigger: grid,
      start: "top 75%",
      once: true,
      onEnter: function () {
        numbers.forEach(function (el, idx) {
          // Dynamic: compute years since a start date (e.g. Oct 2021) so it updates automatically.
          // Usage: <span class="stat-number" data-years-since="2021-10-01">4+</span>
          if (el && el.dataset && el.dataset.yearsSince) {
            var y = yearsSince(el.dataset.yearsSince);
            if (typeof y === "number") {
              el.textContent = String(y) + "+";
            }
          }

          var meta = parseStat(el.textContent);

          // Special: count then swap to infinity (your choice).
          if (meta.type === "infinity") {
            var objInf = { v: 0 };
            gsap.to(objInf, {
              v: 180,
              duration: 1.6,
              ease: easePremium,
              delay: idx * 0.06,
              snap: { v: 1 },
              onUpdate: function () {
                el.textContent = String(objInf.v);
              },
              onComplete: function () {
                el.textContent = "∞";
              }
            });
            return;
          }

          if (meta.type !== "number") return;

          // Always count 0 → target, preserving unit/plus (e.g. "10M+", "100+", "4+").
          var obj = { v: 0 };
          gsap.to(obj, {
            v: meta.value,
            duration: counterDuration(meta),
            ease: easePremium,
            delay: idx * 0.06,
            snap: { v: 1 },
            onUpdate: function () {
              el.textContent = formatStat(obj.v, meta);
            },
            onComplete: function () {
              el.textContent = formatStat(meta.value, meta);
            }
          });
        });
      }
    });
  }

  function batchReveal(selector, options) {
    var els = document.querySelectorAll(selector);
    if (!els.length) return;

    ScrollTrigger.batch(els, {
      start: options.start || "top 70%",
      once: true,
      onEnter: function (batch) {
        gsap.fromTo(
          batch,
          { opacity: 0, x: options.fromX || 0, y: options.fromY || 0 },
          {
            opacity: 1,
            x: 0,
            y: 0,
            duration: options.duration || 0.7,
            ease: options.ease || easePremium,
            stagger: options.stagger || 0.1,
            clearProps: "transform"
          }
        );
      }
    });
  }

  function initServicesShowcaseEntrance(distanceX, distanceY) {
    var cards = Array.prototype.slice.call(
      document.querySelectorAll("#mh-services .services-showcase__card")
    );
    if (!cards.length) return;

    var fromStates = [
      { opacity: 0, x: -distanceX, y: 0 },
      { opacity: 0, x: 0, y: distanceY },
      { opacity: 0, x: distanceX, y: 0 }
    ];

    ScrollTrigger.batch(cards, {
      start: "top 70%",
      once: true,
      onEnter: function () {
        cards.forEach(function (card, i) {
          var from = fromStates[i] || fromStates[0];
          gsap.fromTo(
            card,
            from,
            {
              opacity: 1,
              x: 0,
              y: 0,
              duration: 0.8,
              ease: easePremium,
              delay: i * 0.1,
              onComplete: function () {
                gsap.set(card, { clearProps: "all" });
              }
            }
          );
        });
      }
    });
  }

  function initProjectHover() {
    var figures = Array.prototype.slice.call(
      document.querySelectorAll("#mh-portfolio .mh-project-gallery .grid-item figure")
    );
    if (!figures.length) return;

    figures.forEach(function (fig) {
      var isActive = false;

      function enter() {
        if (isActive) return;
        isActive = true;
        gsap.to(fig, {
          y: -4,
          duration: 0.22,
          ease: "power4.out",
          overwrite: true
        });
        gsap.to(fig, {
          borderColor: "var(--accent)",
          duration: 0.22,
          ease: "power3.out",
          overwrite: true
        });
      }

      function leave() {
        isActive = false;
        gsap.to(fig, {
          y: 0,
          duration: 0.22,
          ease: "power3.out",
          overwrite: true,
          clearProps: "transform"
        });
        gsap.to(fig, {
          borderColor: "",
          duration: 0.22,
          ease: "power3.out",
          overwrite: true,
          clearProps: "borderColor"
        });
      }

      fig.addEventListener("mouseenter", enter);
      fig.addEventListener("mouseleave", leave);
      fig.addEventListener("focusin", enter);
      fig.addEventListener("focusout", leave);
    });
  }

  function initSkillsCascade() {
    var section = document.querySelector("#mh-skills");
    if (!section) return;

    var pills = Array.prototype.slice.call(section.querySelectorAll(".sk-item"));
    if (!pills.length) return;

    var aiSet = new Set(["langchain", "langgraph", "rag", "pgvector", "cohere", "openai", "gemini"]);
    pills.forEach(function (pill) {
      var t = (pill.textContent || "").trim().toLowerCase();
      // Match full tokens inside the pill text.
      aiSet.forEach(function (k) {
        if (t.indexOf(k) !== -1) pill.classList.add("sk-item--ai");
      });
    });

    gsap.set(pills, { opacity: 0, scale: 0.85, transformOrigin: "50% 50%" });

    ScrollTrigger.create({
      trigger: section,
      start: "top 75%",
      once: true,
      onEnter: function () {
        gsap.to(pills, {
          opacity: 1,
          scale: 1,
          duration: 0.55,
          ease: easePremium,
          stagger: 0.04,
          clearProps: "transform"
        });
      }
    });
  }

  function initHeadingUnderline() {
    var titles = Array.prototype.slice.call(document.querySelectorAll(".section-title"));
    if (!titles.length) return;

    titles.forEach(function (t) {
      ScrollTrigger.create({
        trigger: t,
        start: "top 75%",
        once: true,
        onEnter: function () {
          t.classList.add("is-inview");
        }
      });
    });
  }

  function initExperienceReveal(distanceX) {
    batchReveal("#mh-experience .mh-education-item", {
      fromX: -distanceX,
      duration: 0.75,
      stagger: 0.1,
      ease: easePremium,
      start: "top 70%"
    });
  }

  mm.add(
    {
      // Mobile-ish: keep entrances but reduce distances.
      isMobile: "(max-width: 768px)",
      // Hover-capable devices only.
      canHover: "(hover: hover) and (pointer: fine)"
    },
    function (ctx) {
      var isMobile = !!ctx.conditions.isMobile;
      var canHover = !!ctx.conditions.canHover;

      heroEntrance(isMobile ? 12 : 28);
      initStatCounters();
      initExperienceReveal(isMobile ? 12 : 24);
      initServicesShowcaseEntrance(
        isMobile ? 12 : 28,
        isMobile ? 10 : 20
      );
      if (window.ServiceShowcase) {
        window.ServiceShowcase.init({
          ease: easePremium,
          canHover: canHover
        });
      }
      initSkillsCascade();
      initHeadingUnderline();

      if (canHover) {
        initProjectHover();
      }
    }
  );
})();

