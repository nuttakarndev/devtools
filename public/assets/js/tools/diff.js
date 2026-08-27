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

  var showError = window.DT.bindError(errEl);
  var escapeHtml = window.DT.escapeHtml;
  var sortDeep = window.DT.sortDeep;

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

  var CONTEXT_KEEP = 3; /* unchanged lines to keep around each change before collapsing a long run */
  var CONTEXT_COLLAPSE_AT = 8; /* only collapse a run of unchanged lines longer than this */

  function splitLines(value) {
    var lines = value.split("\n");
    if (lines.length && lines[lines.length - 1] === "") lines.pop();
    return lines;
  }

  /* Renders a word-level sub-diff of one changed line, keeping only the
     "removed" side (mode="del") or the "added" side (mode="add") so a
     one-word edit reads as a highlighted word inside an otherwise-unchanged
     line instead of two unrelated-looking full-line blocks. */
  function renderWordDiffSide(wordParts, side) {
    var html = "";
    wordParts.forEach(function (p) {
      if (side === "del") {
        if (p.added) return;
        html += p.removed ? "<mark class=\"d-word-del\">" + escapeHtml(p.value) + "</mark>" : escapeHtml(p.value);
      } else {
        if (p.removed) return;
        html += p.added ? "<mark class=\"d-word-add\">" + escapeHtml(p.value) + "</mark>" : escapeHtml(p.value);
      }
    });
    return html || " ";
  }

  function renderLineDiff(parts) {
    var entries = []; /* {type:'ctx'|'add'|'del', html} */
    var added = 0, removed = 0;
    var i = 0;

    while (i < parts.length) {
      var part = parts[i];
      var next = parts[i + 1];

      if (part.removed && next && next.added) {
        /* A removed block immediately followed by an added block is almost
           always the same line(s) edited — pair them up and diff by word so
           only the actual change is highlighted, not the whole line. */
        var delLines = splitLines(part.value);
        var addLines = splitLines(next.value);
        var pairCount = Math.min(delLines.length, addLines.length);
        for (var p = 0; p < pairCount; p++) {
          var wordParts = window.Diff.diffWords(delLines[p], addLines[p]);
          entries.push({ type: "del", html: renderWordDiffSide(wordParts, "del") });
          entries.push({ type: "add", html: renderWordDiffSide(wordParts, "add") });
        }
        for (var d = pairCount; d < delLines.length; d++) entries.push({ type: "del", html: escapeHtml(delLines[d]) || " " });
        for (var a = pairCount; a < addLines.length; a++) entries.push({ type: "add", html: escapeHtml(addLines[a]) || " " });
        removed += delLines.length;
        added += addLines.length;
        i += 2;
        continue;
      }

      splitLines(part.value).forEach(function (line) {
        var esc = escapeHtml(line) || " ";
        if (part.added) { added++; entries.push({ type: "add", html: esc }); }
        else if (part.removed) { removed++; entries.push({ type: "del", html: esc }); }
        else { entries.push({ type: "ctx", html: esc }); }
      });
      i++;
    }

    /* Collapse long unchanged runs so changes far apart in a big document
       aren't separated by screenfuls of identical context. */
    var collapsed = [];
    var j = 0;
    while (j < entries.length) {
      if (entries[j].type !== "ctx") { collapsed.push(entries[j]); j++; continue; }
      var runStart = j;
      while (j < entries.length && entries[j].type === "ctx") j++;
      var runLen = j - runStart;
      if (runLen > CONTEXT_COLLAPSE_AT) {
        for (var k = runStart; k < runStart + CONTEXT_KEEP; k++) collapsed.push(entries[k]);
        collapsed.push({ type: "sep", count: runLen - 2 * CONTEXT_KEEP });
        for (var k2 = j - CONTEXT_KEEP; k2 < j; k2++) collapsed.push(entries[k2]);
      } else {
        for (var k3 = runStart; k3 < j; k3++) collapsed.push(entries[k3]);
      }
    }

    var html = collapsed.map(function (e) {
      if (e.type === "sep") return '<span class="d-sep">⋯ ข้ามบรรทัดที่เหมือนกัน ' + e.count + " บรรทัด ⋯</span>\n";
      if (e.type === "add") return '<span class="d-add">+ ' + e.html + "</span>\n";
      if (e.type === "del") return '<span class="d-del">- ' + e.html + "</span>\n";
      return '<span class="d-ctx">&nbsp;&nbsp;' + e.html + "</span>\n";
    }).join("");

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
