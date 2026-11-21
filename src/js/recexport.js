// Funnel-Hack-Aufnahme als ZIP im Format der Scan-Engine (~/Developer/vs-funnel-scan/SCHEMA.md, schemaVersion 1):
// funnelhack/funnel.json, design-tokens.css, index.html (Engine-Übersicht) und je Schritt steps/NN-slug/ mit
// Screenshots, page.json, text.md, design.json, tech.json. Läuft vollständig im Browser; es wird nichts hochgeladen.
// Was im Browser des Nutzers nicht messbar ist (Mobil-Emulation, Video, Server-Header, Cookie-Banner-Wahl), bleibt null/leer.
import { makeZip } from "./zip.js";
import { allSteps } from "./recdb.js";
import { slugify, pad2, normalizeUrl } from "./engine/util.js";
import { classifyStep, KIND_LABEL } from "./engine/flow.js";
import { toMarkdown } from "./engine/page.js";
import { mergeDesign, tokensCss } from "./engine/design.js";
import { mergeTech } from "./engine/tech.js";
import { renderReport } from "./engine/report.js";

export const SCHEMA_VERSION = 1;
export const ENGINE = { name: "vs-funnel-scan", version: "1.0.0" };

// Regeln wie RULES in vs-funnel-scan/lib/scan.mjs (Sätze 1–3 wörtlich), ergänzt um die Aufnahme-Regel des Addons
export const RULES = [
  "Sehr nah modellieren: gleicher Seitenablauf, gleiche Sektionsreihenfolge, gleiche Layout-Muster, ähnliche Design-Werte (Abstände, Schriftgrößen, Farbstimmung).",
  "Texte, Bilder, Logos, Markennamen, Kundenstimmen und Zahlen sind IMMER eigen – fremde Inhalte nie 1:1 übernehmen (Urheber- und Wettbewerbsrecht).",
  "Screenshots, Videos und text.md dienen nur der Analyse und gehören nie in Nachbau-Dateien; design-tokens.css ist ein Startpunkt, der im eigenen Brand angepasst wird.",
  "Aufnahme im VIKITOR-Addon: Der Nutzer klickt selbst durch den Funnel; Opt-ins füllt er selbst aus, keine echten Zahlungsdaten, nichts wird an einen Server gesendet."
];

const NOTE = "Nur zur Analyse. Texte, Bilder, Logos und Marken gehören dem Seitenbetreiber und werden nicht in Nachbau-Dateien übernommen.";

/** Ordnername wie in der Engine (captureStep in scan.mjs) */
export function stepId(url, index, prevUrl) {
  let base;
  try { base = new URL(url).pathname.split("/").filter(Boolean).pop(); } catch (_) { base = null; }
  try { if (base) base = decodeURIComponent(base); } catch (_) { /* roh lassen */ }
  if (prevUrl && normalizeUrl(prevUrl) === normalizeUrl(url)) base = "nach-absenden";
  else if (!base) base = index === 1 ? "start" : "seite";
  return `${pad2(index)}-${slugify(base)}`;
}
/** Kurzform für Tests und Altaufrufe */
export const slugOf = (url, n) => stepId(url, n, null);

/** Wie kam der Nutzer von der vorigen Seite hierher? CTA mit passendem Ziel, sonst „click“. */
function viaOf(prev, cur) {
  if (!prev) return { via: "start", label: null, cta: null };
  const target = normalizeUrl(cur.url);
  const cta = (prev.page?.ctas || []).find((c) => c.href && normalizeUrl(c.href) === target);
  if (cta) return { via: "cta", label: cta.text || null, cta };
  const form = (prev.page?.forms || []).find((f) => f.visible && f.hasSubmit && f.action && normalizeUrl(f.action) === target);
  if (form) return { via: "form-submit", label: form.submitText || "Formular absenden", cta: null };
  return { via: "click", label: null, cta: null };
}

function filesOf(device) {
  const d = device === "desktop", m = device === "mobile";
  return {
    desktop: d ? "desktop.png" : null,
    mobile: m ? "mobile.png" : null,
    aboveTheFold: { desktop: d ? "above-the-fold-desktop.png" : null, mobile: m ? "above-the-fold-mobile.png" : null },
    video: {},
    page: "page.json", text: "text.md", design: null, tech: "tech.json"
  };
}

