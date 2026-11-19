// Seiten-Check: collectPageData wird per chrome.scripting.executeScript in die aktuelle Seite
// injiziert (nur auf Knopfdruck). Sie muss eigenständig sein (keine Verweise nach außen).
export async function collectPageData() {
  const q = (s) => document.querySelector(s);
  const meta = (n) => { const el = q(`meta[name="${n}" i]`); return el ? (el.getAttribute("content") || "") : null; };
  const viewport = meta("viewport");
  const title = (document.title || "").trim();
  const description = meta("description");
  const h1 = document.querySelectorAll("h1").length;
  const imgs = Array.from(document.images);
  const imgNoAlt = imgs.filter((i) => !i.hasAttribute("alt")).length;
  const ld = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
  const types = new Set();
  let ldErrors = 0;
  const collect = (o) => {
    if (!o || typeof o !== "object") return;
    if (Array.isArray(o)) { o.forEach(collect); return; }
    const t = o["@type"];
    if (typeof t === "string") types.add(t);
    else if (Array.isArray(t)) t.forEach((x) => typeof x === "string" && types.add(x));
    if (o["@graph"]) collect(o["@graph"]);
  };
  for (const s of ld) { try { collect(JSON.parse(s.textContent)); } catch (_) { ldErrors++; } }
  const lang = document.documentElement.getAttribute("lang") || "";
  const og = q('meta[property="og:image" i]');
  const canonical = q('link[rel="canonical" i]');
  let llms = { ok: false, status: 0 };
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    const r = await fetch("/llms.txt", { method: "GET", cache: "no-store", signal: ctrl.signal, credentials: "omit" });
    clearTimeout(timer);
    const ct = (r.headers.get("content-type") || "").toLowerCase();
    llms = { ok: r.ok && !ct.includes("text/html"), status: r.status };
  } catch (_) { llms = { ok: false, status: 0 }; }
  return {
    url: location.href, viewport, title, description, h1,
    images: imgs.length, imgNoAlt, ldCount: ld.length, ldErrors, ldTypes: Array.from(types).slice(0, 12),
    lang, ogImage: og ? (og.getAttribute("content") || "") : "", canonical: canonical ? (canonical.getAttribute("href") || "") : "", llms
  };
}

