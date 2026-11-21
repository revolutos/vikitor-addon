import { h, icon, socialRow } from "../ui.js";

export function viewAbout(ctx) {
  const L = ctx.links;
  const features = ["25+ Kapitel vom ersten Prompt bis zum Funnel", "17 Skills für Claude Code", "Über 20 Prompt-Vorlagen", "Generator mit Projekt-Startpaket", "Vorlagen-Bibliothek", "Mitgliederbereich"];
  return [
    h("header", { class: "vhead" },
      h("span", { class: "overline" }, "Über Viktor"),
      h("h1", {}, h("span", { class: "hl nowrap" }, "Hallo, ich bin Viktor."))),
    h("section", { class: "about" },
      h("img", { class: "about-photo", src: "img/viktor.png", alt: "Viktor Siemens", width: 256, height: 256 }),
      h("div", { class: "about-text stack" },
        h("p", {}, "Ich bin Viktor Siemens, der Nr. 1 Vibecoder Deutschlands für KI-Webseiten und Funnels, die wirklich verkaufen. Seit vier Jahren arbeite ich intensiv mit KI und seit einem Jahr bin ich voll auf Vibecoding, ohne selbst eine Zeile Code zu schreiben. Über 250 Kunden haben mir bisher ihr Business anvertraut, und das ERFOLG Magazin hat mich 2024 zu den Top 100 Unternehmern gezählt."),
        h("p", {}, "Diesen Assistenten habe ich gebaut, damit du die Werkzeuge, die ich jeden Tag selbst benutze, kostenlos ausprobieren kannst. Alles hier funktioniert ohne Kauf und ohne Anmeldung, und ich freue mich, wenn er dir bei deinem nächsten Projekt hilft."),
        h("img", { class: "signature", src: "img/signatur.png", alt: "Unterschrift Viktor Siemens", width: 591, height: 246 }),
        h("div", { class: "about-links" },
          h("div", { class: "links" },
            h("a", { href: L.website.url, target: "_blank", rel: "noopener" }, L.website.label),
            h("a", { href: L.webinar.url, target: "_blank", rel: "noopener" }, "Live-Call"),
            h("a", { href: L.masterclass.url, target: "_blank", rel: "noopener" }, "Masterclass"),
            h("a", { href: L.news.url, target: "_blank", rel: "noopener" }, "News")),
          socialRow(L)))),
    h("section", { class: "section card is-strong stack" },
      h("span", { class: "overline" }, "Der nächste Schritt"),
      h("h2", { class: "h2" }, h("span", { class: "hl" }, "VS Premium Vibecoding Framework")),
      h("p", { class: "muted" }, "Wenn du mehr willst als einzelne Prompts, ist das Framework der komplette Weg: ein durchdachtes System, mit dem dein Agent Webseiten und Funnels in gleichbleibender Qualität baut, von der ersten Idee bis zum Livegang."),
      h("ul", { class: "feat" }, features.map((f) => h("li", {}, icon("ok"), f))),
      h("div", { class: "actions" }, h("a", { class: "btn btn-signal", href: L.framework.url, target: "_blank", rel: "noopener" }, "Mehr erfahren auf vikitor.de", icon("arrow"))))
  ];
}
