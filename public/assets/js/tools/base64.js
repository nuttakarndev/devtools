/* ===== base64.js ===== */
(function () {
  "use strict";
  var panel = document.getElementById("panel-base64");
  if (!panel) return;

  var $ = function (id) { return document.getElementById(id); };
  var textEl = $("b64-text");
  var encEl = $("b64-encoded");
  var errEl = $("b64-error");
  var urlSafe = $("b64-urlsafe");

  var showError = window.DT.bindError(errEl);

  function toBase64(str) {
    var bytes = new TextEncoder().encode(str);
    var bin = "";
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    var b64 = btoa(bin);
    if (urlSafe.checked) b64 = b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    return b64;
  }

  function fromBase64(str) {
    var s = str.trim().replace(/\s+/g, "");
    if (urlSafe.checked || /[-_]/.test(s)) {
      s = s.replace(/-/g, "+").replace(/_/g, "/");
    }
    while (s.length % 4 !== 0) s += "=";
    var bin = atob(s);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  }

  function encode() {
    showError("");
    try {
      encEl.value = toBase64(textEl.value);
    } catch (e) {
      showError("เข้ารหัสไม่สำเร็จ: " + e.message);
    }
  }

  function decode() {
    showError("");
    if (!encEl.value.trim()) { textEl.value = ""; return; }
    try {
      textEl.value = fromBase64(encEl.value);
    } catch (e) {
      showError("Base64 ไม่ถูกต้อง: " + e.message);
    }
  }

  panel.querySelector('[data-action="b64-clear"]').addEventListener("click", function () {
    textEl.value = "";
    encEl.value = "";
    showError("");
  });

  /* Both fields are live: typing in either one updates the other. Setting
     .value programmatically does not fire an "input" event, so this can't
     loop back on itself. */
  textEl.addEventListener("input", encode);
  encEl.addEventListener("input", decode);
  urlSafe.addEventListener("change", function () {
    if (textEl.value) encode();
    else if (encEl.value) decode();
  });
})();