/** Baut aus den gespeicherten Rohdaten alle Dateien im Engine-Format */
export function buildFunnel(state, raw, meta = {}) {
  const steps = [];
  const transitions = [];
  const warnings = [];
  const perStep = [];
  raw.forEach((r, i) => {
    const index = i + 1;
    const prev = raw[i - 1];
    const id = stepId(r.url, index, prev && prev.url);
    const { via, label } = viaOf(prev, r);
    const next = raw[i + 1];
    const nextVia = next ? viaOf(r, next) : null;
    const page = r.page || { url: r.url, title: r.title, headings: [], sections: [], ctas: [], forms: [], prices: [], scarcity: { countdowns: [], keywords: [] }, videos: [], popups: [], exitIntent: false, captcha: null, document: { width: null, height: r.pageHeight }, media: {} };
    const kind = classifyStep(page, { index, via });
    const files = filesOf(r.device || "desktop");
    if (r.design) files.design = "design.json";
    if (!r.tech) files.tech = null;
    const { textBlocks, bodyHash, ...pageOut } = page;
    const pageJson = {
      schemaVersion: SCHEMA_VERSION, step: index, id, kind, kindLabel: KIND_LABEL[kind] || kind, via,
      capturedAt: r.capturedAt,
      ...pageOut,
      popups: (r.popups && r.popups.length) ? r.popups : page.popups,
      consent: null,
      mobile: r.mobileFacts || null,
      note: NOTE
    };
    const designJson = r.design ? { schemaVersion: SCHEMA_VERSION, step: index, url: page.url, ...r.design, mobile: r.mobileType || null } : null;
    const techJson = r.tech ? { schemaVersion: SCHEMA_VERSION, step: index, ...r.tech } : null;
    const d = r.design || {};
    const t = r.tech || { builder: [], checkout: [], tracking: [], weight: {} };
    const stepWarnings = [...(r.warnings || [])];
    const primary = nextVia && nextVia.cta ? { text: nextVia.cta.text, href: nextVia.cta.href } : null;
    steps.push({
      index, id, dir: `steps/${id}`, url: page.url || r.url, title: page.title || r.title, kind, kindLabel: KIND_LABEL[kind] || kind,
      via, from: prev ? steps[i - 1].id : null, viaLabel: label,
      files,
      summary: {
        sections: (page.sections || []).map((s) => s.type),
        ctaCount: (page.ctas || []).length,
        primaryCta: primary,
        forms: (page.forms || []).filter((f) => f.visible).map((f) => ({ kind: f.kind, fields: (f.fields || []).filter((x) => x.visible).length, captcha: f.captcha })),
        prices: (page.prices || []).slice(0, 8).map((p) => ({ text: p.text, struck: p.struck })),
        countdown: (page.scarcity?.countdowns || []).some((c) => c.ticking),
        scarcity: page.scarcity?.keywords || [],
        videos: [...new Set((page.videos || []).map((v) => v.provider))],
        popups: (r.popups || []).filter((p) => p.kind !== "cookie").length,
        exitIntent: !!page.exitIntent,
        captcha: page.captcha ?? null,
        documentHeight: page.document?.height ?? r.pageHeight ?? null
      },
      design: {
        bg: d.colors?.roles?.background ?? null, text: d.colors?.roles?.text ?? null, accent: d.colors?.roles?.accent ?? null, button: d.colors?.roles?.buttonBg ?? null,
        headingFont: d.typography?.h1?.family || d.typography?.h2?.family || null, bodyFont: d.typography?.body?.family || null,
        h1: d.typography?.h1?.sizeMax ?? null, body: d.typography?.body?.size ?? null
      },
      tech: {
        builder: (t.builder || []).map((x) => x.name), checkout: (t.checkout || []).map((x) => x.name), tracking: (t.tracking || []).map((x) => x.name),
        lcp: t.performance?.lcp ?? null, mb: t.weight?.megabytes ?? null
      },
      warnings: stepWarnings,
      // Zusatzfelder des Addons (laut Schema erlaubt, Apps ignorieren Unbekanntes)
      viewport: r.viewport || null, truncated: !!r.truncated
    });
    if (i) transitions.push({ from: steps[i - 1].id, to: id, type: via, label });
    warnings.push(...stepWarnings.map((w) => `Schritt ${index}: ${w}`));
    perStep.push({ id, page: pageJson, text: toMarkdown(page), design: designJson, tech: techJson, raw: r });
  });
  const last = steps[steps.length - 1];
  const stop = last && last.kind === "checkout"
    ? { reason: "checkout", message: "Checkout erreicht – Aufnahme vor der Zahlung beendet.", step: last.id }
    : { reason: "aborted", message: "Aufnahme im Addon vom Nutzer beendet.", step: last ? last.id : null };
  const design = mergeDesign(raw.map((r) => (r.design ? { ...r.design, mobile: r.mobileType || null } : null)));
  const tech = mergeTech(raw.map((r) => r.tech).filter(Boolean));
  const created = state.started || (raw[0] && raw[0].capturedAt) || new Date().toISOString();
  const finished = state.ended || new Date().toISOString();
  const funnel = {
    schemaVersion: SCHEMA_VERSION,
    tool: { name: "vikitor-addon", version: meta.version || "", mode: "aufnahme", engine: ENGINE },
    startUrl: state.startUrl || (raw[0] && raw[0].url) || "",
    createdAt: created,
    finishedAt: finished,
    durationSec: Math.max(0, Math.round((Date.parse(finished) - Date.parse(created)) / 1000)) || 0,
    chrome: meta.chrome || null,
    options: { maxSteps: meta.maxSteps || 30, optin: false, mailbox: null, video: false, videoFormat: null, videoMaxSec: null, mailWaitSec: null },
    rules: RULES,
    steps,
    transitions,
    optin: { used: false, mailbox: null },
    stop,
    design,
    tech,
    warnings
  };
  const css = tokensCss(design, { startUrl: funnel.startUrl, date: funnel.createdAt });
  return { funnel, css, perStep };
}

