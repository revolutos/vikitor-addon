// Funnel-Hack-Aufnahme als ZIP: Ordner funnelhack/ mit funnel.json, steps/NN-slug/… und index.html (Übersicht, offline lesbar).
// Läuft vollständig im Browser; es wird nichts hochgeladen.
import { makeZip } from "./zip.js";
import { allSteps } from "./recdb.js";

export const FORMAT = "vikitor-funnelhack";
export const FORMAT_VERSION = 1;

export function slugOf(url, n) {
  let s = "";
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean).map((p) => { try { return decodeURIComponent(p); } catch (_) { return p; } });
    s = parts.length ? parts[parts.length - 1] : "start";
  } catch (_) { s = "seite"; }
  s = s.toLowerCase().replace(/\.(html?|php|aspx?)$/, "").normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .replace(/ß/g, "ss").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
  return `${String(n).padStart(2, "0")}-${s || "seite"}`;
}

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export function funnelJson(state, steps) {
  return {
    format: FORMAT,
    formatVersion: FORMAT_VERSION,
    source: "vikitor-addon",
    addonVersion: (typeof chrome !== "undefined" && chrome.runtime?.getManifest?.().version) || "",
    mode: "aufnahme",
    startUrl: state.startUrl || (steps[0] && steps[0].url) || "",
    started: state.started || null,
    ended: state.ended || null,
    rules: "Sehr nah modellieren (Seitenablauf, Sektionsreihenfolge, Layout-Muster, Design-Werte). Texte, Bilder, Logos, Markennamen, Kundenstimmen und Zahlen immer eigen; fremde Inhalte nie 1:1 übernehmen.",
    steps: steps.map((s, i) => ({
      n: i + 1,
      dir: `steps/${slugOf(s.url, i + 1)}`,
      url: s.url,
      title: s.title,
      capturedAt: s.capturedAt,
      device: s.viewport && s.viewport.width < 768 ? "mobile" : "desktop",
      viewport: s.viewport,
      pageHeight: s.pageHeight,
      truncated: !!s.truncated,
      files: ["desktop.png", "above-the-fold.png"]
    })),
    transitions: steps.slice(1).map((s, i) => ({ from: i + 1, to: i + 2, toUrl: s.url }))
  };
}

export function indexHtml(fj) {
  const cards = fj.steps.map((s, i) => `
    ${i ? '<div class="arrow" aria-hidden="true">→</div>' : ""}
    <article class="step">
      <a href="${esc(s.dir)}/desktop.png" target="_blank"><img src="${esc(s.dir)}/above-the-fold.png" alt="Schritt ${s.n}: ${esc(s.title)}" loading="lazy"></a>
      <div class="meta"><span class="n">${String(s.n).padStart(2, "0")}</span><b>${esc(s.title || "Ohne Titel")}</b></div>
      <p class="url">${esc(s.url)}</p>
      <p class="small"><a href="${esc(s.dir)}/desktop.png" target="_blank">Ganze Seite</a> · ${s.viewport ? `${s.viewport.width} px breit` : ""}${s.truncated ? " · gekürzt" : ""}</p>
    </article>`).join("");
  return `<!doctype html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Funnel-Hack: Aufnahme</title>
<style>
:root{--bg:#08090a;--card:#141517;--border:#232529;--text:#f2f3f4;--muted:#9da2a9;--signal:#c8ff3d}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:15px/1.55 "Inter Tight",system-ui,-apple-system,"Segoe UI",sans-serif;padding:32px 20px}
h1{margin:0 0 6px;font-size:32px;letter-spacing:-.02em}h1 span{color:var(--signal)}
.lead{color:var(--muted);margin:0 0 28px;max-width:760px}
.flow{display:flex;flex-wrap:wrap;gap:16px;align-items:center}
.step{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:12px;width:280px}
.step img{width:100%;height:180px;object-fit:cover;object-position:top;border-radius:8px;display:block;border:1px solid var(--border)}
.meta{display:flex;gap:8px;align-items:baseline;margin-top:10px}.n{color:var(--signal);font-family:ui-monospace,Menlo,monospace;font-size:12px}
.url{color:var(--muted);font-size:12px;word-break:break-all;margin:6px 0}.small{font-size:13px;margin:0}a{color:var(--signal)}
.arrow{color:var(--signal);font-size:26px}
.note{margin-top:32px;padding:14px 16px;border:1px solid var(--border);border-radius:12px;color:var(--muted);max-width:760px}
</style></head><body>
<h1>Funnel-Hack <span>Aufnahme</span></h1>
<p class="lead">${fj.steps.length} Seiten aufgenommen mit dem VIKITOR Vibecoding Assistent${fj.started ? ` am ${esc(new Date(fj.started).toLocaleString("de-DE"))}` : ""}. Start: ${esc(fj.startUrl)}</p>
<div class="flow">${cards}</div>
<p class="note">Regel: sehr nah modellieren (Seitenablauf, Sektionsreihenfolge, Layout-Muster, Design-Werte). Texte, Bilder, Logos, Markennamen, Kundenstimmen und Zahlen immer eigen; fremde Inhalte nie 1:1 übernehmen. Importieren in VS MAC OS oder VS WIN OS über „Aufnahme importieren“.</p>
</body></html>
`;
}

/** Baut das ZIP aus den lokal gespeicherten Schritten */
export async function buildRecordingZip(state = {}) {
  const steps = await allSteps();
  const fj = funnelJson(state, steps);
  const files = [{ name: "funnelhack/funnel.json", data: JSON.stringify(fj, null, 2) + "\n" }, { name: "funnelhack/index.html", data: indexHtml(fj) }];
  steps.forEach((s, i) => {
    const dir = "funnelhack/" + fj.steps[i].dir;
    files.push({ name: `${dir}/desktop.png`, data: s.full }, { name: `${dir}/above-the-fold.png`, data: s.fold });
  });
  return { blob: await makeZip(files), funnel: fj };
}

export function zipName(state = {}) {
  const d = state.started ? new Date(state.started) : new Date();
  let host = "funnel";
  try { host = new URL(state.startUrl).hostname.replace(/^www\./, "").replace(/[^a-z0-9.-]/gi, ""); } catch (_) {}
  return `funnelhack-${host}-${d.toISOString().slice(0, 10)}.zip`;
}
