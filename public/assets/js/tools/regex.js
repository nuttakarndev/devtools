/* ===== regex.js — Regex tester + pattern generator/presets ===== */
(function () {
  "use strict";
  var panel = document.getElementById("panel-regex");
  if (!panel) return;

  var $ = function (id) { return document.getElementById(id); };
  var patternEl = $("regex-pattern");
  var flagsEl = $("regex-flags");
  var testEl = $("regex-test");
  var errEl = $("regex-error");
  var highlightEl = $("regex-highlight");
  var matchesEl = $("regex-matches");
  var countEl = $("regex-count");
  var replaceEl = $("regex-replace");
  var replaceOutEl = $("regex-replace-output");
  var presetsEl = $("regex-presets");
  var flagBtns = Array.prototype.slice.call($("flag-toggles").querySelectorAll(".flag-btn"));

  var PRESETS = [
    { label: "อีเมล (Email)", pattern: "^[\\w.+-]+@[\\w-]+\\.[a-zA-Z]{2,}$", flags: "" },
    { label: "URL", pattern: "^(https?:\\/\\/)?([\\w-]+\\.)+[\\w-]+(\\/[\\w\\-./?%&=#]*)?$", flags: "i" },
    { label: "IPv4 Address", pattern: "^(25[0-5]|2[0-4]\\d|1?\\d?\\d)(\\.(25[0-5]|2[0-4]\\d|1?\\d?\\d)){3}$", flags: "" },
    { label: "เบอร์โทรไทย (มือถือ)", pattern: "^0[689]\\d{8}$", flags: "" },
    { label: "วันที่ ISO (YYYY-MM-DD)", pattern: "^\\d{4}-\\d{2}-\\d{2}$", flags: "" },
    { label: "เวลา (HH:MM:SS)", pattern: "^([01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d$", flags: "" },
    { label: "รหัสสี Hex (#fff / #ffffff)", pattern: "^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$", flags: "" },
    { label: "Username (3-16 ตัว, a-z 0-9 _)", pattern: "^[a-zA-Z0-9_]{3,16}$", flags: "" },
    { label: "รหัสผ่านคาดหวัง (≥8, มีเลข/พิมพ์เล็ก/พิมพ์ใหญ่)", pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$", flags: "" },
    { label: "Slug (my-post-title)", pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$", flags: "" },
    { label: "HTML Tag", pattern: "<([a-z][a-z0-9]*)\\b[^>]*>(.*?)<\\/\\1>", flags: "i" },
    { label: "ข้อความภาษาไทย", pattern: "[\\u0E00-\\u0E7F]+", flags: "g" },
    { label: "ช่องว่างซ้ำ (whitespace runs)", pattern: "\\s+", flags: "g" },
    { label: "ตัวเลขทศนิยม (Number)", pattern: "^-?\\d+(\\.\\d+)?$", flags: "" }
  ];
  PRESETS.forEach(function (p, i) {
    var opt = document.createElement("option");
    opt.value = String(i);
    opt.textContent = p.label;
    presetsEl.appendChild(opt);
  });

  var showError = window.DT.bindError(errEl);
  var escapeHtml = window.DT.escapeHtml;
  var MATCH_LIMIT = 5000;

  function syncButtonsFromInput() {
    var val = flagsEl.value;
    flagBtns.forEach(function (btn) {
      btn.classList.toggle("active", val.indexOf(btn.getAttribute("data-flag")) !== -1);
    });
  }
  function syncInputFromButtons() {
    var order = "gimsuy";
    var val = "";
    order.split("").forEach(function (f) {
      var btn = flagBtns.filter(function (b) { return b.getAttribute("data-flag") === f; })[0];
      if (btn && btn.classList.contains("active")) val += f;
    });
    flagsEl.value = val;
  }

  function run() {
    var patternStr = patternEl.value;
    var flags = flagsEl.value.replace(/[^gimsuy]/g, "");
    if (flags !== flagsEl.value) flagsEl.value = flags;
    showError("");

    var text = testEl.value;

    if (!patternStr) {
      highlightEl.textContent = text;
      matchesEl.innerHTML = '<div class="matches-empty">ยังไม่ได้ใส่แพทเทิร์น</div>';
      countEl.textContent = "0";
      replaceOutEl.value = "";
      return;
    }

    var hRe;
    try {
      var hFlags = flags.indexOf("g") === -1 ? flags + "g" : flags;
      hRe = new RegExp(patternStr, hFlags);
    } catch (e) {
      showError("Regex ไม่ถูกต้อง: " + e.message);
      highlightEl.textContent = text;
      matchesEl.innerHTML = '<div class="matches-empty">แพทเทิร์นไม่ถูกต้อง</div>';
      countEl.textContent = "0";
      replaceOutEl.value = "";
      return;
    }

    var matches = [];
    var htmlParts = [];
    var lastIndex = 0;
    var m;
    var truncated = false;
    while ((m = hRe.exec(text)) !== null) {
      if (matches.length >= MATCH_LIMIT) { truncated = true; break; }
      matches.push(m);
      htmlParts.push(escapeHtml(text.slice(lastIndex, m.index)));
      htmlParts.push("<mark>" + (escapeHtml(m[0]) || "&nbsp;") + "</mark>");
      lastIndex = m.index + m[0].length;
      if (m[0].length === 0) { hRe.lastIndex++; }
    }
    htmlParts.push(escapeHtml(text.slice(lastIndex)));
    highlightEl.innerHTML = htmlParts.length ? htmlParts.join("") : escapeHtml(text);

    countEl.textContent = String(matches.length) + (truncated ? "+" : "");
    if (!matches.length) {
      matchesEl.innerHTML = '<div class="matches-empty">ไม่พบข้อความที่ตรงกัน</div>';
    } else {
      var truncNotice = truncated
        ? '<div class="matches-empty">⚠ พบมากกว่า ' + MATCH_LIMIT + ' รายการ แสดงผลเพียง ' + MATCH_LIMIT + ' รายการแรก</div>'
        : "";
      matchesEl.innerHTML = truncNotice + matches.map(function (mm, i) {
        var groupsHtml = "";
        var gs = [];
        for (var gi = 1; gi < mm.length; gi++) {
          gs.push("กลุ่ม " + gi + ": " + (mm[gi] === undefined ? "(ไม่พบ)" : escapeHtml(mm[gi])));
        }
        if (mm.groups) {
          Object.keys(mm.groups).forEach(function (name) {
            gs.push(name + ": " + (mm.groups[name] === undefined ? "(ไม่พบ)" : escapeHtml(mm.groups[name])));
          });
        }
        if (gs.length) groupsHtml = '<div class="groups">' + gs.join("<br>") + "</div>";
        return '<div class="match-item"><span class="idx">#' + (i + 1) + '</span><span class="full">' +
          escapeHtml(mm[0]) + '</span> <span style="color:var(--text-muted)">@' + mm.index + "</span>" + groupsHtml + "</div>";
      }).join("");
    }

    try {
      var replRe = new RegExp(patternStr, flags);
      replaceOutEl.value = text.replace(replRe, replaceEl.value);
    } catch (e) {
      replaceOutEl.value = "";
    }
  }

  flagBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      btn.classList.toggle("active");
      syncInputFromButtons();
      run();
    });
  });
  flagsEl.addEventListener("input", function () { syncButtonsFromInput(); run(); });
  patternEl.addEventListener("input", run);
  testEl.addEventListener("input", run);
  replaceEl.addEventListener("input", run);
  presetsEl.addEventListener("change", function () {
    if (!presetsEl.value) return;
    var p = PRESETS[parseInt(presetsEl.value, 10)];
    patternEl.value = p.pattern;
    flagsEl.value = p.flags || "g";
    syncButtonsFromInput();
    run();
    presetsEl.value = "";
  });

  syncButtonsFromInput();
  run();
})();
