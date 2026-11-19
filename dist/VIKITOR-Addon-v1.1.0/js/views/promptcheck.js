import { h, icon, toast, copyText, pitch } from "../ui.js";
import { checkPrompt, completePrompt } from "../promptcheck.js";
import { get, set, addSaved } from "../store.js";

const STATUS = { ok: "erfüllt", warn: "ausbaufähig", bad: "fehlt" };

export async function viewPromptCheck(ctx) {
  const C = ctx.content;
  const ta = h("textarea", { class: "textarea is-big", id: "pc-text", placeholder: "Füge hier deinen Prompt ein, zum Beispiel: „Baue mir eine Website für meine Praxis …“", "aria-label": "Dein Prompt" });
  ta.value = await get("lastPromptCheck", "");
  const result = h("div", { class: "stack", id: "pc-result", style: { marginTop: "24px" } });
  let timer;

  const run = () => {
    const text = ta.value;
    set("lastPromptCheck", text);
    result.textContent = "";
    if (!text.trim()) {
      result.append(h("p", { class: "hint" }, "Sobald du einen Prompt eingibst, siehst du hier, was schon drin ist und was fehlt."));
      return;
    }
    const r = checkPrompt(C, text);
    const missing = r.results.filter((x) => x.status !== "ok" && x.add).length;
    result.append(...[
      h("div", { class: "row", style: { justifyContent: "space-between" } },
        h("h2", { class: "h2" }, h("span", { class: r.hits === r.total ? "hl" : "" }, `${r.hits} von ${r.total} Punkten erfüllt`)),
        h("span", { class: "tag" + (r.hits === r.total ? " is-signal" : "") }, `${r.words} Wörter`)),
      h("ul", { class: "checks" }, r.results.map((x) => h("li", { class: `check ${x.status}` },
        h("span", { class: "dot", "aria-hidden": "true" }),
        h("div", {},
          h("div", { class: "check-title" }, h("b", {}, x.label), h("span", { class: "mono" }, STATUS[x.status])),
          x.status !== "ok" || x.id === "laenge" ? h("p", { class: x.status === "ok" ? "" : "fix" }, x.hint) : null)))),
      h("div", { class: "actions" },
        missing ? h("button", { class: "btn btn-signal", type: "button", onclick: () => { ta.value = completePrompt(C, ta.value); run(); toast("Fehlende Vorgaben ergänzt."); } }, icon("plus"), "Fehlendes ergänzen") : null,
        h("button", { class: missing ? "btn btn-ghost" : "btn btn-signal", type: "button", onclick: async () => { toast((await copyText(ta.value)) ? "Prompt kopiert." : "Kopieren nicht möglich."); } }, icon("copy"), "Kopieren"),
        h("button", { class: "btn btn-ghost", type: "button", onclick: async () => { await addSaved("Eigener Prompt (geprüft)", ta.value); toast("In der Merkliste gespeichert."); } }, icon("save"), "Merken")),
      missing ? h("p", { class: "hint" }, "„Fehlendes ergänzen“ hängt passende Sätze an deinen Prompt an. Lies sie kurz durch und passe die Stellen in Klammern an.") : null,
      pitch(C.pitch.promptcheck, ctx.links.framework.url, "Zum Framework")].filter(Boolean));
  };

  ta.addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(run, 250); });
  run();

  return [
    h("header", { class: "vhead" },
      h("span", { class: "overline" }, "Prompt-Check"),
      h("h1", {}, h("span", { class: "hl nowrap" }, "Ist dein Prompt gut?")),
      h("p", {}, "Füge deinen eigenen Prompt ein. Der Check läuft komplett in deinem Browser nach festen Regeln und zeigt dir, welche wichtigen Vorgaben schon enthalten sind und welche fehlen.")),
    h("div", { class: "field" }, h("label", { for: "pc-text" }, "Dein Prompt"), ta),
    result
  ];
}
