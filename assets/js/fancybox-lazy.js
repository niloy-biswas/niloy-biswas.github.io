/**
 * Loads Fancybox (CSS + JS) only when a [data-fancybox] link is near the
 * viewport or clicked. Fancybox binds its own delegated click handler on
 * `document` when its script executes, so grouping (data-fancybox="reviewer")
 * behaves exactly as before. Requires jQuery (loaded earlier, in order).
 */
(function () {
  "use strict";

  var script = document.currentScript;
  if (!script || !document.querySelector("[data-fancybox]")) return;

  var base = new URL("../plugins/", script.src);
  var state = "idle"; // idle | loading | ready | failed
  var waiting = [];

  function flush() {
    var queue = waiting;
    waiting = [];
    queue.forEach(function (fn) { fn(); });
  }

  function load() {
    if (state !== "idle") return;
    state = "loading";

    var pending = 2;
    var jsOk = false;
    function settle() {
      if (--pending) return;
      state = jsOk ? "ready" : "failed";
      flush();
    }

    var css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = new URL("css/jquery.fancybox.min.css", base).href;
    css.onload = css.onerror = settle;
    document.head.appendChild(css);

    var js = document.createElement("script");
    js.src = new URL("js/jquery.fancybox.min.js", base).href;
    js.onload = function () { jsOk = true; settle(); };
    js.onerror = settle;
    document.head.appendChild(js);
  }

  // Click before the library is ready: hold the navigation, load, then replay.
  document.addEventListener("click", function (e) {
    if (state === "ready") return;
    var link = e.target.closest && e.target.closest("[data-fancybox]");
    if (!link) return;
    if (e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    e.preventDefault();
    e.stopPropagation();
    waiting.push(function () {
      if (state === "ready") link.click();
      else if (link.href) window.location.href = link.href; // fallback: open the image directly
    });
    load();
  }, true);

  // Warm up shortly before a gallery scrolls into view.
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      if (entries.some(function (en) { return en.isIntersecting; })) {
        io.disconnect();
        load();
      }
    }, { rootMargin: "800px 0px" });
    document.querySelectorAll("[data-fancybox]").forEach(function (el) { io.observe(el); });
  }
})();
