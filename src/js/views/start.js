import { h, icon } from "../ui.js";
import { shopPromo } from "./shop.js";

export function viewStart(ctx) {
  const tiles = [
    { id: "generator", icon: "wand", title: "Prompt-Generator", text: "Zehn Vorlagen für Claude Code, Codex, ChatGPT und Lovable, mit eingebauten Qualitätsregeln." },
    { id: "quiz", icon: "compass", title: "Funnel-Quiz", text: "Sieben Fragen, und du weißt, welcher Funnel zu deinem Angebot passt." },
    { id: "promptcheck", icon: "check", title: "Prompt-Check", text: "Prüft deinen eigenen Prompt und ergänzt fehlende Vorgaben mit einem Klick." },
    { id: "pagecheck", icon: "gauge", title: "Seiten-Check", text: "Ein Schnellcheck der technischen Grundlagen der Seite, die du gerade offen hast." }
  ];
  const out = [];
  if (ctx.welcome) {
    out.push(h("div", { class: "notice is-signal" },
      h("b", {}, "Schön, dass du da bist. "),
      "Damit du den Assistenten jederzeit griffbereit hast, klick in Chrome, Edge oder Brave oben rechts auf das Puzzle-Symbol (Erweiterungen) und hefte „VIKITOR Vibecoding Assistent“ an. Ein Klick auf das Symbol öffnet ihn dann als Seitenleiste neben jeder Webseite."));
  }
  out.push(h("header", { class: "vhead" },
    h("span", { class: "overline" }, "Vibecoding Assistent · kostenlos"),
    h("h1", {}, h("span", { class: "hl nowrap" }, "Willkommen.")),
    h("p", {}, "Das ist dein Vibecoding-Werkzeugkasten. Hier bekommst du saubere Prompts, findest den passenden Funnel, prüfst deine Seiten und lernst Schritt für Schritt, wie du mit Claude Code, Codex, ChatGPT und Lovable echte Webseiten baust, ohne selbst Code zu schreiben.")));
  out.push(h("div", { class: "tiles" }, tiles.map((t) =>
    h("button", { class: "card tile hover-lift", type: "button", onclick: () => ctx.go(t.id) },
      h("span", { class: "tile-ic" }, icon(t.icon)), h("h3", {}, t.title), h("p", {}, t.text)))));
  out.push(h("section", { class: "section promo" },
    h("div", {},
      h("span", { class: "overline" }, h("span", { class: "live-dot" }), "Kostenloser Live-Call"),
      h("h2", { style: { marginTop: "10px" } }, h("span", { class: "hl" }, "Vibecoding 3.0 live erleben")),
      h("p", {}, "Ich zeige dir live, wie aus einer Idee mit KI eine Webseite oder ein Funnel entsteht, der wirklich verkauft, und beantworte deine Fragen direkt.")),
    h("a", { class: "btn btn-signal", href: ctx.links.webinar.url, target: "_blank", rel: "noopener" }, "Kostenlosen Platz sichern", icon("arrow"))));
  out.push(h("section", { class: "section tiles" },
    h("button", { class: "card tile hover-lift", type: "button", onclick: () => ctx.go("skills") },
      h("span", { class: "tile-ic" }, icon("bolt")), h("h3", {}, "Gratis-Skills"), h("p", {}, "Drei fertige Skills für Claude Code und Codex: Mobil-Check, SEO-Basis und Launch-Check.")),
    h("button", { class: "card tile hover-lift", type: "button", onclick: () => ctx.go("guides") },
      h("span", { class: "tile-ic" }, icon("book")), h("h3", {}, "Anleitungen"), h("p", {}, "Von der Installation über Git bis zur eigenen Domain, verständlich erklärt.")),
    h("a", { class: "card tile hover-lift", href: ctx.links.blueprint.url, target: "_blank", rel: "noopener" },
      h("span", { class: "tile-ic" }, icon("download")), h("h3", {}, "Business Blueprint"), h("p", {}, "Die komplette Anleitung zu Vibecoding 3.0 als Business, kostenlos freischalten.")),
    h("a", { class: "card tile hover-lift", href: ctx.links.kostenlos.url, target: "_blank", rel: "noopener" },
      h("span", { class: "tile-ic" }, icon("bolt")), h("h3", {}, "Werkzeug-Bundle"), h("p", {}, "Browser-Addon, VS MAC OS und VS WIN OS zusammen, kostenlos im Wert von 297 €."))));
  out.push(shopPromo(ctx, true));
  return out;
}
