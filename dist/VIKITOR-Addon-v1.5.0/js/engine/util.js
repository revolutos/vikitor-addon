// Browserfähige Teilmenge von ~/Developer/vs-funnel-scan/lib/util.mjs (Stand c44304c): ohne fs/path/process.
// Kleine Helfer ohne Abhängigkeiten (plattformneutral: nur path.join, keine Shell).

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const UMLAUTE = { ä: "ae", ö: "oe", ü: "ue", ß: "ss", Ä: "ae", Ö: "oe", Ü: "ue" };

export function slugify(input, fallback = "seite", max = 40) {
  const s = String(input || "")
    .replace(/[äöüßÄÖÜ]/g, (c) => UMLAUTE[c])
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\.(html?|php|aspx?)$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, max)
    .replace(/-+$/g, "");
  return s || fallback;
}

export const pad2 = (n) => String(n).padStart(2, "0");

export function normalizeUrl(u) {
  try {
    const x = new URL(u);
    x.hash = "";
    let s = x.toString();
    if (x.pathname !== "/" && s.endsWith("/") && !x.search) s = s.slice(0, -1);
    return s;
  } catch {
    return String(u || "");
  }
}

const MULTI_TLD = new Set(["co.uk", "org.uk", "ac.uk", "com.au", "net.au", "co.at", "or.at", "co.nz", "com.br", "co.jp", "com.tr", "co.za"]);

/** Registrierbare Domain grob bestimmen (ohne Public-Suffix-Liste). */
export function regDomain(host) {
  host = String(host || "").toLowerCase().replace(/^\[|\]$/g, "");
  if (!host || /^[\d.]+$/.test(host) || host.includes(":") || !host.includes(".")) return host;
  const parts = host.split(".");
  const last2 = parts.slice(-2).join(".");
  return MULTI_TLD.has(last2) ? parts.slice(-3).join(".") : last2;
}

export function hostOf(u) {
  try {
    return new URL(u).hostname.toLowerCase();
  } catch {
    return "";
  }
}

export const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export function median(arr) {
  const a = arr.filter((v) => typeof v === "number" && isFinite(v)).sort((x, y) => x - y);
  if (!a.length) return null;
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}

export function mode(arr) {
  const c = new Map();
  for (const v of arr) if (v != null) c.set(v, (c.get(v) || 0) + 1);
  let best = null, n = 0;
  for (const [v, k] of c) if (k > n) (best = v), (n = k);
  return best;
}

export const roundTo = (v, step) => (v == null || !isFinite(v) ? null : Math.round(v / step) * step);

