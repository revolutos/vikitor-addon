import { h, icon } from "../ui.js";
import { get, set } from "../store.js";
import { isUnlocked, loadVorlagen, premiumGate, promptActions } from "../premium.js";

// Premium: Vorlagen (Baupläne für Webseiten, Onepager, Leadpages, Funnels, Shops, Mitgliederbereiche) als fertiger Auftrag an die KI.
const KAT = [["alle", "Alle"], ["funnel", "Funnels"], ["leadpage", "Leadpages"], ["website", "Webseiten"], ["onepager", "Onepager"], ["shop", "Shops"], ["mitglieder", "Mitglieder"]];
const katName = (k) => (KAT.find((x) => x[0] === k) || [k, k])[1];
let filter = "funnel";

const ohneKopf = (md) => md.replace(/^---[\s\S]*?\n---\n?/, "").trim();

/** Einfache Darstellung des Bauplans (Überschriften, Listen, Tabellen) */
function mdBlock(md) {
  const box = h("div", { class: "md" });
  for (const raw of ohneKopf(md).split("\n")) {
    const l = raw.trim();
    if (!l) continue;
    if (l.startsWith("# ")) continue;
    if (l.startsWith("## ")) box.append(h("h3", {}, l.slice(3)));
    else if (l.startsWith("|")) { if (!/^\|[\s|:-]+\|$/.test(l)) box.append(h("p", { class: "md-row" }, l.replace(/^\||\|$/g, "").split("|").map((c) => c.trim()).join("  ·  "))); }
    else if (/^(\d+\.|-)\s/.test(l)) box.append(h("p", { class: "md-li" }, l.replace(/\*\*/g, "")));
    else box.append(h("p", {}, l.replace(/\*\*/g, "")));
  }
  return box;
}

export async function viewVorlagen(ctx) {
  if (!(await isUnlocked())) return premiumGate(ctx, "Funnel-Vorlagen");
  const vorlagen = (await loadVorlagen()) || [];
  const b = await get("vorlagenBrief", { angebot: "", zielgruppe: "" });
  const list = h("div", { class: "tiles" });
  const detail = h("div", { class: "stack" });

  const prompt = (v) => `# Auftrag: ${v.titel} bauen

Baue für mich „${v.titel}“ nach dem folgenden Bauplan. Erfinde keine Fakten, Zahlen, Bewertungen oder Versprechen; was fehlt, sammelst du als offene Frage. Mobil zuerst (390 px), dann Desktop. Arbeite in kleinen Schritten und prüfe nach jedem Schritt.

## Mein Briefing
- Angebot: ${b.angebot || "(fehlt, bitte erfragen)"}
- Zielgruppe: ${b.zielgruppe || "(fehlt, bitte erfragen)"}

## Vorgehen
1. Stelle mir zuerst die offenen Fragen aus „Fragen an den Kunden“, die mein Briefing nicht beantwortet.
2. Schreibe dann einen Plan: Seiten, Sektionen in Reihenfolge, Texte als erster Entwurf.
3. Setze danach Schritt für Schritt um.

## Bauplan
${ohneKopf(v.md)}
`;

  const show = (v) => {
    detail.textContent = "";
    const angebot = h("textarea", { class: "textarea", rows: 2, placeholder: "Dein Angebot (was, für wen, Preis, Ergebnis)" }); angebot.value = b.angebot;
    const ziel = h("textarea", { class: "textarea", rows: 2, placeholder: "Deine Zielgruppe" }); ziel.value = b.zielgruppe;
    const save = () => { b.angebot = angebot.value; b.zielgruppe = ziel.value; set("vorlagenBrief", b); };
    angebot.addEventListener("input", save); ziel.addEventListener("input", save);
    detail.append(
      h("div", { class: "card is-strong stack" },
        h("button", { class: "btn btn-ghost btn-sm", type: "button", onclick: () => { detail.textContent = ""; list.hidden = false; filters.hidden = false; } }, icon("back"), "Alle Vorlagen"),
        h("span", { class: "overline" }, katName(v.kategorie)),
        h("h2", { class: "h2" }, v.titel),
        h("p", { class: "subtle" }, v.kurz),
        h("label", { class: "small" }, "Dein Briefing (wird in den Auftrag übernommen)"), angebot, ziel,
        promptActions(ctx, () => prompt(v))),
      h("div", { class: "card" }, mdBlock(v.md)));
    list.hidden = true; filters.hidden = true;
    window.scrollTo({ top: 0 });
  };

  const draw = () => {
    list.textContent = "";
    for (const v of vorlagen.filter((x) => filter === "alle" || x.kategorie === filter)) {
      list.append(h("button", { class: "card tile hover-lift vorlage-tile", type: "button", onclick: () => show(v) },
        h("span", { class: "overline" }, katName(v.kategorie)), h("h3", { class: "vorlage-title" }, v.titel), h("p", {}, v.kurz)));
    }
    if (!list.children.length) list.append(h("p", { class: "small subtle" }, vorlagen.length ? "Keine Vorlage in diesem Bereich." : "Die Vorlagen konnten gerade nicht geladen werden."));
  };
  const filters = h("div", { class: "feed-filter" }, KAT.map(([id, label]) => h("button", { type: "button", class: filter === id ? "is-on" : "",
    onclick: (e) => { filter = id; filters.querySelectorAll("button").forEach((x) => x.classList.toggle("is-on", x === e.currentTarget)); draw(); } }, label)));
  draw();
  return [
    h("header", { class: "vhead" },
      h("span", { class: "overline" }, "Premium · Vorlagen"),
      h("h1", {}, h("span", { class: "hl nowrap" }, "Funnel-Vorlagen.")),
      h("p", {}, `${vorlagen.length} fertige Baupläne für Funnels, Leadpages, Webseiten, Shops und Mitgliederbereiche. Vorlage wählen, Briefing ergänzen und als Auftrag in Claude, ChatGPT oder Lovable einfügen.`)),
    filters, list, detail
  ];
}
