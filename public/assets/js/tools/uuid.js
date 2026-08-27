/* ===== uuid.js — UUID v4 generator ===== */
(function () {
  "use strict";
  var panel = document.getElementById("panel-uuid");
  if (!panel) return;

  var $ = function (id) { return document.getElementById(id); };
  var countEl = $("uuid-count");
  var upperEl = $("uuid-upper");
  var noHyphenEl = $("uuid-nohyphen");
  var outputEl = $("uuid-output");

  function uuidv4() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      try { return window.crypto.randomUUID(); } catch (e) { /* fall through */ }
    }
    var bytes = new Uint8Array(16);
    window.crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    var hex = "";
    for (var i = 0; i < bytes.length; i++) {
      var h = bytes[i].toString(16);
      hex += h.length === 1 ? "0" + h : h;
    }
    return hex.slice(0, 8) + "-" + hex.slice(8, 12) + "-" + hex.slice(12, 16) + "-" + hex.slice(16, 20) + "-" + hex.slice(20);
  }

  var lastRaw = [];

  function format(list) {
    return list.map(function (id) {
      if (noHyphenEl.checked) id = id.replace(/-/g, "");
      if (upperEl.checked) id = id.toUpperCase();
      return id;
    }).join("\n");
  }

  function generate() {
    var n = parseInt(countEl.value, 10);
    if (isNaN(n) || n < 1) n = 1;
    if (n > 200) n = 200;
    countEl.value = n;
    lastRaw = [];
    for (var i = 0; i < n; i++) lastRaw.push(uuidv4());
    outputEl.value = format(lastRaw);
  }

  panel.querySelector('[data-action="uuid-generate"]').addEventListener("click", generate);
  panel.querySelector('[data-action="uuid-clear"]').addEventListener("click", function () {
    outputEl.value = "";
    lastRaw = [];
  });
  upperEl.addEventListener("change", function () { if (lastRaw.length) outputEl.value = format(lastRaw); });
  noHyphenEl.addEventListener("change", function () { if (lastRaw.length) outputEl.value = format(lastRaw); });

  generate();
})();
