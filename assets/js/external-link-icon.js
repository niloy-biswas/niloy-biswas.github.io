/**
 * Injects the animated external-link SVG into .icon-external-link placeholders.
 * Inline SVG (not <use>) so CSS can animate .external-box / .external-arrow.
 */
(function () {
  "use strict";

  var MARKUP =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path class="external-box" d="M12 6h-6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>' +
    '<g class="external-arrow"><path d="M11 13l9-9"/><path d="M15 4h5v5"/></g></svg>';

  document.querySelectorAll(".icon-external-link").forEach(function (el) {
    if (!el.querySelector("svg")) {
      el.insertAdjacentHTML("beforeend", MARKUP);
    }
  });
})();