/** Engine-Übersicht; Bild-Felder ohne Datei (z. B. kein Mobil-Screenshot im Browser) werden ausgeblendet */
export function indexHtml(funnel, css) {
  let html = renderReport(funnel, css).replace(/<figure(?: class="m")?><a href="[^"]*\/null"[\s\S]*?<\/figure>/g, "");
  // Vorschaubilder der Funnel-Karte: vorhandenes Bild statt fehlendem Gerät
  for (const s of funnel.steps) {
    const fold = s.files.aboveTheFold.desktop || s.files.aboveTheFold.mobile;
    if (fold) html = html.split(`src="${s.dir}/null"`).join(`src="${s.dir}/${fold}"`);
  }
  return html;
}

const json = (o) => JSON.stringify(o, null, 2) + "\n";

/** Baut das ZIP aus den lokal gespeicherten Schritten */
export async function buildRecordingZip(state = {}) {
  const raw = await allSteps();
  const meta = {
    version: (typeof chrome !== "undefined" && chrome.runtime?.getManifest?.().version) || "",
    chrome: ((typeof navigator !== "undefined" && navigator.userAgent.match(/Chrome\/[\d.]+/)) || [null])[0]
  };
  const { funnel, css, perStep } = buildFunnel(state, raw, meta);
  const files = [
    { name: "funnelhack/funnel.json", data: json(funnel) },
    { name: "funnelhack/design-tokens.css", data: css },
    { name: "funnelhack/index.html", data: indexHtml(funnel, css) }
  ];
  funnel.steps.forEach((s, i) => {
    const p = perStep[i];
    const dir = `funnelhack/${s.dir}`;
    const dev = s.files.desktop ? "desktop" : "mobile";
    files.push({ name: `${dir}/${s.files[dev]}`, data: p.raw.full }, { name: `${dir}/${s.files.aboveTheFold[dev]}`, data: p.raw.fold });
    files.push({ name: `${dir}/page.json`, data: json(p.page) }, { name: `${dir}/text.md`, data: p.text });
    if (p.design) files.push({ name: `${dir}/design.json`, data: json(p.design) });
    if (p.tech) files.push({ name: `${dir}/tech.json`, data: json(p.tech) });
  });
  return { blob: await makeZip(files), funnel };
}

export function zipName(state = {}) {
  const d = state.started ? new Date(state.started) : new Date();
  let host = "funnel";
  try { host = new URL(state.startUrl).hostname.replace(/^www\./, "").replace(/[^a-z0-9.-]/gi, ""); } catch (_) {}
  return `funnelhack-${host}-${d.toISOString().slice(0, 10)}.zip`;
}
