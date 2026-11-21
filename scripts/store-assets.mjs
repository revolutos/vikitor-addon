// Erzeugt die Bilder für den Chrome Web Store nach store/:
// - store/screenshots/01-…png bis 05-…png in 1280 × 800 px (große Ansicht der Erweiterung)
// - store/kachel-440x280.png (kleine Werbekachel)
// - store/icon-128.png (Store-Symbol, Kopie von src/img/icon-128.png)
// Gleiche Mechanik wie test/browser.mjs: Chrome mit geladener Erweiterung über puppeteer-core.
// Aufruf: node scripts/store-assets.mjs   (PUPPETEER_CORE und CHROME_PATH wie beim Browser-Test)
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const puppeteer = require(process.env.PUPPETEER_CORE || "puppeteer-core");
const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(root, "src");
const OUT = path.join(root, "store");
const SHOTS = path.join(OUT, "screenshots");
fs.rmSync(SHOTS, { recursive: true, force: true });
fs.mkdirSync(SHOTS, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: true, pipe: true, enableExtensions: [SRC],
  args: ["--no-first-run", "--no-default-browser-check", "--lang=de-DE", "--hide-scrollbars"]
});

try {
  const sw = await browser.waitForTarget((t) => t.type() === "service_worker" && t.url().startsWith("chrome-extension://"), { timeout: 15000 });
  const base = `chrome-extension://${new URL(sw.url()).host}/app.html?view=tab`;
  await sleep(1500);
  const page = await browser.newPage();
  page.on("pageerror", (e) => console.error("Seitenfehler:", e.message));
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
  await page.goto(base, { waitUntil: "load" });
  await page.waitForFunction(() => document.documentElement.dataset.ready === "1", { timeout: 20000 });
  await page.evaluate(() => document.fonts.ready);

  const go = async (hash, prep) => {
    await page.evaluate((h) => { location.hash = h; }, hash);
    await sleep(900);
    if (prep) { await page.evaluate(prep); await sleep(500); }
    await page.evaluate(() => window.scrollTo(0, 0));
    await sleep(300);
  };
  const shot = async (name) => {
    await page.screenshot({ path: path.join(SHOTS, name), clip: { x: 0, y: 0, width: 1280, height: 800 } });
    console.log("Screenshot:", path.join("store/screenshots", name));
  };

  await go("start"); await shot("01-start.png");
  await go("generator", () => {
    document.querySelector(".chips .chip").click();
    Array.from(document.querySelectorAll(".seg button")).find((b) => b.textContent === "Codex").click();
    const set = (id, v) => { const el = document.getElementById(id); if (el) { el.value = v; el.dispatchEvent(new Event("input", { bubbles: true })); } };
    set("f-firma", "Praxis am Sonnenweg"); set("f-branche", "Physiotherapie"); set("f-zielgruppe", "Berufstätige mit Rückenschmerzen");
  });
  await shot("02-prompt-generator-codex.png");
  await go("quiz", () => {
    const b = Array.from(document.querySelectorAll("button")).find((x) => x.textContent.includes("Quiz neu starten")); if (b) b.click();
  });
  for (let i = 0; i < 7; i++) { await page.evaluate(() => document.querySelectorAll(".option")[0].click()); await sleep(150); }
  await sleep(600); await page.evaluate(() => window.scrollTo(0, 0)); await sleep(300);
  await shot("03-funnel-quiz.png");
  await go("promptcheck", () => {
    const t = document.getElementById("pc-text"); t.value = "Mach mir eine schöne Webseite für mein Café."; t.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await shot("04-prompt-check.png");
  await go("skills"); await shot("05-gratis-skills.png");

  // Kleine Werbekachel 440 × 280 im Look der Erweiterung (gleiche Schriften und Farben)
  await page.setViewport({ width: 440, height: 280, deviceScaleFactor: 1 });
  await page.evaluate(() => {
    document.body.className = "";
    document.body.innerHTML = `
      <div style="width:440px;height:280px;box-sizing:border-box;padding:30px 32px;background:radial-gradient(120% 120% at 85% 0%,#1d2a06 0%,#08090a 55%);display:flex;flex-direction:column;justify-content:space-between;font-family:var(--font);color:#f2f3f4;overflow:hidden">
        <div style="display:flex;align-items:center;gap:12px">
          <img src="img/icon-48.png" width="40" height="40" alt="">
          <span class="word" style="font-size:26px">VI<b>KI</b>TOR</span>
        </div>
        <div>
          <div style="font-size:30px;font-weight:800;line-height:1.08;letter-spacing:-0.02em">Vibecoding<br><span style="color:#c8ff3d">Assistent</span></div>
          <div style="margin-top:12px;font-size:14px;color:#c7cacd;line-height:1.4">Prompts für Claude Code, Codex,<br>ChatGPT und Lovable · kostenlos</div>
        </div>
      </div>`;
  });
  await sleep(500);
  await page.screenshot({ path: path.join(OUT, "kachel-440x280.png"), clip: { x: 0, y: 0, width: 440, height: 280 } });
  console.log("Kachel: store/kachel-440x280.png");
  fs.copyFileSync(path.join(SRC, "img", "icon-128.png"), path.join(OUT, "icon-128.png"));
  console.log("Store-Symbol: store/icon-128.png");
} finally {
  await browser.close();
}
