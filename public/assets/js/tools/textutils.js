/* ===== textutils.js — Case converter + line utilities ===== */
(function () {
  "use strict";
  var panel = document.getElementById("panel-textutils");
  if (!panel) return;

  var $ = function (id) { return document.getElementById(id); };
  var inputEl = $("tu-input");
  var outputEl = $("tu-output");
  var caseSel = $("tu-case");
  var statsEl = $("tu-stats");

  function cap(w) { return w.charAt(0).toUpperCase() + w.slice(1); }

  function splitWords(str) {
    return str
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
      .replace(/[_\-]+/g, " ")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map(function (w) { return w.toLowerCase(); });
  }

  function convertLine(mode, line) {
    if (mode === "lower") return line.toLowerCase();
    if (mode === "upper") return line.toUpperCase();
    if (mode === "sentence") {
      var t = line.toLowerCase();
      return t.replace(/^(\s*)(\S)/, function (m, p1, p2) { return p1 + p2.toUpperCase(); });
    }
    var words = splitWords(line);
    if (!words.length) return "";
    switch (mode) {
      case "camel": return words.map(function (w, i) { return i === 0 ? w : cap(w); }).join("");
      case "pascal": return words.map(cap).join("");
      case "snake": return words.join("_");
      case "kebab": return words.join("-");
      case "constant": return words.join("_").toUpperCase();
      case "title": return words.map(cap).join(" ");
      default: return line;
    }
  }

  function applyCase() {
    var mode = caseSel.value;
    outputEl.value = inputEl.value.split("\n").map(function (line) { return convertLine(mode, line); }).join("\n");
  }

  function lineOp(fn) {
    var lines = inputEl.value.split("\n");
    outputEl.value = fn(lines).join("\n");
  }

  function updateStats() {
    var text = inputEl.value;
    var chars = text.length;
    var words = text.trim() ? text.trim().split(/\s+/).length : 0;
    var lines = text ? text.split("\n").length : 0;
    statsEl.textContent = "ตัวอักษร: " + chars + "  |  คำ: " + words + "  |  บรรทัด: " + lines;
  }

  panel.querySelector('[data-action="tu-apply-case"]').addEventListener("click", applyCase);
  panel.querySelector('[data-action="tu-trim"]').addEventListener("click", function () {
    lineOp(function (lines) { return lines.map(function (l) { return l.trim(); }); });
  });
  panel.querySelector('[data-action="tu-remove-empty"]').addEventListener("click", function () {
    lineOp(function (lines) { return lines.filter(function (l) { return l.trim() !== ""; }); });
  });
  panel.querySelector('[data-action="tu-dedupe"]').addEventListener("click", function () {
    lineOp(function (lines) {
      var seen = {};
      return lines.filter(function (l) {
        if (Object.prototype.hasOwnProperty.call(seen, l)) return false;
        seen[l] = true;
        return true;
      });
    });
  });
  panel.querySelector('[data-action="tu-sort-asc"]').addEventListener("click", function () {
    lineOp(function (lines) { return lines.slice().sort(function (a, b) { return a.localeCompare(b); }); });
  });
  panel.querySelector('[data-action="tu-sort-desc"]').addEventListener("click", function () {
    lineOp(function (lines) { return lines.slice().sort(function (a, b) { return b.localeCompare(a); }); });
  });
  panel.querySelector('[data-action="tu-reverse-lines"]').addEventListener("click", function () {
    lineOp(function (lines) { return lines.slice().reverse(); });
  });
  panel.querySelector('[data-action="tu-clear"]').addEventListener("click", function () {
    inputEl.value = "";
    outputEl.value = "";
    updateStats();
  });

  inputEl.addEventListener("input", updateStats);
  updateStats();
})();
