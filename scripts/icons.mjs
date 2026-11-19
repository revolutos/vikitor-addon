// Erzeugt die Erweiterungs-Icons (16/32/48/128 px) per Puppeteer-Screenshot.
// Dunkles, abgerundetes Quadrat (#08090a) mit „KI“ in Limette (#c8ff3d), fett.
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const puppeteer = require(process.env.PUPPETEER_CORE || "puppeteer-core");
const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const html = (size) => `<!doctype html><html><head>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@800;900&display=swap">
<style>
html,body{margin:0;background:transparent}
.i{width:${size}px;height:${size}px;border-radius:${Math.round(size * 0.22)}px;background:#08090a;display:grid;place-items:center;
  box-shadow:inset 0 0 0 ${size >= 48 ? Math.max(1, Math.round(size / 64)) : 0}px #232529}
.i span{font-family:"Inter Tight",system-ui,sans-serif;font-weight:900;color:#c8ff3d;font-size:${Math.round(size * (size <= 16 ? 0.62 : 0.5))}px;
  letter-spacing:${size <= 16 ? "-0.02em" : "-0.04em"};line-height:1;transform:translateY(${size <= 16 ? 0 : -Math.round(size * 0.01)}px)}
</style></head><body><div class="i"><span>KI</span></div></body></html>`;

const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new" });
try {
  const page = await browser.newPage();
  for (const size of [16, 32, 48, 128]) {
    await page.setViewport({ width: size, height: size, deviceScaleFactor: 1 });
    await page.setContent(html(size), { waitUntil: "load", timeout: 15000 });
    await page.evaluate(() => Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 3000))]));
    const el = await page.$(".i");
    const out = path.join(root, "src/img", `icon-${size}.png`);
    await el.screenshot({ path: out, omitBackground: true });
    console.log("Icon erstellt:", path.relative(root, out));
  }
} finally {
  await browser.close();
}
