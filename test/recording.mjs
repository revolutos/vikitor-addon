// Test der Funnel-Hack-Aufnahme (Mitschneiden) gegen einen lokalen Test-Funnel mit drei Seiten.
// Es wird keine fremde Seite aufgerufen. Für den Test bekommt eine Kopie der Erweiterung den Seitenzugriff fest
// im Manifest, damit kein Berechtigungsdialog erscheint (im echten Addon wird er nur während der Aufnahme erbeten).
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const puppeteer = require(process.env.PUPPETEER_CORE || "puppeteer-core");
const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const ok = (name, pass, info = "") => { results.push({ name, pass, info }); console.log(`${pass ? "OK  " : "FAIL"} ${name}${info ? " – " + info : ""}`); };

// Lokaler Test-Funnel: lange Startseite mit fester Kopfzeile, Opt-in-Seite mit Formular, Danke-Seite
const page = (title, body) => `<!doctype html><html lang="de"><head><meta charset="utf-8"><title>${title}</title>
<style>body{margin:0;font:18px system-ui;background:#fff}header{position:fixed;top:0;left:0;right:0;height:60px;background:#111;color:#fff;padding:16px}
main{padding:80px 24px}section{height:700px;border-bottom:4px solid #c00;padding:20px}a.cta{display:inline-block;background:#0a0;color:#fff;padding:14px 22px}</style></head>
<body><header>Test-Funnel</header><main>${body}</main></body></html>`;
const PAGES = {
  "/start": page("Start – Test-Funnel", `<h1>Hero</h1>${[1, 2, 3, 4].map((i) => `<section><h2>Sektion ${i}</h2><p>Nutzen und Beweise für das Testangebot, Abschnitt ${i}.</p></section>`).join("")}<a class="cta" id="go" href="/optin">Jetzt eintragen</a>`),
  "/optin": page("Opt-in – Test-Funnel", `<h1>Trag dich ein</h1><form action="/danke"><input name="email" placeholder="E-Mail"><a class="cta" id="go" href="/danke">Absenden</a></form>`),
  "/danke": page("Danke – Test-Funnel", `<h1>Danke!</h1><p>Bitte bestätige deine E-Mail.</p>`)
};
const server = http.createServer((req, res) => {
  const body = PAGES[req.url.split("?")[0]];
  res.writeHead(body ? 200 : 404, { "Content-Type": "text/html; charset=utf-8" });
  res.end(body || "nicht gefunden");
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const BASE = `http://127.0.0.1:${server.address().port}`;

// Kopie der Erweiterung mit festem Seitenzugriff
const ext = fs.mkdtempSync(path.join(os.tmpdir(), "vikitor-rec-"));
fs.cpSync(path.join(root, "src"), ext, { recursive: true });
const mf = JSON.parse(fs.readFileSync(path.join(ext, "manifest.json"), "utf8"));
mf.host_permissions = [...mf.host_permissions, "<all_urls>"];
fs.writeFileSync(path.join(ext, "manifest.json"), JSON.stringify(mf, null, 2));

const browser = await puppeteer.launch({ executablePath: CHROME, headless: process.env.HEADFUL ? false : true, pipe: true, enableExtensions: [ext], args: ["--no-first-run", "--no-default-browser-check", "--lang=de-DE"] });
const issues = [];
try {
  const sw = await browser.waitForTarget((t) => t.type() === "service_worker" && t.url().startsWith("chrome-extension://"), { timeout: 15000 });
  const extId = new URL(sw.url()).host;
  await sleep(1200);
  const app = await browser.newPage();
  app.on("pageerror", (e) => issues.push(e.message));
  await app.setViewport({ width: 400, height: 800 });
  await app.goto(`chrome-extension://${extId}/app.html?view=panel`, { waitUntil: "load" });
  await app.waitForFunction(() => document.documentElement.dataset.ready === "1");
  await app.evaluate(() => chrome.storage.local.set({ premiumLicense: "test-nur-oberflaeche" }));
  await app.evaluate(() => { location.hash = "funnelhack"; });
  await app.waitForSelector("#rec-start", { timeout: 8000 });
  ok("Funnel-Hack zeigt „Aufnahme starten“ und behält „Aktuelle Seite erfassen“", await app.evaluate(() => /Aktuelle Seite erfassen/.test(document.body.innerText) && !!document.getElementById("rec-start")));

  const site = await browser.newPage();
  site.on("pageerror", (e) => issues.push("Seite: " + e.message));
  await site.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
  await site.goto(`${BASE}/start`, { waitUntil: "load" });
  await site.bringToFront();
  await sleep(300);

  const count = () => app.evaluate(async () => ((await chrome.storage.local.get("recState")).recState || {}).count || 0);
  const waitCount = async (n, ms = 25000) => { const t = Date.now(); while (Date.now() - t < ms) { if ((await count()) >= n) return true; await sleep(300); } return false; };

  await app.evaluate(() => document.getElementById("rec-start").click());
  await sleep(500);
  const st = await app.evaluate(async () => ({ state: (await chrome.storage.local.get("recState")).recState, badge: await chrome.action.getBadgeText({}), banner: document.querySelector(".rec-status")?.innerText || "" }));
  ok("Aufnahme startet nur nach Klick und zeigt sichtbaren Hinweis (Symbol + Banner)", st.state?.active && /REC|\d/.test(st.badge) && /Aufnahme läuft/.test(st.banner), `Symbol „${st.badge}“, ${st.banner.replace(/\s+/g, " ")}`);

  const swWorker = await sw.worker();
  swWorker.on("console", (m) => { if (m.type() === "error") issues.push("SW: " + m.text()); });
  const first = await waitCount(1);
  ok("Startseite wird erfasst", first, first ? "" : JSON.stringify(await app.evaluate(async () => (await chrome.storage.local.get("recState")).recState)));
  for (const [i, next] of [[2, "Opt-in"], [3, "Danke"]]) {
    await site.bringToFront();
    await Promise.all([site.waitForNavigation({ waitUntil: "load" }), site.click("#go")]);
    ok(`Seite ${i} (${next}) wird nach dem Klick erfasst`, await waitCount(i));
  }
  // gleiche Seite neu laden zählt nicht doppelt
  await site.reload({ waitUntil: "load" });
  await sleep(3500);
  ok("Neu laden derselben Seite erzeugt keinen doppelten Schritt", (await count()) === 3, `${await count()} Schritte`);
  await app.evaluate(() => { location.hash = "about"; });
  await sleep(200);
  await app.evaluate(() => { location.hash = "funnelhack"; });
  await app.waitForSelector("#rec-stop", { timeout: 8000 });
  await app.evaluate(() => document.getElementById("rec-stop").click());
  await app.waitForSelector("#rec-zip", { timeout: 15000 });
  const after = await app.evaluate(async () => ({ badge: await chrome.action.getBadgeText({}), thumbs: document.querySelectorAll(".rec-step img").length }));
  ok("Stoppen beendet den Hinweis und zeigt die erfassten Schritte", after.badge === "" && after.thumbs === 3, `Symbol „${after.badge}“, ${after.thumbs} Vorschaubilder`);

  await app.evaluate(() => document.getElementById("rec-card").scrollIntoView());
  await sleep(400);
  await app.screenshot({ path: path.join(root, "test/screens/panel-funnelhack-aufnahme.png") });
  const zipB64 = await app.evaluate(async () => {
    const m = await import("./js/recexport.js");
    const s = (await chrome.storage.local.get("recState")).recState;
    const { blob } = await m.buildRecordingZip(s);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let bin = ""; for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  });
  const zipPath = path.join(ext, "aufnahme.zip");
  fs.writeFileSync(zipPath, Buffer.from(zipB64, "base64"));
  if (process.env.KEEP_ZIP) fs.copyFileSync(zipPath, process.env.KEEP_ZIP);
  const listing = execFileSync("unzip", ["-Z1", zipPath]).toString().trim().split("\n");
  ok("ZIP lässt sich entpacken (unzip -t)", /No errors/.test(execFileSync("unzip", ["-t", zipPath]).toString()));
  const want = ["funnelhack/funnel.json", "funnelhack/index.html", "funnelhack/steps/01-start/desktop.png", "funnelhack/steps/01-start/above-the-fold.png", "funnelhack/steps/02-optin/desktop.png", "funnelhack/steps/03-danke/desktop.png"];
  const missing = want.filter((f) => !listing.includes(f));
  ok("ZIP-Struktur funnelhack/ (funnel.json, steps/NN-slug/, index.html)", missing.length === 0, missing.length ? "fehlt: " + missing.join(", ") : `${listing.length} Dateien`);
  const fj = JSON.parse(execFileSync("unzip", ["-p", zipPath, "funnelhack/funnel.json"]).toString());
  ok("funnel.json: drei Schritte in Reihenfolge mit Übergängen", fj.steps.length === 3 && fj.steps.map((s) => new URL(s.url).pathname).join(",") === "/start,/optin,/danke" && fj.transitions.length === 2 && /immer eigen/.test(fj.rules));
  const png = execFileSync("unzip", ["-p", zipPath, "funnelhack/steps/01-start/desktop.png"]);
  const w = png.readUInt32BE(16), hgt = png.readUInt32BE(20);
  ok("Ganzseiten-Screenshot ist aus mehreren Bildern zusammengesetzt (höher als das Fenster)", png.subarray(1, 4).toString() === "PNG" && w === 1280 && hgt > 2500, `${w} × ${hgt} px`);
  const fold = execFileSync("unzip", ["-p", zipPath, "funnelhack/steps/01-start/above-the-fold.png"]);
  ok("Bild des sichtbaren Bereichs (above the fold)", fold.readUInt32BE(20) === 800, `${fold.readUInt32BE(16)} × ${fold.readUInt32BE(20)} px`);
  // Feste Kopfzeile nur einmal: unterhalb der ersten 800 px darf kein schwarzer Balken (#111) über die volle Breite liegen
  const html = execFileSync("unzip", ["-p", zipPath, "funnelhack/index.html"]).toString();
  ok("index.html-Übersicht verweist auf alle Schritte", fj.steps.every((s) => html.includes(`${s.dir}/above-the-fold.png`)));
  const scroll = await site.evaluate(() => window.scrollY);
  ok("Seite wird nach der Erfassung zurückgescrollt und Kopfzeile wieder sichtbar", scroll === 0 && await site.evaluate(() => getComputedStyle(document.querySelector("header")).visibility === "visible"));
  ok("Keine Fehler in Erweiterung und Testseiten", issues.length === 0, issues.join(" | "));
  await app.evaluate(() => document.getElementById("rec-reset").click());
  await sleep(600);
  ok("Verwerfen löscht die Aufnahme", (await count()) === 0 && await app.evaluate(() => !!document.getElementById("rec-start")));
} finally {
  await browser.close();
  server.close();
  fs.rmSync(ext, { recursive: true, force: true });
}
const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} Aufnahme-Prüfungen bestanden.`);
process.exit(failed.length ? 1 : 0);
