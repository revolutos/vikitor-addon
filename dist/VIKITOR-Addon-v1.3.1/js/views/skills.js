import { h, icon, pitch, codebox } from "../ui.js";

export function viewSkills(ctx) {
  const base = ctx.links.skillsBase.url.replace(/\/?$/, "/");
  const cards = ctx.content.skills.map((s) => h("article", { class: "card hover-lift stack-s" },
    h("div", { class: "row", style: { justifyContent: "space-between" } }, h("span", { class: "tile-ic" }, icon("bolt")), h("span", { class: "tag is-signal" }, "gratis")),
    h("h3", { class: "h3" }, s.title),
    h("span", { class: "skill-cmd" }, s.id),
    h("p", { class: "muted small" }, s.desc),
    s.call ? h("p", { class: "hint" }, "Aufruf in Claude Code: ", h("b", {}, `„${s.call}“`)) : null,
    h("div", { class: "actions", style: { marginTop: "auto" } },
      h("a", { class: "btn btn-signal btn-sm", href: `${base}${s.id}.zip`, target: "_blank", rel: "noopener" }, icon("download"), "Herunterladen"))));

  const install = h("article", { class: "card is-strong stack-s" },
    h("span", { class: "tile-ic" }, icon("book")),
    h("h3", { class: "h3" }, "So installierst du einen Skill"),
    h("ol", { class: "reasons" },
      h("li", {}, "Lade die ZIP-Datei herunter und entpacke sie. Du erhältst einen Ordner mit dem Namen des Skills und darin eine Datei SKILL.md."),
      h("li", {}, "Lege den ganzen Ordner in deinen persönlichen Skill-Ordner (siehe unten). Gibt es den Ordner „skills“ noch nicht, legst du ihn an."),
      h("li", {}, "Starte Claude Code neu, damit es den Skill erkennt."),
      h("li", {}, "Ruf den Skill mit seinem Namen auf, zum Beispiel: „Nutze den Skill vikitor-mobil-check“.")));

  return [
    h("header", { class: "vhead" },
      h("span", { class: "overline" }, "Gratis-Skills für Claude Code"),
      h("h1", {}, h("span", { class: "hl nowrap" }, "Drei Skills geschenkt.")),
      h("p", {}, "Skills sind fertige Arbeitsanleitungen für deinen Agenten. Einmal installiert, erledigt Claude Code damit wiederkehrende Prüfungen gründlich und immer in derselben Qualität.")),
    h("div", { class: "tiles" }, cards, install),
    h("section", { class: "section stack" },
      h("h2", { class: "h2" }, "Wohin mit dem Ordner?"),
      codebox("Mac", "mkdir -p ~/.claude/skills\nmv ~/Downloads/vikitor-mobil-check ~/.claude/skills/"),
      codebox("Windows (PowerShell)", "mkdir \"$env:USERPROFILE\\.claude\\skills\" -Force\nMove-Item \"$env:USERPROFILE\\Downloads\\vikitor-mobil-check\" \"$env:USERPROFILE\\.claude\\skills\\\""),
      h("p", { class: "hint" }, "Der Ordner liegt danach unter ~/.claude/skills/vikitor-mobil-check/SKILL.md (Mac) beziehungsweise %USERPROFILE%\\.claude\\skills\\vikitor-mobil-check\\SKILL.md (Windows). Für die anderen Skills ersetzt du einfach den Namen. Möchtest du einen Skill nur für ein bestimmtes Projekt nutzen, kannst du ihn stattdessen in den Ordner .claude/skills/ innerhalb des Projekts legen.")),
    pitch(ctx.content.pitch.skills, ctx.links.framework.url, "Zum Framework")
  ];
}
