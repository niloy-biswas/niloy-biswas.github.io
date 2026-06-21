/**
 * Photography gallery layout tool — drag tiles to swap column/row, export gallery.json.
 * Load from photography/layout.html or scripts/photography-gallery-layout/layout.html.
 * Config via #layout-grid data-gallery, data-base-path, data-preview-url, data-live-url.
 */
(function () {
  "use strict";

  var STORAGE_KEY = "photography-layout-draft";
  var PREVIEW_KEY = "photography-layout-preview";
  var COL_COUNT = 3;
  var MANIFEST_BASE_PATH = "../assets/images/photography/gallery";

  var config = {
    galleryUrl: "../../photography/gallery.json",
    basePath: "../../assets/images/photography/gallery",
    previewUrl: "../../photography/?preview=draft",
    liveUrl: "../../photography/",
  };

  var state = {
    basePath: config.basePath,
    images: [],
  };

  var dragFile = null;
  var gridEl = document.getElementById("layout-grid");
  var statusEl = document.getElementById("layout-status");

  function readConfig() {
    if (!gridEl) return;
    if (gridEl.dataset.gallery) config.galleryUrl = gridEl.dataset.gallery;
    if (gridEl.dataset.basePath) config.basePath = gridEl.dataset.basePath;
    if (gridEl.dataset.previewUrl) config.previewUrl = gridEl.dataset.previewUrl;
    if (gridEl.dataset.liveUrl) config.liveUrl = gridEl.dataset.liveUrl;
    state.basePath = config.basePath;
  }

  function setStatus(message, isSuccess) {
    if (!statusEl) return;
    statusEl.textContent = message || "";
    statusEl.classList.toggle("is-success", !!isSuccess);
  }

  function slotKey(column, row) {
    return column + "-" + row;
  }

  function normalizeImage(image, basePath) {
    var item = Object.assign({}, image);
    item.column = parseInt(item.column, 10) || 1;
    item.row = parseInt(item.row, 10) || 1;
    if (!item.src && item.file) {
      item.src = basePath.replace(/\/$/, "") + "/" + item.file;
    }
    return item;
  }

  function getMaxRow(images) {
    var max = 0;
    images.forEach(function (image) {
      if (image.row > max) max = image.row;
    });
    return max || 1;
  }

  function buildSlotMap(images) {
    var map = {};
    images.forEach(function (image) {
      map[slotKey(image.column, image.row)] = image;
    });
    return map;
  }

  function findImageByFile(file) {
    for (var i = 0; i < state.images.length; i++) {
      if (state.images[i].file === file) return state.images[i];
    }
    return null;
  }

  function swapImages(sourceFile, targetFile) {
    if (!sourceFile || !targetFile || sourceFile === targetFile) return;

    var source = findImageByFile(sourceFile);
    var target = findImageByFile(targetFile);
    if (!source || !target) return;

    var sourceCol = source.column;
    var sourceRow = source.row;
    source.column = target.column;
    source.row = target.row;
    target.column = sourceCol;
    target.row = sourceRow;

    saveDraft();
    renderGrid();
    setStatus("Swapped " + shortName(source.file) + " with " + shortName(target.file) + ".");
  }

  function shortName(file) {
    return String(file || "").replace(/\.[^.]+$/, "").replace(/-/g, " ");
  }

  function saveDraft() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ basePath: state.basePath, images: state.images })
      );
    } catch (err) {
      console.warn("[layout-tool] Could not save draft", err);
    }
  }

  function loadDraft() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (err) {
      return null;
    }
  }

  function clearDraft() {
    localStorage.removeItem(STORAGE_KEY);
  }

  function exportManifest() {
    var sorted = state.images.slice().sort(function (a, b) {
      if (a.row !== b.row) return a.row - b.row;
      if (a.column !== b.column) return a.column - b.column;
      return String(a.file).localeCompare(String(b.file));
    });

    var images = sorted.map(function (image) {
      return {
        file: image.file,
        column: image.column,
        row: image.row,
        alt: image.alt || "",
      };
    });

    return JSON.stringify(
      { basePath: MANIFEST_BASE_PATH, images: images },
      null,
      2
    );
  }

  function renderGrid() {
    if (!gridEl) return;

    var maxRow = getMaxRow(state.images);
    var slotMap = buildSlotMap(state.images);
    var col;
    var row;
    var html = "";

    for (col = 1; col <= COL_COUNT; col++) {
      html += '<div class="layout-tool__col" data-column="' + col + '">';
      for (row = 1; row <= maxRow; row++) {
        var image = slotMap[slotKey(col, row)];
        html += renderSlot(image, col, row);
      }
      html += "</div>";
    }

    gridEl.innerHTML = html;
    bindDragHandlers();
  }

  function renderSlot(image, column, row) {
    if (!image) {
      return (
        '<div class="layout-tool__slot layout-tool__slot--empty" data-column="' +
        column +
        '" data-row="' +
        row +
        '"></div>'
      );
    }

    return (
      '<div class="layout-tool__slot" data-column="' +
      column +
      '" data-row="' +
      row +
      '">' +
      '<figure class="layout-tool__tile" draggable="true" data-file="' +
      escapeAttr(image.file) +
      '">' +
      '<img src="' +
      escapeAttr(image.src) +
      '" alt="' +
      escapeAttr(image.alt || "") +
      '" loading="lazy" decoding="async">' +
      '<figcaption class="layout-tool__meta">' +
      '<span class="layout-tool__meta-name">' +
      escapeHtml(shortName(image.file)) +
      "</span>" +
      '<span class="layout-tool__meta-slot">C' +
      column +
      " R" +
      row +
      "</span>" +
      "</figcaption>" +
      "</figure>" +
      "</div>"
    );
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function escapeAttr(str) {
    return escapeHtml(str);
  }

  function bindDragHandlers() {
    var tiles = gridEl.querySelectorAll(".layout-tool__tile");
    var slots = gridEl.querySelectorAll(".layout-tool__slot");

    tiles.forEach(function (tile) {
      tile.addEventListener("dragstart", onDragStart);
      tile.addEventListener("dragend", onDragEnd);
    });

    slots.forEach(function (slot) {
      slot.addEventListener("dragover", onDragOver);
      slot.addEventListener("dragleave", onDragLeave);
      slot.addEventListener("drop", onDrop);
    });
  }

  function onDragStart(event) {
    var tile = event.currentTarget;
    dragFile = tile.getAttribute("data-file");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", dragFile);
    tile.closest(".layout-tool__slot").classList.add("is-dragging");
  }

  function onDragEnd(event) {
    var slot = event.currentTarget.closest(".layout-tool__slot");
    if (slot) slot.classList.remove("is-dragging");
    gridEl.querySelectorAll(".layout-tool__slot.is-drop-target").forEach(function (el) {
      el.classList.remove("is-drop-target");
    });
    dragFile = null;
  }

  function onDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    event.currentTarget.classList.add("is-drop-target");
  }

  function onDragLeave(event) {
    event.currentTarget.classList.remove("is-drop-target");
  }

  function onDrop(event) {
    event.preventDefault();
    var slot = event.currentTarget;
    slot.classList.remove("is-drop-target");

    var targetTile = slot.querySelector(".layout-tool__tile");
    if (!targetTile) return;

    var sourceFile = dragFile || event.dataTransfer.getData("text/plain");
    var targetFile = targetTile.getAttribute("data-file");
    swapImages(sourceFile, targetFile);
  }

  function applyData(data, fromDraft) {
    state.basePath = data.basePath || config.basePath;
    state.images = (data.images || []).map(function (image) {
      return normalizeImage(image, state.basePath);
    });
    renderGrid();
    setStatus(
      fromDraft
        ? "Restored your saved draft from this browser."
        : "Loaded gallery.json. Drag images to try new layouts."
    );
  }

  function initActions() {
    var liveLink = document.getElementById("layout-live-link");
    if (liveLink) liveLink.setAttribute("href", config.liveUrl);

    document.getElementById("layout-reset").addEventListener("click", function () {
      clearDraft();
      fetch(config.galleryUrl)
        .then(function (res) {
          if (!res.ok) throw new Error("Could not reload gallery.json");
          return res.json();
        })
        .then(function (data) {
          applyData(data, false);
          setStatus("Reset to gallery.json from the repo.");
        })
        .catch(function (err) {
          setStatus(err.message);
        });
    });

    document.getElementById("layout-copy").addEventListener("click", function () {
      var json = exportManifest();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(json).then(function () {
          setStatus("Copied gallery.json to clipboard.", true);
        });
      } else {
        window.prompt("Copy this JSON into photography/gallery.json:", json);
      }
    });

    document.getElementById("layout-download").addEventListener("click", function () {
      var json = exportManifest();
      var blob = new Blob([json], { type: "application/json" });
      var url = URL.createObjectURL(blob);
      var link = document.createElement("a");
      link.href = url;
      link.download = "gallery.json";
      link.click();
      URL.revokeObjectURL(url);
      setStatus("Downloaded gallery.json. Replace photography/gallery.json to publish.", true);
    });

    document.getElementById("layout-preview").addEventListener("click", function () {
      try {
        sessionStorage.setItem(PREVIEW_KEY, exportManifest());
        window.open(config.previewUrl, "_blank", "noopener");
        setStatus("Opened live page with your draft (preview tab only).", true);
      } catch (err) {
        setStatus("Could not open preview.");
      }
    });
  }

  function init() {
    readConfig();
    initActions();

    var draft = loadDraft();
    if (draft && draft.images && draft.images.length) {
      applyData(draft, true);
      return;
    }

    fetch(config.galleryUrl)
      .then(function (res) {
        if (!res.ok) throw new Error("Could not load gallery.json");
        return res.json();
      })
      .then(function (data) {
        applyData(data, false);
      })
      .catch(function (err) {
        if (gridEl) {
          gridEl.innerHTML =
            '<p class="layout-tool__hint">Could not load gallery.json. Open this page via your local server.</p>';
        }
        setStatus(err.message);
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
