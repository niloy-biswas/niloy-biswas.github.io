/**
 * Photography page — gallery manifest, masonry grid, scroll reveal, column parallax.
 *
 * Expects #photography-masonry (+ optional data-gallery) and photography/gallery.json.
 * Breakpoints align with assets/css/photography-page.css media queries.
 */
(function () {
  "use strict";

  var CONFIG = {
    masonryId: "photography-masonry",
    galleryUrl: "gallery.json",
    defaultBasePath: "../assets/images/photography/gallery",
    previewStorageKey: "photography-layout-preview",
    revealStaggerMs: 70,
    parallaxBase: 0.1,
    resizeDebounceMs: 150,
    breakpoints: {
      singleCol: 575,
      twoCol: 991,
    },
  };

  var prefersReduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var revealObserver = null;
  var userHasScrolled = false;
  var parallaxRaf = null;
  var parallaxContainer = null;
  var parallaxScrollBaseline = null;
  var galleryData = null;
  var resizeTimer = null;

  /* ---- Gallery manifest + grid ---- */

  function resolveGalleryUrl() {
    var container = document.getElementById(CONFIG.masonryId);
    if (container && container.dataset.gallery) {
      return container.dataset.gallery;
    }
    return CONFIG.galleryUrl;
  }

  function getColumnCount() {
    if (window.matchMedia("(max-width: " + CONFIG.breakpoints.singleCol + "px)").matches) {
      return 1;
    }
    if (window.matchMedia("(max-width: " + CONFIG.breakpoints.twoCol + "px)").matches) {
      return 2;
    }
    return 3;
  }

  function resolveColumn(image, colCount) {
    var col = parseInt(image.column, 10);
    if (!col || col < 1) return 1;
    if (colCount === 1) return 1;
    if (colCount === 2) return col === 3 ? 2 : Math.min(col, 2);
    return Math.min(col, 3);
  }

  function compareGridSlots(a, b) {
    if (a._row !== b._row) return a._row - b._row;
    if (a._sourceColumn !== b._sourceColumn) return a._sourceColumn - b._sourceColumn;
    return a._manifestIndex - b._manifestIndex;
  }

  function prepareImages(images, basePath, colCount) {
    return images.map(function (image, manifestIndex) {
      var item = Object.assign({}, image);
      if (!item.src && item.file) {
        item.src = basePath + "/" + item.file;
      }
      item._manifestIndex = manifestIndex;
      item._sourceColumn = parseInt(item.column, 10);
      if (!item._sourceColumn || item._sourceColumn < 1) {
        item._sourceColumn = 1;
      }
      item._column = resolveColumn(item, colCount);
      item._row = parseInt(item.row, 10);
      if (!item._row || item._row < 1) {
        item._row = manifestIndex + 1;
      }
      return item;
    });
  }

  function createItemElement(image) {
    var row = image._row || 1;
    var figure = document.createElement("figure");
    figure.className = "photography-masonry__item photography-reveal";
    figure.setAttribute("role", "listitem");
    figure.dataset.row = String(row);
    figure.style.setProperty("--reveal-delay", (row - 1) * CONFIG.revealStaggerMs + "ms");

    var img = document.createElement("img");
    img.src = image.src;
    img.alt = image.alt || "";
    img.loading = row <= 1 ? "eager" : "lazy";
    img.decoding = "async";

    img.addEventListener("load", function () {
      figure.classList.add("is-loaded");
    });

    img.addEventListener("error", function () {
      figure.remove();
    });

    if (img.complete && img.naturalWidth) {
      figure.classList.add("is-loaded");
    }

    figure.appendChild(img);
    return figure;
  }

  function buildColumns(container, images, basePath) {
    var colCount = getColumnCount();
    var columns = [];
    var buckets = [];
    var prepared = prepareImages(images, basePath, colCount);
    var c;
    var i;

    container.innerHTML = "";
    container.setAttribute("aria-busy", "false");

    for (c = 0; c < colCount; c++) {
      var colEl = document.createElement("div");
      colEl.className = "photography-masonry__col";
      colEl.dataset.parallaxCol = String(c + 1);
      colEl.setAttribute("role", "presentation");
      container.appendChild(colEl);
      columns.push(colEl);
      buckets.push([]);
    }

    prepared.forEach(function (item) {
      buckets[item._column - 1].push(item);
    });

    for (c = 0; c < colCount; c++) {
      buckets[c].sort(compareGridSlots);
      for (i = 0; i < buckets[c].length; i++) {
        columns[c].appendChild(createItemElement(buckets[c][i]));
      }
    }
  }

  function renderGallery(data, container) {
    var basePath = (data.basePath || CONFIG.defaultBasePath).replace(/\/$/, "");
    buildColumns(container, data.images || [], basePath);
  }

  function applyDraftPreview(data) {
    var params = new URLSearchParams(window.location.search);
    if (params.get("preview") !== "draft") return data;

    try {
      var draft = sessionStorage.getItem(CONFIG.previewStorageKey);
      if (draft) return JSON.parse(draft);
    } catch (previewErr) {
      console.warn("[photography-page] Draft preview unavailable", previewErr);
    }

    return data;
  }

  /* ---- Scroll reveal ---- */

  function initScrollReveal(root) {
    if (revealObserver) {
      revealObserver.disconnect();
      revealObserver = null;
    }

    var items = root.querySelectorAll(".photography-reveal");
    if (!items.length) return;

    if (prefersReduced || !("IntersectionObserver" in window)) {
      items.forEach(function (el) {
        el.classList.add("is-visible");
      });
      return;
    }

    function isNearViewport(el, margin) {
      var rect = el.getBoundingClientRect();
      var viewH = window.innerHeight || document.documentElement.clientHeight;
      return rect.top < viewH + margin && rect.bottom > -margin;
    }

    function revealRow(row, triggerEl) {
      root.querySelectorAll('.photography-reveal[data-row="' + row + '"]').forEach(function (el) {
        var shouldReveal = el === triggerEl || isNearViewport(el, 120);
        if (shouldReveal && !el.classList.contains("is-visible")) {
          if (userHasScrolled) {
            el.style.setProperty("--reveal-delay", "0ms");
          }
          el.classList.add("is-visible");
        }
        if (el.classList.contains("is-visible")) {
          revealObserver.unobserve(el);
        }
      });
    }

    revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;

          var row = entry.target.dataset.row;
          if (row) {
            revealRow(row, entry.target);
            return;
          }

          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        });
      },
      { root: null, rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );

    items.forEach(function (el) {
      revealObserver.observe(el);
    });
  }

  /* ---- Column parallax ---- */

  function getColumnParallaxSpeeds(colCount) {
    if (colCount === 1) return [1];
    if (colCount === 2) return [1, 1.8];
    return [1, 1.3, 2];
  }

  function resetColumnParallax(container) {
    container.querySelectorAll(".photography-masonry__col").forEach(function (col) {
      col.style.transform = "";
    });
    container.style.marginBottom = "";

    var gallery = container.closest(".photography-page__gallery");
    if (gallery) gallery.style.marginBottom = "";

    container.classList.remove("photography-masonry--parallax");
  }

  function updateColumnParallax(container) {
    if (prefersReduced) {
      resetColumnParallax(container);
      return;
    }

    var colCount = getColumnCount();
    var cols = container.querySelectorAll(".photography-masonry__col");
    if (colCount === 1 || cols.length < 2) {
      resetColumnParallax(container);
      return;
    }

    var scrollY = window.pageYOffset || document.documentElement.scrollTop;
    if (parallaxScrollBaseline === null) {
      parallaxScrollBaseline = scrollY;
    }

    var progress = Math.max(0, scrollY - parallaxScrollBaseline);
    var speeds = getColumnParallaxSpeeds(colCount);
    var maxLift = 0;

    container.classList.add("photography-masonry--parallax");

    cols.forEach(function (col, index) {
      var speed = speeds[index] || speeds[speeds.length - 1];
      var lift = progress * CONFIG.parallaxBase * speed;
      maxLift = Math.max(maxLift, lift);
      col.style.transform = "translate3d(0, " + (-lift).toFixed(2) + "px, 0)";
    });

    var gallery = container.closest(".photography-page__gallery");
    if (gallery) {
      gallery.style.marginBottom = maxLift > 0 ? (-maxLift).toFixed(2) + "px" : "";
    }
  }

  function scheduleColumnParallax() {
    if (!parallaxContainer || parallaxRaf) return;

    parallaxRaf = requestAnimationFrame(function () {
      parallaxRaf = null;
      updateColumnParallax(parallaxContainer);
    });
  }

  function initColumnParallax(container) {
    parallaxContainer = container;
    parallaxScrollBaseline = null;
    updateColumnParallax(container);
  }

  function onPageScroll() {
    userHasScrolled = true;
    scheduleColumnParallax();
  }

  /* ---- Lifecycle ---- */

  function refreshGallery(container) {
    if (!galleryData) return;

    renderGallery(galleryData, container);
    initScrollReveal(container);
    initColumnParallax(container);
  }

  function handleResize(container) {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      refreshGallery(container);
    }, CONFIG.resizeDebounceMs);
  }

  function showGalleryError(container, message) {
    container.removeAttribute("aria-busy");
    container.innerHTML =
      '<p class="photography-page__error">' + message + "</p>";
  }

  function init() {
    var container = document.getElementById(CONFIG.masonryId);
    if (!container) return;

    container.setAttribute("aria-busy", "true");
    window.addEventListener("scroll", onPageScroll, { passive: true });
    window.addEventListener("resize", function () {
      handleResize(container);
    });

    fetch(resolveGalleryUrl())
      .then(function (res) {
        if (!res.ok) throw new Error("Gallery manifest failed: " + res.status);
        return res.json();
      })
      .then(function (data) {
        galleryData = applyDraftPreview(data);
        refreshGallery(container);
      })
      .catch(function (err) {
        console.error("[photography-page]", err);
        showGalleryError(container, "Gallery could not be loaded.");
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
