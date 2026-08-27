/* ===== hash.js — SHA-1/256/384/512 hash generator (text or file) via Web Crypto API ===== */
(function () {
  "use strict";
  var panel = document.getElementById("panel-hash");
  if (!panel) return;

  var $ = function (id) { return document.getElementById(id); };
  var modeWrap = $("hash-mode");
  var textWrap = $("hash-text-wrap");
  var fileWrap = $("hash-file-wrap");
  var inputEl = $("hash-input");
  var fileEl = $("hash-file");
  var fileInfoEl = $("hash-file-info");
  var errEl = $("hash-error");
  var mode = "text";

  var ALGOS = [["SHA-1", "hash-sha1"], ["SHA-256", "hash-sha256"], ["SHA-384", "hash-sha384"], ["SHA-512", "hash-sha512"]];

  function showError(msg) {
    if (!msg) { errEl.classList.remove("show"); errEl.textContent = ""; return; }
    errEl.textContent = msg;
    errEl.classList.add("show");
  }

  function clearResults() {
    ALGOS.forEach(function (a) { $(a[1]).value = ""; });
  }

  function bufToHex(buf) {
    var bytes = new Uint8Array(buf);
    var hex = "";
    for (var i = 0; i < bytes.length; i++) {
      var h = bytes[i].toString(16);
      hex += h.length === 1 ? "0" + h : h;
    }
    return hex;
  }

  function formatBytes(n) {
    if (n < 1024) return n + " B";
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
    return (n / (1024 * 1024)).toFixed(2) + " MB";
  }

  function computeAll(dataBuffer) {
    if (!window.crypto || !window.crypto.subtle) {
      showError("เบราว์เซอร์นี้ไม่รองรับ Web Crypto API (ต้องเปิดผ่าน HTTPS หรือ localhost)");
      clearResults();
      return;
    }
    showError("");
    var subtle = window.crypto.subtle;
    ALGOS.forEach(function (a) {
      subtle.digest(a[0], dataBuffer).then(function (buf) {
        $(a[1]).value = bufToHex(buf);
      }).catch(function (e) {
        showError("คำนวณแฮชไม่สำเร็จ: " + e.message);
      });
    });
  }

  function computeText() {
    var buf = new TextEncoder().encode(inputEl.value);
    computeAll(buf);
  }

  function computeFile(file) {
    if (!file) { clearResults(); fileInfoEl.textContent = ""; return; }
    fileInfoEl.textContent = file.name + " — " + formatBytes(file.size);
    showError("");
    file.arrayBuffer().then(function (buf) {
      computeAll(buf);
    }).catch(function (e) {
      showError("อ่านไฟล์ไม่สำเร็จ: " + e.message);
    });
  }

  modeWrap.querySelectorAll(".seg-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      modeWrap.querySelectorAll(".seg-btn").forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      mode = btn.getAttribute("data-hmode");
      textWrap.hidden = mode !== "text";
      fileWrap.hidden = mode !== "file";
      showError("");
      clearResults();
      if (mode === "text") computeText();
      else if (fileEl.files[0]) computeFile(fileEl.files[0]);
    });
  });

  var debounceTimer = null;
  inputEl.addEventListener("input", function () {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(computeText, 150);
  });
  fileEl.addEventListener("change", function () { computeFile(fileEl.files[0]); });

  computeText();
})();
