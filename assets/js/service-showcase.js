/**
 * Service showcase — SVG chart animations & hover tooltips.
 * Requires GSAP + ScrollTrigger (loaded before this file).
 */
(function (global) {
  "use strict";

  var SEL = {
    card: ".services-showcase__card",
    viz: ".service-card__viz",
    tooltip: ".service-viz-tooltip",
    part: "[data-viz-part]",
    path: ".service-viz__edge, .service-viz__line",
    bar: ".service-viz__bar",
    node: ".service-viz__node, .service-viz__pipe",
    point: ".service-viz__point",
    area: ".service-viz__area",
    decor:
      ".service-viz__db-cap, .service-viz__db-body, .service-viz__gear, .service-viz__node-ring, " +
      ".service-viz__trigger-icon, .service-viz__trigger-bolt, .service-viz__agent-bot, " +
      ".service-viz__router-icon, .service-viz__action-dot, .service-viz__agent-title, " +
      ".service-viz__sat-label, .service-viz__port-label"
  };

  var HOVER_EASE = "power2.inOut";
  var SCROLL_EASE = "power3.out";

  var reduced = false;

  function prefersReduced() {
    return global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function getCards() {
    return Array.prototype.slice.call(document.querySelectorAll(SEL.card));
  }

  function getSvg(card) {
    return card.querySelector(".service-viz");
  }

  function pathLength(el) {
    return el && typeof el.getTotalLength === "function" ? el.getTotalLength() : 0;
  }

  function killTween(card) {
    if (card._vizTween) {
      card._vizTween.eventCallback("onInterrupt", null);
      card._vizTween.kill();
      card._vizTween = null;
    }
  }

  function finishViz(card) {
    var svg = getSvg(card);
    if (!svg || !global.gsap) return;

    killTween(card);

    var paths = svg.querySelectorAll(SEL.path);
    for (var i = 0; i < paths.length; i++) {
      paths[i].style.strokeDashoffset = "0";
    }

    global.gsap.set(svg.querySelectorAll(SEL.area), { opacity: 1 });
    global.gsap.set(svg.querySelectorAll(SEL.bar), { scaleY: 1, transformOrigin: "center bottom" });
    global.gsap.set(svg.querySelectorAll(SEL.node), { opacity: 1, scale: 1, transformOrigin: "center center" });
    global.gsap.set(svg.querySelectorAll(SEL.point), { opacity: 1, scale: 1, transformOrigin: "center center" });
    global.gsap.set(svg.querySelectorAll(SEL.decor), { opacity: 1 });

    card.dataset.vizDrawn = "1";
  }

  function cacheDashLengths(svg) {
    var paths = svg.querySelectorAll(SEL.path);
    for (var i = 0; i < paths.length; i++) {
      var len = pathLength(paths[i]);
      if (len > 0) paths[i].dataset.dashLength = String(len);
    }
  }

  function resetViz(card, silent) {
    var svg = getSvg(card);
    if (!svg || !global.gsap) return;

    if (!silent) killTween(card);

    var paths = svg.querySelectorAll(SEL.path);
    for (var i = 0; i < paths.length; i++) {
      var len = parseFloat(paths[i].dataset.dashLength) || pathLength(paths[i]);
      if (len > 0) {
        paths[i].style.strokeDasharray = len;
        paths[i].style.strokeDashoffset = len;
      }
    }

    global.gsap.set(svg.querySelectorAll(SEL.area), { opacity: 0 });
    global.gsap.set(svg.querySelectorAll(SEL.bar), { scaleY: 0, transformOrigin: "center bottom" });
    global.gsap.set(svg.querySelectorAll(SEL.node), { opacity: 0, scale: 0.88, transformOrigin: "center center" });
    global.gsap.set(svg.querySelectorAll(SEL.point), { opacity: 0, scale: 0, transformOrigin: "center center" });
    global.gsap.set(svg.querySelectorAll(SEL.decor), { opacity: 0 });
  }

  function playViz(card, config) {
    if (reduced) return null;

    config = config || {};
    var ease = config.ease || HOVER_EASE;
    var isHover = !!config.isHover;
    var pathDuration = config.pathDuration != null ? config.pathDuration : isHover ? 1.25 : 0.95;
    var barDuration = config.barDuration != null ? config.barDuration : isHover ? 0.85 : 0.55;

    var svg = getSvg(card);
    if (!svg || !global.gsap) return null;

    killTween(card);

    var paths = svg.querySelectorAll(SEL.path);
    var bars = svg.querySelectorAll(SEL.bar);
    var nodes = svg.querySelectorAll(SEL.node);
    var points = svg.querySelectorAll(SEL.point);
    var areas = svg.querySelectorAll(SEL.area);
    var decor = svg.querySelectorAll(SEL.decor);

    var tl = global.gsap.timeline({
      defaults: { ease: ease },
      onComplete: function () {
        card.dataset.vizDrawn = "1";
      },
      onInterrupt: function () {
        finishViz(card);
      }
    });
    card._vizTween = tl;

    var t = 0;

    if (paths.length) {
      tl.to(paths, { strokeDashoffset: 0, duration: pathDuration, stagger: 0.1 }, t);
      t += pathDuration * 0.4;
    }
    if (areas.length) {
      tl.to(areas, { opacity: 1, duration: pathDuration * 0.75 }, t - pathDuration * 0.15);
    }
    if (nodes.length) {
      tl.to(nodes, { opacity: 1, scale: 1, duration: isHover ? 0.55 : 0.45, stagger: 0.08 }, t);
      t += 0.25;
    }
    if (decor.length) {
      tl.to(decor, { opacity: 1, duration: 0.35, stagger: 0.02 }, t - 0.1);
    }
    if (bars.length) {
      tl.to(bars, { scaleY: 1, duration: barDuration, stagger: 0.09 }, t);
      t += barDuration * 0.45;
    }
    if (points.length) {
      tl.to(points, { opacity: 1, scale: 1, duration: 0.4, stagger: 0.1 }, t);
    }

    return tl;
  }

  function replayOnHover(card) {
    if (reduced) return;
    if (card._vizTween && card._vizTween.isActive()) return;
    killTween(card);
    resetViz(card, true);
    playViz(card, { ease: HOVER_EASE, isHover: true });
  }

  function bindSegmentHover(card, canHover) {
    var parts = card.querySelectorAll(SEL.part);
    parts.forEach(function (part) {
      var label = part.getAttribute("data-tooltip") || "";

      function activate() {
        card.querySelectorAll(".service-viz__part--active").forEach(function (el) {
          el.classList.remove("service-viz__part--active");
        });
        part.classList.add("service-viz__part--active");
        if (label) {
          var tip = card.querySelector(SEL.tooltip);
          if (tip) {
            tip.textContent = label;
            tip.classList.add("is-visible");
          }
        }
      }

      function deactivate() {
        part.classList.remove("service-viz__part--active");
        if (!card.classList.contains("is-hover")) {
          var tip = card.querySelector(SEL.tooltip);
          if (tip) tip.classList.remove("is-visible");
        }
      }

      part.addEventListener("mouseenter", activate);
      part.addEventListener("mouseleave", deactivate);

      if (!canHover) {
        part.addEventListener("click", function (e) {
          e.stopPropagation();
          if (part.classList.contains("service-viz__part--active")) {
            part.classList.remove("service-viz__part--active");
            var tip = card.querySelector(SEL.tooltip);
            if (tip) tip.classList.remove("is-visible");
          } else {
            activate();
          }
        });
      }
    });
  }

  function bindCardInteraction(card, canHover) {
    var viz = card.querySelector(SEL.viz);

    function clearHover() {
      card.classList.remove("is-hover");
      var tip = card.querySelector(SEL.tooltip);
      if (tip) tip.classList.remove("is-visible");
      card.querySelectorAll(".service-viz__part--active").forEach(function (el) {
        el.classList.remove("service-viz__part--active");
      });
    }

    function onVizEnter() {
      if (reduced) return;
      card.classList.add("is-hover");
      replayOnHover(card);
    }

    if (viz) {
      // Prevent click from focusing the card (which was re-triggering reset → blank).
      viz.addEventListener("mousedown", function (e) {
        e.preventDefault();
      });
      viz.addEventListener("mouseenter", onVizEnter);
    }

    card.addEventListener("mouseleave", clearHover);

    card.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onVizEnter();
      }
    });

    card.addEventListener("focusout", function (e) {
      if (!card.contains(e.relatedTarget)) clearHover();
    });

    if (!canHover) {
      card.addEventListener("click", function () {
        if (card.classList.toggle("is-active")) {
          replayOnHover(card);
        } else {
          clearHover();
          finishViz(card);
        }
      });
    }

    card.setAttribute("tabindex", "0");
  }

  function initScrollDraw(cards, scrollEase) {
    if (reduced) {
      cards.forEach(finishViz);
      return;
    }

    if (!global.ScrollTrigger) {
      cards.forEach(function (card) {
        resetViz(card, true);
        playViz(card, { ease: scrollEase, isHover: false });
      });
      return;
    }

    global.ScrollTrigger.batch(cards, {
      start: "top 72%",
      once: true,
      onEnter: function (batch) {
        batch.forEach(function (card, i) {
          if (card.dataset.vizDrawn === "1") return;
          global.gsap.delayedCall(i * 0.12, function () {
            resetViz(card, true);
            playViz(card, { ease: scrollEase, isHover: false });
          });
        });
      }
    });
  }

  function init(options) {
    if (!global.gsap) return;

    options = options || {};
    reduced = prefersReduced();

    var showcase = document.querySelector(".services-showcase");
    if (!showcase) return;

    if (reduced) showcase.classList.add("services-showcase--static");

    var cards = getCards();
    if (!cards.length) return;

    cards.forEach(function (card) {
      if (reduced) {
        finishViz(card);
      } else {
        cacheDashLengths(getSvg(card));
        resetViz(card, true);
      }
      bindSegmentHover(card, options.canHover !== false);
      bindCardInteraction(card, options.canHover !== false);
    });

    initScrollDraw(cards, options.ease || SCROLL_EASE);
  }

  function destroy() {
    getCards().forEach(killTween);
  }

  global.ServiceShowcase = { init: init, destroy: destroy };
})(typeof window !== "undefined" ? window : this);
