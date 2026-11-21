// Funnel-Hack-Aufnahme (läuft im Service Worker): Solange die Aufnahme aktiv ist, wird jede Seite, die im
// aufgenommenen Tab fertig geladen ist, erfasst: Ganzseiten-Screenshot aus mehreren captureVisibleTab-Bildern
// (beim Scrollen zusammengesetzt), Bild des sichtbaren Bereichs und die Seitenstruktur. Alles bleibt lokal (IndexedDB).
// Start nur per Klick in der App; sichtbarer Hinweis über das Symbol („REC“) und in der App.
import { putStep, allSteps, clearSteps } from "./recdb.js";
import { collectFunnelData } from "./funnel.js";

const KEY = "recState";
const MAX_STEPS = 30;
const MAX_CSS_HEIGHT = 15000; // Grenze für Bildhöhe (Canvas) und Aufnahmedauer
const GAP = 620; // Chrome erlaubt höchstens zwei captureVisibleTab-Aufrufe pro Sekunde
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function getState() { return (await chrome.storage.local.get(KEY))[KEY] || { active: false, count: 0 }; }
async function setState(patch) { const s = { ...(await getState()), ...patch }; await chrome.storage.local.set({ [KEY]: s }); return s; }

async function badge(active, count = 0) {
  try {
    await chrome.action.setBadgeBackgroundColor({ color: "#e11d48" });
    await chrome.action.setBadgeText({ text: active ? (count ? String(count) : "REC") : "" });
    await chrome.action.setTitle({ title: active ? `Funnel-Hack: Aufnahme läuft (${count} Seiten)` : "VIKITOR Vibecoding Assistent öffnen" });
  } catch (_) { /* Symbol nicht verfügbar */ }
}

export async function startRecording(tabId, windowId) {
  await clearSteps();
  const tab = await chrome.tabs.get(tabId);
  await setState({ active: true, tabId, windowId, started: new Date().toISOString(), ended: null, startUrl: tab.url, count: 0, lastUrl: null, error: null, viewport: null });
  await badge(true, 0);
  schedule(tabId, 200);
  return getState();
}

export async function stopRecording() {
  // laufende Erfassung noch abschließen lassen
  for (let i = 0; i < 40 && busy; i++) await sleep(250);
  const s = await setState({ active: false, ended: new Date().toISOString() });
  await badge(false);
  return s;
}

export async function resetRecording() {
  await clearSteps();
  await chrome.storage.local.set({ [KEY]: { active: false, count: 0 } });
  await badge(false);
}

const norm = (u) => { try { const x = new URL(u); x.hash = ""; return x.toString(); } catch (_) { return u; } };
const capturable = (u) => /^https?:/.test(u || "");

let busy = false;
let timer = null;
let pending = false;

function schedule(tabId, delay = 1300) {
  clearTimeout(timer);
  timer = setTimeout(() => run(tabId).catch(() => {}), delay);
}

async function run(tabId) {
  if (busy) { pending = true; return; }
  const s = await getState();
  if (!s.active || s.tabId !== tabId) return;
  const tab = await chrome.tabs.get(tabId).catch(() => null);
  if (!tab || !capturable(tab.url) || tab.status !== "complete") return;
  if (!tab.active) { pending = true; return; } // Screenshot geht nur vom sichtbaren Tab; nach dem Zurückwechseln weiter
  if (norm(tab.url) === s.lastUrl) return;
  if (s.count >= MAX_STEPS) { await setState({ error: `Höchstens ${MAX_STEPS} Seiten pro Aufnahme.` }); return; }
  busy = true; pending = false;
  try {
    const step = await captureStep(tab);
    const cur = await getState();
    if (!cur.active) return;
    if (norm((await chrome.tabs.get(tabId)).url) !== norm(step.url)) { pending = true; return; } // während der Erfassung weitergeklickt
    step.n = cur.count + 1;
    await putStep(step);
    await setState({ count: step.n, lastUrl: norm(step.url), viewport: step.viewport, error: null });
    await badge(true, step.n);
  } catch (e) {
    await setState({ error: "Seite konnte nicht erfasst werden: " + String(e && e.message || e).slice(0, 160) });
  } finally {
    busy = false;
    if (pending) schedule(tabId, 400);
  }
}

