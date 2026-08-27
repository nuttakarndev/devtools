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
  var jsonEl = $("url-json");
  var jsonInputEl = $("url-json-input");
  var jsonOutputEl = $("url-json-output");
  var jsonErrEl = $("url-json-error");
  var mode = "component";

  var showError = window.DT.bindError(errEl);
  var showJsonError = window.DT.bindError(jsonErrEl);
  var escapeHtml = window.DT.escapeHtml;

  function parseParams(text) {
    var qs = text;
    var qIndex = qs.indexOf("?");
    if (qIndex !== -1) {
      qs = qs.slice(qIndex + 1);
    } else if (qs.indexOf("=") === -1) {
      /* No "?" and no "=" at all — this isn't a query string (e.g. a bare
         "www.google.com"), so don't let URLSearchParams misread the whole
         input as a single key with an empty value. */
      return [];
    }
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

  /* Rows -> plain object; a repeated key collects into an array instead of
     silently overwriting the earlier value. */
  function rowsToObject(rows) {
    var obj = {};
    rows.forEach(function (r) {
      var k = r[0], v = r[1];
      if (Object.prototype.hasOwnProperty.call(obj, k)) {
        if (Array.isArray(obj[k])) obj[k].push(v);
        else obj[k] = [obj[k], v];
      } else {
        obj[k] = v;
      }
    });
    return obj;
  }

  function renderParams() {
    var rows = parseParams(textEl.value);
    if (!rows.length) {
      paramsBody.innerHTML = '<tr><td class="empty" colspan="2">ไม่พบพารามิเตอร์ในข้อความ</td></tr>';
      jsonEl.value = "{}";
      return;
    }
    paramsBody.innerHTML = rows.map(function (r) {
      return "<tr><td>" + escapeHtml(r[0]) + "</td><td>" + escapeHtml(r[1]) + "</td></tr>";
    }).join("");
    jsonEl.value = JSON.stringify(rowsToObject(rows), null, 2);
  }

  function jsonToQuery() {
    showJsonError("");
    var text = jsonInputEl.value.trim();
    if (!text) { jsonOutputEl.value = ""; return; }
    var obj;
    try {
      obj = JSON.parse(text);
    } catch (e) {
      jsonOutputEl.value = "";
      showJsonError("JSON ไม่ถูกต้อง: " + e.message);
      return;
    }
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
      jsonOutputEl.value = "";
      showJsonError("ต้องเป็น JSON object เช่น {\"key\":\"value\"} เท่านั้น");
      return;
    }
    var params = new URLSearchParams();
    Object.keys(obj).forEach(function (k) {
      var v = obj[k];
      var values = Array.isArray(v) ? v : [v];
      values.forEach(function (item) {
        params.append(k, item === null || item === undefined ? "" : String(item));
      });
    });
    jsonOutputEl.value = params.toString();
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

  panel.querySelector('[data-action="url-clear"]').addEventListener("click", function () {
    textEl.value = "";
    encEl.value = "";
    jsonInputEl.value = "";
    jsonOutputEl.value = "";
    showError("");
    showJsonError("");
    renderParams();
  });

  /* Both fields are live: typing in either one updates the other. Setting
     .value programmatically does not fire an "input" event, so this can't
     loop back on itself. */
  textEl.addEventListener("input", encode);
  encEl.addEventListener("input", decode);

  var jsonDebounce = null;
  jsonInputEl.addEventListener("input", function () {
    clearTimeout(jsonDebounce);
    jsonDebounce = setTimeout(jsonToQuery, 200);
  });

  renderParams();
})();
