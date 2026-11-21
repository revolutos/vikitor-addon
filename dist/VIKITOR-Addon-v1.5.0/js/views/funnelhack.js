import { h, icon } from "../ui.js";
import { get, set } from "../store.js";
import { getActiveTab, runFunnelCapture } from "../browser.js";
import { funnelPrompt } from "../funnel.js";
import { isUnlocked, premiumGate, promptActions } from "../premium.js";
import { recordingCard } from "./recording.js";

// Premium: Funnel-Hack. Erfasst die Struktur der offenen Seite und baut daraus einen Auftrag an die KI,
// der das Erfolgsmuster analysiert und mit eigenen Texten auf das eigene Angebot überträgt.
export async function viewFunnelHack(ctx) {
  if (!(await isUnlocked())) return premiumGate(ctx, "Funnel-Hack");
  const b = await get("funnelBrief", { angebot: "", zielgruppe: "", marke: "" });
  let data = null;
  const field = (key, label, ph, rows = 2) => {
    const id = "fh-" + key;
    const t = h("textarea", { class: "textarea", id, rows, placeholder: ph }); t.value = b[key] || "";
    t.addEventListener("input", () => { b[key] = t.value; set("funnelBrief", b); });
    return h("div", { class: "field" }, h("label", { for: id }, label), t);
  };
  const out = h("div", { class: "stack" });
  const note = h("p", { class: "hint", role: "status", "aria-live": "polite" });
  const btn = h("button", { class: "btn btn-signal", type: "button" }, icon("compass"), "Aktuelle Seite erfassen");
  btn.addEventListener("click", async () => {
    note.textContent = ""; out.textContent = "";
    const tab = await getActiveTab();
    if (!tab || tab.isSelf || !/^https?:/.test(tab.url || "")) { note.textContent = "Öffne die Seite oder den Funnel, den du analysieren willst, im aktiven Tab und nutze den Assistenten als Seitenleiste daneben."; return; }
    btn.disabled = true; note.textContent = "Erfasse die Seite …";
    const r = await runFunnelCapture(tab);
    btn.disabled = false;
    if (r.error || !r.data) { note.textContent = r.error || "Die Seite konnte nicht erfasst werden."; return; }
    data = r.data; note.textContent = "";
    const n = (t) => data.items.filter((i) => i.type === t).length;
    out.append(
      h("div", { class: "card is-strong stack-s" },
        h("span", { class: "overline" }, "Erfasst"),
        h("p", { class: "small", style: { wordBreak: "break-all" } }, data.url),
        h("p", { class: "small subtle" }, `${n("h1") + n("h2") + n("h3")} Überschriften · ${n("text") + n("punkt")} Textabschnitte · ${n("cta")} Buttons · ${n("formular")} Formulare · ${data.preise.length} Preise · ${data.links.length} Folgeseiten`)),
      h("div", { class: "card stack-s" },
        h("span", { class: "overline" }, "Dein Auftrag an die KI"),
        h("p", { class: "small subtle" }, "Enthält die Regeln (sehr nah modellieren, aber Texte, Bilder und Marke immer eigen, nichts erfinden), dein Briefing und die erfasste Struktur."),
        promptActions(ctx, () => funnelPrompt(data, b))),
      h("p", { class: "small subtle" }, "Tipp: Erfasse auch die Folgeseiten (Danke-Seite, Angebot) und gib sie nacheinander in denselben Chat oder dieselbe Sitzung in Claude Code oder Codex. In VS MAC OS legt der Funnel-Hack daraus direkt ein Projekt mit Aufgaben an."));
  });
  return [
    h("header", { class: "vhead" },
      h("span", { class: "overline" }, "Premium · Funnel-Hack"),
      h("h1", {}, h("span", { class: "hl nowrap" }, "Funnel-Hack.")),
      h("p", {}, "Öffne eine erfolgreiche Seite oder einen Funnel. Der Assistent erfasst Aufbau, Überschriften, Texte, Buttons, Formulare und Preise und baut daraus einen Auftrag, der das Erfolgsmuster auf dein Angebot überträgt. Oder du schneidest den ganzen Funnel mit, während du selbst durchklickst.")),
    h("div", { class: "card stack-s" },
      h("span", { class: "overline" }, "1 · Dein Briefing"),
      field("angebot", "Dein Angebot", "Was, für wen, Preis, Ergebnis"),
      field("zielgruppe", "Deine Zielgruppe", "Wen willst du erreichen?"),
      field("marke", "Deine Marke und Positionierung (optional)", "Wofür stehst du, wie klingst du?", 1)),
    h("div", { class: "card stack-s" },
      h("span", { class: "overline" }, "2 · Vorbild erfassen"),
      btn, note),
    out,
    recordingCard(ctx),
    h("p", { class: "small subtle" }, "Sehr nah modellieren: Seitenablauf, Sektionsreihenfolge, Layout-Muster und Design-Werte ja. Texte, Bilder, Logos, Markennamen, Kundenstimmen und Zahlen immer eigen, nie 1:1 übernehmen.")
  ];
}
