// Kopie aus ~/Developer/vs-funnel-scan/lib/report.mjs (Stand c44304c), unverändert bis auf Importpfade.
// Nicht hier ändern, sondern in der Engine und neu kopieren (scripts/sync-engine.mjs).
// funnelhack/index.html: lokale, offline lesbare Übersicht im VIKITOR-Look (dunkel, Limette #c8ff3d).
// Schriften Inter Tight / JetBrains Mono nur, wenn lokal installiert (keine Web-Fonts), sonst system-ui.
import { esc } from "./util.js";
import { KIND_LABEL } from "./flow.js";

export const STOP_LABEL = {
  checkout: "Checkout erreicht – Halt vor der Zahlung",
  "max-steps": "Maximale Schrittzahl erreicht",
  "no-next": "Kein weiterer Haupt-CTA",
  "optin-skipped": "Opt-in-Formular nicht ausgefüllt (ohne --optin)",
  "optin-manual": "Opt-in braucht Angaben, die nicht automatisch ausgefüllt werden",
  "optin-failed": "Opt-in konnte nicht abgeschickt werden",
  captcha: "CAPTCHA – bitte manuell im Addon weitermachen",
  aborted: "Abgebrochen",
  error: "Fehler",
};
const VIA_LABEL = { start: "Start", cta: "CTA", "form-submit": "Formular", "email-confirm": "E-Mail-Bestätigung", click: "Klick", popup: "Popup" };

const sw = (hex, label) =>
  `<span class="sw" title="${esc(hex)}"><i style="background:${esc(hex)}"></i><code>${esc(hex)}</code>${label ? `<em>${esc(label)}</em>` : ""}</span>`;
const chips = (arr, cls = "chip") => (arr || []).filter(Boolean).map((x) => `<span class="${cls}">${esc(x)}</span>`).join("");
const pathOf = (u) => {
  try {
    const x = new URL(u);
    return x.host + (x.pathname === "/" ? "" : x.pathname);
  } catch {
    return u;
  }
};

function videoBlock(step, dev) {
  const v = step.files?.video?.[dev];
  if (!v) return `<div class="vid empty">kein Video</div>`;
  const src = `${step.dir}/${v.file}`;
  if (v.format === "mp4")
    return `<video class="vid" src="${esc(src)}" controls muted playsinline preload="metadata" poster="${esc(`${step.dir}/above-the-fold-${dev}.png`)}"></video>`;
  return `<a class="vid frames" href="${esc(src)}" target="_blank" rel="noopener"><img src="${esc(`${step.dir}/above-the-fold-${dev}.png`)}" alt=""><span>▶ Bildfolge abspielen (${v.frames} Bilder, ${v.seconds}s)</span></a>`;
}

