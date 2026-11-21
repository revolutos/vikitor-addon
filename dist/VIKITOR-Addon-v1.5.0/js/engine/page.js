// Kopie aus ~/Developer/vs-funnel-scan/lib/page.mjs (Stand c44304c), unverändert bis auf Importpfade.
// Nicht hier ändern, sondern in der Engine und neu kopieren (scripts/sync-engine.mjs).
// Seitenanalyse im Seitenkontext: Meta, Überschriften, Sektionen (mit Typ-Vermutung), CTAs, Formulare,
// Preise, Knappheit, Videos, Popups. Markiert Elemente mit data-vsfs-* für spätere Klicks.
// Texte landen nur in page.json/text.md (Analyse), nie in Nachbau-Dateien.

export function inPageAnalyze() {
  return (async () => {
    const vw = innerWidth;
    const vh = innerHeight;
    const sx = scrollX;
    const sy = scrollY;
    const docH = Math.max(document.documentElement.scrollHeight, document.body ? document.body.scrollHeight : 0);
    const R = (el) => {
      const r = el.getBoundingClientRect();
      return { x: Math.round(r.left + sx), y: Math.round(r.top + sy), w: Math.round(r.width), h: Math.round(r.height) };
    };
    const vis = (el) => {
      if (!el || !el.getBoundingClientRect) return false;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return false;
      const cs = getComputedStyle(el);
      return cs.visibility !== "hidden" && cs.display !== "none" && +cs.opacity > 0.02;
    };
    const T = (el, n = 200) => (el ? (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim().slice(0, n) : "");
    const abs = (h) => {
      try {
        return new URL(h, location.href).href;
      } catch {
        return null;
      }
    };
    const transparent = (c) => !c || c === "transparent" || /rgba\([^)]*,\s*0\)$/.test(c) || /\/\s*0\)$/.test(c);
    for (const el of document.querySelectorAll("[data-vsfs-cta],[data-vsfs-form],[data-vsfs-submit],[data-vsfs-field],[data-vsfs-section]")) {
      for (const a of ["data-vsfs-cta", "data-vsfs-form", "data-vsfs-submit", "data-vsfs-field", "data-vsfs-section"]) el.removeAttribute(a);
    }

    /* Meta */
    const m = (sel) => document.querySelector(sel)?.getAttribute("content") || null;
    const meta = {
      lang: document.documentElement.lang || null,
      description: m('meta[name="description"]'),
      robots: m('meta[name="robots"]'),
      viewport: m('meta[name="viewport"]'),
      generator: m('meta[name="generator"]'),
      canonical: document.querySelector('link[rel="canonical"]')?.href || null,
      og: {
        title: m('meta[property="og:title"]'),
        description: m('meta[property="og:description"]'),
        image: m('meta[property="og:image"]'),
        type: m('meta[property="og:type"]'),
        siteName: m('meta[property="og:site_name"]'),
      },
      twitterCard: m('meta[name="twitter:card"]'),
      favicon: document.querySelector('link[rel~="icon"]')?.href || null,
    };

    /* Überschriften */
    const headings = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")]
      .filter(vis)
      .slice(0, 150)
      .map((h) => ({ level: +h.tagName[1], text: T(h, 200), y: R(h).y }));

    /* Sektionen */
    const blockish = (el) => {
      if (!vis(el)) return false;
      const cs = getComputedStyle(el);
      if (cs.position === "fixed" && el.getBoundingClientRect().height > vh * 0.8) return false;
      return !/^(SCRIPT|STYLE|NOSCRIPT|LINK|META|TEMPLATE|SVG|BR)$/.test(el.tagName);
    };
    const kidsOf = (el) => [...el.children].filter((k) => blockish(k) && k.getBoundingClientRect().height >= 24 && k.getBoundingClientRect().width >= vw * 0.45);
    let list = [document.body];
    for (let round = 0; round < 8; round++) {
      let changed = false;
      const next = [];
      for (const el of list) {
        const isSemantic = /^(SECTION|HEADER|FOOTER|NAV|ASIDE)$/.test(el.tagName) && el !== document.body;
        const kids = kidsOf(el);
        const h = el.getBoundingClientRect().height;
        const kidsH = kids.reduce((a, k) => a + k.getBoundingClientRect().height, 0);
        const ecs = getComputedStyle(el);
        const whole = el.getBoundingClientRect().height >= docH * 0.9 && kids.length >= 1;
        const distinct = !whole && (!transparent(ecs.backgroundColor) || ecs.backgroundImage !== "none" || parseFloat(ecs.paddingTop) >= 24);
        const wrapper =
          el === document.body || (!isSemantic && ((kids.length === 1 && !distinct) || (kids.length >= 2 && h > vh * 1.3 && kidsH > h * 0.6)));
        if (wrapper && kids.length) {
          next.push(...kids);
          changed = true;
        } else next.push(el);
      }
      list = next;
      if (!changed) break;
    }
    list = list.filter((el) => el.getBoundingClientRect().height >= 40).slice(0, 60);

    const PRICE_RE = /(?:€|EUR|\$|USD|CHF|£)\s?\d{1,3}(?:[.\s]\d{3})*(?:[.,]\d{1,2})?(?:,-)?|\d{1,3}(?:[.\s]\d{3})*(?:[.,]\d{1,2})?(?:,-)?\s?(?:€|EUR|Euro|USD|CHF|£)/g;
    const KW = {
      socialProof: /kundenstimme|erfahrung|bewertung|rezension|testimonial|das sagen|sagen unsere|teilnehmer sagen|trustpilot|provenexpert|google-bewertung|★|⭐|reviews?\b|what (our )?(clients|customers) say/i,
      faq: /\bfaq\b|häufig(e|ste)? (gestellte )?fragen|fragen (und|&) antworten|frequently asked/i,
      logos: /bekannt aus|as seen|featured in|partner|kunden wie|vertrauen uns|trusted by/i,
      guarantee: /garantie|geld[- ]zurück|risikofrei|guarantee|money[- ]back/i,
      about: /über mich|über uns|wer (ist|sind|bin)|dein (coach|mentor)|about (me|us)|meet your/i,
      steps: /schritt \d|in \d schritten|so funktioniert|ablauf|how it works|step \d/i,
      benefits: /vorteile|du bekommst|das erwartet dich|was du lernst|nutzen|inhalte|module|what you('ll)? (get|learn)|benefits|features|leistungen/i,
      offer: /angebot|paket|bonus|wert von|statt|nur heute|jetzt (kaufen|sichern|bestellen)|in den warenkorb|offer|bundle/i,
    };
    const sections = list.map((el, i) => {
      el.setAttribute("data-vsfs-section", String(i));
      const r = R(el);
      const text = (el.innerText || "").slice(0, 4000);
      const tag = el.tagName.toLowerCase();
      const sig = {
        tag,
        h1: !!el.querySelector("h1"),
        form: !!el.querySelector("form, input[type=email]"),
        prices: (text.match(PRICE_RE) || []).length,
        images: el.querySelectorAll("img, picture, svg").length,
        video: !!el.querySelector("video, iframe[src*='youtu'], iframe[src*='vimeo'], iframe[src*='wistia'], iframe[src*='vidalytics']"),
        details: el.querySelectorAll("details, [aria-expanded]").length,
        blockquotes: el.querySelectorAll("blockquote, [class*='testimonial'], [class*='review']").length,
        listItems: el.querySelectorAll("li").length,
        buttons: el.querySelectorAll("a, button").length,
        legal: /impressum|datenschutz|privacy|agb|terms/i.test(text) && text.length < 1500,
        words: text.split(/\s+/).filter(Boolean).length,
      };
      let type = "inhalt";
      let why = [];
      const firstBig = r.y < vh * 0.9;
      if (tag === "footer" || el.closest("footer") || (sig.legal && i > 0 && i >= list.length - 2 && r.h < vh * 0.6)) type = "footer";
      else if ((tag === "header" || tag === "nav" || el.querySelector(":scope > nav")) && r.h < 200) type = "header";
      else if ((sig.h1 || (firstBig && i <= 1)) && r.y < vh * 1.2) type = "hero";
      else if (sig.details >= 3 || KW.faq.test(text.slice(0, 400))) type = "faq";
      else if (sig.form && sig.words < 250) type = "formular";
      else if (sig.prices >= 1 && KW.offer.test(text)) type = "preis";
      else if (sig.blockquotes >= 1 || KW.socialProof.test(text.slice(0, 1500))) type = "social-proof";
      else if (KW.logos.test(text.slice(0, 300)) || (sig.images >= 4 && sig.words < 40)) type = "logos";
      else if (KW.guarantee.test(text.slice(0, 600))) type = "garantie";
      else if (sig.video && sig.words < 120) type = "video";
      else if (KW.steps.test(text.slice(0, 600))) type = "ablauf";
      else if (KW.about.test(text.slice(0, 600))) type = "ueber";
      else if (KW.offer.test(text.slice(0, 600)) && sig.buttons >= 1) type = "angebot";
      else if (KW.benefits.test(text.slice(0, 600)) || sig.listItems >= 3) type = "nutzen";
      else if (sig.words < 60 && sig.buttons >= 1 && sig.buttons <= 3) type = "cta";
      why = Object.entries(sig)
        .filter(([k, v]) => v && v !== 0 && k !== "tag" && k !== "words")
        .map(([k, v]) => (v === true ? k : `${k}:${v}`));
      const cs = getComputedStyle(el);
      return {
        index: i,
        type,
        tag,
        id: el.id || null,
        bbox: r,
        background: transparent(cs.backgroundColor) ? null : cs.backgroundColor,
        backgroundImage: cs.backgroundImage && cs.backgroundImage !== "none" ? (cs.backgroundImage.includes("gradient") ? "gradient" : "image") : null,
        heading: T(el.querySelector("h1,h2,h3"), 140) || null,
        words: sig.words,
        signals: why,
      };
    });
    const sectionIndexOf = (el) => {
      const s = el.closest("[data-vsfs-section]");
      return s ? +s.getAttribute("data-vsfs-section") : null;
    };

    /* CTAs */
    const isFixedBar = (el) => {
      for (let n = el, i = 0; n && n !== document.body && i < 12; n = n.parentElement, i++) {
        const cs = getComputedStyle(n);
        if ((cs.position === "fixed" || cs.position === "sticky") && n.getBoundingClientRect().height < 180) return true;
      }
      return false;
    };
    const buttonLike = (el, cs) => {
      if (el.tagName === "BUTTON" || el.tagName === "INPUT" || el.getAttribute("role") === "button") return true;
      const cls = typeof el.className === "string" ? el.className : "";
      if (/\b(btn|button|cta)\b|btn-|button-|-btn|-button|elementor-button|wp-block-button/i.test(cls)) return true;
      const pbg = el.parentElement ? getComputedStyle(el.parentElement).backgroundColor : "";
      if (!transparent(cs.backgroundColor) && cs.backgroundColor !== pbg && parseFloat(cs.paddingLeft) >= 8) return true;
      if (parseFloat(cs.borderTopWidth) >= 1 && parseFloat(cs.borderTopLeftRadius) >= 3 && parseFloat(cs.paddingLeft) >= 10) return true;
      return false;
    };
    const ctaEls = [...document.querySelectorAll('a[href], button, input[type="submit"], input[type="button"], [role="button"]')].filter(vis).slice(0, 400);
    const ctas = ctaEls
      .map((el, i) => {
        const cs = getComputedStyle(el);
        const text = (el.innerText || el.value || el.getAttribute("aria-label") || el.title || "").replace(/\s+/g, " ").trim().slice(0, 120);
        if (!text && !el.querySelector("img,svg")) return null;
        el.setAttribute("data-vsfs-cta", String(i));
        const rawHref = el.getAttribute("href");
        const r = R(el);
        return {
          id: i,
          tag: el.tagName.toLowerCase(),
          text,
          href: rawHref ? abs(rawHref) : null,
          rawHref: rawHref ? rawHref.slice(0, 300) : null,
          target: el.getAttribute("target") || null,
          buttonLike: buttonLike(el, cs),
          inNav: !!el.closest('nav, [role="navigation"]') || isFixedBar(el),
          inFooter: !!el.closest('footer, [role="contentinfo"]'),
          inForm: !!el.closest("form"),
          type: el.getAttribute("type") || null,
          section: sectionIndexOf(el),
          aboveFold: r.y < vh,
          bbox: r,
          style: {
            bg: transparent(cs.backgroundColor) ? null : cs.backgroundColor,
            color: cs.color,
            fontSize: parseFloat(cs.fontSize),
            fontWeight: +cs.fontWeight || 400,
            radius: cs.borderTopLeftRadius,
          },
        };
      })
      .filter(Boolean);

    /* Formulare */
    const labelOf = (f) =>
      (f.labels && f.labels[0] && T(f.labels[0], 80)) || f.getAttribute("aria-label") || f.getAttribute("placeholder") || T(f.closest("label"), 80) || null;
    const CAPTCHA_SEL =
      'iframe[src*="recaptcha"], .g-recaptcha, .grecaptcha-badge, iframe[src*="hcaptcha"], .h-captcha, .cf-turnstile, iframe[src*="challenges.cloudflare"], .frc-captcha, [class*="captcha"], [id*="captcha"], input[name*="captcha"]';
    const captchaKind = (root) => {
      const c = root.querySelector(CAPTCHA_SEL);
      if (!c) return null;
      const s = (c.getAttribute("src") || "") + " " + (typeof c.className === "string" ? c.className : "") + " " + (c.id || "");
      return /hcaptcha|h-captcha/i.test(s) ? "hcaptcha" : /turnstile|cloudflare/i.test(s) ? "turnstile" : /recaptcha/i.test(s) ? "recaptcha" : /frc/i.test(s) ? "friendlycaptcha" : "captcha";
    };
    const PAY_FIELD = /card|karte|kreditkarte|cc-?(number|num|exp|csc)|cvc|cvv|iban|bic|expir|ablauf|sicherheitscode|kontonummer/i;
    const fieldInfo = (f, fi, fid) => {
      f.setAttribute("data-vsfs-field", `${fid}-${fi}`);
      const opts = f.tagName === "SELECT" ? [...f.options].filter((o) => o.value).length : null;
      return {
        ref: `${fid}-${fi}`,
        tag: f.tagName.toLowerCase(),
        type: (f.getAttribute("type") || (f.tagName === "SELECT" ? "select" : f.tagName === "TEXTAREA" ? "textarea" : "text")).toLowerCase(),
        name: f.getAttribute("name") || null,
        id: f.id || null,
        autocomplete: f.getAttribute("autocomplete") || null,
        label: labelOf(f),
        required: f.required || f.getAttribute("aria-required") === "true",
        visible: vis(f),
        options: opts,
        payment: PAY_FIELD.test([f.name, f.id, f.getAttribute("autocomplete"), f.getAttribute("placeholder"), labelOf(f)].join(" ")),
      };
    };
    const formRoots = [...document.querySelectorAll("form")].filter((f) => vis(f) || f.querySelector("input:not([type=hidden])"));
    // Felder ohne <form> (manche Baukästen): nächsten Container mit Button als Pseudo-Formular
    for (const inp of document.querySelectorAll('input[type="email"], input[name*="mail" i]')) {
      if (inp.closest("form") || !vis(inp)) continue;
      let c = inp.parentElement;
      for (let i = 0; c && i < 6 && !c.querySelector("button, [role=button], input[type=submit]"); i++) c = c.parentElement;
      if (c && !formRoots.includes(c)) formRoots.push(c);
    }
    const forms = formRoots.slice(0, 12).map((f, fid) => {
      f.setAttribute("data-vsfs-form", String(fid));
      const fields = [...f.querySelectorAll("input, select, textarea")]
        .filter((x) => !/^(hidden|submit|button|image|reset)$/i.test(x.type))
        .slice(0, 40)
        .map((x, fi) => fieldInfo(x, fi, fid));
      const submit =
        [...f.querySelectorAll('button[type="submit"], input[type="submit"], button:not([type]), button[type="button"], [role="button"], a[class*="button"], a[class*="btn"]')].find(vis) || null;
      if (submit) submit.setAttribute("data-vsfs-submit", String(fid));
      const ftext = (f.innerText || "").slice(0, 2000);
      const hasEmail = fields.some((x) => x.type === "email" || /e-?mail/i.test(`${x.name} ${x.id} ${x.label} ${x.autocomplete}`));
      const hasPassword = fields.some((x) => x.type === "password");
      const hasPayment = fields.some((x) => x.payment) || !!f.querySelector('iframe[src*="stripe"], iframe[src*="paypal"], iframe[src*="braintree"], iframe[src*="adyen"], iframe[src*="mollie"]');
      const isSearch = f.getAttribute("role") === "search" || fields.some((x) => x.type === "search" || /^(s|q|search)$/i.test(x.name || ""));
      const kind = hasPayment
        ? "checkout"
        : hasPassword
          ? "login"
          : isSearch
            ? "suche"
            : hasEmail && fields.filter((x) => x.visible && x.type !== "checkbox").length <= 6
              ? "optin"
              : hasEmail
                ? "kontakt"
                : "sonstiges";
      return {
        index: fid,
        tag: f.tagName.toLowerCase(),
        action: f.getAttribute("action") ? abs(f.getAttribute("action")) : null,
        method: (f.getAttribute("method") || "get").toLowerCase(),
        kind,
        visible: vis(f),
        section: sectionIndexOf(f),
        bbox: R(f),
        fields,
        submitText: submit ? (submit.innerText || submit.value || "").replace(/\s+/g, " ").trim().slice(0, 100) : null,
        hasSubmit: !!submit,
        captcha: captchaKind(f),
        paymentWording: /zahlungspflichtig|kostenpflichtig bestellen|jetzt bezahlen|pay now|place order|complete (order|purchase)/i.test(ftext),
      };
    });

    /* Preise */
    const prices = [];
    const seenPrice = new Set();
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode()) && prices.length < 40) {
      const s = node.nodeValue;
      if (!s || !/\d/.test(s)) continue;
      const hits = s.match(PRICE_RE);
      if (!hits) continue;
      const pe = node.parentElement;
      if (!pe || !vis(pe)) continue;
      let struck = false;
      for (let n = pe, i = 0; n && i < 4; n = n.parentElement, i++) {
        if (/^(S|DEL|STRIKE)$/.test(n.tagName) || getComputedStyle(n).textDecorationLine.includes("line-through")) struck = true;
      }
      for (const h of hits) {
        const key = h + "|" + struck;
        if (seenPrice.has(key)) continue;
        seenPrice.add(key);
        const num = parseFloat(h.replace(/[^\d.,]/g, "").replace(/\.(?=\d{3})/g, "").replace(",", "."));
        const cur = /\$|USD/.test(h) ? "USD" : /CHF/.test(h) ? "CHF" : /£/.test(h) ? "GBP" : "EUR";
        prices.push({ text: h.trim(), value: isFinite(num) ? num : null, currency: cur, struck, y: R(pe).y, section: sectionIndexOf(pe) });
      }
    }

    /* Countdown / Knappheit */
    const timeRe = /\b\d{1,2}\s*:\s*\d{2}(\s*:\s*\d{2})?\b/;
    const cdCands = [...document.querySelectorAll('[class*="countdown" i], [id*="countdown" i], [class*="timer" i], [id*="timer" i], [data-countdown], [class*="clock" i]')]
      .filter(vis)
      .slice(0, 10);
    for (const el of document.querySelectorAll("span, div, p, strong, b")) {
      if (cdCands.length >= 10) break;
      const tc = el.textContent || "";
      const unitRe = /\d{1,2}\s*(tage|tag|std|stunden|min|minuten|sek|sekunden|days?|hours?|hrs|mins?|minutes|secs?|seconds)\b/i;
      if (el.children.length <= 12 && tc.length < 120 && (timeRe.test(tc) || (unitRe.test(tc) && /(sek|sec)/i.test(tc))) && vis(el)) cdCands.push(el);
    }
    const before = cdCands.map((e) => e.textContent);
    await new Promise((r) => setTimeout(r, 1200));
    const cdSeen = new Set();
    const countdowns = cdCands
      .map((e, i) => ({ el: e, ticking: e.textContent !== before[i], bbox: R(e), section: sectionIndexOf(e) }))
      .filter((c) => c.ticking || /countdown|timer/i.test((typeof c.el.className === "string" ? c.el.className : "") + c.el.id))
      .filter((c, _, all) => !all.some((o) => o !== c && o.el !== c.el && c.el.contains(o.el)))
      .filter((c) => !cdSeen.has(c.el) && cdSeen.add(c.el))
      .map(({ el, ...rest }) => rest);
    const bodyText = (document.body.innerText || "").slice(0, 200000);
    const SCARCITY = [
      ["nur noch", /nur noch \d+/i],
      ["begrenzt", /begrenzt|limitiert|limited/i],
      ["plätze", /\d+\s*(freie\s*)?plätze|spots? left|seats? left/i],
      ["endet", /endet (in|am|heute)|läuft ab|ends? (in|today|soon)|expires?/i],
      ["nur heute", /nur heute|heute noch|only today|today only/i],
      ["preis steigt", /preis steigt|preiserhöhung|price (goes up|increase)/i],
      ["einmalig", /einmalig(es)? angebot|one[- ]time offer|nur auf dieser seite/i],
      ["bonus", /bonus/i],
    ];
    const scarcity = SCARCITY.filter(([, re]) => re.test(bodyText)).map(([k]) => k);

    /* Videos & iframes */
    const provider = (src) => {
      const s = String(src || "");
      if (/youtu\.?be|youtube(-nocookie)?\.com/.test(s)) return "YouTube";
      if (/vimeo\.com/.test(s)) return "Vimeo";
      if (/wistia/.test(s)) return "Wistia";
      if (/vidalytics/.test(s)) return "Vidalytics";
      if (/loom\.com/.test(s)) return "Loom";
      if (/mediadelivery\.net|bunnycdn|b-cdn\.net/.test(s)) return "Bunny Stream";
      if (/jwplayer|jwpcdn/.test(s)) return "JW Player";
      if (/spotlightr|vooplayer/.test(s)) return "Spotlightr";
      if (/presto/.test(s)) return "Presto Player";
      if (/dailymotion/.test(s)) return "Dailymotion";
      if (/videoask/.test(s)) return "VideoAsk";
      if (/cloudflarestream|videodelivery\.net/.test(s)) return "Cloudflare Stream";
      return null;
    };
    const videos = [];
    for (const f of document.querySelectorAll("iframe")) {
      const src = f.src || f.getAttribute("data-src") || "";
      const p = provider(src);
      if (p) videos.push({ provider: p, kind: "iframe", host: (() => { try { return new URL(src).host; } catch { return null; } })(), section: sectionIndexOf(f), bbox: R(f) });
    }
    for (const v of document.querySelectorAll("video")) {
      const src = v.currentSrc || v.src || v.querySelector("source")?.src || "";
      videos.push({ provider: provider(src) || "eigenes Video", kind: "video", background: v.autoplay && v.muted && v.loop, controls: v.controls, section: sectionIndexOf(v), bbox: R(v) });
    }
    for (const el of document.querySelectorAll("[class*='wistia_embed'], vidalytics-player, [id^='vidalytics'], lite-youtube, [data-youtube-id]")) {
      videos.push({ provider: provider(el.className + " " + el.tagName.toLowerCase() + " " + el.id) || "YouTube", kind: "embed", section: sectionIndexOf(el), bbox: R(el) });
    }
    const iframes = [...document.querySelectorAll("iframe")].slice(0, 30).map((f) => {
      try {
        return new URL(f.src || f.getAttribute("data-src") || "about:blank").host || "about:blank";
      } catch {
        return null;
      }
    });

    /* Popups / Exit-Intent */
    const popups = [];
    for (const el of document.querySelectorAll('dialog[open], [role="dialog"], [aria-modal="true"], body *')) {
      if (popups.length >= 8) break;
      const cs = getComputedStyle(el);
      if (el.tagName !== "DIALOG" && el.getAttribute("role") !== "dialog" && cs.position !== "fixed") continue;
      if (!vis(el)) continue;
      const r = el.getBoundingClientRect();
      const area = (r.width * r.height) / (vw * vh);
      const sigTxt = (el.id || "") + " " + (typeof el.className === "string" ? el.className : "") + " " + T(el, 200);
      const isCookie = /cookie|consent|datenschutz/i.test(sigTxt);
      if (area < 0.12 && !isCookie && el.getAttribute("role") !== "dialog") continue;
      if (r.height < 60) continue;
      popups.push({
        kind: isCookie ? "cookie" : el.querySelector("form, input[type=email]") ? "formular-popup" : area > 0.5 ? "overlay" : "fixiert",
        area: +area.toFixed(2),
        hasForm: !!el.querySelector("form, input[type=email]"),
        bbox: { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) },
      });
    }
    const inline = [...document.scripts].filter((s) => !s.src).map((s) => s.textContent).join("\n").slice(0, 500000);
    const exitIntent = /exit[-_ ]?intent|exitIntent|mouseleave|mouseout[^;]{0,120}clientY/i.test(inline) || !!document.querySelector("[data-exit-intent], [class*='exit-intent' i], [class*='exitintent' i]");

    /* Zahlung / Captcha (Seite gesamt) */
    const payment = {
      fields: forms.reduce((a, f) => a + f.fields.filter((x) => x.payment).length, 0),
      iframes: [...document.querySelectorAll("iframe")].map((f) => f.src).filter((s) => /stripe|paypal|braintree|adyen|mollie|klarna|checkout|payment/i.test(s || "")).length,
      wording: /zahlungspflichtig bestellen|kostenpflichtig bestellen|jetzt kaufen und bezahlen|zahlungsart|zahlungsmethode|payment method|kreditkarte|credit card|place order/i.test(bodyText),
    };
    const captcha = captchaKind(document);

    /* Medien */
    const imgs = [...document.images];
    const media = {
      images: imgs.length,
      lazyImages: imgs.filter((i) => i.loading === "lazy" || i.hasAttribute("data-src") || i.hasAttribute("data-lazy-src")).length,
      brokenImages: imgs.filter((i) => i.complete && i.naturalWidth === 0 && i.src).length,
      svgs: document.querySelectorAll("svg").length,
      imageHosts: [...new Set(imgs.map((i) => { try { return new URL(i.currentSrc || i.src).host; } catch { return null; } }).filter(Boolean))].slice(0, 12),
    };

    /* Textblöcke für text.md */
    const textBlocks = [];
    let total = 0;
    for (const el of document.querySelectorAll("h1,h2,h3,h4,h5,h6,p,li,blockquote,figcaption,label,button,a[class*='btn'],a[class*='button'],summary,td,th")) {
      if (total > 150000) break;
      if (!vis(el)) continue;
      if (el.closest("li") && el.tagName !== "LI" && !/^H/.test(el.tagName)) continue;
      if (el.tagName === "LI" && el.querySelector("p,h1,h2,h3,h4")) continue;
      const t = (el.innerText || "").replace(/\s+/g, " ").trim();
      if (!t || t.length < 2) continue;
      total += t.length;
      textBlocks.push({ s: sectionIndexOf(el), tag: el.tagName.toLowerCase(), t: t.slice(0, 1500) });
    }

    return {
      url: location.href,
      title: document.title,
      viewport: { width: vw, height: vh },
      document: { width: document.documentElement.scrollWidth, height: docH },
      meta,
      headings,
      sections,
      ctas,
      forms,
      prices,
      scarcity: { countdowns, keywords: scarcity },
      videos,
      iframes,
      popups,
      exitIntent,
      payment,
      captcha,
      media,
      textBlocks,
      bodyHash: bodyText.length + ":" + bodyText.slice(0, 400),
    };
  })();
}

