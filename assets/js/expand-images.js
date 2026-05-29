/**
 * Toggle .expanded-images panels (one state per .expand-button).
 */
(function () {
  "use strict";

  function toggle(btn) {
    var panel = btn.nextElementSibling;
    if (!panel || !panel.classList.contains("expanded-images")) {
      return;
    }
    var open = btn.getAttribute("aria-expanded") === "true";
    btn.setAttribute("aria-expanded", open ? "false" : "true");
    if (open) {
      panel.setAttribute("hidden", "");
    } else {
      panel.removeAttribute("hidden");
    }
  }

  document.querySelectorAll(".expand-button").forEach(function (btn) {
    btn.setAttribute("role", "button");
    btn.setAttribute("tabindex", "0");
    btn.setAttribute("aria-expanded", "false");

    var panel = btn.nextElementSibling;
    if (panel && panel.classList.contains("expanded-images")) {
      panel.setAttribute("hidden", "");
    }

    btn.addEventListener("click", function () {
      toggle(btn);
    });

    btn.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggle(btn);
      }
    });
  });
})();
