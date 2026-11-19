// VIKITOR Vibecoding Assistent – App-Gerüst: Layout (Seitenleiste oder Tab), Menü, Router.
import { h, icon, wordmark, reveal } from "./ui.js";
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

const VIEWS = [
  { id: "start", label: "Start", icon: "home", render: viewStart },
  { id: "generator", label: "Prompt-Generator", icon: "wand", render: viewGenerator },
  { id: "quiz", label: "Funnel-Quiz", icon: "compass", render: viewQuiz },
  { id: "promptcheck", label: "Prompt-Check", icon: "check", render: viewPromptCheck },
  { id: "pagecheck", label: "Seiten-Check", icon: "gauge", render: viewPageCheck },
  { id: "skills", label: "Gratis-Skills", icon: "bolt", render: viewSkills },
  { id: "guides", label: "Anleitungen", icon: "book", render: viewGuides },
  { id: "saved", label: "Merkliste", icon: "bookmark", render: viewSaved },
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
  go
};

function linkList(links, cls = "links") {
  const order = ["website", "webinar", "instagram", "facebook", "linkedin", "youtube", "tiktok", "datenschutz"];
  return h("nav", { class: cls, "aria-label": "Links" },
    order.filter((k) => links[k] && links[k].url).map((k) => h("a", { href: links[k].url, target: "_blank", rel: "noopener" }, k === "webinar" ? "Live-Webinar" : links[k].label)));
}

function footer() {
  return h("footer", { class: "foot" },
    h("div", { class: "foot-brand" }, wordmark(), h("span", { class: "by" }, "von Viktor Siemens")),
    linkList(ctx.links),
    h("span", { class: "small subtle" }, `Version ${chrome.runtime?.getManifest?.().version || "1.0.0"} · kostenlos`));
}

function navItems(onPick) {
  return VIEWS.map((v) => h("button", {
    class: "nav-item", type: "button", "data-view": v.id,
    onclick: () => { onPick && onPick(); go(v.id); }
  }, icon(v.icon), h("span", {}, v.label)));
}

let content, drawer, menuBtn;

function shell() {
  const app = document.getElementById("app");
  app.textContent = "";
  document.body.classList.toggle("is-panel", ctx.mode === "panel");

  const side = h("aside", { class: "side" },
    h("div", { class: "side-brand" }, wordmark(), h("span", { class: "by" }, "von Viktor Siemens")),
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
    h("div", { class: "topbar-brand" }, wordmark(), h("span", { class: "by" }, "von Viktor Siemens")),
    h("div", { class: "topbar-actions" },
      ctx.inPanel ? h("button", { class: "icon-btn", type: "button", title: "Im großen Fenster öffnen", "aria-label": "Im großen Fenster öffnen", onclick: () => openInTab(currentView()) }, icon("expand")) : null,
      menuBtn));
  drawer = h("nav", { class: "drawer", id: "drawer", "aria-label": "Menü" }, h("div", { class: "nav" }, navItems(closeMenu)));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });

  content = h("div", { class: "content", id: "content" });
  const main = h("main", { class: "main" }, topbar, drawer, content, footer());
  app.append(side, main);
}

function currentView() {
  const id = location.hash.replace("#", "");
  return VIEWS.find((v) => v.id === id) ? id : "start";
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
  document.documentElement.dataset.ready = "1";
}

init().catch((e) => {
  console.error(e);
  document.getElementById("app").textContent = "Der Assistent konnte nicht geladen werden. Bitte öffne ihn erneut.";
});