/** Kurzfassung für mobile Ansicht (Sektionen + Überschriften-Größen kommen aus design.mjs). */
export function inPageMobileFacts() {
  const docH = Math.max(document.documentElement.scrollHeight, document.body ? document.body.scrollHeight : 0);
  const burger = !!document.querySelector('[aria-label*="menü" i], [aria-label*="menu" i], [class*="burger" i], [class*="hamburger" i], [class*="menu-toggle" i]');
  const sticky = [...document.querySelectorAll("body *")].filter((el) => {
    const cs = getComputedStyle(el);
    if (cs.position !== "fixed" && cs.position !== "sticky") return false;
    const r = el.getBoundingClientRect();
    return r.width > innerWidth * 0.6 && r.height > 30 && r.height < 160 && r.top > innerHeight * 0.6 && el.querySelector("a,button");
  }).length;
  return { height: docH, overflowX: document.documentElement.scrollWidth > innerWidth + 2, burgerMenu: burger, stickyBottomBars: sticky };
}

/** text.md erzeugen (nur Analyse). */
export function toMarkdown(page) {
  const lines = [
    `<!-- Nur zur Analyse. Diese Texte gehören dem Seitenbetreiber und dürfen NICHT in Nachbau-Dateien übernommen werden. -->`,
    `# ${page.title || page.url}`,
    "",
    `Quelle: ${page.url}`,
    "",
  ];
  let cur = -2;
  for (const b of page.textBlocks || []) {
    if (b.s !== cur) {
      cur = b.s;
      const s = page.sections?.[b.s];
      lines.push("", `---`, `<!-- Sektion ${b.s ?? "?"}${s ? ` · ${s.type}` : ""} -->`, "");
    }
    if (/^h[1-6]$/.test(b.tag)) lines.push(`${"#".repeat(Math.min(6, +b.tag[1] + 1))} ${b.t}`, "");
    else if (b.tag === "li") lines.push(`- ${b.t}`);
    else if (b.tag === "blockquote") lines.push(`> ${b.t}`, "");
    else if (b.tag === "button" || b.tag === "a") lines.push(`[Button] ${b.t}`, "");
    else lines.push(b.t, "");
  }
  return lines.join("\n").replace(/\n{3,}/g, "\n\n") + "\n";
}
