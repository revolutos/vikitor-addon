import { h, pitch, codebox } from "../ui.js";

function block(b) {
  if (b.p) return h("p", {}, b.p);
  if (b.steps) return h("ol", {}, b.steps.map((s) => h("li", {}, s)));
  if (b.code) return codebox(b.label || "Befehl", b.code);
  if (b.note) return h("div", { class: "notice" }, b.note);
  return null;
}

export function viewGuides(ctx) {
  const items = ctx.content.guides.map((g, i) => {
    const item = h("div", { class: "acc-item", "data-guide": g.id });
    const body = h("div", { class: "acc-body", id: "g-" + g.id }, g.blocks.map(block));
    const btn = h("button", { class: "acc-btn", type: "button", "aria-expanded": "false", "aria-controls": "g-" + g.id,
      onclick: () => { const open = !item.classList.contains("is-open"); item.classList.toggle("is-open", open); btn.setAttribute("aria-expanded", String(open)); } },
      h("span", { class: "num" }, String(i + 1).padStart(2, "0")), h("span", {}, g.title), h("span", { class: "pm", "aria-hidden": "true" }, "+"));
    item.append(btn, body);
    return item;
  });
  return [
    h("header", { class: "vhead" },
      h("span", { class: "overline" }, "Anleitungen"),
      h("h1", {}, h("span", { class: "hl nowrap" }, "Schritt für Schritt.")),
      h("p", {}, "Von der Installation über das Terminal bis zur eigenen Domain. Jede Anleitung ist in Ruhe zum Nachmachen geschrieben, Befehle kannst du mit einem Klick kopieren.")),
    h("div", { class: "acc" }, items),
    pitch("Im VS Premium Vibecoding Framework geht es nach diesen Grundlagen weiter: mit über 25 Kapiteln vom ersten Projekt bis zum fertigen Funnel.", ctx.links.framework.url, "Zum Framework")
  ];
}
