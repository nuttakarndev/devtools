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

  var CONTEXT_KEEP = 3; /* unchanged lines kept around each change — same as git's default -U3 */

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

  /* "@@ -aStart,aCount +bStart,bCount @@" over one hunk. A count of 1 is written
     without the count, and a side with no lines at all points at the line it
     follows — both exactly as git formats a unified diff header. */
  function hunkHeader(hunk) {
    var aStart = 0, bStart = 0, aCount = 0, bCount = 0;
    hunk.forEach(function (e) {
      if (e.type !== "add") { if (aCount === 0) aStart = e.aLine; aCount++; }
      if (e.type !== "del") { if (bCount === 0) bStart = e.bLine; bCount++; }
    });
    if (aCount === 0) aStart = hunk[0].aLine - 1;
    if (bCount === 0) bStart = hunk[0].bLine - 1;
    return "@@ -" + aStart + (aCount === 1 ? "" : "," + aCount) +
      " +" + bStart + (bCount === 1 ? "" : "," + bCount) + " @@";
  }

  function renderLineDiff(parts) {
    var entries = []; /* {type:'ctx'|'add'|'del', html, aLine, bLine} */
    var added = 0, removed = 0;
    var aNo = 1, bNo = 1;
    var i = 0;

    /* Entries are pushed in display order, so each one records the A/B line
       number it occupies and advances only the side(s) it consumes. */
    function push(type, html) {
      entries.push({ type: type, html: html, aLine: aNo, bLine: bNo });
      if (type !== "add") aNo++;
      if (type !== "del") bNo++;
    }

    while (i < parts.length) {
      var part = parts[i];
      var next = parts[i + 1];

      if (part.removed && next && next.added) {
        /* A removed block immediately followed by an added block is almost
           always the same line(s) edited — pair them up and diff by word so
           only the actual change is highlighted, not the whole line. git
           prints every "-" line before every "+" line, so the pairs are
           emitted in two passes instead of interleaved. */
        var delLines = splitLines(part.value);
        var addLines = splitLines(next.value);
        var pairCount = Math.min(delLines.length, addLines.length);
        var wordDiffs = [];
        for (var p = 0; p < pairCount; p++) wordDiffs.push(window.Diff.diffWords(delLines[p], addLines[p]));
        for (var d = 0; d < delLines.length; d++) {
          push("del", d < pairCount ? renderWordDiffSide(wordDiffs[d], "del") : escapeHtml(delLines[d]) || " ");
        }
        for (var a = 0; a < addLines.length; a++) {
          push("add", a < pairCount ? renderWordDiffSide(wordDiffs[a], "add") : escapeHtml(addLines[a]) || " ");
        }
        removed += delLines.length;
        added += addLines.length;
        i += 2;
        continue;
      }

      splitLines(part.value).forEach(function (line) {
        var esc = escapeHtml(line) || " ";
        if (part.added) { added++; push("add", esc); }
        else if (part.removed) { removed++; push("del", esc); }
        else { push("ctx", esc); }
      });
      i++;
    }

    /* Keep only changed lines plus CONTEXT_KEEP unchanged lines around each,
       then group the surviving runs into hunks. Overlapping context merges on
       its own, so changes closer than 2*CONTEXT_KEEP land in one hunk — the
       same grouping git produces. */
    var keep = [];
    entries.forEach(function (e, idx) {
      if (e.type === "ctx") return;
      var from = Math.max(0, idx - CONTEXT_KEEP);
      var to = Math.min(entries.length - 1, idx + CONTEXT_KEEP);
      for (var k = from; k <= to; k++) keep[k] = true;
    });

    var hunks = [];
    var j = 0;
    while (j < entries.length) {
      if (!keep[j]) { j++; continue; }
      var start = j;
      while (j < entries.length && keep[j]) j++;
      hunks.push(entries.slice(start, j));
    }

    var html = "";
    if (hunks.length) {
      html += '<span class="d-file">--- ต้นฉบับ (A)</span>\n<span class="d-file">+++ แก้ไข (B)</span>\n';
      hunks.forEach(function (hunk) {
        html += '<span class="d-hunk">' + hunkHeader(hunk) + "</span>\n";
        hunk.forEach(function (e) {
          if (e.type === "add") html += '<span class="d-add">+' + e.html + "</span>\n";
          else if (e.type === "del") html += '<span class="d-del">-' + e.html + "</span>\n";
          else html += '<span class="d-ctx"> ' + e.html + "</span>\n";
        });
      });
    }

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
