// Anbindung an Chrome: aktiven Tab ermitteln, Prompt einfügen, Seiten-Check ausführen.
import { collectPageData } from "./pagecheck.js";
import { collectFunnelData } from "./funnel.js";

export const AI_SITES = {
  "claude.ai": "Claude",
  "chatgpt.com": "ChatGPT",
  "lovable.dev": "Lovable"
};

const hasTabs = () => typeof chrome !== "undefined" && chrome.tabs && chrome.tabs.query;

let selfTabId = null;
export async function getSelfTabId() {
  if (selfTabId !== null) return selfTabId;
  try { const t = await chrome.tabs.getCurrent(); selfTabId = t ? t.id : -1; } catch (_) { selfTabId = -1; }
  return selfTabId;
}

// Liefert den aktiven Tab im zuletzt fokussierten Fenster (nicht die eigene App-Seite).
export async function getActiveTab() {
  if (!hasTabs()) return null;
  try {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (!tab) return null;
    const self = await getSelfTabId();
    if (tab.id === self) return { ...tab, isSelf: true };
    return tab;
  } catch (_) { return null; }
}

export function aiSiteOf(tab) {
  if (!tab || !tab.url) return null;
  try {
    const host = new URL(tab.url).hostname.replace(/^www\./, "");
    return AI_SITES[host] ? { host, name: AI_SITES[host] } : null;
  } catch (_) { return null; }
}

export async function insertIntoTab(tabId, text) {
  const send = () => chrome.tabs.sendMessage(tabId, { type: "vikitor-insert", text });
  try {
    const r = await send();
    if (r) return r;
  } catch (_) { /* Content-Script evtl. noch nicht geladen */ }
  try {
    await chrome.scripting.executeScript({ target: { tabId }, files: ["content.js"] });
    return (await send()) || { ok: false };
  } catch (_) {
    return { ok: false, reason: "unreachable" };
  }
}

export function onTabChange(cb) {
  if (!hasTabs()) return () => {};
  const a = () => cb();
  const u = (_id, info) => { if (info.status === "complete" || info.url) cb(); };
  const f = () => cb();
  chrome.tabs.onActivated.addListener(a);
  chrome.tabs.onUpdated.addListener(u);
  if (chrome.windows && chrome.windows.onFocusChanged) chrome.windows.onFocusChanged.addListener(f);
  return () => {
    chrome.tabs.onActivated.removeListener(a);
    chrome.tabs.onUpdated.removeListener(u);
    if (chrome.windows && chrome.windows.onFocusChanged) chrome.windows.onFocusChanged.removeListener(f);
  };
}

async function inject(tabId, func = collectPageData) {
  const [res] = await chrome.scripting.executeScript({ target: { tabId }, func });
  return res ? res.result : null;
}

// Seiten-Check: erst mit activeTab versuchen; falls Chrome den Zugriff verweigert,
// den Zugriff nur für genau diese Webseite erfragen (optionale Berechtigung).
export async function runPageCheck(tab, func = collectPageData) {
  try {
    return { data: await inject(tab.id, func) };
  } catch (err) {
    const msg = String(err && err.message || err);
    if (/chrome:\/\/|chrome-extension:|webstore|Cannot access a chrome|extensions gallery/i.test(msg)) {
      return { error: "Diese Seite ist von Chrome geschützt und kann nicht geprüft werden. Öffne eine normale Webseite und versuche es erneut." };
    }
    let origin = null;
    try { origin = tab.url ? new URL(tab.url).origin : null; } catch (_) { origin = null; }
    const origins = origin ? [origin + "/*"] : ["https://*/*", "http://*/*"];
    try {
      const granted = await chrome.permissions.request({ origins });
      if (!granted) return { error: "Ohne deine Erlaubnis kann der Assistent diese Seite nicht prüfen." };
      return { data: await inject(tab.id, func) };
    } catch (e2) {
      return { error: "Die Seite konnte nicht geprüft werden. Lade sie neu, klicke einmal auf das VIKITOR-Symbol und versuche es dann erneut." };
    }
  }
}

export function openInTab(hash = "") {
  const url = chrome.runtime.getURL("app.html?view=tab" + (hash ? "#" + hash : ""));
  chrome.tabs.create({ url });
}

/** Funnel-Hack: Struktur der aktuellen Seite erfassen (gleiche Berechtigungslogik wie der Seiten-Check) */
export const runFunnelCapture = (tab) => runPageCheck(tab, collectFunnelData);
