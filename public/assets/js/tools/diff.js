/* ===== diff.js — Text / JSON / YAML diff viewer (uses jsdiff + js-yaml from CDN) ===== */
(function () {
  "use strict";
  var panel = document.getElementById("panel-diff");
  if (!panel) return;

  var $ = function (id) { return document.getElementById(id); };
  var aEl = $("diff-a");
  var bEl = $("diff-b");
  var errEl = $("diff-error");
  var statsEl = $("diff-stats");
  var outEl = $("diff-output");
  var sortKeysChk = $("diff-sortkeys");
  var modeWrap = $("diff-mode");
  var granWrap = $("diff-granularity");
  var mode = "text";
  var gran = "line";

  function showError(msg) {
    if (!msg) { errEl.classList.remove("show"); errEl.textContent = ""; return; }
    errEl.textContent = msg;
    errEl.classList.add("show");
  }

  function escapeHtml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function sortDeep(value) {
    if (Array.isArray(value)) return value.map(sortDeep);
    if (value && typeof value === "object") {
      var out = {};
      Object.keys(value).sort().forEach(function (k) { out[k] = sortDeep(value[k]); });
      return out;
    }
    return value;
  }

  function normalize(text, label) {
    if (mode === "text") return text;
    try {
      var obj = mode === "json" ? JSON.parse(text || "null") : window.jsyaml.load(text || "");
      if (sortKeysChk.checked) obj = sortDeep(obj);
      return JSON.stringify(obj, null, 2);
    } catch (e) {
      throw new Error(label + ": " + e.message);
    }
  }

  function renderLineDiff(parts) {
    var html = "", added = 0, removed = 0;
    parts.forEach(function (part) {
      var lines = part.value.split("\n");
      if (lines.length && lines[lines.length - 1] === "") lines.pop();
      lines.forEach(function (line) {
        var esc = escapeHtml(line) || " ";
        if (part.added) { added++; html += '<span class="d-add">+ ' + esc + "</span>\n"; }
        else if (part.removed) { removed++; html += '<span class="d-del">- ' + esc + "</span>\n"; }
        else { html += '<span class="d-ctx">&nbsp;&nbsp;' + esc + "</span>\n"; }
      });
    });
    return { html: html, added: added, removed: removed, unit: "บรรทัด" };
  }

  function renderInlineDiff(parts) {
    var html = "", added = 0, removed = 0;
    parts.forEach(function (part) {
      var esc = escapeHtml(part.value);
      if (part.added) { added += part.value.length; html += '<span class="d-add-inline">' + esc + "</span>"; }
      else if (part.removed) { removed += part.value.length; html += '<span class="d-del-inline">' + esc + "</span>"; }
      else { html += esc; }
    });
    return { html: html, added: added, removed: removed, unit: "ตัวอักษร" };
  }

  function compare() {
    showError("");
    var rawA = aEl.value, rawB = bEl.value;
    if (!rawA && !rawB) { outEl.innerHTML = ""; statsEl.textContent = ""; return; }
    var normA, normB;
    try {
      normA = normalize(rawA, "ต้นฉบับ (A)");
      normB = normalize(rawB, "แก้ไข (B)");
    } catch (e) {
      outEl.innerHTML = "";
      statsEl.textContent = "";
      showError(e.message);
      return;
    }

    var parts;
    if (gran === "word") parts = window.Diff.diffWords(normA, normB);
    else if (gran === "char") parts = window.Diff.diffChars(normA, normB);
    else parts = window.Diff.diffLines(normA, normB);

    var result = gran === "line" ? renderLineDiff(parts) : renderInlineDiff(parts);
    outEl.innerHTML = result.html || '<span class="d-ctx">ไม่มีความแตกต่าง</span>';
    statsEl.innerHTML = result.added === 0 && result.removed === 0
      ? "ไม่มีความแตกต่าง"
      : '<span class="add">+' + result.added + " " + result.unit + '</span> &nbsp; <span class="del">-' + result.removed + " " + result.unit + "</span>";
  }

  modeWrap.querySelectorAll(".seg-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      modeWrap.querySelectorAll(".seg-btn").forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      mode = btn.getAttribute("data-mode");
      compare();
    });
  });
  granWrap.querySelectorAll(".seg-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      granWrap.querySelectorAll(".seg-btn").forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      gran = btn.getAttribute("data-gran");
      compare();
    });
  });
  sortKeysChk.addEventListener("change", compare);

  panel.querySelector('[data-action="diff-clear"]').addEventListener("click", function () {
    aEl.value = "";
    bEl.value = "";
    outEl.innerHTML = "";
    statsEl.textContent = "";
    showError("");
  });

  var debounceTimer = null;
  [aEl, bEl].forEach(function (el) {
    el.addEventListener("input", function () {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(compare, 200);
    });
  });
})();
