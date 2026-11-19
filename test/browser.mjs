// End-to-End-Test: lädt die Erweiterung in Chrome, öffnet Tab- und Panel-Ansicht,
// klickt jede Ansicht an, speichert Screenshots und prüft Funktionen und Konsole.
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const puppeteer = require(process.env.PUPPETEER_CORE || "puppeteer-core");
const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(root, "src");
const SHOTS = path.join(root, "test/screens");
fs.mkdirSync(SHOTS, { recursive: true });

const VIEWS = ["start", "generator", "quiz", "promptcheck", "pagecheck", "skills", "guides", "saved", "shop", "about"];
const results = [];
const ok = (name, pass, info = "") => { results.push({ name, pass, info }); console.log(`${pass ? "OK  " : "FAIL"} ${name}${info ? " – " + info : ""}`); };
const consoleIssues = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function watch(page, label) {
  page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") consoleIssues.push(`[${label}] ${m.type()}: ${m.text()} ${m.location()?.url || ""}`); });
  page.on("pageerror", (e) => consoleIssues.push(`[${label}] pageerror: ${e.message}`));
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: process.env.HEADFUL ? false : true,
  pipe: true,
  enableExtensions: [SRC],
  args: ["--no-first-run", "--no-default-browser-check", "--lang=de-DE"]
});

