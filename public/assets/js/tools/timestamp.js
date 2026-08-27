/* ===== timestamp.js — Unix timestamp <-> date/time converter ===== */
(function () {
  "use strict";
  var panel = document.getElementById("panel-timestamp");
  if (!panel) return;

  var $ = function (id) { return document.getElementById(id); };
  var unixEl = $("ts-unix");
  var errEl = $("ts-error");
  var resultEl = $("ts-result");
  var datetimeEl = $("ts-datetime");
  var unixResultEl = $("ts-unix-result");

  var showError = window.DT.bindError(errEl);

  function pad(n) { return n < 10 ? "0" + n : "" + n; }

  function toDatetimeLocalValue(d) {
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + "T" +
      pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
  }

  function makeRow(container, id, label, value) {
    var row = document.createElement("div");
    row.className = "hash-row";
    var lab = document.createElement("label");
    lab.textContent = label;
    var inp = document.createElement("input");
    inp.type = "text";
    inp.id = id;
    inp.readOnly = true;
    inp.value = value;
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "copy-btn";
    btn.setAttribute("data-copy", "#" + id);
    btn.textContent = "คัดลอก";
    row.appendChild(lab);
    row.appendChild(inp);
    row.appendChild(btn);
    container.appendChild(row);
  }

  function relativeTime(targetMs, nowMs) {
    var diffSec = Math.round((targetMs - nowMs) / 1000);
    var future = diffSec > 0;
    var abs = Math.abs(diffSec);
    var units = [["ปี", 31536000], ["เดือน", 2592000], ["วัน", 86400], ["ชั่วโมง", 3600], ["นาที", 60], ["วินาที", 1]];
    var text = "0 วินาที";
    for (var i = 0; i < units.length; i++) {
      if (abs >= units[i][1] || units[i][0] === "วินาที") {
        text = Math.floor(abs / units[i][1]) + " " + units[i][0];
        break;
      }
    }
    return future ? ("ในอีก " + text) : (text + "ที่แล้ว");
  }

  function renderTsResult(d) {
    resultEl.innerHTML = "";
    var localStr, utcStr;
    try {
      localStr = d.toLocaleString("th-TH-u-ca-gregory", { dateStyle: "medium", timeStyle: "medium" });
      utcStr = d.toLocaleString("th-TH-u-ca-gregory", { dateStyle: "medium", timeStyle: "medium", timeZone: "UTC" }) + " UTC";
    } catch (e) {
      localStr = d.toString();
      utcStr = d.toUTCString();
    }
    makeRow(resultEl, "ts-out-local", "Local", localStr);
    makeRow(resultEl, "ts-out-utc", "UTC", utcStr);
    makeRow(resultEl, "ts-out-iso", "ISO 8601", d.toISOString());
    makeRow(resultEl, "ts-out-rel", "เทียบกับตอนนี้", relativeTime(d.getTime(), Date.now()));
  }

  function computeFromUnix() {
    var raw = unixEl.value.trim();
    if (!raw) { showError(""); resultEl.innerHTML = ""; return; }
    if (!/^-?\d+$/.test(raw)) {
      showError("กรอกเฉพาะตัวเลข (วินาที หรือ มิลลิวินาที)");
      resultEl.innerHTML = "";
      return;
    }
    showError("");
    var n = Number(raw);
    var ms = Math.abs(n) >= 1e12 ? n : n * 1000;
    var d = new Date(ms);
    if (isNaN(d.getTime())) { showError("ค่าที่ป้อนอยู่นอกช่วงวันที่ที่รองรับ"); resultEl.innerHTML = ""; return; }
    renderTsResult(d);
  }

  function computeFromDatetime() {
    var v = datetimeEl.value;
    unixResultEl.innerHTML = "";
    if (!v) return;
    var d = new Date(v);
    if (isNaN(d.getTime())) return;
    makeRow(unixResultEl, "ts-out-sec", "Unix (วินาที)", String(Math.floor(d.getTime() / 1000)));
    makeRow(unixResultEl, "ts-out-ms", "Unix (มิลลิวินาที)", String(d.getTime()));
  }

  panel.querySelector('[data-action="ts-now"]').addEventListener("click", function () {
    var now = new Date();
    unixEl.value = String(Math.floor(now.getTime() / 1000));
    datetimeEl.value = toDatetimeLocalValue(now);
    computeFromUnix();
    computeFromDatetime();
  });

  var debounceTimer = null;
  unixEl.addEventListener("input", function () {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(computeFromUnix, 150);
  });
  datetimeEl.addEventListener("input", computeFromDatetime);

  /* bootstrap with current time */
  (function init() {
    var now = new Date();
    unixEl.value = String(Math.floor(now.getTime() / 1000));
    datetimeEl.value = toDatetimeLocalValue(now);
    computeFromUnix();
    computeFromDatetime();
  })();
})();