function stepArticle(s, i) {
  const sum = s.summary || {};
  const d = s.design || {};
  const t = s.tech || {};
  return `<article class="step reveal" id="${esc(s.id)}" style="--i:${i}">
  <header class="step-h"><span class="num">${String(s.index).padStart(2, "0")}</span><div><h3>${esc(KIND_LABEL[s.kind] || s.kind)}</h3>
  <a class="url" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(pathOf(s.url))}</a></div>
  <span class="via">${esc(VIA_LABEL[s.via] || s.via)}</span></header>
  <div class="shots">
    <figure><a href="${esc(`${s.dir}/${s.files.desktop}`)}" target="_blank"><img loading="lazy" src="${esc(`${s.dir}/${s.files.aboveTheFold.desktop}`)}" alt="Desktop ${s.index}"></a><figcaption>Desktop · <a href="${esc(`${s.dir}/${s.files.desktop}`)}" target="_blank">Ganzseite</a></figcaption></figure>
    <figure class="m"><a href="${esc(`${s.dir}/${s.files.mobile}`)}" target="_blank"><img loading="lazy" src="${esc(`${s.dir}/${s.files.aboveTheFold.mobile}`)}" alt="Mobil ${s.index}"></a><figcaption>Mobil · <a href="${esc(`${s.dir}/${s.files.mobile}`)}" target="_blank">Ganzseite</a></figcaption></figure>
  </div>
  <div class="vids">${videoBlock(s, "desktop")}${videoBlock(s, "mobile")}</div>
  <dl class="facts">
    <dt>Sektionen</dt><dd class="seq">${chips(sum.sections)}</dd>
    <dt>Haupt-CTA</dt><dd>${sum.primaryCta ? `„${esc(sum.primaryCta.text)}“ → <code>${esc(pathOf(sum.primaryCta.href || ""))}</code>` : "–"} <small>(${sum.ctaCount ?? 0} Links/Buttons)</small></dd>
    <dt>Formulare</dt><dd>${(sum.forms || []).map((f) => `${esc(f.kind)} · ${f.fields} Felder${f.captcha ? ` · CAPTCHA (${esc(f.captcha)})` : ""}`).join("<br>") || "–"}</dd>
    <dt>Preise</dt><dd>${(sum.prices || []).map((p) => (p.struck ? `<s>${esc(p.text)}</s>` : esc(p.text))).join(" · ") || "–"}</dd>
    <dt>Knappheit</dt><dd>${sum.countdown ? "Countdown läuft · " : ""}${esc((sum.scarcity || []).join(", ")) || (sum.countdown ? "" : "–")}</dd>
    <dt>Videos</dt><dd>${esc((sum.videos || []).join(", ")) || "–"}</dd>
    <dt>Popups</dt><dd>${sum.popups ? `${sum.popups} sichtbar` : "–"}${sum.exitIntent ? " · Exit-Intent-Hinweis" : ""}</dd>
    <dt>Design</dt><dd>${[d.bg && sw(d.bg, "BG"), d.text && sw(d.text, "Text"), d.accent && sw(d.accent, "Akzent"), d.button && sw(d.button, "Button")].filter(Boolean).join("")}<br><small>${esc(d.headingFont || "?")} ${d.h1 ? `· H1 ${d.h1}px` : ""} · ${esc(d.bodyFont || "?")} ${d.body ? `${d.body}px` : ""}</small></dd>
    <dt>Technik</dt><dd>${chips([...(t.builder || []), ...(t.checkout || [])], "chip t")}${chips(t.tracking, "chip k")}${t.lcp ? `<small> LCP ~${(t.lcp / 1000).toFixed(1)} s · ${t.mb} MB</small>` : ""}</dd>
    <dt>Dateien</dt><dd class="files"><a href="${esc(`${s.dir}/page.json`)}">page.json</a><a href="${esc(`${s.dir}/design.json`)}">design.json</a><a href="${esc(`${s.dir}/tech.json`)}">tech.json</a><a href="${esc(`${s.dir}/text.md`)}">text.md</a></dd>
  </dl>
  ${(s.warnings || []).length ? `<p class="warn">${s.warnings.map(esc).join("<br>")}</p>` : ""}
</article>`;
}