// --- im Seitenkontext ausgeführt (müssen eigenständig sein) ---
function pageMeasure() {
  const el = document.scrollingElement || document.documentElement;
  return { h: Math.max(el.scrollHeight, document.body ? document.body.scrollHeight : 0), vh: window.innerHeight, vw: window.innerWidth, dpr: window.devicePixelRatio || 1, y0: window.scrollY };
}
function pageScroll(y) {
  window.scrollTo({ top: y, left: 0, behavior: "instant" });
  return window.scrollY;
}
function pageFixed(hide) {
  if (hide) {
    for (const el of document.querySelectorAll("body *")) {
      const p = getComputedStyle(el).position;
      if ((p === "fixed" || p === "sticky") && !el.hasAttribute("data-vk-rec")) {
        el.setAttribute("data-vk-rec", el.style.getPropertyValue("visibility") || "-");
        el.style.setProperty("visibility", "hidden", "important");
      }
    }
  } else {
    for (const el of document.querySelectorAll("[data-vk-rec]")) {
      const v = el.getAttribute("data-vk-rec");
      if (v === "-") el.style.removeProperty("visibility"); else el.style.setProperty("visibility", v);
      el.removeAttribute("data-vk-rec");
    }
  }
  return true;
}

async function inject(tabId, func, args = []) {
  const [r] = await chrome.scripting.executeScript({ target: { tabId }, func, args });
  return r ? r.result : null;
}

let lastShot = 0;
async function shot(windowId) {
  const wait = lastShot + GAP - Date.now();
  if (wait > 0) await sleep(wait);
  lastShot = Date.now();
  return chrome.tabs.captureVisibleTab(windowId, { format: "png" });
}

const toBlob = async (dataUrl) => (await fetch(dataUrl)).blob();

/** Ganzseiten-Screenshot: scrollen, sichtbaren Bereich aufnehmen, zusammensetzen */
export async function captureFullPage(tab) {
  const m = await inject(tab.id, pageMeasure);
  const total = Math.min(m.h, MAX_CSS_HEIGHT);
  const frames = [];
  try {
    let y = 0;
    for (let i = 0; i < 40; i++) {
      const actual = await inject(tab.id, pageScroll, [y]);
      await sleep(i === 0 ? 250 : 450); // Lazy-Load und Einblendungen abwarten
      frames.push({ y: actual, url: await shot(tab.windowId) });
      if (i === 0) await inject(tab.id, pageFixed, [true]); // feste Kopfzeilen nur im ersten Bild
      if (actual + m.vh >= total || actual < y) break;
      y = actual + m.vh;
    }
  } finally {
    await inject(tab.id, pageFixed, [false]).catch(() => {});
    await inject(tab.id, pageScroll, [m.y0]).catch(() => {});
  }
  const bitmaps = await Promise.all(frames.map(async (f) => ({ y: f.y, bmp: await createImageBitmap(await toBlob(f.url)) })));
  const scale = bitmaps[0].bmp.width / m.vw;
  const canvas = new OffscreenCanvas(bitmaps[0].bmp.width, Math.min(Math.round(total * scale), 32000));
  const c = canvas.getContext("2d");
  for (const { y, bmp } of bitmaps) c.drawImage(bmp, 0, Math.round(y * scale));
  return {
    full: await canvas.convertToBlob({ type: "image/png" }),
    fold: await toBlob(frames[0].url),
    viewport: { width: m.vw, height: m.vh, dpr: m.dpr },
    pageHeight: m.h,
    truncated: m.h > MAX_CSS_HEIGHT
  };
}

async function captureStep(tab) {
  const shotData = await captureFullPage(tab);
  const struktur = await inject(tab.id, collectFunnelData).catch(() => null);
  return {
    url: tab.url,
    title: tab.title || (struktur && struktur.titel) || "",
    capturedAt: new Date().toISOString(),
    viewport: shotData.viewport,
    pageHeight: shotData.pageHeight,
    truncated: shotData.truncated,
    full: shotData.full,
    fold: shotData.fold,
    struktur
  };
}

/** Ereignisse im Service Worker anmelden (einmal beim Laden von background.js) */
export function initRecorder() {
  chrome.tabs.onUpdated.addListener(async (tabId, info) => {
    if (info.status !== "complete") return;
    const s = await getState();
    if (s.active && s.tabId === tabId) schedule(tabId);
  });
  // Öffnet der Funnel einen neuen Tab (z. B. Checkout), folgt die Aufnahme diesem Tab
  chrome.tabs.onCreated.addListener(async (tab) => {
    const s = await getState();
    if (s.active && tab.openerTabId === s.tabId) { await setState({ tabId: tab.id, windowId: tab.windowId }); schedule(tab.id, 2000); }
  });
  chrome.tabs.onActivated.addListener(async ({ tabId }) => {
    const s = await getState();
    if (s.active && s.tabId === tabId) schedule(tabId, 600);
  });
  chrome.tabs.onRemoved.addListener(async (tabId) => {
    const s = await getState();
    if (s.active && s.tabId === tabId) { await stopRecording(); await setState({ error: "Der aufgenommene Tab wurde geschlossen. Die Aufnahme ist beendet." }); }
  });
  getState().then((s) => badge(s.active, s.count));
}

export { allSteps };
