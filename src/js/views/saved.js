import { h, icon, toast, copyText } from "../ui.js";
import { getSaved, removeSaved } from "../store.js";

export async function viewSaved(ctx) {
  const list = h("div", { class: "saved" });
  const draw = (items) => {
    list.textContent = "";
    if (!items.length) {
      list.append(h("div", { class: "empty" }, h("b", {}, "Noch nichts gemerkt."),
        "Im Prompt-Generator und im Prompt-Check kannst du Prompts mit „Merken“ hier ablegen. Sie bleiben lokal in deinem Browser gespeichert.",
        h("div", { style: { marginTop: "16px" } }, h("button", { class: "btn btn-signal btn-sm", type: "button", onclick: () => ctx.go("generator") }, icon("wand"), "Zum Generator"))));
      return;
    }
    for (const s of items) {
      const item = h("article", { class: "card saved-item" },
        h("div", { class: "saved-head" },
          h("div", {}, h("h3", { class: "h3" }, s.title), h("span", { class: "hint" }, new Date(s.date).toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" }))),
          h("div", { class: "row", style: { flexWrap: "nowrap" } },
            h("button", { class: "btn btn-ghost btn-sm", type: "button", "aria-label": "Kopieren", onclick: async () => toast((await copyText(s.text)) ? "Kopiert." : "Kopieren nicht möglich.") }, icon("copy"), "Kopieren"),
            h("button", { class: "btn btn-ghost btn-sm", type: "button", "aria-label": "Löschen", title: "Löschen", onclick: async () => { draw(await removeSaved(s.id)); toast("Gelöscht."); } }, icon("trash")))),
        h("div", { class: "saved-text" }, s.text));
      item.querySelector(".saved-text").addEventListener("click", () => item.classList.toggle("is-open"));
      list.append(item);
    }
  };
  draw(await getSaved());
  return [
    h("header", { class: "vhead" },
      h("span", { class: "overline" }, "Merkliste"),
      h("h1", {}, h("span", { class: "hl nowrap" }, "Deine Prompts.")),
      h("p", {}, "Alles, was du dir gemerkt hast, liegt nur lokal in deinem Browser. Klick auf einen Text, um ihn ganz zu sehen.")),
    list
  ];
}
