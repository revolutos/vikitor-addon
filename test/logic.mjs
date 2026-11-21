// Logik-Tests ohne Browser: Generator, Quiz, Prompt-Check, Datenprüfung.
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { buildPrompt } from "../src/js/generator.js";
import { evaluate } from "../src/js/quiz.js";
import { checkPrompt, completePrompt } from "../src/js/promptcheck.js";
import { scorePage } from "../src/js/pagecheck.js";

const root = new URL("../src/", import.meta.url);
const content = JSON.parse(fs.readFileSync(new URL("data/content.json", root), "utf8"));
const links = JSON.parse(fs.readFileSync(new URL("data/links.json", root), "utf8"));
let fails = 0;
const fail = (m) => { fails++; console.log("FEHLER:", m); };

// 1) Generator: 10 Vorlagen × 4 Werkzeuge (Claude Code, Codex, ChatGPT, Lovable), leer und voll ausgefüllt
const full = {};
for (const k of Object.keys(content.fields)) full[k] = k === "problem" ? "Das Menü öffnet sich nicht.\nNur auf dem iPhone." : `Test ${k}`;
let gen = 0;
if (content.templates.length !== 10) fail(`Erwartet 10 Vorlagen, gefunden ${content.templates.length}`);
for (const t of content.templates) for (const tool of Object.keys(content.tools)) for (const vals of [{}, full]) {
  const p = buildPrompt(content, t.id, tool, vals);
  gen++;
  if (!p || p.length < 400) fail(`${t.id}/${tool}: zu kurz`);
  if (/undefined|null|\{\{|\}\}|\[\[|\]\]|NaN|\?\./.test(p)) fail(`${t.id}/${tool}: enthält undefined/{{`);
  for (const must of ["390 px", "Erfinde keine", "Fragen", "prüf"]) if (!p.toLowerCase().includes(must.toLowerCase())) fail(`${t.id}/${tool}: Regel fehlt (${must})`);
  for (const f of t.fields) if (!content.fields[f]) fail(`${t.id}: Feld ${f} nicht definiert`);
}
console.log(`Generator: ${gen} Prompts erzeugt.`);
if (gen !== 80) fail(`Erwartet 80 Prompts (10 × 4 × 2), erzeugt ${gen}`);

// 1b) Werkzeuge: Codex arbeitet wie Claude Code im Projektordner (mit AGENTS.md), ChatGPT bleibt Planer und Texter
const TOOLS = ["claude", "codex", "chatgpt", "lovable"];
if (JSON.stringify(Object.keys(content.tools)) !== JSON.stringify(TOOLS)) fail(`Werkzeuge müssen ${TOOLS.join(", ")} sein, gefunden ${Object.keys(content.tools).join(", ")}`);
if (content.tools.codex?.label !== "Codex") fail("Codex braucht das Label „Codex“");
if (content.tools.chatgpt?.label !== "ChatGPT") fail("ChatGPT braucht das Label „ChatGPT“ (ohne Codex)");
for (const t of content.templates) {
  const cx = buildPrompt(content, t.id, "codex", full);
  const cc = buildPrompt(content, t.id, "claude", full);
  const gpt = buildPrompt(content, t.id, "chatgpt", full);
  if (!/Projektordner/.test(cx) || !/AGENTS\.md/.test(cx) || !/Dateien anlegen/.test(cx)) fail(`${t.id}/codex: kein Arbeitsauftrag im Projektordner mit AGENTS.md`);
  if (!/starte die Seite lokal/.test(cx)) fail(`${t.id}/codex: Prüfauftrag fehlt`);
  if (/Schreib keinen Code/.test(cx)) fail(`${t.id}/codex: darf nicht „Schreib keinen Code“ enthalten`);
  if (!/Schreib keinen Code/.test(gpt) || /Projektordner/.test(gpt)) fail(`${t.id}/chatgpt: muss Plan und Texte ohne Code bleiben`);
  if (cx.split("## Abschluss")[0].split("## So gehst du vor")[1] !== cc.split("## Abschluss")[0].split("## So gehst du vor")[1]) fail(`${t.id}/codex: Schritte und Regeln weichen von Claude Code ab`);
}
const cxGuide = content.guides.find((g) => g.id === "chatgpt-codex");
const cxText = JSON.stringify(cxGuide || {});
if (!/AGENTS\.md/.test(cxText) || !/~\/\.codex\/skills/.test(cxText) || !/\/skills/.test(cxText)) fail("Codex-Anleitung: AGENTS.md, ~/.codex/skills oder /skills fehlt");
const skillsView = fs.readFileSync(new URL("js/views/skills.js", root), "utf8");
if (!/~\/\.codex\/skills/.test(skillsView) || !/\/skills/.test(skillsView)) fail("Gratis-Skills: Anleitung für Codex fehlt");

