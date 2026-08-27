/* ===== format.js — Pretty / Minify / Convert JSON <-> YAML ===== */
(function () {
  "use strict";
  var panel = document.getElementById("panel-format");
  if (!panel) return;

  var $ = function (id) { return document.getElementById(id); };
  var input = $("format-input");
  var output = $("format-output");
  var errEl = $("format-error");
  var indentSel = $("format-indent");
  var sortKeysChk = $("format-sortkeys");
  var modeWrap = $("format-mode");
  var mode = "json";

  var showError = window.DT.bindError(errEl);
  var sortDeep = window.DT.sortDeep;

  function jsonIndent() {
    var v = indentSel.value;
    return v === "tab" ? "\t" : parseInt(v, 10);
  }
  function yamlIndent() {
    var v = indentSel.value;
    return v === "tab" ? 2 : parseInt(v, 10);
  }

  /* YAML has no tab-indent concept (js-yaml only accepts a numeric indent) — disable
     the "Tab" option while in YAML mode instead of silently substituting 2 spaces. */
  function syncIndentOptions() {
    var tabOption = indentSel.querySelector('option[value="tab"]');
    if (!tabOption) return;
    if (mode === "yaml") {
      tabOption.disabled = true;
      if (indentSel.value === "tab") indentSel.value = "2";
    } else {
      tabOption.disabled = false;
    }
  }

  function parseInput() {
    var text = input.value;
    if (!text.trim()) return undefined;
    if (mode === "json") return JSON.parse(text);
    return window.jsyaml.load(text);
  }

  function maybeSort(obj) {
    return sortKeysChk.checked ? sortDeep(obj) : obj;
  }

  function pretty() {
    showError("");
    if (!input.value.trim()) { output.value = ""; return; }
    try {
      var obj = maybeSort(parseInput());
      if (mode === "json") {
        output.value = JSON.stringify(obj, null, jsonIndent());
      } else {
        output.value = window.jsyaml.dump(obj, { indent: yamlIndent(), sortKeys: false, noRefs: true, lineWidth: -1 });
      }
    } catch (e) {
      output.value = "";
      showError((mode === "json" ? "JSON" : "YAML") + " ไม่ถูกต้อง: " + e.message);
    }
  }

  function minify() {
    showError("");
    if (!input.value.trim()) { output.value = ""; return; }
    try {
      var obj = maybeSort(parseInput());
      if (mode === "json") {
        output.value = JSON.stringify(obj);
      } else {
        output.value = window.jsyaml.dump(obj, { flowLevel: 0, sortKeys: false, noRefs: true, lineWidth: -1 }).trim();
      }
    } catch (e) {
      output.value = "";
      showError("แปลงไม่สำเร็จ: " + e.message);
    }
  }

  function toJson() {
    showError("");
    if (!input.value.trim()) { output.value = ""; return; }
    try {
      var obj = maybeSort(parseInput());
      output.value = JSON.stringify(obj, null, jsonIndent());
    } catch (e) {
      output.value = "";
      showError("แปลงเป็น JSON ไม่สำเร็จ: " + e.message);
    }
  }

  function toYaml() {
    showError("");
    if (!input.value.trim()) { output.value = ""; return; }
    try {
      var obj = maybeSort(parseInput());
      output.value = window.jsyaml.dump(obj, { indent: yamlIndent(), sortKeys: false, noRefs: true, lineWidth: -1 });
    } catch (e) {
      output.value = "";
      showError("แปลงเป็น YAML ไม่สำเร็จ: " + e.message);
    }
  }

  modeWrap.querySelectorAll(".seg-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      modeWrap.querySelectorAll(".seg-btn").forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      mode = btn.getAttribute("data-fmt");
      syncIndentOptions();
      pretty();
    });
  });

  syncIndentOptions();

  panel.querySelector('[data-action="format-pretty"]').addEventListener("click", pretty);
  panel.querySelector('[data-action="format-minify"]').addEventListener("click", minify);
  panel.querySelector('[data-action="format-tojson"]').addEventListener("click", toJson);
  panel.querySelector('[data-action="format-toyaml"]').addEventListener("click", toYaml);
  panel.querySelector('[data-action="format-clear"]').addEventListener("click", function () {
    input.value = "";
    output.value = "";
    showError("");
  });

  var debounceTimer = null;
  input.addEventListener("input", function () {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(pretty, 200);
  });
  indentSel.addEventListener("change", pretty);
  sortKeysChk.addEventListener("change", pretty);
})();
