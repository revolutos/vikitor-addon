// Kopie aus ~/Developer/vs-funnel-scan/lib/flow.mjs (Stand c44304c), unverändert bis auf Importpfade.
// Nicht hier ändern, sondern in der Engine und neu kopieren (scripts/sync-engine.mjs).
// Funnel-Logik: Seitentyp bestimmen, Haupt-CTA wählen, Opt-in-Formular vorbereiten/ausfüllen.
// Sicherheitsregeln: Opt-in nur mit --optin, einmal pro Funnel, Testname „Max Test", keine CAPTCHAs
// umgehen, Halt vor jeder Zahlung (Checkout wird erfasst, nichts abgeschickt).
import { regDomain, hostOf, normalizeUrl } from "./util.js";
import { CHECKOUT_HOSTS, FUNNEL_HOSTS } from "./tech.js";

export const TEST_PERSON = { first: "Max", last: "Test", full: "Max Test" };

const LEGAL = /impressum|imprint|datenschutz|privacy|agb|terms|cookie|widerruf|disclaimer|haftung|legal|kontakt|contact|faq$|sitemap|karriere|jobs|presse/i;
const LOGIN = /login|log-in|einloggen|sign-?in|anmeldung-mitglieder|mein-konto|my-account|account|passwort|password|member/i;
const SOCIAL = /(^|\.)(facebook|instagram|youtube|youtu|linkedin|x|twitter|tiktok|pinterest|xing|t|wa|whatsapp|threads|telegram|spotify|apple)\.(com|me|be|org)$|wa\.me$|t\.me$/i;
const CTA_WORDS =
  /jetzt|sichern|anmelden|eintragen|registrier|kostenlos|gratis|starten|start|loslegen|kaufen|bestellen|buchen|weiter|zum angebot|zur anmeldung|ja[,!]? ich|ich will|ich möchte|teilnehmen|zugang|download|herunterladen|ticket|termin|platz|mitmachen|get|join|buy|order|claim|register|sign ?up|yes|continue|grab|access|enroll|book/i;
const NEGATIVE = /nein,? danke|no,? thanks|überspringen|skip|später|zurück|back|abbrechen|cancel|mehr erfahren über uns/i;
const PAY_ACTION = /zahlungspflichtig|kostenpflichtig|jetzt bezahlen|bezahlen|pay now|place order|complete (order|purchase)|kauf abschließen|bestellung abschließen/i;

export function isCheckoutPage(page) {
  const host = hostOf(page.url);
  if (page.payment?.fields > 0 || page.payment?.iframes > 0) return true;
  if (page.forms?.some((f) => f.kind === "checkout" || (f.paymentWording && f.visible))) return true;
  if (CHECKOUT_HOSTS.test(host) && (page.forms?.length || page.payment?.wording)) return true;
  return false;
}

export function optinForm(page) {
  return (page.forms || []).find((f) => f.kind === "optin" && f.visible && f.hasSubmit) || null;
}

export function classifyStep(page, { index, via }) {
  const heads = [page.title, ...(page.headings || []).slice(0, 6).map((h) => h.text)].join(" ");
  const hasPrice = (page.prices || []).length > 0;
  if (isCheckoutPage(page)) return "checkout";
  if (via === "email-confirm") return "bestaetigung";
  if (optinForm(page) && index <= 2 && !/danke|thank/i.test(heads)) return index === 1 ? "landing-optin" : "optin";
  if (hasPrice && /warte|wait|einmalig|one[- ]time|nur (jetzt|heute|auf dieser seite)|upgrade|sonderangebot|special offer|\boto\b|exklusiv/i.test(heads)) return "upsell";
  if (/danke|vielen dank|thank you|thanks|bestätig|postfach|check (your )?(e-?mail|inbox)|fast geschafft|almost (done|there)|erfolgreich/i.test(heads)) return "danke";
  if (optinForm(page)) return "optin";
  if (hasPrice && (page.ctas || []).some((c) => /kauf|bestell|buy|order|warenkorb|cart/i.test(c.text))) return "sales";
  if (index === 1) return "landing";
  if (hasPrice) return "angebot";
  return "inhalt";
}

export const KIND_LABEL = {
  landing: "Landingpage",
  "landing-optin": "Landingpage mit Opt-in",
  optin: "Opt-in-Seite",
  danke: "Danke-Seite",
  bestaetigung: "Bestätigung (Double-Opt-in)",
  upsell: "Upsell / OTO",
  sales: "Verkaufsseite",
  angebot: "Angebotsseite",
  checkout: "Checkout (Halt)",
  popup: "Popup",
  inhalt: "Inhaltsseite",
};