// 2) Quiz: alle Antwortkombinationen
const qs = content.quiz.questions;
if (qs.length !== 7) fail("Quiz braucht 7 Fragen");
const counts = {};
let combos = 0;
const rec = (i, ans) => {
  if (i === qs.length) {
    const r = evaluate(content.quiz, ans);
    combos++;
    if (!r.funnel || !r.funnel.name || !r.funnel.pages.length) fail("Quiz ohne Ergebnis: " + ans.join(","));
    if (!content.templates.find((t) => t.id === r.funnel.template)) fail("Quiz-Vorlage fehlt: " + r.funnel.template);
    counts[r.id] = (counts[r.id] || 0) + 1;
    return;
  }
  for (let o = 0; o < qs[i].options.length; o++) rec(i + 1, [...ans, o]);
};
rec(0, []);
console.log(`Quiz: ${combos} Pfade geprüft, Verteilung:`, counts);
for (const k of content.quiz.order) if (!counts[k]) fail(`Funnel ${k} ist nie erreichbar`);

// 3) Prompt-Check
const weak = checkPrompt(content, "mach mir eine website");
const done = checkPrompt(content, completePrompt(content, "mach mir eine website"));
console.log(`Prompt-Check: schwach ${weak.hits}/${weak.total}, nach Ergänzen ${done.hits}/${done.total}`);
const goodPrompt = buildPrompt(content, "website", "claude", full);
const good = checkPrompt(content, goodPrompt);
console.log(`Prompt-Check eines generierten Prompts: ${good.hits}/${good.total}`, good.results.filter((r) => r.status !== "ok").map((r) => r.id));
if (good.hits < good.total) fail("Generierter Prompt besteht den eigenen Prompt-Check nicht vollständig");

// 4) Seiten-Check-Bewertung
const s1 = scorePage({ viewport: "width=device-width, initial-scale=1", title: "Physiotherapie in Hannover | Praxis am Sonnenweg", description: "x".repeat(120), h1: 1, images: 4, imgNoAlt: 0, ldCount: 1, ldErrors: 0, ldTypes: ["Organization"], lang: "de", ogImage: "a.png", canonical: "https://a.de/", llms: { ok: true, status: 200 } });
const s0 = scorePage({ viewport: null, title: "", description: null, h1: 0, images: 10, imgNoAlt: 10, ldCount: 0, ldErrors: 0, ldTypes: [], lang: "", ogImage: "", canonical: "", llms: { ok: false, status: 404 } });
console.log(`Seiten-Check-Bewertung: perfekt=${s1.score}, leer=${s0.score}`);
if (s1.score !== 100) fail("Perfekte Seite ergibt nicht 100");

// 5) Inhaltsregeln
const all = JSON.stringify(content) + JSON.stringify(links);
if (/mr\.?\s*lovable/i.test(all)) fail("Verbotener Name gefunden");
if (/whatsapp|wa\.me/i.test(all)) fail("WhatsApp-Bezug gefunden");
const EXPECT = {
  instagram: "https://www.instagram.com/viktorsiemens.business/", facebook: "https://www.facebook.com/viktorsiemens", facebookPrivat: "https://www.facebook.com/viktorsiemens90/", linkedin: "https://www.linkedin.com/in/viktor-siemens/",
  youtube: "https://www.youtube.com/@viktorsiemens?sub_confirmation=1",
  webinar: "https://vikitor.de/live/", masterclass: "https://vikitor.de/angebot/vibecoding-masterclass/", blueprint: "https://vikitor.de/blueprint/",
  kostenlos: "https://vikitor.de/kostenlos/", shop: "https://vikitor.de/shop/", news: "https://vikitor.de/news/"
};
for (const [k, u] of Object.entries(EXPECT)) if (links[k]?.url !== u) fail(`${k}: falsche oder fehlende Adresse`);
for (const [k, v] of Object.entries(links)) if (!v || !v.url) fail(`links.json: leerer Eintrag ${k}`);
if (links.warteliste) fail("links.json: Warteliste gibt es nicht mehr");

// 6) Quelltexte der Oberfläche: kein verbotener Name, „Webseite“ statt „Website“, keine Shop-bald- oder Warteliste-Texte
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(new URL(e.name + "/", dir)) : [new URL(e.name, dir)]);
const texts = walk(root).filter((u) => /\.(js|json|html)$/.test(u.pathname)).map((u) => [u.pathname.split("/src/")[1], fs.readFileSync(u, "utf8")]);
for (const [name, t] of texts) {
  if (/mr\.?\s*lovable/i.test(t)) fail(`${name}: verbotener Name`);
  if (/\bWebsite\b/.test(t)) fail(`${name}: „Website“ statt „Webseite“`);
  if (/Warteliste|Shop · bald|in Kürze im Shop/.test(t)) fail(`${name}: veralteter Shop-Text`);
}

