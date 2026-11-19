import { h, icon } from "../ui.js";

// Pitch zum VIKITOR Shop (vikitor.de/shop): noch nicht offen, deshalb Warteliste. Keine Preise, keine Termine erfinden.
export const SHOP_ITEMS = [
  { t: "Premium-Addons", d: "Erweiterungen für Chrome mit mehr Vorlagen, Prüfungen und Abkürzungen für deinen Alltag." },
  { t: "Premium-Skills", d: "Fertige Claude-Code-Skills für Design, Mobil, SEO, Conversion und Livegang." },
  { t: "Premium-Templates", d: "Baupläne für Websites, Shops, Funnels und Nischen, die dein Agent direkt umsetzt." },
  { t: "Premium-Frameworks", d: "Komplette Regelwerke wie das VS Premium Vibecoding Framework." },
  { t: "Premium-Systeme", d: "Durchdachte Systeme für Vertrieb, Marketing und Abläufe in deinem Business." },
  { t: "Mentoring", d: "Ich begleite dich über Wochen, bis deine Website, dein Funnel oder dein Angebot steht." },
  { t: "Coaching", d: "Gezielte Einzelsitzungen zu deinem Projekt, deinem Werkzeug oder deiner Strategie." },
  { t: "Consulting", d: "Beratung für Unternehmen, die KI und Vibecoding sinnvoll einführen wollen." },
  { t: "Workshops", d: "Für Mitarbeiter, Selbstständige und Unternehmer, vor Ort oder online." },
  { t: "Done-for-you", d: "Du willst es nicht selbst bauen? Dann setzen wir deine Website, Funnels oder Systeme für dich um." }
];

export function shopPromo(ctx, compact = false) {
  return h("section", { class: "section promo shop-promo" },
    h("div", {},
      h("span", { class: "overline" }, icon("bag"), " VIKITOR Shop · bald"),
      h("h2", { style: { marginTop: "10px" } }, h("span", { class: "hl" }, "Mehr Premium kommt.")),
      h("p", {}, compact
        ? "Premium-Addons, Skills, Templates, Frameworks, Systeme, Mentoring, Workshops und Done-for-you. Trag dich jetzt auf die Warteliste ein."
        : "Im Shop findest du bald Premium-Addons, Skills, Templates, Frameworks und Systeme, dazu Mentoring, Coaching, Consulting, Workshops und Done-for-you. Wer auf der Warteliste steht, erfährt es zuerst.")),
    h("div", { class: "shop-actions" },
      h("a", { class: "btn btn-signal", href: ctx.links.warteliste.url, target: "_blank", rel: "noopener" }, "Auf die Warteliste", icon("arrow")),
      compact ? h("button", { class: "btn btn-ghost", type: "button", onclick: () => ctx.go("shop") }, "Was kommt?") : null));
}

export function viewShop(ctx) {
  return [
    h("header", { class: "vhead" },
      h("span", { class: "overline" }, "VIKITOR Shop · bald verfügbar"),
      h("h1", {}, h("span", { class: "hl nowrap" }, "Der VIKITOR Shop.")),
      h("p", {}, "Alles, was ich in den letzten Jahren für meine Kunden und für mich gebaut habe, wird nach und nach im Shop verfügbar. Von Premium-Werkzeugen für dein Vibecoding bis zur persönlichen Begleitung und Umsetzung, für Selbstständige, Unternehmer und ganze Teams.")),
    h("div", { class: "tiles shop-grid" }, SHOP_ITEMS.map((x) =>
      h("article", { class: "card tile" }, h("span", { class: "badge-soon" }, "bald"), h("h3", {}, x.t), h("p", {}, x.d)))),
    shopPromo(ctx),
    h("p", { class: "small subtle", style: { marginTop: "14px" } }, "Schon jetzt verfügbar: das VS Premium Vibecoding Framework und die Vorlagen-Bibliothek im Mitgliederbereich. ",
      h("a", { href: ctx.links.framework.url, target: "_blank", rel: "noopener" }, "Framework ansehen"))
  ];
}
