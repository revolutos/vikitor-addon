// Funnel-Hack: collectFunnelData wird per chrome.scripting.executeScript in die aktuelle Seite injiziert (nur auf Knopfdruck).
// Sie muss eigenständig sein. Erfasst die Struktur der Seite in Lesereihenfolge, ohne Bilder oder Dateien zu laden.
export function collectFunnelData() {
  const clean = (s, n = 260) => (s || "").replace(/\s+/g, " ").trim().slice(0, n);
  const visible = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none"; };
  const items = [];
  let chars = 0;
  const push = (type, text, extra) => {
    if (!text || chars > 14000 || items.length > 220) return;
    const last = items[items.length - 1];
    if (last && last.type === type && last.text === text) return;
    items.push(extra ? { type, text, ...extra } : { type, text }); chars += text.length;
  };
  const isCta = (el) => el.matches("button, [role=button], input[type=submit]") || (el.tagName === "A" && (/btn|button|cta/i.test(el.className) || (el.textContent || "").trim().length < 40 && el.closest("section, header, main, form") && getComputedStyle(el).backgroundColor !== "rgba(0, 0, 0, 0)"));
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
  const seen = new WeakSet();
  for (let el = walker.currentNode; el; el = walker.nextNode()) {
    if (seen.has(el) || el.closest("script, style, noscript, svg, nav [aria-hidden=true]")) continue;
    const tag = el.tagName;
    if (/^H[1-4]$/.test(tag) && visible(el)) { push(tag.toLowerCase(), clean(el.textContent, 180)); el.querySelectorAll("*").forEach((c) => seen.add(c)); continue; }
    if (tag === "FORM" && visible(el)) {
      const fields = Array.from(el.querySelectorAll("input, select, textarea")).filter((f) => f.type !== "hidden").map((f) => clean(f.getAttribute("aria-label") || f.placeholder || (f.labels && f.labels[0] && f.labels[0].textContent) || f.name || f.type, 40)).filter(Boolean);
      push("formular", fields.slice(0, 10).join(" · ") || "Formular"); continue;
    }
    if ((tag === "A" || tag === "BUTTON" || el.getAttribute("role") === "button") && visible(el) && isCta(el)) { push("cta", clean(el.textContent || el.value, 60), tag === "A" ? { href: el.href } : undefined); el.querySelectorAll("*").forEach((c) => seen.add(c)); continue; }
    if ((tag === "P" || tag === "LI" || tag === "BLOCKQUOTE") && visible(el)) {
      const t = clean(el.textContent);
      if (t.length >= 25) push(tag === "BLOCKQUOTE" ? "zitat" : tag === "LI" ? "punkt" : "text", t);
      el.querySelectorAll("*").forEach((c) => seen.add(c));
    }
  }
  const prices = Array.from(new Set((document.body.innerText.match(/(\d{1,3}(?:[.\s]\d{3})*(?:,\d{2})?\s?(?:€|EUR)|€\s?\d[\d.,]*)/g) || []).map((s) => s.trim()))).slice(0, 12);
  const host = location.hostname;
  const links = Array.from(new Map(Array.from(document.querySelectorAll("a[href]")).filter((a) => { try { const u = new URL(a.href); return u.hostname === host && u.pathname !== location.pathname && !/\.(pdf|zip|jpg|png)$/i.test(u.pathname); } catch (_) { return false; } })
    .map((a) => [new URL(a.href).pathname, clean(a.textContent, 50)])).entries()).filter(([, t]) => t).slice(0, 15).map(([p, t]) => ({ pfad: p, text: t }));
  const meta = (n) => { const m = document.querySelector(`meta[name="${n}" i], meta[property="${n}" i]`); return m ? clean(m.getAttribute("content"), 300) : ""; };
  return { url: location.href, titel: clean(document.title, 160), beschreibung: meta("description") || meta("og:description"), items, preise: prices, links };
}

/** Baut aus Erfassung und Briefing den Funnel-Hack-Prompt (für Claude, ChatGPT oder Lovable). */
export function funnelPrompt(d, b) {
  const outline = d.items.map((i) => {
    const t = { h1: "H1", h2: "H2", h3: "H3", h4: "H4", text: "Text", punkt: "•", zitat: "Zitat", cta: "Button", formular: "Formular" }[i.type] || i.type;
    return `${t}: ${i.text}${i.href ? `  (→ ${i.href})` : ""}`;
  }).join("\n");
  const links = d.links.map((l) => `- ${l.text}: ${l.pfad}`).join("\n");
  return `# Auftrag: Funnel-Hack

Du bist erfahrener Funnel-Stratege und Werbetexter. Unten steht die erfasste Struktur einer erfolgreichen Seite (Vorbild). Analysiere das Erfolgsmuster und übertrage es auf MEIN Angebot.

## Regeln
- Übernimm Strategie, Aufbau, Dramaturgie und Psychologie. Übernimm NIE fremde Texte, Bilder, Logos, Markennamen, Kundenstimmen oder Zahlen. Alle Texte für mich neu und eigenständig schreiben.
- Erfinde keine Fakten, Zahlen, Bewertungen oder Versprechen. Was fehlt, sammelst du als offene Frage.
- Keine Einkommensversprechen. Schreib auf Deutsch, klar und konkret.

## Mein Briefing
- Angebot: ${b.angebot || "(fehlt, bitte als Frage aufnehmen)"}
- Zielgruppe: ${b.zielgruppe || "(fehlt, bitte als Frage aufnehmen)"}
- Marke und Positionierung: ${b.marke || "(offen)"}

## Liefere in dieser Reihenfolge
1. **Analyse des Vorbilds:** Ziel der Seite, Sektionen in Reihenfolge (Typ, Zweck, Kernaussage, Handlungsaufruf), Werbetext-Strategie (Hook, Versprechen, Problem, Einwände, Belege, Dringlichkeit), Positionierung, Zielgruppe, Angebot und Preisstruktur, vermutete Funnel-Schritte, Stärken und Schwächen.
2. **Adaption für mein Angebot:** Seitenplan und Sektionen in Reihenfolge mit neuen, eigenständigen Textentwürfen (Überschrift, Unterzeile, Kernaussagen, Button-Texte). Was ich bewusst besser oder anders mache.
3. **Offene Fragen** an mich.
4. **Umsetzung Schritt für Schritt** als nummerierte, prüfbare Aufgaben.

## Erfasstes Vorbild
- Adresse: ${d.url}
- Titel: ${d.titel}
- Beschreibung: ${d.beschreibung || "–"}
- Gefundene Preise: ${d.preise.length ? d.preise.join(", ") : "keine"}

### Struktur in Lesereihenfolge
${outline || "(keine Inhalte erkannt)"}

### Weitere Seiten des Funnels (gleiche Domain)
${links || "keine"}
`;
}