/** Ist ein Ziel erlaubt? Gleiche Domain wie Start/besuchte Schritte oder bekannter Funnel-/Checkout-Anbieter. */
export function allowedTarget(url, ctx) {
  let u;
  try {
    u = new URL(url);
  } catch {
    return false;
  }
  if (!/^https?:$/.test(u.protocol)) return false;
  const host = u.hostname.toLowerCase();
  if (SOCIAL.test(host)) return false;
  if (/\.(pdf|zip|docx?|xlsx?|pptx?|mp3|mp4|mov|png|jpe?g|gif|webp|svg|ics)$/i.test(u.pathname)) return false;
  const rd = regDomain(host);
  if (ctx.domains.has(rd)) return true;
  return FUNNEL_HOSTS.test(host);
}

function scoreCta(c, page, ctx, counts) {
  const text = c.text || "";
  let s = 0;
  if (c.buttonLike) s += 4;
  if (c.style?.bg) s += 1;
  if (CTA_WORDS.test(text)) s += 3;
  if (NEGATIVE.test(text)) s -= 6;
  if (c.aboveFold) s += 1;
  if (c.style?.fontSize >= 16) s += 1;
  if (c.bbox && c.bbox.w * c.bbox.h > 9000) s += 1;
  const n = counts.get(c.href) || 0;
  if (n > 1) s += Math.min(3, n - 1);
  const sec = page.sections?.[c.section];
  if (sec && ["hero", "cta", "preis", "angebot"].includes(sec.type)) s += 1;
  if (text.length > 70) s -= 2;
  if (c.href && FUNNEL_HOSTS.test(hostOf(c.href))) s += 2;
  return s;
}

/**
 * Nächste Aktion bestimmen. Rückgabe:
 *  { type: "link", url, cta } | { type: "click", cta } | { type: "optin", form } | { stop, reason, message }
 */
export function decideNext(page, ctx) {
  if (isCheckoutPage(page)) return { stop: true, reason: "checkout", message: "Checkout erreicht: Halt vor der Zahlung (nichts abgeschickt, keine Zahlungsdaten)." };
  const form = optinForm(page);
  const links = rankLinks(page, ctx);
  if (form && !ctx.optinDone) {
    if (page.captcha || form.captcha)
      return { stop: true, reason: "captcha", message: "CAPTCHA am Opt-in-Formular: wird nicht umgangen. Bitte manuell im Addon weitermachen." };
    if (ctx.optin) return { type: "optin", form };
    if (!links.length) return { stop: true, reason: "optin-skipped", message: "Opt-in-Formular gefunden, aber --optin ist nicht gesetzt: Formular wurde nicht ausgefüllt." };
    ctx.warnings.push(`Schritt ${ctx.stepIndex}: Opt-in-Formular nicht ausgefüllt (ohne --optin), stattdessen Link gefolgt.`);
  }
  if (links.length) return { type: "link", url: links[0].href, cta: links[0], alternatives: links.slice(1, 4).map((l) => l.href) };
  const clicks = (page.ctas || [])
    .filter((c) => !c.href && c.buttonLike && !c.inForm && !c.inNav && !c.inFooter && CTA_WORDS.test(c.text || "") && !PAY_ACTION.test(c.text || "") && !NEGATIVE.test(c.text || ""))
    .filter((c) => !ctx.clicked.has(`${normalizeUrl(page.url)}|${c.text}`));
  if (clicks.length && ctx.clicksOnPage < 2) return { type: "click", cta: clicks[0] };
  return { stop: true, reason: "no-next", message: "Kein weiterer Haupt-CTA gefunden." };
}

export function rankLinks(page, ctx) {
  const here = normalizeUrl(page.url);
  const counts = new Map();
  for (const c of page.ctas || []) if (c.href) counts.set(c.href, (counts.get(c.href) || 0) + 1);
  const out = [];
  for (const c of page.ctas || []) {
    if (!c.href || c.inNav || c.inFooter || c.inForm) continue;
    if (/^(mailto|tel|javascript|sms):/i.test(c.rawHref || "")) continue;
    const nu = normalizeUrl(c.href);
    if (nu === here || (c.rawHref || "").startsWith("#")) continue;
    if (ctx.visited.has(nu)) continue;
    let path = "";
    try {
      path = new URL(c.href).pathname + new URL(c.href).search;
    } catch {}
    if (LEGAL.test(path) || LEGAL.test(c.text || "") || LOGIN.test(path) || LOGIN.test(c.text || "")) continue;
    if (PAY_ACTION.test(c.text || "")) continue;
    if (!allowedTarget(c.href, ctx)) continue;
    const score = scoreCta(c, page, ctx, counts);
    if (score < 4) continue;
    out.push({ ...c, score });
  }
  out.sort((a, b) => b.score - a.score || a.bbox.y - b.bbox.y);
  const seen = new Set();
  return out.filter((c) => !seen.has(normalizeUrl(c.href)) && seen.add(normalizeUrl(c.href)));
}

