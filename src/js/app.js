// VIKITOR Vibecoding Assistent – App-Gerüst: Layout (Seitenleiste oder Tab), Menü, Router.
import { h, icon, wordmark, reveal, socialRow } from "./ui.js";
import { loadContent, loadLinks } from "./data.js";
import { get } from "./store.js";
import { openInTab } from "./browser.js";
import { viewStart } from "./views/start.js";
import { viewGenerator } from "./views/generator.js";
import { viewQuiz } from "./views/quiz.js";
import { viewPromptCheck } from "./views/promptcheck.js";
import { viewPageCheck } from "./views/pagecheck.js";
import { viewSkills } from "./views/skills.js";
import { viewGuides } from "./views/guides.js";
import { viewSaved } from "./views/saved.js";
import { viewAbout } from "./views/about.js";
import { viewShop } from "./views/shop.js";
import { viewNeu, unreadCount } from "./views/neu.js";
import { viewVorlagen } from "./views/vorlagen.js";
import { viewFunnelHack } from "./views/funnelhack.js";
import { isUnlocked } from "./premium.js";

const VIEWS = [
  { id: "start", label: "Start", icon: "home", render: viewStart },
  { id: "neu", label: "Neu von VIKITOR", icon: "spark", render: viewNeu },
  { id: "generator", label: "Prompt-Generator", icon: "wand", render: viewGenerator },
  { id: "quiz", label: "Funnel-Quiz", icon: "compass", render: viewQuiz },
  { id: "promptcheck", label: "Prompt-Check", icon: "check", render: viewPromptCheck },
  { id: "pagecheck", label: "Seiten-Check", icon: "gauge", render: viewPageCheck },
  { id: "skills", label: "Gratis-Skills", icon: "bolt", render: viewSkills },
  { id: "guides", label: "Anleitungen", icon: "book", render: viewGuides },
  { id: "saved", label: "Merkliste", icon: "bookmark", render: viewSaved },
  { id: "vorlagen", label: "Funnel-Vorlagen", icon: "book", render: viewVorlagen, premium: true },
  { id: "funnelhack", label: "Funnel-Hack", icon: "compass", render: viewFunnelHack, premium: true },
  { id: "downloads", label: "Downloads", icon: "download", href: "https://vikitor.de/downloads/" },
  { id: "shop", label: "Shop · bald", icon: "bag", render: viewShop },
  { id: "about", label: "Über Viktor", icon: "user", render: viewAbout }
];

const params = new URLSearchParams(location.search);
const ctx = {
  mode: window.matchMedia("(max-width: 719px)").matches ? "panel" : "tab",
  inPanel: params.get("view") === "panel",
  welcome: params.get("welcome") === "1",
  content: null,
  links: null,
  gen: null,
  cleanup: [],
  views: VIEWS,
  go,
  current: () => currentView(),
  refreshBadge: () => refreshBadge()
};

function linkList(links, cls = "links") {
  const order = ["website", "downloads", "vsmacos", "shop", "webinar", "datenschutz"];
  return h("nav", { class: cls, "aria-label": "Links" },
    order.filter((k) => links[k] && links[k].url).map((k) => h("a", { href: links[k].url, target: "_blank", rel: "noopener" }, k === "webinar" ? "Live-Webinar" : links[k].label)));
}

/** Logo mit Untertitel: führt überall zurück zum Start (schließt dabei das Menü) */
function homeLink(cls, before) {
  return h("a", { class: `${cls} home-link`, href: "#start", title: "Zum Start", "aria-label": "VIKITOR – zum Start",
    onclick: (e) => { e.preventDefault(); if (before) before(); go("start"); } },
    wordmark(), h("span", { class: "by" }, "von Viktor Siemens"));
}

function footer() {
  return h("footer", { class: "foot" },
    homeLink("foot-brand"),
    linkList(ctx.links),
    socialRow(ctx.links),
    h("span", { class: "small subtle" }, `Version ${chrome.runtime?.getManifest?.().version || "1.0.0"} · kostenlos`));
}

/** Abschluss unter der Fußzeile: Positionierung mit Foto, Unterschrift und Webinar-CTA (wie auf vikitor.de) */
function ctaFoot() {
  const sec = h("section", { class: "sig", "aria-labelledby": "sig-h" },
    h("div", { class: "sig-photo", "aria-hidden": "true" }, h("img", { src: "img/viktor-experte.jpg", alt: "", loading: "lazy" })),
    h("div", { class: "sig-in" },
      h("span", { class: "overline sig-a" }, "Viktor Siemens · VIKITOR"),
      h("h2", { id: "sig-h", class: "sig-h sig-a" }, h("span", {}, "Der Nr. 1 Vibecoder"), h("span", {}, "Deutschlands.")),
      h("p", { class: "sig-sub sig-a" }, "Für KI-Webseiten und Funnels, die wirklich verkaufen. Und nichts davon sieht nach billiger KI aus."),
      h("ul", { class: "sig-facts sig-a" },
        h("li", {}, h("b", {}, "250+"), " Kunden"),
        h("li", {}, h("b", {}, "Top 100"), " Unternehmer 2024, ERFOLG Magazin"),
        h("li", {}, h("b", {}, "4 Jahre"), " intensiv mit KI")),
      h("div", { class: "sig-who sig-a" }, h("span", { class: "sig-name" }, "Viktor Siemens"), h("img", { class: "sig-sign", src: "img/signatur.png", alt: "Unterschrift von Viktor Siemens" })),
      h("div", { class: "sig-cta sig-a" },
        h("a", { class: "btn btn-signal", href: ctx.links.webinar.url, target: "_blank", rel: "noopener" }, "Kostenlosen Webinar-Platz sichern", icon("arrow")),
        h("span", { class: "small subtle" }, "Live-Webinar „Vibecoding 3.0“ · Mac oder Windows · ohne Vorkenntnisse")),
      h("div", { class: "sig-social sig-a" }, h("span", { class: "overline" }, "Folge mir"), socialRow(ctx.links))));
  const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { sec.classList.add("is-in"); io.disconnect(); } }, { threshold: 0.15 });
  io.observe(sec);
  return sec;
}

