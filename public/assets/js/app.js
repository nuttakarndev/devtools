/* ===== app.js — nav routing, theme toggle, toast, clipboard helpers ===== */
(function () {
  "use strict";

  var TOOLS = ["home", "base64", "url", "format", "textutils", "diff", "jwt", "hash", "regex", "uuid", "idcard", "timestamp"];

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  /* ---- Toast ---- */
  var toastEl = $("#toast");
  var toastTimer = null;
  window.showToast = function (msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("show"); }, 1600);
  };

  /* ---- Shared helpers reused across assets/js/tools/*.js (avoids duplicating these in every file) ---- */
  window.DT = {
    escapeHtml: function (s) {
      return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    },
    sortDeep: function sortDeep(value) {
      if (Array.isArray(value)) return value.map(sortDeep);
      if (value && typeof value === "object") {
        var out = {};
        Object.keys(value).sort().forEach(function (k) { out[k] = sortDeep(value[k]); });
        return out;
      }
      return value;
    },
    /* Returns a showError(msg) function bound to a given error <div>; pass "" / falsy to clear. */
    bindError: function (el) {
      return function (msg) {
        if (!msg) { el.classList.remove("show"); el.textContent = ""; return; }
        el.textContent = msg;
        el.classList.add("show");
      };
    }
  };

  /* ---- Clipboard ---- */
  window.copyText = function (text) {
    if (!text) { window.showToast("ไม่มีข้อความให้คัดลอก"); return; }
    var done = function () { window.showToast("คัดลอกแล้ว ✓"); };
    var fail = function () {
      try {
        var ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        done();
      } catch (e) {
        window.showToast("คัดลอกไม่สำเร็จ");
      }
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, fail);
    } else {
      fail();
    }
  };

  /* Event delegation so copy buttons injected later (dynamic tool results) work too */
  document.addEventListener("click", function (e) {
    var btn = e.target.closest ? e.target.closest(".copy-btn") : null;
    if (!btn) return;
    var sel = btn.getAttribute("data-copy");
    var target = sel && $(sel);
    if (!target) return;
    window.copyText(target.value);
    /* Brief green flash on the button itself. The label is left alone so the
       row never reflows, and the timer is per-button so rapid clicks on
       different buttons don't cancel each other. */
    btn.classList.add("copied");
    clearTimeout(btn._copiedTimer);
    btn._copiedTimer = setTimeout(function () { btn.classList.remove("copied"); }, 1000);
  });

  /* ---- Theme ---- */
  var html = document.documentElement;
  var themeBtn = $("#themeToggle");
  function applyTheme(t) {
    html.setAttribute("data-theme", t);
    if (themeBtn) themeBtn.textContent = t === "dark" ? "🌙" : "☀️";
    try { localStorage.setItem("devtools-theme", t); } catch (e) {}
  }
  (function initTheme() {
    var saved = null;
    try { saved = localStorage.getItem("devtools-theme"); } catch (e) {}
    if (saved === "light" || saved === "dark") {
      applyTheme(saved);
    } else {
      var prefersLight = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
      applyTheme(prefersLight ? "light" : "dark");
    }
  })();
  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      applyTheme(html.getAttribute("data-theme") === "dark" ? "light" : "dark");
    });
  }

  /* ---- Sidebar (mobile) ---- */
  var sidebar = $("#sidebar");
  var navToggle = $("#navToggle");
  var backdrop = $("#sidebarBackdrop");
  function closeSidebar() {
    if (!sidebar) return;
    sidebar.classList.remove("open");
    if (backdrop) backdrop.classList.remove("show");
    if (navToggle) navToggle.setAttribute("aria-expanded", "false");
  }
  if (navToggle) {
    navToggle.addEventListener("click", function () {
      var open = sidebar.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      if (backdrop) backdrop.classList.toggle("show", open);
    });
  }
  if (backdrop) backdrop.addEventListener("click", closeSidebar);
  $all(".nav-item").forEach(function (a) {
    a.addEventListener("click", closeSidebar);
  });

  /* ---- Router ---- */
  function showTool(name) {
    if (TOOLS.indexOf(name) === -1) name = TOOLS[0];
    TOOLS.forEach(function (t) {
      var panel = $("#panel-" + t);
      if (panel) panel.hidden = t !== name;
      var nav = $('.nav-item[data-tool="' + t + '"]');
      if (nav) nav.classList.toggle("active", t === name);
    });
    document.title = "DevTools Hub — " + name;
    var content = $("#content");
    if (content) content.scrollTop = 0;
  }

  function currentTool() {
    return (location.hash || "").replace("#", "") || TOOLS[0];
  }

  window.addEventListener("hashchange", function () { showTool(currentTool()); });
  showTool(currentTool());
})();
