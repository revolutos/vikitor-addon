import { h, icon } from "../ui.js";
import { get, set } from "../store.js";

// „Neu von VIKITOR“: News, Ratgeber, Updates und Events aus https://vikitor.de/feed.json (JSON Feed 1.1 + _vikitor).
// Nur Text-Daten, kein Code. Zwischengespeichert, höchstens alle 3 Stunden neu geladen.
const FEED = "https://vikitor.de/feed.json";
const KANAELE = [["alle", "Alle"], ["news", "News"], ["ratgeber", "Ratgeber"], ["updates", "Updates"], ["events", "Events"]];
const TITEL = { news: "News", ratgeber: "Ratgeber", updates: "Update", events: "Event" };
let filter = "alle";

const valid = (f) => f && Array.isArray(f.items) && f.items.every((i) => typeof i.id === "string" && typeof i.title === "string");

export async function loadFeed(force = false) {
  const cached = await get("feedCache", null);
  const last = await get("feedCheckedAt", 0);
  if (!force && cached && Date.now() - last < 3 * 60 * 60 * 1000) return cached;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 6000);
    const r = await fetch(FEED, { cache: "no-store", credentials: "omit", signal: ctrl.signal });
    clearTimeout(t);
    const data = r.ok ? await r.json() : null;
    if (valid(data)) { await set("feedCache", data); await set("feedCheckedAt", Date.now()); return data; }
  } catch (_) { /* offline: Zwischenspeicher nutzen */ }
  return cached;
}

/** Zahl ungelesener Beiträge (für das Menü). Beim allerersten Laden gilt alles als gelesen. */
export async function unreadCount() {
  const feed = await loadFeed();
  if (!feed) return 0;
  let read = await get("feedRead", null);
  if (!read) { read = feed.items.map((i) => i.id); await set("feedRead", read); }
  return feed.items.filter((i) => !read.includes(i.id)).length;
}

const status = (ev) => {
  if (!ev) return null;
  const n = Date.now(), s = Date.parse(ev.start), e = Date.parse(ev.ende);
  return n < s ? "kommend" : n < e ? "live" : "vorbei";
};
const STATUS = { kommend: "Demnächst", live: "Jetzt live", vorbei: "Vergangen" };
const fmtDate = (iso) => new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
const fmtWhen = (iso) => new Date(iso).toLocaleString("de-DE", { weekday: "long", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) + " Uhr";
const withUtm = (url, kanal) => {
  try {
    const u = new URL(url);
    if (u.hostname.endsWith("vikitor.de")) { u.searchParams.set("utm_source", "vikitor-addon"); u.searchParams.set("utm_medium", "addon"); u.searchParams.set("utm_content", "neu-" + kanal); }
    return u.toString();
  } catch (_) { return url; }
};
const newer = (a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }) > 0;

export async function viewNeu(ctx) {
  const feed = await loadFeed();
  const read = new Set(await get("feedRead", []));
  const mine = (typeof chrome !== "undefined" && chrome.runtime?.getManifest) ? chrome.runtime.getManifest().version : "0";
  const items = feed ? feed.items : [];
  const addonUpdate = items.find((i) => i._vikitor?.update?.produkt === "addon" && newer(i._vikitor.update.version, mine));

  const list = h("div", { class: "feed-list" });
  const markRead = async (id) => { read.add(id); await set("feedRead", [...read]); };
  const draw = () => {
    list.textContent = "";
    const shown = items.filter((i) => filter === "alle" || i._vikitor?.kanal === filter);
    if (!shown.length) { list.append(h("p", { class: "small subtle" }, feed ? "Hier ist noch nichts erschienen." : "vikitor.de ist gerade nicht erreichbar. Versuch es gleich noch einmal.")); return; }
    for (const i of shown) {
      const v = i._vikitor || {}, ev = v.event, st = status(ev), up = v.update;
      const open = (url) => h("a", { class: "btn btn-signal", href: withUtm(url, v.kanal), target: "_blank", rel: "noopener", onclick: () => markRead(i.id) });
      list.append(h("article", { class: `card feed-card${st === "live" ? " is-live" : ""}` },
        h("div", { class: "feed-meta" },
          h("span", { class: "overline" }, TITEL[v.kanal] || "Neu"),
          st ? h("span", { class: `feed-status is-${st}` }, STATUS[st]) : h("span", { class: "feed-date" }, fmtDate(i.date_published)),
          up?.version ? h("span", { class: "feed-date" }, "Version " + up.version) : null,
          read.has(i.id) ? null : h("span", { class: "feed-dot", title: "Neu" })),
        h("h3", { class: "feed-title" }, i.title),
        ev ? h("p", { class: "feed-when" }, fmtWhen(ev.start) + (ev.ort ? " · " + ev.ort : "")) : null,
        h("p", { class: "feed-sum" }, i.summary || ""),
        h("div", { class: "feed-actions" },
          st !== "vorbei" && ev?.anmeldung ? Object.assign(open(ev.anmeldung), { textContent: st === "live" ? "Jetzt dabei sein" : "Platz sichern" }) : null,
          st === "vorbei" ? (ev.aufzeichnung ? Object.assign(open(ev.aufzeichnung), { textContent: "Aufzeichnung ansehen" }) : h("span", { class: "small subtle" }, "Aufzeichnung folgt")) : null,
          up?.download ? Object.assign(open(up.download), { textContent: "Herunterladen", className: "btn btn-ghost" }) : null,
          h("a", { class: "feed-more", href: withUtm(i.url, v.kanal), target: "_blank", rel: "noopener", onclick: () => markRead(i.id) }, ev ? "Details" : "Weiterlesen", icon("arrow")))));
    }
  };

  const tabs = h("div", { class: "feed-filter", role: "tablist", "aria-label": "Kanäle" }, KANAELE.map(([id, label]) =>
    h("button", { type: "button", role: "tab", class: filter === id ? "is-on" : "", "aria-selected": String(filter === id),
      onclick: (e) => { filter = id; tabs.querySelectorAll("button").forEach((b) => { b.classList.toggle("is-on", b === e.currentTarget); b.setAttribute("aria-selected", String(b === e.currentTarget)); }); draw(); } }, label)));
  draw();
  // ab jetzt gilt alles Sichtbare als gesehen (der Punkt bleibt bis zum nächsten Öffnen stehen)
  set("feedRead", [...new Set([...read, ...items.map((i) => i.id)])]);
  ctx.refreshBadge && setTimeout(ctx.refreshBadge, 300);

  return [
    h("header", { class: "vhead" },
      h("span", { class: "overline" }, "Neu von VIKITOR"),
      h("h1", {}, h("span", { class: "hl nowrap" }, "Was ist neu?")),
      h("p", {}, "News, Ratgeber, Updates und Events von vikitor.de. Neue Beiträge erscheinen hier automatisch.")),
    addonUpdate ? h("div", { class: "notice is-signal" },
      h("b", {}, `Neue Version ${addonUpdate._vikitor.update.version} des Addons ist da. `),
      h("a", { href: withUtm(addonUpdate._vikitor.update.download || addonUpdate.url, "updates"), target: "_blank", rel: "noopener" }, "Jetzt herunterladen")) : null,
    tabs,
    list,
    h("p", { class: "small subtle", style: { marginTop: "14px" } }, "Lieber im Feed-Reader? ",
      h("a", { href: "https://vikitor.de/feed.xml", target: "_blank", rel: "noopener" }, "RSS-Feed abonnieren"))
  ];
}
