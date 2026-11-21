// VIKITOR Vibecoding Assistent – Content-Script für claude.ai, chatgpt.com und lovable.dev.
// Aufgabe: einen vom Nutzer erzeugten Prompt in das Eingabefeld EINFÜGEN.
// Das Skript liest keine Inhalte dieser Seiten aus und sendet nichts weiter.
(() => {
  if (window.__vikitorInsert) return;
  window.__vikitorInsert = true;

  const SELECTORS = {
    "claude.ai": ['div.ProseMirror[contenteditable="true"]', '[contenteditable="true"]', "textarea"],
    "chatgpt.com": ["#prompt-textarea", 'div.ProseMirror[contenteditable="true"]', "textarea"],
    "lovable.dev": ["#chatinput", "form textarea", "textarea", '[contenteditable="true"]']
  };

  function visible(el) {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }

  function isEditable(el) {
    if (!el || el === document.body) return false;
    if (el.tagName === "TEXTAREA") return true;
    if (el.tagName === "INPUT" && /^(text|search)$/i.test(el.type)) return true;
    return el.isContentEditable === true;
  }

  function findField() {
    const active = document.activeElement;
    if (isEditable(active) && visible(active)) return active;
    const host = location.hostname.replace(/^www\./, "");
    const list = SELECTORS[host] || ['[contenteditable="true"]', "textarea"];
    for (const sel of list) {
      const all = Array.from(document.querySelectorAll(sel)).filter(visible);
      if (all.length) return all[all.length - 1];
    }
    return null;
  }

  function insertIntoTextarea(el, text) {
    const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, "value").set;
    const start = typeof el.selectionStart === "number" ? el.selectionStart : el.value.length;
    const end = typeof el.selectionEnd === "number" ? el.selectionEnd : el.value.length;
    const next = el.value.slice(0, start) + text + el.value.slice(end);
    setter.call(el, next);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    try { el.setSelectionRange(start + text.length, start + text.length); } catch (_) {}
    return true;
  }

  function insertIntoEditable(el, text) {
    el.focus();
    const sel = window.getSelection();
    if (sel && !el.contains(sel.anchorNode)) {
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    }
    let ok = false;
    try { ok = document.execCommand("insertText", false, text); } catch (_) { ok = false; }
    if (!ok) {
      try {
        const dt = new DataTransfer();
        dt.setData("text/plain", text);
        ok = el.dispatchEvent(new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true })) === false;
      } catch (_) { ok = false; }
    }
    return ok;
  }

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (!msg || msg.type !== "vikitor-insert" || typeof msg.text !== "string") return;
    const el = findField();
    if (!el) { sendResponse({ ok: false, reason: "no-field" }); return; }
    el.focus();
    const ok = el.isContentEditable ? insertIntoEditable(el, msg.text) : insertIntoTextarea(el, msg.text);
    sendResponse({ ok });
  });
})();