/** Werte für das Opt-in-Formular planen. Unbekannte Pflichtfelder → manuell (kein Erfinden von Daten). */
export function planOptin(form, email) {
  const values = [];
  const missing = [];
  for (const f of form.fields) {
    if (!f.visible && f.type !== "checkbox") continue;
    const sig = `${f.name || ""} ${f.id || ""} ${f.label || ""} ${f.autocomplete || ""}`.toLowerCase();
    if (f.payment || f.type === "password") return { ok: false, reason: "Formular verlangt Passwort oder Zahlungsdaten" };
    if (f.type === "email" || /e-?mail/.test(sig)) values.push({ ref: f.ref, value: email, kind: "email" });
    else if (f.type === "checkbox") {
      if (f.required) values.push({ ref: f.ref, check: true, kind: "pflicht-checkbox" });
    } else if (f.type === "radio") {
      if (f.required) values.push({ ref: f.ref, check: true, kind: "pflicht-radio" });
    } else if (/vorname|first|fname|given/.test(sig)) values.push({ ref: f.ref, value: TEST_PERSON.first, kind: "vorname" });
    else if (/nachname|last|lname|family|surname|zuname/.test(sig)) values.push({ ref: f.ref, value: TEST_PERSON.last, kind: "nachname" });
    else if (/name/.test(sig) && !/user|firma|company|unternehmen/.test(sig)) values.push({ ref: f.ref, value: TEST_PERSON.full, kind: "name" });
    else if (f.tag === "select" && f.required) values.push({ ref: f.ref, selectFirst: true, kind: "auswahl" });
    else if (f.required) missing.push(f.label || f.name || f.type);
  }
  if (!values.some((v) => v.kind === "email")) return { ok: false, reason: "kein E-Mail-Feld gefunden" };
  if (missing.length) return { ok: false, reason: `Pflichtfelder ohne Testwert: ${missing.slice(0, 4).join(", ")}` };
  return { ok: true, values };
}

/** Im Seitenkontext: Werte setzen (React-/Vue-kompatibel) und absenden. */
export function inPageFillAndSubmit({ formIndex, values, submit }) {
  const form = document.querySelector(`[data-vsfs-form="${formIndex}"]`);
  if (!form) return { ok: false, reason: "Formular nicht mehr gefunden" };
  const setVal = (el, v) => {
    const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : el.tagName === "SELECT" ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    const desc = Object.getOwnPropertyDescriptor(proto, "value");
    el.focus();
    desc && desc.set ? desc.set.call(el, v) : (el.value = v);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    el.blur();
  };
  const done = [];
  for (const v of values) {
    const el = document.querySelector(`[data-vsfs-field="${v.ref}"]`);
    if (!el) continue;
    if (v.check) {
      if (!el.checked) el.click();
    } else if (v.selectFirst) {
      const o = [...el.options].find((x) => x.value);
      if (o) setVal(el, o.value);
    } else setVal(el, v.value);
    done.push(v.kind);
  }
  if (!submit) return { ok: true, filled: done };
  if (typeof form.checkValidity === "function" && form.tagName === "FORM" && !form.checkValidity()) {
    const bad = [...form.querySelectorAll(":invalid")].map((e) => e.name || e.id || e.type).slice(0, 5);
    return { ok: false, reason: "Formular ungültig: " + bad.join(", "), filled: done };
  }
  const btn = document.querySelector(`[data-vsfs-submit="${formIndex}"]`);
  setTimeout(() => {
    if (btn) btn.click();
    else if (form.requestSubmit) form.requestSubmit();
    else form.submit();
  }, 50);
  return { ok: true, filled: done };
}

export function inPageClick(id) {
  const el = document.querySelector(`[data-vsfs-cta="${id}"]`);
  if (!el) return false;
  el.scrollIntoView({ block: "center" });
  setTimeout(() => el.click(), 50);
  return true;
}

/** Hat sich nach Klick/Absenden ohne Navigation sichtbar etwas geändert (Popup, Erfolgsmeldung)? */
export function inPageStateHash() {
  const t = (document.body.innerText || "").slice(0, 200000);
  const dialog = [...document.querySelectorAll('dialog[open], [role="dialog"], [aria-modal="true"]')].some((d) => d.getBoundingClientRect().height > 50);
  const forms = [...document.querySelectorAll("form")].filter((f) => f.getBoundingClientRect().height > 10).length;
  return { len: t.length, head: t.slice(0, 300), dialog, forms, emailVisible: [...document.querySelectorAll('input[type="email"]')].some((e) => e.getBoundingClientRect().height > 0) };
}
