// Kopie aus ~/Developer/vs-funnel-scan/lib/design.mjs (Stand c44304c), unverändert bis auf Importpfade.
// Nicht hier ändern, sondern in der Engine und neu kopieren (scripts/sync-engine.mjs).
// Design-Werte im Seitenkontext messen (Farben, Schriften, Abstände, Radien, Schatten, Buttons, Animationen)
// und daraus gerundete Design-Tokens für den Nachbau ableiten.
import { median, mode, roundTo } from "./util.js";

export function inPageDesign() {
  const vw = innerWidth;
  const vh = innerHeight;
  const cache = new Map();
  let ctx = null;
  const toHex = (c) => {
    if (!c || c === "transparent") return null;
    if (cache.has(c)) return cache.get(c);
    let r, g, b, a;
    const m = c.match(/^rgba?\(([^)]+)\)$/);
    if (m) {
      const p = m[1].split(/[\s,/]+/).filter(Boolean).map((x) => (x.endsWith("%") ? parseFloat(x) / 100 : parseFloat(x)));
      [r, g, b] = p;
      a = p.length > 3 ? p[3] : 1;
    } else {
      try {
        if (!ctx) {
          const cv = document.createElement("canvas");
          cv.width = cv.height = 1;
          ctx = cv.getContext("2d", { willReadFrequently: true });
        }
        ctx.clearRect(0, 0, 1, 1);
        ctx.fillStyle = "#000";
        ctx.fillStyle = c;
        ctx.fillRect(0, 0, 1, 1);
        const d = ctx.getImageData(0, 0, 1, 1).data;
        [r, g, b] = d;
        a = d[3] / 255;
      } catch {
        return null;
      }
    }
    if (!(a > 0.02)) {
      cache.set(c, null);
      return null;
    }
    const hex = "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
    const out = a < 0.98 ? hex + Math.round(a * 255).toString(16).padStart(2, "0") : hex;
    cache.set(c, out);
    return out;
  };
  const hsl = (hex) => {
    const n = parseInt(hex.slice(1, 7), 16);
    const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    const l = (mx + mn) / 2;
    const s = mx === mn ? 0 : l > 0.5 ? (mx - mn) / (2 - mx - mn) : (mx - mn) / (mx + mn);
    return { s, l };
  };
  const vis = (el, r) => {
    if (r.width < 1 || r.height < 1) return false;
    const cs = getComputedStyle(el);
    return cs.visibility !== "hidden" && cs.display !== "none" && +cs.opacity > 0.02;
  };
  const px = (v) => (v == null ? null : parseFloat(v));
  const fam = (f) => (f || "").split(",")[0].replace(/["']/g, "").trim();
  const inc = (map, k, w = 1) => k != null && k !== "" && map.set(k, (map.get(k) || 0) + w);
  const top = (map, n) => [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
  const docH = Math.max(document.documentElement.scrollHeight, document.body ? document.body.scrollHeight : 0);

  const bg = new Map(), text = new Map(), border = new Map(), btnBg = new Map(), linkC = new Map();
  const radii = new Map(), shadows = new Map(), gradients = new Map(), gaps = new Map(), widths = new Map();
  const families = new Map(), weights = new Map(), transitions = new Map(), easings = new Map();
  let transitionEls = 0, animatedEls = 0;
  const animNames = new Map();
  const isBtn = (el, cs) =>
    el.tagName === "BUTTON" || el.getAttribute("role") === "button" || (el.tagName === "INPUT" && /submit|button/.test(el.type)) ||
    (el.tagName === "A" && (/\b(btn|button|cta)\b|btn-|button-|elementor-button/i.test(typeof el.className === "string" ? el.className : "") || (cs.backgroundColor !== "rgba(0, 0, 0, 0)" && parseFloat(cs.paddingLeft) >= 8)));
  const buttons = [];

  const htmlBg = toHex(getComputedStyle(document.documentElement).backgroundColor);
  const bodyBg = document.body ? toHex(getComputedStyle(document.body).backgroundColor) : null;
  inc(bg, bodyBg || htmlBg || "#ffffff", vw * docH);

  const all = document.body ? document.body.getElementsByTagName("*") : [];
  const N = Math.min(all.length, 7000);
  for (let i = 0; i < N; i++) {
    const el = all[i];
    if (/^(SCRIPT|STYLE|NOSCRIPT|META|LINK|TEMPLATE|BR|PATH|DEFS)$/i.test(el.tagName)) continue;
    const r = el.getBoundingClientRect();
    if (!vis(el, r)) continue;
    const cs = getComputedStyle(el);
    const area = Math.min(r.width, vw) * Math.min(r.height, docH);
    const b = toHex(cs.backgroundColor);
    if (b) inc(bg, b, area);
    if (cs.backgroundImage && cs.backgroundImage.includes("gradient")) inc(gradients, cs.backgroundImage.slice(0, 220), area);
    let own = 0;
    for (const n of el.childNodes) if (n.nodeType === 3) own += n.nodeValue.trim().length;
    if (own) {
      const fs = px(cs.fontSize);
      inc(text, toHex(cs.color), own * fs);
      inc(families, fam(cs.fontFamily), own);
      inc(weights, String(+cs.fontWeight || 400), own);
      if (el.tagName === "A" && !isBtn(el, cs)) inc(linkC, toHex(cs.color), own);
    }
    const bw = px(cs.borderTopWidth);
    if (bw >= 1 && cs.borderTopStyle !== "none") inc(border, toHex(cs.borderTopColor), r.width);
    const rad = cs.borderTopLeftRadius;
    if (rad && rad !== "0px" && (b || bw >= 1 || el.tagName === "IMG" || el.tagName === "VIDEO" || el.tagName === "PICTURE")) {
      const rv = rad.endsWith("%") || px(rad) >= Math.min(r.width, r.height) / 2 - 1 ? "pill" : String(Math.round(px(rad)));
      inc(radii, rv);
    }
    if (cs.boxShadow && cs.boxShadow !== "none") inc(shadows, cs.boxShadow.slice(0, 200));
    if (/flex|grid/.test(cs.display)) {
      const g = cs.rowGap !== "normal" ? cs.rowGap : cs.gap;
      if (g && g !== "normal" && g !== "0px") inc(gaps, String(Math.round(px(g))));
      const cg = cs.columnGap;
      if (cg && cg !== "normal" && cg !== "0px") inc(gaps, String(Math.round(px(cg))));
    }
    if (cs.maxWidth !== "none" && r.width > 280 && r.width < vw - 24 && Math.abs(r.left - (vw - r.right)) < 8) inc(widths, String(Math.round(r.width)), r.height);
    const td = cs.transitionDuration;
    if (td && td.split(",").some((d) => parseFloat(d) > 0)) {
      transitionEls++;
      inc(transitions, `${cs.transitionProperty.split(",")[0].trim()} ${td.split(",")[0].trim()}`);
      inc(easings, cs.transitionTimingFunction.split(",")[0].trim());
    }
    if (cs.animationName && cs.animationName !== "none") {
      animatedEls++;
      for (const n of cs.animationName.split(",")) inc(animNames, n.trim());
    }
    if (isBtn(el, cs) && buttons.length < 60 && r.height >= 24 && r.height < 140) {
      buttons.push({
        bg: b,
        color: toHex(cs.color),
        radius: rad.endsWith("%") || px(rad) >= r.height / 2 - 1 ? "pill" : Math.round(px(rad)),
        paddingY: Math.round(px(cs.paddingTop)),
        paddingX: Math.round(px(cs.paddingLeft)),
        height: Math.round(r.height),
        fontSize: Math.round(px(cs.fontSize)),
        fontWeight: +cs.fontWeight || 400,
        fontFamily: fam(cs.fontFamily),
        textTransform: cs.textTransform !== "none" ? cs.textTransform : null,
        letterSpacing: cs.letterSpacing !== "normal" ? cs.letterSpacing : null,
        border: bw >= 1 ? `${Math.round(bw)}px ${toHex(cs.borderTopColor)}` : null,
        shadow: cs.boxShadow !== "none" ? cs.boxShadow.slice(0, 120) : null,
        w: r.width * r.height,
      });
      if (b) inc(btnBg, b, r.width * r.height);
    }
  }

  /* Farben bündeln */
  const sum = (m) => [...m.values()].reduce((a, b) => a + b, 0) || 1;
  const sBg = sum(bg), sTx = sum(text), sBo = sum(border);
  const combined = new Map();
  for (const [k, v] of bg) combined.set(k, { hex: k, bg: v / sBg, text: 0, border: 0 });
  for (const [k, v] of text) (combined.get(k) || combined.set(k, { hex: k, bg: 0, text: 0, border: 0 }).get(k)).text = v / sTx;
  for (const [k, v] of border) (combined.get(k) || combined.set(k, { hex: k, bg: 0, text: 0, border: 0 }).get(k)).border = v / sBo;
  const palette = [...combined.values()]
    .map((c) => ({ hex: c.hex, share: +(c.bg * 0.55 + c.text * 0.35 + c.border * 0.1).toFixed(4), uses: ["bg", "text", "border"].filter((k) => c[k] > 0.005) }))
    .sort((a, b) => b.share - a.share)
    .slice(0, 12);
  const topBg = top(bg, 3).map((x) => x[0]);
  const btnTop = top(btnBg, 3).map((x) => x[0]);
  const accentScore = new Map();
  for (const c of combined.values()) {
    if (c.hex.length > 7) continue;
    const { s, l } = hsl(c.hex);
    if (s < 0.3 || l < 0.12 || l > 0.92) continue;
    accentScore.set(c.hex, c.bg + c.text + (btnBg.get(c.hex) || 0) / (sum(btnBg) || 1) * 3 + (linkC.get(c.hex) || 0) / (sum(linkC) || 1));
  }
  const h1 = document.querySelector("h1, h2");
  const roles = {
    background: topBg[0] || null,
    surface: topBg[1] || null,
    text: top(text, 1)[0]?.[0] || null,
    heading: h1 ? toHex(getComputedStyle(h1).color) : null,
    accent: top(accentScore, 1)[0]?.[0] || btnTop[0] || null,
    buttonBg: btnTop[0] || null,
    buttonText: null,
    link: top(linkC, 1)[0]?.[0] || null,
  };

  /* Buttons bündeln */
  const bmap = new Map();
  for (const b of buttons) {
    const k = [b.bg, b.color, b.radius, b.fontWeight].join("|");
    const e = bmap.get(k) || { ...b, count: 0, weight: 0 };
    e.count++;
    e.weight += b.w;
    bmap.set(k, e);
  }
  const buttonStyles = [...bmap.values()].sort((a, b) => b.weight - a.weight).slice(0, 5).map(({ w, weight, ...rest }) => rest);
  if (buttonStyles[0]) roles.buttonText = buttonStyles.find((b) => b.bg === roles.buttonBg)?.color || buttonStyles[0].color;

  /* Typografie */
  const typeOf = (sel) => {
    const els = [...document.querySelectorAll(sel)].filter((e) => vis(e, e.getBoundingClientRect()) && (e.innerText || "").trim()).slice(0, 40);
    if (!els.length) return null;
    const rows = els.map((e) => {
      const cs = getComputedStyle(e);
      const fs = px(cs.fontSize);
      const lh = cs.lineHeight === "normal" ? null : +(px(cs.lineHeight) / fs).toFixed(2);
      return { family: fam(cs.fontFamily), size: fs, weight: +cs.fontWeight || 400, lineHeight: lh, letterSpacing: cs.letterSpacing === "normal" ? 0 : +(px(cs.letterSpacing) / fs).toFixed(3), transform: cs.textTransform };
    });
    const pick = (k) => {
      const c = new Map();
      rows.forEach((r) => inc(c, String(r[k])));
      return top(c, 1)[0]?.[0];
    };
    const sizes = rows.map((r) => r.size).sort((a, b) => a - b);
    return {
      family: pick("family"),
      size: sizes[Math.floor(sizes.length / 2)],
      sizeMax: sizes[sizes.length - 1],
      weight: +pick("weight"),
      lineHeight: pick("lineHeight") === "null" ? null : +pick("lineHeight"),
      letterSpacingEm: +pick("letterSpacing"),
      textTransform: pick("transform") !== "none" ? pick("transform") : null,
      count: els.length,
    };
  };
  const typography = { h1: typeOf("h1"), h2: typeOf("h2"), h3: typeOf("h3"), h4: typeOf("h4"), body: typeOf("p, li"), small: typeOf("small, figcaption, .small, footer p"), button: typeOf("button, a[class*='btn'], a[class*='button']") };
  const loadedFonts = [];
  try {
    for (const f of document.fonts) if (f.status === "loaded" && loadedFonts.length < 30) loadedFonts.push({ family: f.family.replace(/["']/g, ""), weight: f.weight, style: f.style });
  } catch {}

  /* Abstände */
  const secPads = [];
  for (const s of document.querySelectorAll("[data-vsfs-section]")) {
    const r = s.getBoundingClientRect();
    if (r.height < 120) continue;
    const cs = getComputedStyle(s);
    let first = null, last = null;
    for (const d of s.querySelectorAll("h1,h2,h3,h4,p,img,a,button,ul,form,video,iframe")) {
      const dr = d.getBoundingClientRect();
      if (dr.height < 2 || dr.width < 2) continue;
      if (!first || dr.top < first) first = dr.top;
      if (!last || dr.bottom > last) last = dr.bottom;
    }
    const topPad = first != null ? first - r.top : px(cs.paddingTop);
    const botPad = last != null ? r.bottom - last : px(cs.paddingBottom);
    secPads.push({ top: Math.max(0, Math.round(topPad)), bottom: Math.max(0, Math.round(botPad)) });
  }
  const med = (a) => {
    const s = a.filter((x) => x != null).sort((x, y) => x - y);
    return s.length ? s[Math.floor(s.length / 2)] : null;
  };
  const containerW = top(widths, 1)[0]?.[0];
  let sidePad = null;
  const h = document.querySelector("h1, h2, p");
  if (h) sidePad = Math.round(h.getBoundingClientRect().left);

  /* Animationen / Scroll-Libraries */
  const keyframes = new Set();
  let inaccessibleSheets = 0;
  for (const sh of document.styleSheets) {
    let rules;
    try {
      rules = sh.cssRules;
    } catch {
      inaccessibleSheets++;
      continue;
    }
    const walk = (rs) => {
      for (const r of rs) {
        if (r.type === 7 && keyframes.size < 60) keyframes.add(r.name);
        else if (r.cssRules) walk(r.cssRules);
      }
    };
    try {
      walk(rules);
    } catch {}
  }
  const w = window;
  const libs = [];
  const add = (n, c) => c && libs.push(n);
  add("GSAP", w.gsap || w.TweenMax);
  add("GSAP ScrollTrigger", w.ScrollTrigger || (w.gsap && w.gsap.plugins && w.gsap.plugins.scrollTrigger));
  add("Lenis", w.Lenis || w.lenis || document.documentElement.classList.contains("lenis"));
  add("Locomotive Scroll", w.LocomotiveScroll || document.querySelector("[data-scroll-container]"));
  add("AOS", w.AOS || document.querySelector("[data-aos]"));
  add("ScrollReveal", w.ScrollReveal);
  add("Framer Motion", document.querySelector("[data-framer-appear-id], [data-projection-id]"));
  add("Anime.js", w.anime);
  add("Swiper", w.Swiper || document.querySelector(".swiper, .swiper-container"));
  add("Splide", w.Splide || document.querySelector(".splide"));
  add("Slick", document.querySelector(".slick-slider"));
  add("Lottie", w.lottie || w.bodymovin || document.querySelector("lottie-player, dotlottie-player"));
  add("Barba.js", w.barba);
  add("SplitType/Splitting", w.SplitType || w.Splitting || document.querySelector("[data-splitting], .split-line, .char"));
  add("Elementor Motion", document.querySelector(".elementor-invisible, [data-settings*='animation']"));
  add("WOW.js", w.WOW || document.querySelector(".wow"));
  add("Reveal-Klassen (IntersectionObserver)", document.querySelector(".reveal, .fade-in, .fade-up, [data-reveal], [data-animate], [data-animation]"));
  let runningAnimations = 0;
  try {
    runningAnimations = document.getAnimations().length;
  } catch {}

  return {
    colors: { roles, palette, gradients: top(gradients, 4).map(([v, n]) => ({ value: v, weight: Math.round(n) })) },
    typography: { ...typography, families: top(families, 6).map(([f, n]) => ({ family: f, chars: n })), weights: top(weights, 8).map(([wt]) => +wt), loadedFonts },
    spacing: {
      sectionPaddingTop: med(secPads.map((s) => s.top)),
      sectionPaddingBottom: med(secPads.map((s) => s.bottom)),
      sections: secPads.length,
      container: containerW ? +containerW : null,
      containerCandidates: top(widths, 4).map(([v, n]) => ({ width: +v, weight: Math.round(n) })),
      sidePadding: sidePad,
      gaps: top(gaps, 6).map(([g, n]) => ({ px: +g, count: n })),
    },
    radii: top(radii, 6).map(([r, n]) => ({ value: r === "pill" ? "pill" : +r, count: n })),
    shadows: top(shadows, 5).map(([s, n]) => ({ value: s, count: n })),
    borders: top(border, 4).map(([c, n]) => ({ color: c, weight: Math.round(n) })),
    buttons: buttonStyles,
    motion: {
      transitionElements: transitionEls,
      transitions: top(transitions, 6).map(([t, n]) => ({ value: t, count: n })),
      easings: top(easings, 4).map(([t, n]) => ({ value: t, count: n })),
      cssAnimatedElements: animatedEls,
      animationNames: top(animNames, 10).map(([t]) => t),
      keyframes: [...keyframes],
      runningAnimations,
      scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
      libraries: libs,
      inaccessibleStylesheets: inaccessibleSheets,
    },
    viewport: { width: vw, height: vh },
  };
}

/** Kleine Messung in Mobil-Ansicht: Schriftgrößen, Sektions-Abstand, Seitenrand. */
export function inPageMobileType() {
  const size = (sel) => {
    const e = [...document.querySelectorAll(sel)].find((x) => x.getBoundingClientRect().height > 0 && (x.innerText || "").trim());
    return e ? Math.round(parseFloat(getComputedStyle(e).fontSize)) : null;
  };
  const pads = [];
  for (const s of document.querySelectorAll("[data-vsfs-section]")) {
    const r = s.getBoundingClientRect();
    if (r.height < 120) continue;
    let first = null;
    for (const d of s.querySelectorAll("h1,h2,h3,p,img,a,button")) {
      const dr = d.getBoundingClientRect();
      if (dr.height > 1 && (first == null || dr.top < first)) first = dr.top;
    }
    if (first != null) pads.push(Math.round(first - r.top));
  }
  pads.sort((a, b) => a - b);
  const p = document.querySelector("h1, h2, p");
  return {
    h1: size("h1"),
    h2: size("h2"),
    h3: size("h3"),
    body: size("p, li"),
    sectionPaddingTop: pads.length ? pads[Math.floor(pads.length / 2)] : null,
    sidePadding: p ? Math.round(p.getBoundingClientRect().left) : null,
  };
}

/* ---------- Zusammenfassung über alle Schritte + Tokens ---------- */

export function mergeDesign(designs) {
  const ds = designs.filter(Boolean);
  if (!ds.length) return null;
  const first = ds[0];
  const pal = new Map();
  for (const d of ds) for (const c of d.colors?.palette || []) pal.set(c.hex, (pal.get(c.hex) || 0) + c.share / ds.length);
  const palette = [...pal.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([hex, share]) => ({ hex, share: +share.toFixed(4) }));
  const typo = {};
  for (const k of ["h1", "h2", "h3", "body", "button"]) {
    const rows = ds.map((d) => d.typography?.[k]).filter(Boolean);
    if (!rows.length) continue;
    typo[k] = {
      family: mode(rows.map((r) => r.family)),
      size: median(rows.map((r) => r.sizeMax ?? r.size)),
      weight: mode(rows.map((r) => r.weight)),
      lineHeight: median(rows.map((r) => r.lineHeight)),
      letterSpacingEm: median(rows.map((r) => r.letterSpacingEm)),
    };
  }
  const mob = {};
  for (const k of ["h1", "h2", "h3", "body", "sectionPaddingTop", "sidePadding"]) mob[k] = median(ds.map((d) => d.mobile?.[k]));
  const radii = new Map();
  for (const d of ds) for (const r of d.radii || []) radii.set(String(r.value), (radii.get(String(r.value)) || 0) + r.count);
  return {
    roles: first.colors?.roles || {},
    palette,
    typography: typo,
    mobile: mob,
    spacing: {
      sectionPaddingTop: median(ds.map((d) => d.spacing?.sectionPaddingTop)),
      sectionPaddingBottom: median(ds.map((d) => d.spacing?.sectionPaddingBottom)),
      container: mode(ds.map((d) => d.spacing?.container).filter(Boolean)) ?? null,
      gap: mode(ds.flatMap((d) => (d.spacing?.gaps || []).slice(0, 2).map((g) => g.px))) ?? null,
    },
    radii: [...radii.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([v, n]) => ({ value: v === "pill" ? "pill" : +v, count: n })),
    shadows: (first.shadows || []).slice(0, 3).map((s) => s.value),
    button: first.buttons?.find((b) => b.bg === first.colors?.roles?.buttonBg) || first.buttons?.[0] || null,
    motion: {
      libraries: [...new Set(ds.flatMap((d) => d.motion?.libraries || []))],
      easing: mode(ds.flatMap((d) => (d.motion?.easings || []).slice(0, 1).map((e) => e.value))) || null,
      transition: mode(ds.flatMap((d) => (d.motion?.transitions || []).slice(0, 1).map((e) => e.value))) || null,
    },
  };
}

const fsRound = (v) => (v == null ? null : v > 20 ? roundTo(v, 2) : Math.round(v));
const spRound = (v) => (v == null ? null : v >= 32 ? roundTo(v, 8) : roundTo(v, 4));
const quote = (f) => (f ? (/^[\w-]+$/.test(f) && !/\s/.test(f) ? f : `"${f.replace(/"/g, "")}"`) : null);

export function tokensCss(sum, meta = {}) {
  const L = [];
  L.push(
    "/*",
    " * Design-Tokens, abgeleitet aus einem Funnel-Scan (vs-funnel-scan).",
    ` * Quelle: ${meta.startUrl || "?"} · erstellt ${meta.date || new Date().toISOString()}`,
    " * Gerundete Startwerte für den Nachbau: im EIGENEN Brand anpassen (Farben, Schriften).",
    " * Regel: Seitenablauf und Layout-Muster dürfen nah modelliert werden; Texte, Bilder, Logos,",
    " * Markennamen, Kundenstimmen und Zahlen sind IMMER eigen. Schriften nur mit eigener Lizenz nutzen.",
    " */",
    ":root {",
  );
  if (!sum) return L.concat(["  /* keine Design-Werte erfasst */", "}", ""]).join("\n");
  const r = sum.roles || {};
  const c = (n, v) => v && L.push(`  --${n}: ${v};`);
  L.push("  /* Farben (Rollen) */");
  c("color-bg", r.background);
  c("color-surface", r.surface);
  c("color-text", r.text);
  c("color-heading", r.heading);
  c("color-accent", r.accent);
  c("color-link", r.link);
  c("color-button-bg", r.buttonBg);
  c("color-button-text", r.buttonText);
  L.push("  /* Palette nach Häufigkeit */");
  (sum.palette || []).slice(0, 8).forEach((p, i) => L.push(`  --palette-${i + 1}: ${p.hex}; /* ${(p.share * 100).toFixed(1)} % */`));
  const t = sum.typography || {};
  L.push("  /* Schrift */");
  const hf = quote(t.h1?.family || t.h2?.family);
  const bf = quote(t.body?.family);
  if (hf) L.push(`  --font-heading: ${hf}, system-ui, sans-serif;`);
  if (bf) L.push(`  --font-body: ${bf}, system-ui, sans-serif;`);
  const m = sum.mobile || {};
  for (const k of ["h1", "h2", "h3", "body"]) {
    const d = fsRound(t[k]?.size);
    if (!d) continue;
    const mo = fsRound(m[k]) || d;
    const lo = Math.min(mo, d), hi = Math.max(mo, d);
    L.push(lo === hi ? `  --fs-${k}: ${hi}px;` : `  --fs-${k}: clamp(${lo}px, ${((hi / 1440) * 100).toFixed(2)}vw, ${hi}px); /* mobil ${mo}px, Desktop ${d}px */`);
    if (t[k]?.weight) L.push(`  --fw-${k}: ${t[k].weight};`);
    if (t[k]?.lineHeight) L.push(`  --lh-${k}: ${(Math.round(t[k].lineHeight * 20) / 20).toFixed(2)};`);
    if (t[k]?.letterSpacingEm) L.push(`  --ls-${k}: ${(Math.round(t[k].letterSpacingEm * 200) / 200).toFixed(3)}em;`);
  }
  const s = sum.spacing || {};
  L.push("  /* Abstände & Layout */");
  const sp = spRound(s.sectionPaddingTop);
  if (sp) L.push(`  --space-section: ${sp}px;`);
  const spm = spRound(m.sectionPaddingTop);
  if (spm) L.push(`  --space-section-mobile: ${spm}px;`);
  if (s.container) L.push(`  --container: ${roundTo(s.container, 10)}px;`);
  if (m.sidePadding) L.push(`  --gutter-mobile: ${spRound(m.sidePadding)}px;`);
  if (s.gap) L.push(`  --gap: ${spRound(s.gap)}px;`);
  L.push("  /* Radien & Schatten */");
  const nums = (sum.radii || []).filter((x) => x.value !== "pill").map((x) => x.value).sort((a, b) => a - b);
  const uniq = [...new Set(nums.map((v) => roundTo(v, 2)))];
  ["sm", "md", "lg"].forEach((n, i) => uniq[i] != null && L.push(`  --radius-${n}: ${uniq[i]}px;`));
  if ((sum.radii || []).some((x) => x.value === "pill")) L.push("  --radius-pill: 999px;");
  (sum.shadows || []).forEach((v, i) => L.push(`  --shadow-${i + 1}: ${v};`));
  const b = sum.button;
  if (b) {
    L.push("  /* Haupt-Button */");
    L.push(`  --button-radius: ${b.radius === "pill" ? "999px" : `${roundTo(b.radius, 2)}px`};`);
    L.push(`  --button-padding: ${spRound(b.paddingY)}px ${spRound(b.paddingX)}px;`);
    L.push(`  --button-font-size: ${fsRound(b.fontSize)}px;`);
    L.push(`  --button-font-weight: ${b.fontWeight};`);
    if (b.textTransform) L.push(`  --button-text-transform: ${b.textTransform};`);
  }
  const mo = sum.motion || {};
  if (mo.easing || mo.transition) {
    L.push("  /* Bewegung */");
    if (mo.easing) L.push(`  --ease: ${mo.easing};`);
    const dur = mo.transition && /([\d.]+)(m?s)/.exec(mo.transition);
    if (dur) L.push(`  --duration: ${roundTo(dur[2] === "s" ? +dur[1] * 1000 : +dur[1], 50)}ms;`);
  }
  if (mo.libraries?.length) L.push(`  /* erkannte Motion-Bibliotheken: ${mo.libraries.join(", ")} */`);
  L.push("}", "");
  return L.join("\n");
}
