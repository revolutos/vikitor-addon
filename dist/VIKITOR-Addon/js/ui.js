// Kleine DOM-Helfer. Inhalte werden immer als Text gesetzt (kein innerHTML für Daten).
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === "class") el.className = v;
    else if (k === "style" && typeof v === "object") Object.assign(el.style, v);
    else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === "html") el.innerHTML = v; // nur für eigene, statische SVG-Icons
    else if (k in el && typeof v !== "string") el[k] = v;
    else el.setAttribute(k, v === true ? "" : v);
  }
  append(el, children);
  return el;
}

function append(el, children) {
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
}

const P = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>',
  wand: '<path d="m15 4 1.4 2.6L19 8l-2.6 1.4L15 12l-1.4-2.6L11 8l2.6-1.4Z"/><path d="M3 21 13 11"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5Z"/>',
  check: '<path d="M9 11.5 11.5 14 16 9"/><rect x="3.5" y="3.5" width="17" height="17" rx="4"/>',
  gauge: '<path d="M4.5 17a8.5 8.5 0 1 1 15 0"/><path d="m12 13 4-4"/><circle cx="12" cy="13" r="1.2"/>',
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7Z"/>',
  book: '<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5Z"/><path d="M4 21.5V4.5"/><path d="M8 7h8"/>',
  bookmark: '<path d="M6 3h12v18l-6-4-6 4Z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  expand: '<path d="M14 4h6v6"/><path d="M20 4l-7 7"/><path d="M10 20H4v-6"/><path d="m4 20 7-7"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  send: '<path d="M4 12 20 4l-6 16-3-7Z"/>',
  save: '<path d="M6 3h12v18l-6-4-6 4Z"/>',
  trash: '<path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M6 7l1 13h10l1-13"/>',
  download: '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M4 21h16"/>',
  arrow: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
  back: '<path d="M19 12H5"/><path d="m11 6-6 6 6 6"/>',
  spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
  ok: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>'
};

export function icon(name) {
  const span = document.createElement("span");
  span.style.display = "contents";
  span.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || ""}</svg>`;
  return span.firstChild;
}

export function wordmark(cls = "") {
  return h("span", { class: `word ${cls}`, "aria-label": "VIKITOR" }, "VI", h("b", {}, "KI"), "TOR");
}

let toastTimer;
export function toast(msg) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("is-on");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("is-on"), 2400);
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (_) {
    const ta = h("textarea", { style: { position: "fixed", opacity: "0" } });
    ta.value = text;
    document.body.append(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch (_) { ok = false; }
    ta.remove();
    return ok;
  }
}

// Elemente einer Ansicht nacheinander einblenden
export function reveal(nodes) {
  let i = 0;
  for (const n of nodes) {
    if (!(n instanceof HTMLElement)) continue;
    n.classList.add("rv");
    n.style.setProperty("--i", String(Math.min(i++, 10)));
  }
}

export function vhead(overline, title, text) {
  return h("header", { class: "vhead" },
    overline ? h("span", { class: "overline" }, overline) : null,
    h("h1", {}, title),
    text ? h("p", {}, text) : null
  );
}

export function pitch(text, href, linkLabel = "Mehr auf vikitor.de") {
  return h("aside", { class: "pitch" }, icon("spark"),
    h("span", {}, text, href ? [" ", h("a", { href, target: "_blank", rel: "noopener" }, linkLabel)] : null));
}

export function codebox(label, text, extra) {
  const pre = h("pre", {}, text);
  return h("div", { class: "codebox is-short" },
    h("div", { class: "codebox-head" }, h("span", { class: "overline" }, label),
      h("button", { class: "btn btn-ghost btn-sm", type: "button", onclick: async (e) => {
        const ok = await copyText(text);
        toast(ok ? "Kopiert." : "Kopieren nicht möglich.");
        if (ok) { e.currentTarget.classList.add("is-done"); }
      } }, icon("copy"), "Kopieren"), extra || null),
    pre);
}
