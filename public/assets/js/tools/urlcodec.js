/* ===== urlcodec.js — URL encode/decode + query string parser ===== */
(function () {
  "use strict";
  var panel = document.getElementById("panel-url");
  if (!panel) return;

  var $ = function (id) { return document.getElementById(id); };
  var textEl = $("url-text");
  var encEl = $("url-encoded");
  var errEl = $("url-error");
  var modeWrap = $("url-mode");
  var paramsBody = $("url-params").querySelector("tbody");
  var mode = "component";

  var showError = window.DT.bindError(errEl);
  var escapeHtml = window.DT.escapeHtml;

  function parseParams(text) {
    var qs = text;
    var qIndex = qs.indexOf("?");
    if (qIndex !== -1) qs = qs.slice(qIndex + 1);
    var hIndex = qs.indexOf("#");
    if (hIndex !== -1) qs = qs.slice(0, hIndex);
    qs = qs.trim();
    if (!qs) return [];
    var rows = [];
    try {
      var params = new URLSearchParams(qs);
      params.forEach(function (v, k) { rows.push([k, v]); });
    } catch (e) { return []; }
    return rows;
  }

  function renderParams() {
    var rows = parseParams(textEl.value);
    if (!rows.length) {
      paramsBody.innerHTML = '<tr><td class="empty" colspan="2">ไม่พบพารามิเตอร์ในข้อความ</td></tr>';
      return;
    }
    paramsBody.innerHTML = rows.map(function (r) {
      return "<tr><td>" + escapeHtml(r[0]) + "</td><td>" + escapeHtml(r[1]) + "</td></tr>";
    }).join("");
  }

  function encode() {
    showError("");
    try {
      encEl.value = mode === "component" ? encodeURIComponent(textEl.value) : encodeURI(textEl.value);
    } catch (e) {
      showError("เข้ารหัสไม่สำเร็จ: " + e.message);
    }
    renderParams();
  }

  function decode() {
    showError("");
    if (!encEl.value) { textEl.value = ""; renderParams(); return; }
    try {
      textEl.value = mode === "component" ? decodeURIComponent(encEl.value) : decodeURI(encEl.value);
    } catch (e) {
      showError("ถอดรหัสไม่สำเร็จ: รูปแบบ %XX ไม่ถูกต้อง (" + e.message + ")");
    }
    renderParams();
  }

  modeWrap.querySelectorAll(".seg-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      modeWrap.querySelectorAll(".seg-btn").forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      mode = btn.getAttribute("data-umode");
      encode();
    });
  });

  panel.querySelector('[data-action="url-encode"]').addEventListener("click", encode);
  panel.querySelector('[data-action="url-decode"]').addEventListener("click", decode);
  panel.querySelector('[data-action="url-swap"]').addEventListener("click", function () {
    var t = textEl.value;
    textEl.value = encEl.value;
    encEl.value = t;
    renderParams();
  });
  panel.querySelector('[data-action="url-clear"]').addEventListener("click", function () {
    textEl.value = "";
    encEl.value = "";
    showError("");
    renderParams();
  });

  textEl.addEventListener("input", encode);
  renderParams();
})();
