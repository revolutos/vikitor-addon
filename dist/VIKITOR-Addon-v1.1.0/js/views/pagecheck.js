import { h, icon, pitch } from "../ui.js";
import { scorePage } from "../pagecheck.js";
import { getActiveTab, runPageCheck } from "../browser.js";

const STATUS = { ok: "gut", warn: "verbesserbar", bad: "fehlt" };

function ring(score) {
  const r = 40, c = 2 * Math.PI * r;
  const wrap = h("div", { class: "ring", role: "img", "aria-label": `Schnellcheck-Wert ${score} von 100` });
  wrap.innerHTML = `<svg viewBox="0 0 92 92" aria-hidden="true"><circle class="bg" cx="46" cy="46" r="${r}"/><circle class="fg" cx="46" cy="46" r="${r}" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${c.toFixed(1)}"/></svg>`;
  wrap.append(h("span", {}, String(score)));
  requestAnimationFrame(() => requestAnimationFrame(() => {
    wrap.querySelector(".fg").setAttribute("stroke-dashoffset", (c * (1 - score / 100)).toFixed(1));
  }));
  return wrap;
}

export function viewPageCheck(ctx) {
  const result = h("div", { class: "stack", id: "page-result" });
  const btn = h("button", { class: "btn btn-signal", type: "button", id: "page-run" }, icon("gauge"), "Aktuelle Seite prüfen");
  const note = h("p", { class: "hint" });

  const showData = (data) => {
    const s = scorePage(data);
    result.textContent = "";
    const parts = [
      h("div", { class: "card is-strong" },
        h("div", { class: "score" }, ring(s.score),
          h("div", { class: "stack-s" },
            h("span", { class: "overline" }, "Schnellcheck"),
            h("h2", { class: "h2" }, s.score >= 85 ? h("span", { class: "hl" }, "Solide Grundlagen") : s.score >= 60 ? "Gute Basis" : "Viel Luft nach oben"),
            h("p", { class: "hint", style: { wordBreak: "break-all" } }, data.url)))),
      h("div", { class: "legend" }, h("span", {}, h("i", { style: { background: "var(--signal)" } }), "gut"), h("span", {}, h("i", { style: { background: "var(--warn)" } }), "verbesserbar"), h("span", {}, h("i", { style: { background: "var(--danger)" } }), "fehlt")),
      h("ul", { class: "checks" }, s.items.map((x) => h("li", { class: `check ${x.status}` },
        h("span", { class: "dot", "aria-hidden": "true" }),
        h("div", {},
          h("div", { class: "check-title" }, h("b", {}, x.label), h("span", { class: "mono" }, `${STATUS[x.status]} · ${x.weight} P.`)),
          h("p", {}, x.detail),
          x.fix ? h("p", { class: "fix" }, x.fix) : null)))),
      h("p", { class: "hint" }, "Der Wert ist eine eigene, einfache Gewichtung von zehn technischen Grundlagen. Er ist ein Schnellcheck und keine vollständige SEO-Analyse und sagt nichts darüber aus, wie eine Seite bei Google rankt."),
      pitch(ctx.content.pitch.pagecheck, ctx.links.framework.url, "Zum Framework")
    ];
    parts.forEach((p, i) => { p.classList.add("rv"); p.style.setProperty("--i", String(i)); });
    result.append(...parts);
  };

  btn.addEventListener("click", async () => {
    result.textContent = "";
    const tab = await getActiveTab();
    if (!tab || tab.isSelf) {
      result.append(h("div", { class: "notice" }, h("b", {}, "Keine Website ausgewählt. "),
        "Öffne die Seite, die du prüfen möchtest, in einem Tab, klicke dort auf das VIKITOR-Symbol, damit sich die Seitenleiste öffnet, und starte den Check dann dort."));
      return;
    }
    btn.disabled = true;
    btn.lastChild.textContent = "Prüfe …";
    const r = await runPageCheck(tab);
    btn.disabled = false;
    btn.lastChild.textContent = "Erneut prüfen";
    if (r.error || !r.data) {
      result.append(h("div", { class: "notice" }, h("b", {}, "Das hat nicht geklappt. "), r.error || "Die Seite hat keine Daten geliefert."));
      return;
    }
    showData(r.data);
  });

  note.textContent = ctx.inPanel
    ? "Geprüft wird die Seite im aktiven Tab. Der Assistent liest dabei nur die unten genannten technischen Angaben aus und sendet nichts an einen Server."
    : "Tipp: Der Seiten-Check prüft die Seite im aktiven Tab. Am einfachsten startest du ihn in der Seitenleiste neben der Website, die du prüfen möchtest.";

  return [
    h("header", { class: "vhead" },
      h("span", { class: "overline" }, "Seiten-Check"),
      h("h1", {}, h("span", { class: "hl nowrap" }, "Wie steht deine Seite da?")),
      h("p", {}, "Ein Schnellcheck der wichtigsten technischen Grundlagen: Handy-Darstellung, Titel, Beschreibung, Überschriften, Bilder, Strukturdaten, Sprache, Vorschaubild, Canonical und llms.txt.")),
    h("div", { class: "stack-s" }, h("div", { class: "actions" }, btn), note),
    result
  ];
}
