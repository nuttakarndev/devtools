/* ===== idcard.js — Thai national ID number generator/validator (mod-11 check digit) ===== */
/* สุ่มเลขบัตรประชาชนสำหรับทดสอบระบบ/ฟอร์มเท่านั้น เป็นเลขสุ่มล้วนๆ ไม่ผูกกับบุคคลจริงแต่อย่างใด */
(function () {
  "use strict";
  var panel = document.getElementById("panel-idcard");
  if (!panel) return;

  var $ = function (id) { return document.getElementById(id); };
  var countEl = $("idc-count");
  var dashEl = $("idc-dash");
  var outputEl = $("idc-output");
  var validateEl = $("idc-validate");
  var resultEl = $("idc-validate-result");

  function checkDigit(d12) {
    var sum = 0;
    for (var i = 0; i < 12; i++) sum += d12[i] * (13 - i);
    return (11 - (sum % 11)) % 10;
  }

  function formatId(digits, withDash) {
    var s = digits.join("");
    if (!withDash) return s;
    return s.slice(0, 1) + "-" + s.slice(1, 5) + "-" + s.slice(5, 10) + "-" + s.slice(10, 12) + "-" + s.slice(12, 13);
  }

  function generateOne() {
    var digits = [1 + Math.floor(Math.random() * 8)];
    for (var i = 0; i < 11; i++) digits.push(Math.floor(Math.random() * 10));
    digits.push(checkDigit(digits));
    return digits;
  }

  function generate() {
    var n = parseInt(countEl.value, 10);
    if (isNaN(n) || n < 1) n = 1;
    if (n > 100) n = 100;
    countEl.value = n;
    var out = [];
    for (var i = 0; i < n; i++) out.push(formatId(generateOne(), dashEl.checked));
    outputEl.value = out.join("\n");
  }

  function showResult(msg, ok) {
    resultEl.textContent = msg;
    resultEl.className = "jwt-verify-result" + (msg ? " show" : "") + (ok === true ? " ok" : ok === false ? " bad" : "");
  }

  function validate() {
    var raw = validateEl.value.replace(/[\s-]/g, "");
    if (!raw) { showResult("", null); return; }
    if (!/^\d+$/.test(raw)) { showResult("มีตัวอักษรที่ไม่ใช่ตัวเลขปน", false); return; }
    if (raw.length !== 13) { showResult("ต้องมี 13 หลัก (พบ " + raw.length + " หลัก)", false); return; }
    var digits = raw.split("").map(Number);
    var expected = checkDigit(digits.slice(0, 12));
    if (expected === digits[12]) showResult("รูปแบบถูกต้อง ✓ (check digit ตรงกัน)", true);
    else showResult("check digit ไม่ถูกต้อง ✗ (ควรเป็น " + expected + ")", false);
  }

  panel.querySelector('[data-action="idc-generate"]').addEventListener("click", generate);
  panel.querySelector('[data-action="idc-clear"]').addEventListener("click", function () {
    outputEl.value = "";
    validateEl.value = "";
    showResult("", null);
  });
  dashEl.addEventListener("change", generate);
  validateEl.addEventListener("input", validate);

  generate();
})();
