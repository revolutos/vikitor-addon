// Inhalte: gebündelt in data/content.json; optional aktualisierbar über vikitor.de.
// Es wird nur JSON geladen, niemals Code. Ungültige Daten werden still verworfen.
import { get, set } from "./store.js";

const REMOTE = "https://vikitor.de/downloads/addons/content.json";

const isObj = (o) => o && typeof o === "object" && !Array.isArray(o);
const isStr = (s) => typeof s === "string" && s.length > 0;
const isArr = (a) => Array.isArray(a) && a.length > 0;

const VALID = {
  version: isStr,
  pitch: (p) => isObj(p) && Object.values(p).every((v) => typeof v === "string"),
  tools: (t) => isObj(t) && ["claude", "codex", "chatgpt", "lovable"].every((k) => isObj(t[k]) && isStr(t[k].label) && isStr(t[k].intro) && isStr(t[k].outro) && isStr(t[k].stepsTitle)),
  rules: (r) => isArr(r) && r.every(isStr),
  fields: (f) => isObj(f) && Object.values(f).every((x) => isObj(x) && isStr(x.label)),
  templates: (t) => isArr(t) && t.every((x) => isObj(x) && isStr(x.id) && isStr(x.title) && isStr(x.goal) && isArr(x.steps) && Array.isArray(x.fields)),
  quiz: (q) => isObj(q) && isArr(q.questions) && isArr(q.order) && isObj(q.funnels) && q.questions.every((x) => isStr(x.q) && isArr(x.options)) && q.order.every((k) => isObj(q.funnels[k]) && isArr(q.funnels[k].pages)),
  promptChecks: (p) => isArr(p) && p.every((x) => isStr(x.id) && isStr(x.label) && isStr(x.pattern)),
  guides: (g) => isArr(g) && g.every((x) => isStr(x.id) && isStr(x.title) && isArr(x.blocks)),
  skills: (s) => isArr(s) && s.every((x) => isStr(x.id) && isStr(x.title) && isStr(x.desc))
};

function merge(base, remote) {
  if (!isObj(remote)) return base;
  const out = { ...base };
  for (const [k, ok] of Object.entries(VALID)) if (k in remote && ok(remote[k])) out[k] = remote[k];
  // Feldverweise der Vorlagen müssen existieren, sonst gebündelte Vorlagen behalten
  if (!out.templates.every((t) => t.fields.every((f) => out.fields[f]))) { out.templates = base.templates; out.fields = base.fields; }
  return out;
}

async function fetchJson(url, timeout = 5000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const r = await fetch(url, { cache: "no-store", signal: ctrl.signal, credentials: "omit" });
    if (!r.ok) return null;
    return await r.json();
  } catch (_) { return null; } finally { clearTimeout(t); }
}

export async function loadContent() {
  const bundled = await (await fetch("data/content.json")).json();
  const cached = await get("remoteContent", null);
  const content = cached ? merge(bundled, cached) : bundled;
  // Im Hintergrund aktualisieren (höchstens alle 12 Stunden, wirkt beim nächsten Öffnen)
  const last = await get("remoteCheckedAt", 0);
  if (Date.now() - last > 12 * 60 * 60 * 1000) {
    set("remoteCheckedAt", Date.now());
    fetchJson(REMOTE).then((remote) => { if (isObj(remote)) set("remoteContent", remote); }).catch(() => {});
  }
  return content;
}

// Links zu vikitor.de bekommen einheitliche UTM-Parameter (Quelle: Addon); technische Adressen bleiben unverändert.
const NO_UTM = new Set(["skillsBase", "contentUpdate", "datenschutz"]);

export function withUtm(url, content) {
  try {
    const u = new URL(url);
    if (!u.hostname.endsWith("vikitor.de")) return url;
    u.searchParams.set("utm_source", "vikitor-addon");
    u.searchParams.set("utm_medium", "addon");
    if (content) u.searchParams.set("utm_content", content);
    return u.toString();
  } catch (_) { return url; }
}

export async function loadLinks() {
  const links = await (await fetch("data/links.json")).json();
  for (const [k, v] of Object.entries(links)) if (v && v.url && !NO_UTM.has(k)) v.url = withUtm(v.url, k);
  return links;
}
