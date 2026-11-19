// Logik-Tests ohne Browser: Generator, Quiz, Prompt-Check, Datenprüfung.
import fs from "node:fs";
import { buildPrompt } from "../src/js/generator.js";
import { evaluate } from "../src/js/quiz.js";
import { checkPrompt, completePrompt } from "../src/js/promptcheck.js";
import { scorePage } from "../src/js/pagecheck.js";

const root = new URL("../src/", import.meta.url);
const content = JSON.parse(fs.readFileSync(new URL("data/content.json", root), "utf8"));
const links = JSON.parse(fs.readFileSync(new URL("data/links.json", root), "utf8"));
let fails = 0;
const fail = (m) => { fails++; console.log("FEHLER:", m); };

// 1) Generator: 10 Vorlagen × 3 Werkzeuge, leer und voll ausgefüllt
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
for (const k of ["facebook", "linkedin", "youtube", "tiktok"]) if (links[k].url) fail(`${k} darf nicht befüllt sein`);

console.log(fails ? `\n${fails} Fehler` : "\nAlle Logik-Tests bestanden.");
process.exit(fails ? 1 : 0);
