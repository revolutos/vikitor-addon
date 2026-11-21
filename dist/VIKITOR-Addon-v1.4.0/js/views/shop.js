import { h, icon } from "../ui.js";

// Premium-Angebot: Vibecoding 3.0 Masterclass (Fakten aus vikitor.de/angebot/vibecoding-masterclass/).
// Nur freigegebene Angaben verwenden, keine Preise oder Termine erfinden.
export const MASTERCLASS_POINTS = [
  "6 Monate persönliche Betreuung durch Viktor, inklusive WhatsApp",
  "4 Live-Workshop-Calls (je 2 bis 3 Stunden) und 6 Live-Support-Calls (je 1 Stunde)",
  "Mit Claude Code oder ChatGPT Codex, auf Mac oder Windows",
  "Ein persönliches Treffen zum Austausch und Netzwerken",
  "Lebenslanger Zugang zu Memberbereich, Software, Templates, Skills, Add-ons und Aufzeichnungen",
  "Premium in diesem Addon inklusive: Funnel-Vorlagen und Funnel-Hack"
];

/** Kompakter Hinweis auf die Masterclass (Startseite) */
export function shopPromo(ctx, compact = false) {
  return h("section", { class: "section promo shop-promo" },
    h("div", {},
      h("span", { class: "overline" }, icon("bag"), " Premium-Angebot"),
      h("h2", { style: { marginTop: "10px" } }, h("span", { class: "hl" }, "Vibecoding 3.0 Masterclass")),
      h("p", {}, compact
        ? "Dein eigenes Premium-Vibecoding-System, installiert und am Laufen, mit 6 Monaten persönlicher Betreuung. Premium in diesem Addon ist inklusive."
        : "Dein eigenes Premium-Vibecoding-3.0-System, installiert, eingerichtet und am Laufen. Du kaufst keine Videos, sondern 6 Monate direkte Betreuung, bis dein System auf deinem Rechner läuft.")),
    h("div", { class: "shop-actions" },
      h("a", { class: "btn btn-signal", href: ctx.links.masterclass.url, target: "_blank", rel: "noopener" }, "Zur Masterclass", icon("arrow")),
      compact ? h("button", { class: "btn btn-ghost", type: "button", onclick: () => ctx.go("shop") }, "Was ist drin?") : null));
}

export function viewShop(ctx) {
  const L = ctx.links;
  const free = [
    { t: "Kostenloser Live-Call", d: "Vibecoding 3.0 live mit Viktor: Ich zeige dir, wie aus einer Idee mit KI eine Webseite oder ein Funnel entsteht.", href: L.webinar.url, cta: "Platz sichern" },
    { t: "Business Blueprint", d: "Die komplette Anleitung zu Vibecoding 3.0 als Business, ohne Vorkenntnisse. Kostenlos freischalten.", href: L.blueprint.url, cta: "Gratis freischalten" },
    { t: "Werkzeug-Bundle", d: "Browser-Addon, VS MAC OS und VS WIN OS zusammen, im Gesamtwert von 297 €. Kostenlos.", href: L.kostenlos.url, cta: "Gratis sichern" },
    { t: "VIKITOR Shop", d: "Alle Angebote, Downloads und Pakete von Viktor an einem Ort.", href: L.shop.url, cta: "Zum Shop" }
  ];
  return [
    h("header", { class: "vhead" },
      h("span", { class: "overline" }, "Shop · Premium"),
      h("h1", {}, h("span", { class: "hl nowrap" }, "Der nächste Schritt.")),
      h("p", {}, "Alles in diesem Assistenten funktioniert kostenlos und ohne Anmeldung. Wenn du dein eigenes Vibecoding-System willst und dabei nicht allein bleiben möchtest, ist die Masterclass der direkte Weg.")),
    h("section", { class: "card is-strong stack" },
      h("span", { class: "overline" }, "Premium-Angebot"),
      h("h2", { class: "h2" }, h("span", { class: "hl" }, "Vibecoding 3.0 Masterclass")),
      h("p", { class: "muted" }, "Dein eigenes Premium-Vibecoding-3.0-System, installiert, eingerichtet und am Laufen. Mit persönlicher Betreuung durch Viktor Siemens."),
      h("ul", { class: "feat" }, MASTERCLASS_POINTS.map((f) => h("li", {}, icon("ok"), f))),
      h("p", { class: "small subtle" }, "1.500 € netto. Den Freischaltcode für Premium im Addon bekommst du nach der Buchung persönlich per WhatsApp."),
      h("div", { class: "actions" }, h("a", { class: "btn btn-signal", href: L.masterclass.url, target: "_blank", rel: "noopener" }, "Masterclass ansehen", icon("arrow")))),
    h("section", { class: "section stack" },
      h("h2", { class: "h2" }, "Kostenlos starten"),
      h("div", { class: "tiles" }, free.map((x) =>
        h("a", { class: "card tile hover-lift", href: x.href, target: "_blank", rel: "noopener" },
          h("span", { class: "tag is-signal", style: { justifySelf: "start", alignSelf: "flex-start", width: "fit-content" } }, x.t === "VIKITOR Shop" ? "Übersicht" : "gratis"), h("h3", {}, x.t), h("p", {}, x.d), h("span", { class: "small" }, x.cta + " →")))))
  ];
}
