# 🧰 DevTools Hub

เว็บไซต์รวมเครื่องมือสำหรับนักพัฒนา ทำงานทั้งหมดฝั่งเบราว์เซอร์ (ไม่มีข้อมูลถูกส่งขึ้นเซิร์ฟเวอร์) เขียนด้วย HTML/CSS/JavaScript ล้วน ไม่มีขั้นตอน build ใดๆ

## Features

- **Base64** — encode/decode รองรับ UTF-8/ภาษาไทย และโหมด URL-safe
- **Diff** — เปรียบเทียบ Text / JSON / YAML แบบเรียลไทม์ (บรรทัด/คำ/ตัวอักษร)
- **Pretty / Minify JSON & YAML** — จัดรูปแบบ ย่อขนาด แปลงสลับ JSON ↔ YAML เรียง key ได้
- **URL Encode/Decode** — โหมด Component/Full URI พร้อมแยกพารามิเตอร์ query string
- **JWT Decode/Verify** — ถอดรหัส Header/Payload อ่านวันหมดอายุ (exp/iat/nbf) และตรวจสอบลายเซ็น HS256 ด้วย secret
- **Hash Generator** — SHA-1 / SHA-256 / SHA-384 / SHA-512 จากข้อความหรือไฟล์ (Web Crypto API)
- **Regex Tester/Generator** — ทดสอบ regex แบบเรียลไทม์ พร้อมชุดแพทเทิร์นสำเร็จรูป ไฮไลต์ผลลัพธ์ กลุ่ม (groups) และตัวอย่างการแทนที่
- **Case Converter / Text Utilities** — camelCase/snake_case/kebab-case/ฯลฯ + trim/dedupe/sort/reverse บรรทัด + นับตัวอักษร/คำ/บรรทัด
- **UUID Generator** — สุ่ม UUID v4 ได้ครั้งละหลายรายการ
- **เลขบัตรประชาชนไทย (Generator/Validator)** — สุ่มเลข 13 หลักที่ check digit ถูกต้องสำหรับทดสอบฟอร์ม/ระบบ พร้อมตัวตรวจสอบ (เลขสุ่มล้วนๆ ไม่ใช่ของบุคคลจริง)
- **Timestamp Converter** — Unix Timestamp ↔ วันที่-เวลา (Local/UTC/ISO 8601/relative time)

ตัวอักษร (font) รองรับภาษาไทยโดยเฉพาะ: [Kanit](https://fonts.google.com/specimen/Kanit) สำหรับหัวข้อ และ [Sarabun](https://fonts.google.com/specimen/Sarabun) สำหรับเนื้อหา/ช่องข้อความ อ่านง่าย สบายตา (โหลดผ่าน Google Fonts)

## โครงสร้างโปรเจกต์

```
public/                 ← โฟลเดอร์ที่ deploy ขึ้น GitHub Pages
  index.html
  assets/css/style.css
  assets/js/app.js       ← nav routing, theme toggle, clipboard
  assets/js/tools/*.js   ← 1 ไฟล์ต่อ 1 เครื่องมือ
.github/workflows/deploy.yml   ← GitHub Actions: auto tag version + deploy ขึ้น GitHub Pages ทุกครั้งที่ push เข้า main
```

ไลบรารีภายนอกที่ใช้ (โหลดผ่าน CDN, ไม่ต้อง npm install): [`js-yaml`](https://github.com/nodeca/js-yaml) สำหรับ YAML, [`diff`](https://github.com/kpdecker/jsdiff) สำหรับ diff

## วิธี deploy ขึ้น GitHub Pages (auto deploy)

1. สร้าง repository บน GitHub แล้ว push โค้ดนี้ขึ้น branch `main`
2. เข้า **Settings → Pages** ของ repo แล้วตั้งค่า **Source = GitHub Actions**
3. ทุกครั้งที่ push เข้า `main` (หรือกด "Run workflow" เอง) workflow `.github/workflows/deploy.yml` จะ:
   - สร้าง git tag เวอร์ชันใหม่อัตโนมัติ (patch bump เช่น `v0.1.0` → `v0.1.1`) ผ่าน job `tag`
   - build และ deploy โฟลเดอร์ `public/` ขึ้น GitHub Pages ผ่าน job `deploy`
4. ดู URL ของเว็บและเวอร์ชันล่าสุดได้ที่แท็บ **Actions** (หลัง deploy สำเร็จ) หรือแท็บ **Tags/Releases** ของ repo

## รันดูในเครื่อง

เปิดไฟล์ `public/index.html` ในเบราว์เซอร์ได้โดยตรง (ไม่ต้องมี server) หรือจะรันเซิร์ฟเวอร์เล็กๆ เช่น:

```powershell
cd public
python -m http.server 8080
```

แล้วเปิด http://localhost:8080
