/* ===== jwt.js — JWT decode + HS256 signature verify ===== */
(function () {
  "use strict";
  var panel = document.getElementById("panel-jwt");
  if (!panel) return;

  var $ = function (id) { return document.getElementById(id); };
  var inputEl = $("jwt-input");
  var errEl = $("jwt-error");
  var badgesEl = $("jwt-badges");
  var headerEl = $("jwt-header");
  var payloadEl = $("jwt-payload");
  var secretEl = $("jwt-secret");
  var resultEl = $("jwt-verify-result");

  var TIME_CLAIMS = { exp: "หมดอายุ (exp)", iat: "ออกเมื่อ (iat)", nbf: "ใช้งานได้ตั้งแต่ (nbf)" };

  function showError(msg) {
    if (!msg) { errEl.classList.remove("show"); errEl.textContent = ""; return; }
    errEl.textContent = msg;
    errEl.classList.add("show");
  }

  function showResult(msg, ok) {
    resultEl.textContent = msg;
    resultEl.className = "jwt-verify-result show" + (ok === true ? " ok" : ok === false ? " bad" : "");
  }

  function b64urlDecodeToString(str) {
    var s = str.replace(/-/g, "+").replace(/_/g, "/");
    while (s.length % 4 !== 0) s += "=";
    var bin = atob(s);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  }

  function bufferToB64url(buf) {
    var bytes = new Uint8Array(buf);
    var bin = "";
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  function fmtDate(unixSeconds) {
    var d = new Date(unixSeconds * 1000);
    if (isNaN(d.getTime())) return String(unixSeconds);
    try {
      return d.toLocaleString("th-TH-u-ca-gregory", { dateStyle: "medium", timeStyle: "medium" });
    } catch (e) {
      return d.toISOString();
    }
  }

  function badge(text, cls) {
    return '<span class="badge' + (cls ? " " + cls : "") + '">' + text + "</span>";
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function renderBadges(header, payload, hasSignature) {
    var now = Math.floor(Date.now() / 1000);
    var html = "";
    if (header && header.alg) html += badge("alg: " + escapeHtml(header.alg), "");
    if (header && header.typ) html += badge("typ: " + escapeHtml(header.typ), "");
    html += badge(hasSignature ? "มีลายเซ็น" : "ไม่มีลายเซ็น (unsigned)", hasSignature ? "" : "warn");

    if (payload && typeof payload.exp === "number") {
      var expired = payload.exp < now;
      html += badge((expired ? "หมดอายุแล้ว: " : "หมดอายุ: ") + fmtDate(payload.exp), expired ? "bad" : "ok");
    }
    if (payload && typeof payload.nbf === "number" && payload.nbf > now) {
      html += badge("ยังใช้งานไม่ได้จนถึง: " + fmtDate(payload.nbf), "warn");
    }
    if (payload && typeof payload.iat === "number") {
      html += badge("ออกเมื่อ: " + fmtDate(payload.iat), "");
    }
    badgesEl.innerHTML = html;
  }

  function decode() {
    showError("");
    showResult("", null);
    var token = inputEl.value.trim().replace(/^Bearer\s+/i, "");
    if (!token) {
      badgesEl.innerHTML = "";
      headerEl.value = "";
      payloadEl.value = "";
      return;
    }
    var parts = token.split(".");
    if (parts.length < 2 || parts.length > 3) {
      showError("รูปแบบ JWT ไม่ถูกต้อง (ต้องเป็น header.payload.signature คั่นด้วยจุด)");
      badgesEl.innerHTML = "";
      headerEl.value = "";
      payloadEl.value = "";
      return;
    }
    var header, payload;
    try {
      header = JSON.parse(b64urlDecodeToString(parts[0]));
    } catch (e) {
      showError("ถอดรหัส Header ไม่สำเร็จ: " + e.message);
      headerEl.value = "";
      payloadEl.value = "";
      badgesEl.innerHTML = "";
      return;
    }
    try {
      payload = JSON.parse(b64urlDecodeToString(parts[1]));
    } catch (e) {
      showError("ถอดรหัส Payload ไม่สำเร็จ: " + e.message);
      headerEl.value = JSON.stringify(header, null, 2);
      payloadEl.value = "";
      badgesEl.innerHTML = "";
      return;
    }
    headerEl.value = JSON.stringify(header, null, 2);
    payloadEl.value = JSON.stringify(payload, null, 2);
    renderBadges(header, payload, parts.length === 3 && !!parts[2]);
  }

  function verify() {
    showResult("", null);
    var token = inputEl.value.trim().replace(/^Bearer\s+/i, "");
    var parts = token.split(".");
    if (parts.length !== 3 || !parts[2]) {
      showResult("โทเค็นนี้ไม่มีลายเซ็นให้ตรวจสอบ", false);
      return;
    }
    var header;
    try {
      header = JSON.parse(b64urlDecodeToString(parts[0]));
    } catch (e) {
      showResult("ถอดรหัส Header ไม่สำเร็จ ตรวจสอบไม่ได้", false);
      return;
    }
    if (header.alg !== "HS256") {
      showResult("รองรับตรวจสอบลายเซ็นเฉพาะ HS256 เท่านั้น (โทเค็นนี้ใช้ " + (header.alg || "ไม่ทราบ") + ")", false);
      return;
    }
    if (!secretEl.value) {
      showResult("กรุณาใส่ secret ก่อนตรวจสอบ", false);
      return;
    }
    if (!window.crypto || !window.crypto.subtle) {
      showResult("เบราว์เซอร์นี้ไม่รองรับ Web Crypto (ต้องเปิดผ่าน HTTPS หรือ localhost)", false);
      return;
    }
    var data = parts[0] + "." + parts[1];
    window.crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secretEl.value),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    ).then(function (key) {
      return window.crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
    }).then(function (sigBuf) {
      var expected = bufferToB64url(sigBuf);
      var actual = parts[2].replace(/=+$/, "");
      if (expected === actual) showResult("ลายเซ็นถูกต้อง ✓ (ตรงกับ secret ที่ให้มา)", true);
      else showResult("ลายเซ็นไม่ถูกต้อง ✗ (secret ไม่ตรง หรือ token ถูกแก้ไข)", false);
    }).catch(function (e) {
      showResult("ตรวจสอบไม่สำเร็จ: " + e.message, false);
    });
  }

  panel.querySelector('[data-action="jwt-verify"]').addEventListener("click", verify);
  panel.querySelector('[data-action="jwt-clear"]').addEventListener("click", function () {
    inputEl.value = "";
    secretEl.value = "";
    headerEl.value = "";
    payloadEl.value = "";
    badgesEl.innerHTML = "";
    showError("");
    showResult("", null);
  });

  var debounceTimer = null;
  inputEl.addEventListener("input", function () {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(decode, 150);
  });
})();