// Bewertung: eigene, einfache Gewichtung (Summe 100). Grün = volle Punkte, Gelb = halbe, Rot = keine.
export function scorePage(d) {
  const items = [];
  const add = (id, label, weight, status, detail, fix) => items.push({ id, label, weight, status, detail, fix });

  if (!d.viewport) add("viewport", "Viewport für Handys", 15, "bad", "Kein viewport-Meta-Tag gefunden.", "Ergänze <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"> im <head>.");
  else if (/width\s*=\s*device-width/i.test(d.viewport)) add("viewport", "Viewport für Handys", 15, "ok", "Vorhanden und auf Gerätebreite eingestellt.", "");
  else add("viewport", "Viewport für Handys", 15, "warn", `Vorhanden, aber ohne width=device-width („${d.viewport}“).`, "Setze width=device-width, initial-scale=1.");

  const tl = d.title.length;
  if (!tl) add("title", "Seitentitel", 10, "bad", "Kein Titel gefunden.", "Lege einen eindeutigen <title> mit 30 bis 60 Zeichen an.");
  else if (tl >= 30 && tl <= 60) add("title", "Seitentitel", 10, "ok", `${tl} Zeichen: „${d.title}“`, "");
  else add("title", "Seitentitel", 10, "warn", `${tl} Zeichen: „${d.title}“`, tl < 30 ? "Etwas kurz. Ergänze Angebot und Ort oder Marke (30 bis 60 Zeichen)." : "Etwas lang. Kürze auf 30 bis 60 Zeichen, damit nichts abgeschnitten wird.");

  const dl = d.description == null ? -1 : d.description.trim().length;
  if (dl <= 0) add("description", "Meta-Beschreibung", 10, "bad", "Keine Beschreibung gefunden.", "Ergänze <meta name=\"description\"> mit 70 bis 160 Zeichen, die den Nutzen der Seite erklären.");
  else if (dl >= 70 && dl <= 160) add("description", "Meta-Beschreibung", 10, "ok", `${dl} Zeichen.`, "");
  else add("description", "Meta-Beschreibung", 10, "warn", `${dl} Zeichen.`, dl < 70 ? "Etwas kurz. Ziel sind 70 bis 160 Zeichen." : "Etwas lang. Ziel sind 70 bis 160 Zeichen.");

  if (d.h1 === 1) add("h1", "Genau eine H1", 15, "ok", "Eine H1-Überschrift gefunden.", "");
  else if (d.h1 === 0) add("h1", "Genau eine H1", 15, "bad", "Keine H1-Überschrift gefunden.", "Die wichtigste Überschrift der Seite sollte als <h1> ausgezeichnet sein.");
  else add("h1", "Genau eine H1", 15, "warn", `${d.h1} H1-Überschriften gefunden.`, "Nutze genau eine H1 und für alle weiteren Überschriften H2 und H3.");

  if (d.imgNoAlt === 0) add("alt", "Alternativtexte für Bilder", 10, "ok", d.images ? `Alle ${d.images} Bilder haben ein alt-Attribut.` : "Keine Bilder auf der Seite.", "");
  else if (d.imgNoAlt <= Math.max(1, Math.round(d.images * 0.2))) add("alt", "Alternativtexte für Bilder", 10, "warn", `${d.imgNoAlt} von ${d.images} Bildern ohne alt-Attribut.`, "Ergänze kurze, beschreibende Alternativtexte (dekorative Bilder bekommen alt=\"\").");
  else add("alt", "Alternativtexte für Bilder", 10, "bad", `${d.imgNoAlt} von ${d.images} Bildern ohne alt-Attribut.`, "Ergänze kurze, beschreibende Alternativtexte (dekorative Bilder bekommen alt=\"\").");

  if (d.ldCount && !d.ldErrors && d.ldTypes.length) add("jsonld", "Strukturdaten (JSON-LD)", 10, "ok", `Gefunden: ${d.ldTypes.join(", ")}`, "");
  else if (d.ldCount) add("jsonld", "Strukturdaten (JSON-LD)", 10, "warn", d.ldErrors ? `${d.ldErrors} Block/Blöcke nicht lesbar.` : "Vorhanden, aber ohne erkennbaren Typ.", "Prüfe die JSON-LD-Blöcke auf gültige Syntax und einen @type.");
  else add("jsonld", "Strukturdaten (JSON-LD)", 10, "bad", "Keine Strukturdaten gefunden.", "Ergänze JSON-LD, zum Beispiel vom Typ Organization oder LocalBusiness, nur mit echten Angaben.");

  if (d.lang) add("lang", "Sprache angegeben", 10, "ok", `lang="${d.lang}"`, "");
  else add("lang", "Sprache angegeben", 10, "bad", "Kein lang-Attribut am <html>-Element.", "Setze zum Beispiel <html lang=\"de\">.");

  if (d.ogImage) add("og", "Vorschaubild (Open Graph)", 5, "ok", "og:image ist gesetzt.", "");
  else add("og", "Vorschaubild (Open Graph)", 5, "warn", "Kein og:image gefunden.", "Ergänze ein Vorschaubild (etwa 1200 × 630 px) für das Teilen in Netzwerken und Messengern.");

  if (d.canonical) add("canonical", "Canonical-Link", 5, "ok", d.canonical, "");
  else add("canonical", "Canonical-Link", 5, "warn", "Kein canonical-Link gefunden.", "Ergänze <link rel=\"canonical\" href=\"…\"> mit der bevorzugten Adresse der Seite.");

  if (d.llms && d.llms.ok) add("llms", "llms.txt", 10, "ok", "/llms.txt ist erreichbar.", "");
  else add("llms", "llms.txt", 10, "warn", d.llms && d.llms.status ? `/llms.txt nicht gefunden (Status ${d.llms.status}).` : "/llms.txt nicht erreichbar.", "Noch kein fester Standard, aber hilfreich: eine kurze Textdatei, die KI-Systemen erklärt, wer du bist und welche Seiten wichtig sind.");

  const total = items.reduce((s, i) => s + (i.status === "ok" ? i.weight : i.status === "warn" ? i.weight / 2 : 0), 0);
  return { score: Math.round(total), items };
}