try {
  const sw = await browser.waitForTarget((t) => t.type() === "service_worker" && t.url().startsWith("chrome-extension://"), { timeout: 15000 });
  const extId = new URL(sw.url()).host;
  ok("Erweiterung geladen, Service Worker läuft", !!extId, extId);
  const base = `chrome-extension://${extId}/app.html`;

  // Willkommens-Tab nach Installation
  await sleep(1500);
  const welcome = (await browser.pages()).find((p) => p.url().includes("welcome=1"));
  ok("Willkommensansicht wird nach Installation geöffnet", !!welcome, welcome ? welcome.url() : "kein Tab gefunden");

  async function openApp(view, w, h, label) {
    const page = await browser.newPage();
    watch(page, label);
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
    await page.goto(`${base}?view=${view}`, { waitUntil: "load" });
    await page.waitForFunction(() => document.documentElement.dataset.ready === "1", { timeout: 10000 });
    await page.evaluate(() => document.fonts.ready);
    return page;
  }

  async function layoutIssues(page) {
    return page.evaluate(() => {
      const issues = [];
      if (document.documentElement.scrollWidth > window.innerWidth + 1) issues.push(`waagerechtes Scrollen (${document.documentElement.scrollWidth}px > ${window.innerWidth}px)`);
      const vis = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none"; };
      for (const el of document.querySelectorAll(".nowrap, .tile h3, .nav-item, .btn, .chip, .seg button, .word")) {
        if (!vis(el)) continue;
        if (el.scrollWidth > el.clientWidth + 1) issues.push(`abgeschnitten: „${el.textContent.trim().slice(0, 40)}“ (${el.scrollWidth}>${el.clientWidth})`);
        const r = el.getBoundingClientRect();
        if (r.right > window.innerWidth + 1) issues.push(`ragt über Rand: „${el.textContent.trim().slice(0, 40)}“`);
      }
      for (const el of document.querySelectorAll(".vhead h1, .tile h3, .h2, .qbox h2")) {
        if (!vis(el)) continue;
        const lh = parseFloat(getComputedStyle(el).lineHeight);
        const lines = Math.round(el.getBoundingClientRect().height / lh);
        if ((el.matches(".vhead h1") || el.textContent.trim().length <= 34) && lines > 1) issues.push(`Überschrift umgebrochen (${lines} Zeilen): „${el.textContent.trim()}“`);
      }
      if (/\b(null|undefined|NaN)\b|\{\{|\[\[/.test(document.getElementById("content").innerText)) issues.push("sichtbarer Platzhalter oder null/undefined im Text");
      for (const t of document.querySelectorAll(".tile")) if (!t.textContent.trim()) issues.push("leere Kachel");
      const grids = document.querySelectorAll(".tiles");
      for (const g of grids) { const n = g.children.length; if (n % 2) issues.push(`ungerade Kachelanzahl (${n})`); }
      return issues;
    });
  }

  async function shootViews(page, prefix) {
    await page.bringToFront();
    for (const v of VIEWS) {
      await page.evaluate((id) => { location.hash = id; }, v);
      await sleep(900);
      if (v === "guides") { await page.evaluate(() => { document.querySelectorAll(".acc-btn")[0].click(); document.querySelectorAll(".acc-btn")[3].click(); }); await sleep(600); }
      const issues = await layoutIssues(page);
      ok(`${prefix}: Ansicht „${v}“ ohne Layoutfehler`, issues.length === 0, issues.join("; "));
      await page.screenshot({ path: path.join(SHOTS, `${prefix}-${v}.png`), fullPage: true });
    }
  }

  // Tab-Ansicht (breit)
  const tab = await openApp("tab", 1440, 900, "tab");
  await shootViews(tab, "tab");

  // Panel-Ansicht (400 × 800)
  const panel = await openApp("panel", 400, 800, "panel");
  await shootViews(panel, "panel");
  await panel.evaluate(() => { location.hash = "start"; });
  await sleep(500);
  await panel.click(".topbar-actions .icon-btn[aria-controls='drawer']");
  await sleep(400);
  const drawerOpen = await panel.$eval("#drawer", (d) => d.classList.contains("is-open"));
  ok("Panel: ausklappbares Menü öffnet sich", drawerOpen);
  await panel.screenshot({ path: path.join(SHOTS, "panel-menu-open.png") });
  await panel.click("#drawer .nav-item[data-view='quiz']");
  await sleep(500);
  ok("Panel: Menüpunkt navigiert", (await panel.evaluate(() => location.hash)) === "#quiz");

  // Generator: alle Vorlagen × Werkzeuge über die Oberfläche
  await tab.bringToFront();
  await tab.evaluate(() => { location.hash = "generator"; });
  await sleep(700);
  const genCheck = await tab.evaluate(async () => {
    const out = [];
    const chips = Array.from(document.querySelectorAll(".chips .chip"));
    for (let i = 0; i < chips.length; i++) {
      document.querySelectorAll(".chips .chip")[i].click();
      for (let j = 0; j < 3; j++) {
        document.querySelectorAll(".seg button")[j].click();
        const txt = document.querySelector(".codebox pre").textContent;
        out.push({ tpl: document.querySelectorAll(".chips .chip")[i].textContent, tool: document.querySelectorAll(".seg button")[j].textContent, len: txt.length, bad: /undefined|\{\{|null/.test(txt) });
      }
    }
    return out;
  });
  const genBad = genCheck.filter((g) => g.bad || g.len < 400);
  ok(`Generator: ${genCheck.length} Kombinationen (Vorlage × Werkzeug) ohne leere Texte, undefined oder {{`, genCheck.length === 30 && genBad.length === 0, genBad.map((g) => `${g.tpl}/${g.tool}`).join(", "));
  // Eingabe → Vorschau
  await tab.evaluate(() => { document.querySelectorAll(".chips .chip")[0].click(); });
  await tab.type("#f-firma", "Praxis am Sonnenweg");
  await sleep(200);
  const hasName = await tab.$eval(".codebox pre", (p) => p.textContent.includes("Praxis am Sonnenweg"));
  ok("Generator: Eingabe erscheint live in der Vorschau", hasName);
  const insertState = await tab.$eval(".actions .btn-secondary", (b) => ({ disabled: b.disabled, text: b.textContent }));
  ok("Generator: Einfügen ist im Tab ohne KI-Seite deaktiviert", insertState.disabled, insertState.text);
  await tab.evaluate(() => Array.from(document.querySelectorAll(".actions .btn")).find((b) => b.textContent.includes("Merken")).click());
  await sleep(400);
  await tab.evaluate(() => { location.hash = "saved"; });
  await sleep(700);
  const savedCount = await tab.$$eval(".saved-item", (l) => l.length);
  ok("Merkliste: gemerkter Prompt erscheint", savedCount >= 1, `${savedCount} Einträge`);
  await tab.screenshot({ path: path.join(SHOTS, "tab-saved-filled.png"), fullPage: true });
  await tab.evaluate(() => document.querySelector(".saved-item button[aria-label='Löschen']").click());
  await sleep(400);
  ok("Merkliste: Löschen funktioniert", (await tab.$$eval(".saved-item", (l) => l.length)) === savedCount - 1);

  // Quiz: drei Pfade
  for (const [label, pick] of [["immer erste Antwort", () => 0], ["Ziel Bewerbungen", (qi) => (qi === 6 ? 2 : 1)], ["Live und Community", (qi) => [1, 2, 1, 2, 2, 2, 1][qi]]]) {
    await tab.evaluate(() => { location.hash = "about"; });
    await sleep(200);
    await tab.evaluate(() => { location.hash = "quiz"; });
    await sleep(600);
    const restart = await tab.evaluate(() => { const b = Array.from(document.querySelectorAll("button")).find((x) => x.textContent.includes("Quiz neu starten")); if (b) b.click(); return !!b; });
    if (restart) await sleep(300);
    for (let qi = 0; qi < 7; qi++) {
      await tab.evaluate((i) => document.querySelectorAll(".option")[i].click(), pick(qi));
      await sleep(120);
    }
    await sleep(500);
    const res = await tab.evaluate(() => ({ name: document.querySelector(".card h2 .hl")?.textContent, pages: document.querySelectorAll(".pages li").length, prompt: document.querySelector(".codebox pre")?.textContent.length || 0 }));
    ok(`Quiz (${label}) führt zu einem Ergebnis`, !!res.name && res.pages > 2 && res.prompt > 400, `${res.name}, ${res.pages} Seiten`);
  }
  await tab.screenshot({ path: path.join(SHOTS, "tab-quiz-result.png"), fullPage: true });
  await tab.evaluate(() => Array.from(document.querySelectorAll("button")).find((b) => b.textContent.includes("Im Generator öffnen")).click());
  await sleep(700);
  ok("Quiz: Start-Prompt wird in den Generator übernommen", (await tab.evaluate(() => location.hash)) === "#generator");

  // Prompt-Check
  await tab.evaluate(() => { location.hash = "promptcheck"; });
  await sleep(600);
  await tab.evaluate(() => { const t = document.getElementById("pc-text"); t.value = ""; });
  await tab.type("#pc-text", "Mach mir eine schöne Website für mein Café.");
  await sleep(600);
  const before = await tab.$eval("#pc-result .h2", (e) => e.textContent);
  await tab.evaluate(() => Array.from(document.querySelectorAll("#pc-result button")).find((b) => b.textContent.includes("Fehlendes ergänzen")).click());
  await sleep(500);
  const after = await tab.$eval("#pc-result .h2", (e) => e.textContent);
  const pcIssues = await layoutIssues(tab);
  ok("Prompt-Check-Ergebnis ohne Layoutfehler", pcIssues.length === 0, pcIssues.join("; "));
  ok("Prompt-Check: bewertet und ergänzt fehlende Vorgaben", before !== after, `${before} → ${after}`);
  await tab.screenshot({ path: path.join(SHOTS, "tab-promptcheck-result.png"), fullPage: true });

  // Seiten-Check auf echter Seite (vikitor.de) aus der Panel-Seite heraus
  const site = await browser.newPage();
  watch(site, "vikitor.de");
  await site.setViewport({ width: 1280, height: 900 });
  let siteLoaded = true;
  try { await site.goto("https://vikitor.de/", { waitUntil: "domcontentloaded", timeout: 30000 }); } catch (e) { siteLoaded = false; ok("vikitor.de laden", false, e.message); }
  if (siteLoaded) {
    await sleep(1500);
    await site.bringToFront();
    await panel.evaluate(() => { location.hash = "pagecheck"; });
    await sleep(600);
    await panel.evaluate(() => document.getElementById("page-run").click());
    try {
      await panel.waitForSelector("#page-result .check, #page-result .notice", { timeout: 20000 });
      const pc = await panel.evaluate(() => ({ score: document.querySelector(".ring span")?.textContent, items: document.querySelectorAll("#page-result .check").length, notice: document.querySelector("#page-result .notice")?.textContent, url: document.querySelector("#page-result .hint")?.textContent }));
      ok("Seiten-Check auf https://vikitor.de liefert Ergebnis", pc.items === 10, pc.notice || `Wert ${pc.score}/100, ${pc.items} Punkte, ${pc.url}`);
      await panel.bringToFront();
      await sleep(1200);
      await panel.screenshot({ path: path.join(SHOTS, "panel-pagecheck-vikitor.png"), fullPage: true });
    } catch (e) { ok("Seiten-Check auf https://vikitor.de liefert Ergebnis", false, e.message); }
  }

  // Einfügen in chatgpt.com (ohne Anmeldung, falls die Seite das Eingabefeld zeigt)
  const ai = await browser.newPage();
  await ai.setViewport({ width: 1280, height: 900 });
  try {
    await ai.goto("https://chatgpt.com/", { waitUntil: "domcontentloaded", timeout: 30000 });
    await sleep(6000);
    await ai.bringToFront();
    await panel.evaluate(() => { location.hash = "about"; });
    await sleep(200);
    await panel.evaluate(() => { location.hash = "generator"; });
    await sleep(1500);
    const btn = await panel.$eval(".actions .btn-secondary", (b) => ({ disabled: b.disabled, text: b.textContent }));
    ok("Generator erkennt chatgpt.com als aktiven Tab", !btn.disabled, btn.text);
    const challenge = await ai.evaluate(() => !document.querySelector("#prompt-textarea"));
    console.log(`INFO Echtes Einfügen auf chatgpt.com ${challenge ? "nicht testbar (kein Eingabefeld, Cloudflare-Prüfung im automatisierten Browser)" : "wird zusätzlich auf der echten Seite geprüft"}.`);
    if (!challenge && !btn.disabled) {
      await panel.evaluate(() => document.querySelector(".actions .btn-secondary").click());
      await sleep(1500);
      const inserted = await ai.evaluate(() => { const el = document.querySelector("#prompt-textarea") || document.querySelector("textarea"); return el ? (el.innerText || el.value || "") : ""; });
      ok("Einfügen auf dem echten chatgpt.com (ohne Anmeldung)", inserted.includes("# Auftrag"), inserted.slice(0, 50).replace(/\n/g, " ") || "Feld leer");
    }
    await ai.screenshot({ path: path.join(SHOTS, "chatgpt-real.png") });
  } catch (e) { ok("chatgpt.com erreichbar für Einfüge-Test", false, e.message); }

  // Einfügen mit nachgebauten Eingabefeldern unter den echten Domains (Anfragen werden lokal beantwortet,
  // es wird keine echte Seite geladen). Prüft Content-Script, Erkennung und Einfügen.
  const FIXTURES = {
    "https://claude.ai/new": { name: "Claude", html: '<!doctype html><html lang="de"><body><main><div class="ProseMirror" contenteditable="true" style="min-height:80px;border:1px solid #999"><p><br></p></div></main></body></html>', read: "document.querySelector('.ProseMirror').innerText" },
    "https://lovable.dev/projects/test": { name: "Lovable", html: '<!doctype html><html lang="de"><body><form><textarea id="chatinput" rows="4" style="width:400px"></textarea></form><script>window.__events=0;document.getElementById("chatinput").addEventListener("input",()=>window.__events++);</script></body></html>', read: "document.getElementById('chatinput').value + ' events:' + window.__events" }
  };
  for (const [url, fx] of Object.entries(FIXTURES)) {
    const fp = await browser.newPage();
    await fp.setRequestInterception(true);
    fp.on("request", (r) => {
      if (r.resourceType() === "document" && r.url() === url) r.respond({ status: 200, contentType: "text/html; charset=utf-8", body: fx.html });
      else r.abort();
    });
    await fp.goto(url, { waitUntil: "load" });
    await sleep(800);
    await fp.bringToFront();
    await panel.evaluate(() => { location.hash = "about"; });
    await sleep(200);
    await panel.evaluate(() => { location.hash = "generator"; });
    await sleep(1200);
    const b = await panel.$eval(".actions .btn-secondary", (x) => ({ disabled: x.disabled, text: x.textContent }));
    ok(`Generator erkennt ${fx.name} (nachgebaute Seite) als Ziel`, !b.disabled && b.text.includes(fx.name), b.text);
    await panel.evaluate(() => document.querySelector(".actions .btn-secondary").click());
    await sleep(1200);
    const got = await fp.evaluate(fx.read);
    ok(`Einfügen in ${fx.name}-Eingabefeld (nachgebaut) funktioniert`, got.includes("# Auftrag"), got.slice(0, 50).replace(/\n/g, " "));
    await fp.screenshot({ path: path.join(SHOTS, `insert-${fx.name.toLowerCase()}.png`) });
    await fp.close();
  }

  // Konsole
  const expected404 = (c) => c.includes("Failed to load resource") && c.includes("404") && c.includes("addon/content.json");
  const relevantAll = consoleIssues.filter((c) => c.startsWith("[tab]") || c.startsWith("[panel]"));
  const known = relevantAll.filter(expected404);
  const relevant = relevantAll.filter((c) => !expected404(c));
  ok("Keine Konsolenfehler in der Erweiterung (außer 404 der noch nicht gehosteten content.json)", relevant.length === 0, relevant.join(" | ") || `${known.length}× erwarteter 404 für https://vikitor.de/addon/content.json`);
} finally {
  await browser.close();
}

const failed = results.filter((r) => !r.pass);
fs.writeFileSync(path.join(root, "test/results.json"), JSON.stringify({ date: new Date().toISOString(), results, consoleIssues }, null, 2));
console.log(`\n${results.length - failed.length}/${results.length} Prüfungen bestanden.`);
process.exit(failed.length ? 1 : 0);
