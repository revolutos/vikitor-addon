import { h, icon, toast } from "../ui.js";
import { getActiveTab } from "../browser.js";
import { allSteps } from "../recdb.js";
import { buildRecordingZip, zipName } from "../recexport.js";

// Funnel-Hack „Mitschneiden“: Aufnahme starten/stoppen, Fortschritt, ZIP-Download. Erfasst wird im Service Worker (recorder.js).
// Der breite Seitenzugriff wird nur für die Dauer der Aufnahme erbeten und danach wieder entfernt.
const ORIGINS = ["<all_urls>"]; // captureVisibleTab verlangt <all_urls> (oder activeTab, das beim Weiterklicken verfällt)
const send = (type, extra = {}) => chrome.runtime.sendMessage({ type, ...extra });

export function recordingCard(ctx) {
  const status = h("div", { class: "rec-status", role: "status", "aria-live": "polite" });
  const note = h("p", { class: "hint" });
  const list = h("div", { class: "rec-list" });
  const startBtn = h("button", { class: "btn btn-signal", type: "button", id: "rec-start" }, h("span", { class: "rec-dot", "aria-hidden": "true" }), "Aufnahme starten");
  const stopBtn = h("button", { class: "btn btn-signal", type: "button", id: "rec-stop" }, icon("ok"), "Aufnahme stoppen");
  const zipBtn = h("button", { class: "btn btn-signal", type: "button", id: "rec-zip" }, icon("download"), "Als ZIP herunterladen");
  const resetBtn = h("button", { class: "btn btn-ghost", type: "button", id: "rec-reset" }, icon("trash"), "Aufnahme verwerfen");
  const actions = h("div", { class: "actions" });
  const urls = [];

  const thumbs = async () => {
    urls.splice(0).forEach((u) => URL.revokeObjectURL(u));
    list.textContent = "";
    const steps = await allSteps().catch(() => []);
    for (const s of steps) {
      const u = URL.createObjectURL(s.fold);
      urls.push(u);
      list.append(h("figure", { class: "rec-step" },
        h("img", { src: u, alt: `Schritt ${s.n}: ${s.title || s.url}` }),
        h("figcaption", {}, h("b", {}, String(s.n).padStart(2, "0")), " ", s.title || s.url)));
    }
    return steps.length;
  };

  const draw = async (s) => {
    s = s || (await send("rec-status").catch(() => null))?.state || { active: false, count: 0 };
    actions.textContent = "";
    status.textContent = "";
    status.classList.toggle("is-on", !!s.active);
    if (s.active) {
      status.append(h("span", { class: "rec-dot is-live", "aria-hidden": "true" }), h("b", {}, "Aufnahme läuft"), ` · ${s.count} ${s.count === 1 ? "Seite" : "Seiten"} erfasst`);
      note.textContent = "Klick dich jetzt selbst durch den Funnel. Jede Seite wird nach dem Laden kurz durchgescrollt und erfasst; warte, bis die Zahl hochzählt, bevor du weiterklickst. Das Symbol oben zeigt die Aufnahme ebenfalls an. Gib keine echten Zahlungsdaten ein.";
      actions.append(stopBtn);
    } else {
      const n = s.count || 0;
      if (n) {
        status.append(h("b", {}, "Aufnahme beendet"), ` · ${n} ${n === 1 ? "Seite" : "Seiten"}`);
        note.textContent = "Das ZIP enthält den Ordner funnelhack/ im Format der VS-Scan-Engine: funnel.json, design-tokens.css, eine Übersicht (index.html) und je Schritt Screenshots, Seitenanalyse, Texte (nur zur Analyse), Design-Werte und Technik. In VS MAC OS oder VS WIN OS importierst du es über „Aufnahme importieren“.";
        actions.append(zipBtn, resetBtn);
      } else {
        note.textContent = "Öffne die erste Seite des Funnels im aktiven Tab und starte die Aufnahme. Der Browser fragt einmal nach dem Zugriff auf Webseiten; er gilt nur während der Aufnahme. Alles bleibt auf deinem Rechner.";
        actions.append(startBtn);
      }
    }
    if (s.error) status.append(h("span", { class: "rec-err" }, " " + s.error));
    await thumbs();
  };

  let chain = Promise.resolve();
  const redraw = (st) => (chain = chain.then(() => draw(st)).catch(() => {}));

  startBtn.addEventListener("click", async () => {
    const tab = await getActiveTab();
    if (!tab || tab.isSelf || !/^https?:/.test(tab.url || "")) { toast("Öffne zuerst die erste Seite des Funnels im aktiven Tab."); note.textContent = "Öffne die erste Seite des Funnels im aktiven Tab und nutze den Assistenten als Seitenleiste daneben."; return; }
    let granted = false;
    try { granted = await chrome.permissions.request({ origins: ORIGINS }); } catch (_) { granted = false; }
    if (!granted) { note.textContent = "Ohne Zugriff auf Webseiten kann die Aufnahme keine Screenshots machen. Du kannst es jederzeit erneut versuchen."; return; }
    const r = await send("rec-start", { tabId: tab.id, windowId: tab.windowId }).catch((e) => ({ ok: false, error: e.message }));
    if (!r || !r.ok) { note.textContent = "Die Aufnahme konnte nicht starten: " + (r && r.error || "unbekannter Fehler"); return; }
    redraw(r.state);
  });
  stopBtn.addEventListener("click", async () => {
    stopBtn.disabled = true;
    const r = await send("rec-stop").catch(() => null);
    stopBtn.disabled = false;
    try { await chrome.permissions.remove({ origins: ORIGINS }); } catch (_) { /* fest vergebene Rechte bleiben */ }
    redraw(r && r.state);
  });
  zipBtn.addEventListener("click", async () => {
    zipBtn.disabled = true;
    try {
      const s = (await send("rec-status")).state;
      const { blob } = await buildRecordingZip(s);
      const a = h("a", { href: URL.createObjectURL(blob), download: zipName(s) });
      document.body.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 30000);
      toast("ZIP wird heruntergeladen.");
    } catch (e) { toast("ZIP konnte nicht erstellt werden."); }
    zipBtn.disabled = false;
  });
  resetBtn.addEventListener("click", async () => { await send("rec-reset"); redraw(); });

  const onChange = (changes, area) => { if (area === "local" && changes.recState) redraw(changes.recState.newValue); };
  chrome.storage.onChanged.addListener(onChange);
  ctx.cleanup.push(() => { chrome.storage.onChanged.removeListener(onChange); urls.forEach((u) => URL.revokeObjectURL(u)); });
  redraw();

  return h("div", { class: "card stack-s", id: "rec-card" },
    h("span", { class: "overline" }, "3 · Funnel mitschneiden"),
    h("p", { class: "small subtle" }, "Du klickst selbst durch den Funnel, der Assistent erfasst jede besuchte Seite als Ganzseiten-Screenshot mit Struktur. Am Ende lädst du alles als ZIP herunter. Nichts wird an einen Server gesendet."),
    status, actions, note, list);
}