// 7) Einheitliche Version: Manifest, package.json, content.json, Footer-Fallback, README
const ver = JSON.parse(fs.readFileSync(new URL("manifest.json", root), "utf8")).version;
const pkg = JSON.parse(fs.readFileSync(new URL("../package.json", root), "utf8")).version;
const appJs = fs.readFileSync(new URL("js/app.js", root), "utf8");
const readme = fs.readFileSync(new URL("../README.md", root), "utf8");
if (pkg !== ver) fail(`package.json ${pkg} ≠ Manifest ${ver}`);
if (content.version !== ver) fail(`content.json ${content.version} ≠ Manifest ${ver}`);
if (!appJs.includes(`|| "${ver}"`)) fail("Footer-Fallback in app.js passt nicht zur Version");
if (!readme.includes(`v${ver}`)) fail("README nennt die aktuelle Version nicht");
console.log(`Version überall ${ver}.`);

// 8) Funnel-Hack: Regeln „sehr nah modellieren, aber Texte/Bilder/Marke immer eigen“, ZIP-Format der Aufnahme
const { funnelPrompt } = await import("../src/js/funnel.js");
const fp = funnelPrompt({ url: "https://beispiel.de/", titel: "T", beschreibung: "", items: [{ type: "h1", text: "X" }], preise: [], links: [] }, { angebot: "A", zielgruppe: "Z", marke: "" });
for (const must of ["sehr nah", "Sektionsreihenfolge", "Layout-Muster", "IMMER eigen", "NIE fremde Texte", "Urheber- und Wettbewerbsrecht"]) if (!fp.includes(must)) fail(`Funnel-Hack-Prompt: „${must}“ fehlt`);
const { slugOf, funnelJson, indexHtml } = await import("../src/js/recexport.js");
const SLUGS = [["https://a.de/", 1, "01-start"], ["https://a.de/webinar/anmeldung?x=1", 2, "02-anmeldung"], ["https://a.de/Danke-Seite.html", 3, "03-danke-seite"], ["https://a.de/größe-ü", 12, "12-grosse-u"]];
for (const [u, n, want] of SLUGS) if (slugOf(u, n) !== want) fail(`slugOf(${u}) = ${slugOf(u, n)}, erwartet ${want}`);
const fj = funnelJson({ startUrl: "https://a.de/", started: "2026-11-21T10:00:00Z" }, [{ url: "https://a.de/", title: "Start", viewport: { width: 1280, height: 800, dpr: 2 } }, { url: "https://a.de/danke", title: "<Danke>", viewport: { width: 390, height: 800, dpr: 3 } }]);
if (fj.format !== "vikitor-funnelhack" || fj.steps[1].dir !== "steps/02-danke" || fj.steps[1].device !== "mobile" || fj.transitions.length !== 1) fail("funnel.json: Aufbau falsch");
if (!/immer eigen/.test(fj.rules)) fail("funnel.json: Regel fehlt");
if (indexHtml(fj).includes("<Danke>")) fail("index.html: Titel nicht maskiert");
const { makeZip, crc32 } = await import("../src/js/zip.js");
if (crc32(new TextEncoder().encode("123456789")) !== 0xcbf43926) fail("CRC32 falsch");
const zb = Buffer.from(await (await makeZip([{ name: "funnelhack/funnel.json", data: "{}" }, { name: "funnelhack/ä.txt", data: new Uint8Array([1, 2, 3]) }])).arrayBuffer());
const tmpZip = new URL("../test/.logic-test.zip", root);
fs.writeFileSync(tmpZip, zb);
try {
  const { execFileSync } = await import("node:child_process");
  const out = execFileSync("unzip", ["-t", fileURLToPath(tmpZip)]).toString();
  if (!/No errors/.test(out) || !/funnelhack\/.*\.txt/.test(out)) fail("ZIP ungültig: " + out);
} catch (e) { fail("ZIP ungültig: " + e.message); } finally { fs.rmSync(tmpZip, { force: true }); }
console.log("Funnel-Hack: Prompt-Regeln, Ordnernamen, funnel.json und ZIP geprüft.");

console.log(fails ? `\n${fails} Fehler` : "\nAlle Logik-Tests bestanden.");
process.exit(fails ? 1 : 0);
