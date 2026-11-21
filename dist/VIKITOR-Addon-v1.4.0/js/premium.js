// Premium im Addon (gleicher Freischaltcode wie VS MAC OS): Lizenz von vikitor.de, Vorlagen geschützt laden.
import { h, icon, toast, copyText } from "./ui.js";
import { get, set } from "./store.js";
import { withUtm } from "./data.js";
import { getActiveTab, aiSiteOf, insertIntoTab, onTabChange } from "./browser.js";

const API = "https://vikitor.de/api/vsmacos";

export async function license() { return get("premiumLicense", null); }
export async function isUnlocked() { return !!(await license()); }

export async function unlock(code) {
  try {
    const r = await fetch(`${API}/freischalten/`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "omit", body: JSON.stringify({ code: String(code || "").trim() }) });
    const d = await r.json().catch(() => ({}));
    if (r.ok && d.lizenz) { await set("premiumLicense", d.lizenz); return { ok: true }; }
    return { ok: false, fehler: d.fehler || "Freischalten hat nicht geklappt." };
  } catch (_) { return { ok: false, fehler: "vikitor.de ist gerade nicht erreichbar. Bitte gleich noch einmal versuchen." }; }
}

export async function lock() { await set("premiumLicense", null); await set("premiumVorlagen", null); }

/** Vorlagen (zwischengespeichert, höchstens alle 12 Stunden neu) */
export async function loadVorlagen(force = false) {
  const lic = await license();
  if (!lic) return null;
  const cached = await get("premiumVorlagen", null);
  const last = await get("premiumVorlagenAt", 0);
  if (!force && cached && Date.now() - last < 12 * 3600 * 1000) return cached;
  try {
    const r = await fetch(`${API}/premium/`, { headers: { Authorization: `Bearer ${lic}` }, credentials: "omit", cache: "no-store" });
    if (r.status === 401) { await lock(); return null; }
    const d = await r.json();
    if (Array.isArray(d.vorlagen)) { await set("premiumVorlagen", d.vorlagen); await set("premiumVorlagenAt", Date.now()); return d.vorlagen; }
  } catch (_) { /* offline: Zwischenspeicher */ }
  return cached;
}

/** Hinweis + Code-Feld, solange Premium gesperrt ist */
export function premiumGate(ctx, feature) {
  const input = h("input", { class: "input", id: "premium-code", type: "password", placeholder: "Freischaltcode", autocomplete: "off", "aria-label": "Freischaltcode eingeben" });
  const err = h("p", { class: "small", style: { color: "var(--danger)" } });
  const btn = h("button", { class: "btn btn-signal", type: "button" }, icon("ok"), "Freischalten");
  const go = async () => {
    btn.disabled = true; err.textContent = "";
    const r = await unlock(input.value);
    btn.disabled = false;
    if (r.ok) { toast("Premium ist freigeschaltet."); ctx.go(ctx.current()); } else err.textContent = r.fehler;
  };
  btn.addEventListener("click", go);
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") go(); });
  return [
    h("header", { class: "vhead" },
      h("span", { class: "overline" }, "Premium"),
      h("h1", {}, h("span", { class: "hl nowrap" }, feature + ".")),
      h("p", {}, "Mit Premium bekommst du fertige Baupläne für Webseiten und Funnels und den Funnel-Hack: Struktur einer erfolgreichen Seite erfassen und als Auftrag an Claude Code, Codex, ChatGPT oder Lovable geben, übertragen auf dein Angebot.")),
    h("div", { class: "card is-strong stack" },
      h("span", { class: "overline" }, "Freischaltcode"),
      h("div", { class: "unlock-row" }, input, btn),
      err,
      h("div", { class: "unlock-buy" },
        h("a", { class: "btn btn-signal", href: withUtm(ctx.links.masterclass.url, "premium-gate"), target: "_blank", rel: "noopener" }, icon("arrow"), "Zur Vibecoding Masterclass"),
        h("p", { class: "small subtle" }, "Noch keinen Code? Premium ist in der Vibecoding 3.0 Masterclass enthalten. Den Freischaltcode bekommst du persönlich per WhatsApp. Er gilt auch für VS MAC OS Premium.")))
  ];
}

/** Buttons „In Claude/ChatGPT/Lovable einfügen“ und „Kopieren“ für einen Text */
export function promptActions(ctx, getText) {
  let target = null;
  const insertBtn = h("button", { class: "btn btn-ghost", type: "button", disabled: true }, icon("send"), h("span", {}, "In KI einfügen"));
  const hint = h("p", { class: "hint" });
  const refresh = async () => {
    const tab = await getActiveTab();
    const site = tab && !tab.isSelf ? aiSiteOf(tab) : null;
    target = site ? { tab, site } : null;
    insertBtn.disabled = !target;
    insertBtn.lastChild.textContent = target ? `In ${target.site.name} einfügen` : "In Claude / ChatGPT / Lovable einfügen";
    hint.textContent = target ? `Wird in ${target.site.name} im aktiven Tab eingefügt. Abschicken musst du selbst.` : "Einfügen geht, wenn im aktiven Tab claude.ai, chatgpt.com oder lovable.dev offen ist. Sonst kopieren und selbst einfügen.";
  };
  insertBtn.addEventListener("click", async () => {
    if (!target) return;
    const r = await insertIntoTab(target.tab.id, getText());
    if (!(r && r.ok)) await copyText(getText());
    toast(r && r.ok ? `In ${target.site.name} eingefügt.` : "Einfügen hat nicht geklappt. Der Text ist in der Zwischenablage.");
  });
  const copyBtn = h("button", { class: "btn btn-signal", type: "button", onclick: async () => toast((await copyText(getText())) ? "Kopiert." : "Kopieren nicht möglich.") }, icon("copy"), "Kopieren");
  refresh();
  ctx.cleanup.push(onTabChange(refresh));
  return h("div", { class: "stack-s" }, h("div", { class: "row-btns" }, copyBtn, insertBtn), hint);
}
