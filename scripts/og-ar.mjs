// Renders the Arabic home share image to public/og/home-ar.png with Chromium.
// next/og (Satori) can't join Arabic letters, so the Arabic card is drawn by a real browser
// and served as a static file. Run after changing the design: node scripts/og-ar.mjs
import { readFileSync } from "node:fs";
import { chromium } from "@playwright/test";

const root = new URL("..", import.meta.url).pathname;
const b64 = (p) => readFileSync(root + p).toString("base64");
const icons = readFileSync(root + "src/lib/og-icons.ts", "utf8");
const icon = (name, color, size) => {
  const m = new RegExp(`"${name}": "(.*?)",?\\n`).exec(icons);
  return JSON.parse(`"${m[1]}"`).replace(/COLOR/g, color).replace(/width="24" height="24"/, `width="${size}" height="${size}"`);
};
const tile = (name, bg, fg, size, x, y) => `<div class="tile" style="width:${size}px;height:${size}px;left:${x}px;top:${y}px;border-radius:${size * 0.26}px"><div style="width:${size * 0.62}px;height:${size * 0.62}px;border-radius:${size * 0.2}px;background:${bg};display:grid;place-items:center">${icon(name, fg, Math.round(size * 0.36))}</div></div>`;

// Mirrored for right-to-left: the illustration on the left, the text on the right.
const cx = 270, cy = 318;
const html = `<!doctype html><html dir="rtl"><head><meta charset="utf-8"><style>
@font-face{font-family:Plex;src:url(data:font/woff2;base64,${b64("scripts/og-assets/ibm-plex-sans-arabic-arabic-500-normal.woff2")}) format("woff2");font-weight:500}
@font-face{font-family:Plex;src:url(data:font/woff2;base64,${b64("scripts/og-assets/ibm-plex-sans-arabic-arabic-700-normal.woff2")}) format("woff2");font-weight:700}
@font-face{font-family:Inter;src:url(data:font/woff;base64,${b64("public/fonts/og/inter-latin-500-normal.woff")}) format("woff");font-weight:500}
*{margin:0;box-sizing:border-box}
body{width:1200px;height:630px;overflow:hidden;position:relative;font-family:Inter,Plex,sans-serif;color:#151127;
background:radial-gradient(circle at 18% 38%,#e7dcff 0%,rgba(231,220,255,0) 46%),radial-gradient(circle at 92% 100%,#fde4f3 0%,rgba(253,228,243,0) 40%),linear-gradient(180deg,#fdfaff 0%,#f6efff 100%)}
svg.orbit{position:absolute;inset:0}
.tile{position:absolute;display:grid;place-items:center;background:rgba(255,255,255,.92);box-shadow:0 14px 34px -10px rgba(76,46,170,.35);border:1px solid #ece4ff}
.plate{position:absolute;left:${cx - 174}px;top:${cy - 174}px;width:348px;height:348px;border-radius:72px;background:rgba(255,255,255,.45);border:1px solid rgba(255,255,255,.8);transform:rotate(-6deg);box-shadow:0 30px 60px -20px rgba(101,71,255,.35)}
.app{position:absolute;left:${cx - 140}px;top:${cy - 140}px;width:280px;height:280px;border-radius:64px;background:#fff;display:grid;place-items:center;box-shadow:0 30px 60px -16px rgba(20,91,255,.45);border:1px solid #efe9fb}
.text{position:absolute;right:64px;top:56px;bottom:60px;width:600px;display:flex;flex-direction:column;justify-content:space-between}
.lockup{align-self:flex-start;direction:ltr}
h1{font-family:Plex;font-weight:700;font-size:68px;line-height:1.18;letter-spacing:0}
h1 .g{background:linear-gradient(270deg,#7c3aed,#c026d3 55%,#db2777);-webkit-background-clip:text;color:transparent}
p{font-family:Inter,Plex;font-weight:500;font-size:27px;line-height:1.55;color:#5b5573;margin-top:16px;width:560px}
.chips{display:flex;gap:10px}
.chip{font-family:Plex;font-weight:500;font-size:20px;padding:8px 18px;border-radius:999px;background:#fff;border:1px solid #e6dcfb;color:#3f3a56;box-shadow:0 4px 12px -6px rgba(76,46,170,.25)}
.chip bdi{font-family:Inter,Plex}
</style></head><body>
<svg class="orbit" width="1200" height="630"><ellipse cx="${cx}" cy="${cy}" rx="300" ry="128" transform="rotate(24 ${cx} ${cy})" fill="none" stroke="#a78bfa" stroke-opacity=".55" stroke-width="2"/><ellipse cx="${cx}" cy="${cy}" rx="250" ry="190" transform="rotate(-18 ${cx} ${cy})" fill="none" stroke="#93c5fd" stroke-opacity=".5" stroke-width="1.5"/><circle cx="50" cy="210" r="7" fill="#7c3aed" fill-opacity=".55"/><circle cx="480" cy="470" r="6" fill="#3b82f6" fill-opacity=".55"/></svg>
<div class="plate"></div>
<div class="app"><img src="data:image/png;base64,${b64("public/brand/og-mark.png")}" width="226" height="198"></div>
${tile("calculator", "#e3f6ec", "#0f7a4d", 96, 1200 - 706 - 96, 92)}
${tile("image", "#e8f1ff", "#2563eb", 104, 1200 - 1050 - 104, 64)}
${tile("file-text", "#f1e7ff", "#6d28d9", 100, 1200 - 652 - 100, 330)}
${tile("code", "#f1e7ff", "#6d28d9", 100, 1200 - 1010 - 100, 470)}
<div class="text">
  <img class="lockup" src="data:image/png;base64,${b64("public/brand/og-lockup.png")}" width="300" height="79">
  <div><h1>الأداة المناسبة.<br>لكل ما<br><span class="g">تعمل عليه.</span></h1>
  <p>حوّل ملفات PDF وعدّلها، وحوّل كشوف الحساب إلى Excel، واطبع الشيكات، وعالج صورك.</p></div>
  <div class="chips"><span class="chip"><bdi>PDF</bdi> إلى <bdi>Word</bdi></span><span class="chip">كشوف الحساب</span><span class="chip">طباعة شيك</span></div>
</div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html, { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: root + "public/og/home-ar.png" });
await browser.close();
console.log("public/og/home-ar.png");
