/**
 * Homepage beyond-data row — DotLottie (camera, pen) + animated SVG (flask).
 * Styles: .beyond-data in assets/css/styles.css
 */
import "https://cdn.jsdelivr.net/npm/@lottiefiles/dotlottie-wc@0.8.3/dist/dotlottie-wc.js";

var ICONS = {
  camera: {
    type: "dotlottie",
    src: "assets/lottie/beyond-data/Camera.lottie",
  },
  pen: {
    type: "dotlottie",
    src: "assets/lottie/beyond-data/pen-writing.lottie",
  },
  flask: {
    type: "svg",
    src: "assets/images/beyond-data/flask.svg",
  },
};

var prefersReduced =
  window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function getIconKey(el) {
  if (el.classList.contains("beyond-data__icon--pen")) return "pen";
  if (el.classList.contains("beyond-data__icon--flask")) return "flask";
  return "camera";
}

function mountDotLottie(el, src) {
  var player = document.createElement("dotlottie-wc");
  player.className = "beyond-data__dotlottie";
  player.setAttribute("src", src);
  player.setAttribute("loop", "");
  player.setAttribute("mode", "normal");
  player.setAttribute(
    "renderConfig",
    JSON.stringify({ devicePixelRatio: 2 })
  );
  if (!prefersReduced) {
    player.setAttribute("autoplay", "");
  }
  el.appendChild(player);
}

function mountSvg(el, path) {
  return fetch(path)
    .then(function (res) {
      if (!res.ok) throw new Error("SVG failed: " + res.status);
      return res.text();
    })
    .then(function (markup) {
      var wrap = document.createElement("span");
      wrap.className = "beyond-data__svg";
      wrap.innerHTML = markup;

      var svg = wrap.querySelector("svg");
      if (svg) {
        svg.removeAttribute("width");
        svg.removeAttribute("height");
        svg.setAttribute("aria-hidden", "true");
        svg.setAttribute("focusable", "false");
      }

      el.appendChild(wrap);
    })
    .catch(function (err) {
      console.warn("[beyond-data-icons]", err);
    });
}

function initIcon(el) {
  if (el.dataset.beyondDataReady === "true") return;

  var config = ICONS[getIconKey(el)];
  if (!config) return;

  el.dataset.beyondDataReady = "true";

  if (config.type === "dotlottie") {
    mountDotLottie(el, config.src);
    return;
  }

  mountSvg(el, config.src);
}

async function init() {
  var icons = document.querySelectorAll(".beyond-data__icon");
  if (!icons.length) return;

  var needsDotLottie = false;
  icons.forEach(function (el) {
    var config = ICONS[getIconKey(el)];
    if (config && config.type === "dotlottie") needsDotLottie = true;
  });

  if (needsDotLottie && !customElements.get("dotlottie-wc")) {
    await customElements.whenDefined("dotlottie-wc");
  }

  icons.forEach(initIcon);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", function () {
    init().catch(function (err) {
      console.warn("[beyond-data-icons]", err);
    });
  });
} else {
  init().catch(function (err) {
    console.warn("[beyond-data-icons]", err);
  });
}