function navItems(onPick) {
  return VIEWS.map((v) => v.href
    // Menüpunkt, der direkt zur Webseite führt
    ? h("a", { class: "nav-item", href: v.href + "?utm_source=vikitor-addon&utm_medium=addon&utm_content=menue", target: "_blank", rel: "noopener", "data-view": v.id, onclick: () => onPick && onPick() },
        icon(v.icon), h("span", {}, v.label), h("span", { class: "nav-ext", "aria-hidden": "true" }, "↗"))
    : h("button", {
        class: "nav-item", type: "button", "data-view": v.id,
        onclick: () => { onPick && onPick(); go(v.id); }
      }, icon(v.icon), h("span", {}, v.label), v.premium ? h("span", { class: "nav-premium", title: "Premium" }, "PRO") : null));
}

/** Zähler ungelesener Beiträge am Menüpunkt „Neu von VIKITOR“ */
async function refreshBadge() {
  const n = await unreadCount().catch(() => 0);
  document.querySelectorAll('.nav-item[data-view="neu"]').forEach((b) => {
    b.querySelector(".nav-badge")?.remove();
    if (n > 0) b.append(h("span", { class: "nav-badge", "aria-label": `${n} neu` }, String(n)));
  });
}

let content, drawer, menuBtn;

function shell() {
  const app = document.getElementById("app");
  app.textContent = "";
  document.body.classList.toggle("is-panel", ctx.mode === "panel");

  const side = h("aside", { class: "side" },
    homeLink("side-brand"),
    h("nav", { class: "nav", "aria-label": "Hauptmenü" }, navItems()),
    h("div", { class: "side-foot" },
      h("a", { class: "side-cta", href: ctx.links.webinar.url, target: "_blank", rel: "noopener" },
        h("span", { class: "overline" }, h("span", { class: "live-dot" }), "Live"),
        h("b", {}, "Kostenloses Live-Webinar Vibecoding 3.0"),
        h("span", {}, "Platz sichern →"))));

  const closeMenu = () => { drawer.classList.remove("is-open"); menuBtn.setAttribute("aria-expanded", "false"); };
  menuBtn = h("button", { class: "icon-btn", type: "button", "aria-label": "Menü", "aria-expanded": "false", "aria-controls": "drawer",
    onclick: () => { const open = !drawer.classList.contains("is-open"); drawer.classList.toggle("is-open", open); menuBtn.setAttribute("aria-expanded", String(open)); } }, icon("menu"));
  const topbar = h("div", { class: "topbar" },
    homeLink("topbar-brand", closeMenu),
    h("div", { class: "topbar-actions" },
      ctx.inPanel ? h("button", { class: "icon-btn", type: "button", title: "Im großen Fenster öffnen", "aria-label": "Im großen Fenster öffnen", onclick: () => openInTab(currentView()) }, icon("expand")) : null,
      menuBtn));
  drawer = h("nav", { class: "drawer", id: "drawer", "aria-label": "Menü" }, h("div", { class: "nav" }, navItems(closeMenu)));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });

  content = h("div", { class: "content", id: "content" });
  const main = h("main", { class: "main" }, topbar, drawer, content, footer(), ctaFoot());
  app.append(side, main);
}

function currentView() {
  const id = location.hash.replace("#", "");
  return VIEWS.find((v) => v.id === id && !v.href) ? id : "start";
}

async function render() {
  const id = currentView();
  for (const fn of ctx.cleanup.splice(0)) { try { fn(); } catch (_) {} }
  document.querySelectorAll(".nav-item").forEach((b) => b.classList.toggle("is-on", b.dataset.view === id));
  const view = VIEWS.find((v) => v.id === id);
  content.textContent = "";
  const nodes = await view.render(ctx);
  const list = Array.isArray(nodes) ? nodes : [nodes];
  content.append(...list.filter(Boolean));
  reveal(list);
  window.scrollTo({ top: 0 });
  document.title = `${view.label} · VIKITOR Vibecoding Assistent`;
}

function go(id) {
  if (location.hash === "#" + id) render();
  else location.hash = id;
}

async function init() {
  ctx.links = await loadLinks();
  ctx.content = await loadContent();
  ctx.gen = await get("lastInputs", null) || { templateId: ctx.content.templates[0].id, tool: "claude", values: {} };
  shell();
  window.addEventListener("hashchange", render);
  // Layout richtet sich nach der Breite: schmal = Seitenleisten-Layout, breit = Tab-Layout mit Seitenmenü
  const mq = window.matchMedia("(max-width: 719px)");
  mq.addEventListener("change", () => {
    const m = mq.matches ? "panel" : "tab";
    if (m !== ctx.mode) { ctx.mode = m; shell(); render(); }
  });
  await render();
  refreshBadge();
  document.documentElement.dataset.ready = "1";
}

init().catch((e) => {
  console.error(e);
  document.getElementById("app").textContent = "Der Assistent konnte nicht geladen werden. Bitte öffne ihn erneut.";
});