export function renderReport(funnel, tokensCssText) {
  const steps = funnel.steps || [];
  const host = pathOf(funnel.startUrl);
  const ds = funnel.design || {};
  const ts = funnel.tech || {};
  const r = ds.roles || {};
  const typoRows = ["h1", "h2", "h3", "body", "button"]
    .filter((k) => ds.typography?.[k])
    .map((k) => {
      const t = ds.typography[k];
      const mob = ds.mobile?.[k];
      return `<tr><th>${k.toUpperCase()}</th><td>${esc(t.family || "–")}</td><td>${t.size ? Math.round(t.size) + " px" : "–"}${mob ? ` <small>/ mobil ${Math.round(mob)} px</small>` : ""}</td><td>${t.weight ?? "–"}</td><td>${t.lineHeight ?? "–"}</td></tr>`;
    })
    .join("");
  const b = ds.button;
  const btnPreview = b
    ? `<span class="btnprev" style="background:${esc(b.bg || "transparent")};color:${esc(b.color || "#fff")};border-radius:${b.radius === "pill" ? "999px" : `${+b.radius || 0}px`};padding:${+b.paddingY || 10}px ${+b.paddingX || 18}px;font-size:${+b.fontSize || 16}px;font-weight:${+b.fontWeight || 600};${b.border ? `border:${esc(b.border.split(" ")[0])} solid ${esc(b.border.split(" ")[1] || "currentColor")};` : ""}${b.textTransform ? `text-transform:${esc(b.textTransform)};` : ""}">Dein Button-Text</span>`
    : "–";
  const map = steps
    .map((s, i) => {
      const tr = funnel.transitions?.find((x) => x.to === s.id);
      const arrow = i ? `<div class="arrow reveal" style="--i:${i}" title="${esc(tr?.label || "")}"><span>${esc(VIA_LABEL[tr?.type] || "")}</span></div>` : "";
      return `${arrow}<a class="node reveal ${s.kind === "checkout" ? "stop" : ""}" style="--i:${i}" href="#${esc(s.id)}"><img loading="lazy" src="${esc(`${s.dir}/${s.files.aboveTheFold.desktop}`)}" alt=""><b>${String(s.index).padStart(2, "0")} · ${esc(KIND_LABEL[s.kind] || s.kind)}</b><small>${esc(pathOf(s.url))}</small></a>`;
    })
    .join("");
  const stop = funnel.stop || {};
  const opt = funnel.optin || {};

  return `<!doctype html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Funnel-Hack · ${esc(host)}</title>
<style>
:root{--bg:#0b0b0c;--panel:#131315;--panel2:#1a1a1d;--line:#26262a;--text:#ededed;--muted:#9b9ba1;--lime:#c8ff3d;--warn:#ffb547;
--sans:"Inter Tight","Inter",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;--mono:"JetBrains Mono",ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;color-scheme:dark}
*{box-sizing:border-box}html{scroll-behavior:smooth;scroll-padding-top:72px}body{margin:0;background:var(--bg);color:var(--text);font:15px/1.55 var(--sans);-webkit-font-smoothing:antialiased}
a{color:inherit}code,small,.mono{font-family:var(--mono)}small{color:var(--muted);font-size:12px}
.top{position:fixed;inset:0 0 auto 0;z-index:10;display:flex;align-items:center;gap:20px;padding:14px max(16px,calc((100vw - 1200px)/2));background:rgba(11,11,12,.86);backdrop-filter:blur(12px);border-bottom:1px solid var(--line)}
.top b{font-weight:700;letter-spacing:-.01em}.top b i{color:var(--lime);font-style:normal}.top nav{display:flex;gap:16px;margin-left:auto;overflow-x:auto}.top nav a{text-decoration:none;color:var(--muted);font-size:14px;white-space:nowrap}.top nav a:hover{color:var(--lime)}
main{max-width:1200px;margin:0 auto;padding:96px 16px 64px}
.hero h1{font-size:clamp(34px,6vw,64px);line-height:1.02;letter-spacing:-.03em;margin:8px 0 12px;font-weight:700}.hero .key{color:var(--lime);font-size:clamp(18px,2.4vw,24px);font-weight:600;margin:0 0 8px}
.hero .meta{color:var(--muted);font-family:var(--mono);font-size:12px;display:flex;flex-wrap:wrap;gap:6px 16px}
section{margin-top:64px}h2{font-size:clamp(24px,3vw,34px);letter-spacing:-.02em;margin:0 0 20px}h2 span{color:var(--lime)}
.map{display:flex;flex-wrap:wrap;align-items:stretch;gap:0}.node{display:flex;flex-direction:column;gap:6px;width:200px;padding:10px;border:1px solid var(--line);border-radius:14px;background:var(--panel);text-decoration:none;transition:border-color .25s}
.node:hover{border-color:var(--lime)}.node img{width:100%;aspect-ratio:16/10;object-fit:cover;object-position:top;border-radius:8px;background:#000}.node b{font-size:13px}.node small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.node.stop{border-color:#4a2a2a}.arrow{display:flex;align-items:center;justify-content:center;min-width:64px;position:relative;color:var(--muted);font:11px var(--mono)}
.arrow::before{content:"";position:absolute;left:8px;right:8px;top:50%;height:1px;background:var(--lime);opacity:.6}.arrow::after{content:"";position:absolute;right:6px;top:calc(50% - 4px);border:4px solid transparent;border-left:7px solid var(--lime)}
.arrow span{position:relative;top:-14px;background:var(--bg);padding:0 4px}
.step{border:1px solid var(--line);border-radius:18px;background:var(--panel);padding:20px;margin-bottom:24px}.step-h{display:flex;gap:14px;align-items:flex-start;margin-bottom:16px}
.num{font:600 28px/1 var(--mono);color:var(--lime)}.step-h h3{margin:0;font-size:20px}.url{color:var(--muted);font:12px var(--mono);word-break:break-all}.via{margin-left:auto;font:11px var(--mono);border:1px solid var(--line);border-radius:999px;padding:3px 10px;color:var(--muted)}
.shots{display:grid;grid-template-columns:3fr 1fr;gap:14px}.shots figure{margin:0}.shots img{width:100%;border-radius:10px;border:1px solid var(--line);display:block;background:#000}.shots figcaption{font-size:12px;color:var(--muted);margin-top:6px}
.vids{display:grid;grid-template-columns:3fr 1fr;gap:14px;margin-top:14px}.vid{width:100%;border-radius:10px;border:1px solid var(--line);background:#000;display:block}.vid.empty{padding:16px;color:var(--muted);font-size:12px}
.vid.frames{position:relative;text-decoration:none}.vid.frames img{width:100%;display:block;opacity:.55;border-radius:10px}.vid.frames span{position:absolute;inset:auto 10px 10px;font:12px var(--mono);color:var(--lime)}
.facts{display:grid;grid-template-columns:130px 1fr;gap:8px 16px;margin:18px 0 0}.facts dt{color:var(--muted);font-size:13px}.facts dd{margin:0}.seq{display:flex;flex-wrap:wrap;gap:6px}
.chip{display:inline-block;font:11px var(--mono);padding:3px 9px;border-radius:999px;background:var(--panel2);border:1px solid var(--line);margin:0 4px 4px 0}.chip.t{border-color:#3d4a1a;color:var(--lime)}.chip.k{color:#cfcfd4}
.files a{font:12px var(--mono);margin-right:12px;color:var(--lime)}.warn{color:var(--warn);font-size:13px}
.sw{display:inline-flex;align-items:center;gap:6px;margin:0 12px 6px 0;font-size:12px}.sw i{width:22px;height:22px;border-radius:6px;border:1px solid #ffffff22;display:inline-block}.sw em{color:var(--muted);font-style:normal}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:20px}.panel{border:1px solid var(--line);border-radius:18px;background:var(--panel);padding:20px}
table{width:100%;border-collapse:collapse;font-size:13px}th,td{text-align:left;padding:7px 8px;border-bottom:1px solid var(--line)}th{color:var(--muted);font-weight:500}
pre{background:#0f0f11;border:1px solid var(--line);border-radius:12px;padding:14px;overflow:auto;font:12px/1.5 var(--mono);max-height:420px}
.rules li{margin-bottom:6px}.rules li::marker{color:var(--lime)}.btnprev{display:inline-block}
footer{color:var(--muted);font-size:12px;border-top:1px solid var(--line);margin-top:64px;padding-top:20px}
.reveal{animation:rv .6s cubic-bezier(.2,.7,.2,1) both;animation-delay:calc(var(--i,0)*90ms)}@keyframes rv{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.reveal{animation:none}html{scroll-behavior:auto}}
@media (max-width:760px){.top nav{display:none}.map{flex-direction:column}.node{width:100%}.node img{aspect-ratio:16/9}.arrow{min-height:44px;min-width:0}.arrow::before{left:50%;right:auto;top:6px;bottom:6px;width:1px;height:auto}.arrow::after{right:auto;left:calc(50% - 4px);top:auto;bottom:2px;border:4px solid transparent;border-top:7px solid var(--lime)}.arrow span{top:0;left:14px}
.shots,.vids,.grid2{grid-template-columns:1fr}.shots .m img,.vids .vid:last-child{max-width:260px}.facts{grid-template-columns:1fr}.facts dt{margin-top:8px}}
</style></head><body>
<header class="top"><b>Funnel<i>·</i>Hack</b><nav><a href="#karte">Karte</a><a href="#schritte">Schritte</a><a href="#design">Design</a><a href="#technik">Technik</a><a href="#regeln">Regeln</a></nav></header>
<main>
<div class="hero reveal"><small class="mono">VS Funnel-Scan · ${esc(funnel.tool?.version || "")}</small>
<h1>${esc(host)}</h1>
<p class="key">${steps.length} ${steps.length === 1 ? "Schritt" : "Schritte"} erfasst · ${esc(STOP_LABEL[stop.reason] || stop.reason || "")}</p>
<div class="meta"><span>${esc(funnel.createdAt)}</span><span>Start: ${esc(funnel.startUrl)}</span><span>Opt-in: ${opt.used ? "ja (Wegwerf-Postfach)" : "nein"}</span><span>Video: ${esc(funnel.options?.videoFormat || "aus")}</span></div>
${stop.message ? `<p>${esc(stop.message)}</p>` : ""}</div>

<section id="karte"><h2>Funnel-<span>Karte</span></h2><div class="map">${map}</div></section>

<section id="schritte"><h2>Schritte <span>im Detail</span></h2>${steps.map(stepArticle).join("\n")}</section>

<section id="design"><h2>Design-<span>Werte</span></h2>
<div class="grid2"><div class="panel"><h3>Farben</h3>
<p>${[r.background && sw(r.background, "Hintergrund"), r.surface && sw(r.surface, "Fläche"), r.text && sw(r.text, "Text"), r.heading && sw(r.heading, "Überschrift"), r.accent && sw(r.accent, "Akzent"), r.buttonBg && sw(r.buttonBg, "Button")].filter(Boolean).join("")}</p>
<p>${(ds.palette || []).map((p) => sw(p.hex, (p.share * 100).toFixed(1) + " %")).join("")}</p>
<h3>Button-Stil</h3><p>${btnPreview}</p><small>Vorschau mit eigenem Platzhaltertext.</small></div>
<div class="panel"><h3>Schrift</h3><table><tr><th></th><th>Familie</th><th>Größe</th><th>Gewicht</th><th>Zeilenhöhe</th></tr>${typoRows}</table>
<h3>Abstände</h3><p class="mono">Sektion oben ${ds.spacing?.sectionPaddingTop ?? "–"} px · unten ${ds.spacing?.sectionPaddingBottom ?? "–"} px · Container ${ds.spacing?.container ?? "–"} px · Gap ${ds.spacing?.gap ?? "–"} px</p>
<h3>Radien · Motion</h3><p class="mono">${(ds.radii || []).map((x) => (x.value === "pill" ? "pill" : x.value + "px")).join(" · ") || "–"}</p><p>${chips(ds.motion?.libraries)}${ds.motion?.easing ? `<small> ${esc(ds.motion.easing)}</small>` : ""}</p></div></div>
<div class="panel" style="margin-top:20px"><h3>design-tokens.css <small>(<a href="design-tokens.css">Datei</a>)</small></h3><pre>${esc(tokensCssText || "")}</pre></div>
</section>

<section id="technik"><h2>Technik & <span>Tracking</span></h2>
<div class="panel"><dl class="facts">
<dt>Baukasten</dt><dd>${chips(ts.builder, "chip t") || "–"}</dd><dt>Framework</dt><dd>${chips(ts.frameworks) || "–"}</dd>
<dt>Checkout</dt><dd>${chips(ts.checkout, "chip t") || "–"}</dd><dt>Tracking</dt><dd>${chips(ts.tracking, "chip k") || "–"}</dd>
<dt>Consent</dt><dd>${chips(ts.consent) || "–"}</dd><dt>E-Mail/CRM</dt><dd>${chips(ts.email) || "–"}</dd>
<dt>Sonstiges</dt><dd>${chips(ts.other) || "–"}</dd><dt>Hosting</dt><dd>${chips(ts.hosting) || "–"}</dd>
<dt>Ladezeit</dt><dd>${ts.lcpMedian != null ? `LCP ~${(ts.lcpMedian / 1000).toFixed(2)} s (Median)` : "–"} · ${ts.totalMegabytes ?? "–"} MB gesamt</dd></dl></div></section>

<section id="regeln"><h2>Regeln für den <span>Nachbau</span></h2><div class="panel"><ul class="rules">${(funnel.rules || []).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
${(funnel.warnings || []).length ? `<h3>Hinweise</h3><p class="warn">${funnel.warnings.map(esc).join("<br>")}</p>` : ""}</div></section>
<footer>Erstellt mit vs-funnel-scan ${esc(funnel.tool?.version || "")} · lokal und offline lesbar · Daten: <a href="funnel.json">funnel.json</a></footer>
</main></body></html>
`;
}
