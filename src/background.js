// VIKITOR Vibecoding Assistent – Service Worker
// Öffnet die Seitenleiste per Klick aufs Symbol, legt das Kontextmenü an
// und zeigt nach der Installation die Willkommensansicht im Tab.

import { initRecorder, startRecording, stopRecording, resetRecording, getState } from "./js/recorder.js";

const TAB_URL = "app.html?view=tab";

function openTab(extra = "") {
  chrome.tabs.create({ url: chrome.runtime.getURL(TAB_URL + extra) });
}

function setup() {
  if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
  }
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "vikitor-open-tab",
      title: "Assistent im großen Fenster öffnen",
      contexts: ["action"]
    });
  });
}

chrome.runtime.onInstalled.addListener((details) => {
  setup();
  if (details.reason === "install") openTab("&welcome=1");
});

chrome.runtime.onStartup.addListener(setup);

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === "vikitor-open-tab") openTab();
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg && msg.type === "vikitor-open-tab") {
    openTab(msg.hash ? "#" + msg.hash : "");
    sendResponse({ ok: true });
    return;
  }
  // Funnel-Hack-Aufnahme (nur von den eigenen Seiten der Erweiterung, nie von Webseiten)
  if (msg && typeof msg.type === "string" && msg.type.startsWith("rec-") && _sender.id === chrome.runtime.id && !_sender.tab?.url?.startsWith("http")) {
    const run = {
      "rec-start": () => startRecording(msg.tabId, msg.windowId),
      "rec-stop": () => stopRecording(),
      "rec-reset": () => resetRecording(),
      "rec-status": () => getState()
    }[msg.type];
    if (!run) return;
    run().then((state) => sendResponse({ ok: true, state }), (e) => sendResponse({ ok: false, error: String(e && e.message || e) }));
    return true;
  }
});

initRecorder();
