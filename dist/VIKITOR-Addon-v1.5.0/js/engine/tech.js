// Kopie aus ~/Developer/vs-funnel-scan/lib/tech.mjs (Stand c44304c), unverändert bis auf Importpfade.
// Nicht hier ändern, sondern in der Engine und neu kopieren (scripts/sync-engine.mjs).
// Technik & Tracking: Baukasten/Framework, Checkout-Anbieter, Pixel, Consent-Tool, E-Mail-Tool, Hosting,
// Ladezeit (LCP grob) und Seitengewicht. Erkennung über Netzwerk-URLs, HTML, globale Variablen, DOM, Cookies.
import { hostOf, regDomain } from "./util.js";

// [Name, Kategorie, { url, html, global, dom, cookie, meta }]
const S = (name, cat, p) => ({ name, cat, ...p });
export const SIGNATURES = [
  // Baukasten / Framework
  S("ClickFunnels", "builder", { url: "clickfunnels\\.com|myclickfunnels\\.com|cfcdn|cf-assets", html: "clickfunnels", global: ["CFAppDomain"] }),
  S("Systeme.io", "builder", { url: "systeme\\.io", html: "systeme\\.io" }),
  S("WordPress", "builder", { url: "/wp-content/|/wp-includes/|/wp-json/", meta: "WordPress", html: "/wp-content/" }),
  S("Elementor", "builder", { html: "elementor-", dom: [".elementor", "[data-elementor-type]"] }),
  S("Divi", "builder", { dom: [".et_pb_section", "#et-main-area"] }),
  S("Thrive Architect", "builder", { html: "tve_editor|thrive-", dom: ["#tve_editor"] }),
  S("OptimizePress", "builder", { html: "optimizepress|op3-" }),
  S("Webflow", "builder", { url: "webflow\\.(com|io)|website-files\\.com", dom: ["html[data-wf-page]", "html[data-wf-site]"] }),
  S("Framer", "builder", { url: "framerusercontent\\.com|framer\\.(com|website|app)/", meta: "Framer", dom: ["[data-framer-name]", "[data-framer-component-type]"] }),
  S("Lovable", "builder", { url: "gpteng\\.co|lovable\\.(app|dev)|lovableproject\\.com", html: "gptengineer|lovable-tagger|lovable\\.dev|lovableproject" }),
  S("Wix", "builder", { url: "wixstatic\\.com|parastorage\\.com", meta: "Wix" }),
  S("Squarespace", "builder", { url: "squarespace(-cdn)?\\.com|sqspcdn", global: ["Squarespace"] }),
  S("Shopify", "builder", { url: "cdn\\.shopify\\.com|myshopify\\.com", global: ["Shopify"] }),
  S("Kajabi", "builder", { url: "kajabi(-cdn|-storefronts)?\\.com|mykajabi\\.com" }),
  S("GoHighLevel", "builder", { url: "leadconnectorhq\\.com|msgsndr\\.com|gohighlevel" }),
  S("Leadpages", "builder", { url: "leadpages\\.(net|co|io)|lpages\\.co" }),
  S("Unbounce", "builder", { url: "unbounce\\.com|ubembed" }),
  S("Instapage", "builder", { url: "instapage(cdn)?\\.(com|net)" }),
  S("FunnelCockpit", "builder", { url: "funnelcockpit" }),
  S("Builderall", "builder", { url: "builderall" }),
  S("Jimdo", "builder", { url: "jimdo(cdn|static)?\\.com|jimstatic" }),
  S("Carrd", "builder", { url: "carrd\\.co" }),
  S("Next.js", "framework", { url: "/_next/", dom: ["#__next", "script#__NEXT_DATA__"], global: ["__NEXT_DATA__"] }),
  S("Nuxt", "framework", { url: "/_nuxt/", dom: ["#__nuxt"], global: ["__NUXT__"] }),
  S("Gatsby", "framework", { dom: ["#___gatsby"] }),
  S("Astro", "framework", { html: "astro-island|data-astro-cid" }),
  S("Vite (SPA)", "framework", { url: "/assets/index-[\\w-]{6,}\\.js", html: "/@vite/client" }),
  S("React", "framework", { global: ["React", "__REACT_DEVTOOLS_GLOBAL_HOOK__"], dom: ["[data-reactroot]"], html: "react-dom" }),
  S("Vue", "framework", { global: ["__VUE__", "Vue"], dom: ["[data-v-app]"] }),
  S("Tailwind CSS", "framework", { html: "tailwindcss|--tw-" }),
  // Checkout / Zahlung
  S("Digistore24", "checkout", { url: "digistore24\\.com|digistore24-app|checkout-ds24\\.com" }),
  S("CopeCart", "checkout", { url: "copecart\\.com" }),
  S("Ablefy (elopage)", "checkout", { url: "ablefy\\.io|elopage\\.com|myablefy\\.com" }),
  S("Stripe", "checkout", { url: "js\\.stripe\\.com|checkout\\.stripe\\.com|buy\\.stripe\\.com|m\\.stripe\\.network", global: ["Stripe"] }),
  S("PayPal", "checkout", { url: "paypal\\.com/sdk|paypalobjects\\.com|paypal\\.com/checkout" }),
  S("ThriveCart", "checkout", { url: "thrivecart\\.com" }),
  S("Paddle", "checkout", { url: "paddle\\.com|cdn\\.paddle\\.com", global: ["Paddle"] }),
  S("Lemon Squeezy", "checkout", { url: "lemonsqueezy\\.com", global: ["LemonSqueezy"] }),
  S("Gumroad", "checkout", { url: "gumroad\\.com" }),
  S("Mollie", "checkout", { url: "mollie\\.com" }),
  S("Klarna", "checkout", { url: "klarna(cdn)?\\.(com|net)" }),
  S("SamCart", "checkout", { url: "samcart\\.com" }),
  S("Chargebee", "checkout", { url: "chargebee\\.com" }),
  S("FastSpring", "checkout", { url: "fastspring\\.com|onfastspring" }),
  // Tracking / Analyse
  S("Meta Pixel", "tracking", { url: "connect\\.facebook\\.net/.+/fbevents|facebook\\.com/tr", global: ["fbq"], inline: "fbq\\(\\s*['\"]init", cookie: ["_fbp"] }),
  S("Google Tag Manager", "tracking", { url: "googletagmanager\\.com/gtm\\.js", inline: "GTM-[A-Z0-9]{4,}", global: ["google_tag_manager"] }),
  S("Google Analytics 4", "tracking", { url: "gtag/js\\?id=G-|google-analytics\\.com/g/collect|analytics\\.google\\.com", inline: "['\"]G-[A-Z0-9]{6,}['\"]", cookie: ["_ga"] }),
  S("Google Ads", "tracking", { url: "googleadservices\\.com|googleads\\.g\\.doubleclick\\.net|gtag/js\\?id=AW-", inline: "AW-\\d{6,}" }),
  S("Google Tag (gtag.js)", "tracking", { url: "googletagmanager\\.com/gtag/js", global: ["gtag"] }),
  S("TikTok Pixel", "tracking", { url: "analytics\\.tiktok\\.com", global: ["ttq"] }),
  S("Hotjar", "tracking", { url: "static\\.hotjar\\.com|script\\.hotjar\\.com", global: ["hj"] }),
  S("Microsoft Clarity", "tracking", { url: "clarity\\.ms", global: ["clarity"] }),
  S("LinkedIn Insight", "tracking", { url: "snap\\.licdn\\.com|px\\.ads\\.linkedin\\.com", global: ["_linkedin_partner_id"] }),
  S("Pinterest Tag", "tracking", { url: "s\\.pinimg\\.com/ct|ct\\.pinterest\\.com", global: ["pintrk"] }),
  S("Snap Pixel", "tracking", { url: "sc-static\\.net/scevent", global: ["snaptr"] }),
  S("X/Twitter Pixel", "tracking", { url: "static\\.ads-twitter\\.com|analytics\\.twitter\\.com", global: ["twq"] }),
  S("Microsoft Ads (UET)", "tracking", { url: "bat\\.bing\\.com", global: ["uetq"] }),
  S("Matomo", "tracking", { url: "matomo\\.(js|php)|piwik\\.(js|php)", global: ["_paq"] }),
  S("Plausible", "tracking", { url: "plausible\\.io", global: ["plausible"] }),
  S("Umami", "tracking", { url: "umami\\.(is|js)|/umami\\.js", global: ["umami"] }),
  S("Fathom", "tracking", { url: "usefathom\\.com", global: ["fathom"] }),
  S("Vercel Analytics", "tracking", { url: "/_vercel/insights|va\\.vercel-scripts\\.com|vercel-insights" }),
  S("PostHog", "tracking", { url: "posthog\\.com|i\\.posthog", global: ["posthog"] }),
  S("Mixpanel", "tracking", { url: "mixpanel\\.com|cdn\\.mxpnl\\.com", global: ["mixpanel"] }),
  S("Segment", "tracking", { url: "cdn\\.segment\\.com", global: ["analytics"] }),
  S("Hyros", "tracking", { url: "hyros\\.com" }),
  S("Funnelytics", "tracking", { url: "funnelytics" }),
  // Consent
  S("Cookiebot", "consent", { url: "consent\\.cookiebot\\.com|cookiebot", dom: ["#CybotCookiebotDialog"], global: ["Cookiebot"] }),
  S("Usercentrics", "consent", { url: "usercentrics", dom: ["#usercentrics-root", "#usercentrics-cmp-ui"], global: ["UC_UI"] }),
  S("OneTrust", "consent", { url: "onetrust|cookielaw\\.org", dom: ["#onetrust-banner-sdk", "#onetrust-consent-sdk"], global: ["OneTrust"] }),
  S("Borlabs Cookie", "consent", { html: "borlabs-cookie|BorlabsCookie", dom: ["#BorlabsCookieBox", "[data-borlabs-cookie-preference]"] }),
  S("Complianz", "consent", { html: "complianz|cmplz-", dom: [".cmplz-cookiebanner"] }),
  S("CookieYes", "consent", { url: "cookieyes", dom: [".cky-consent-container"] }),
  S("Klaro", "consent", { dom: [".klaro"], global: ["klaro"] }),
  S("iubenda", "consent", { url: "iubenda" }),
  S("consentmanager", "consent", { url: "consentmanager\\.(net|de)", global: ["__cmp"] }),
  S("CCM19", "consent", { url: "ccm19" }),
  S("Real Cookie Banner", "consent", { html: "real-cookie-banner|rcb-banner" }),
  S("Didomi", "consent", { url: "didomi", global: ["Didomi"] }),
  // E-Mail / CRM
  S("ActiveCampaign", "email", { url: "activehosted\\.com|activecampaign" }),
  S("Klick-Tipp", "email", { url: "klick-tipp\\.com|klicktipp" }),
  S("Mailchimp", "email", { url: "list-manage\\.com|chimpstatic\\.com|mailchimp" }),
  S("Brevo (Sendinblue)", "email", { url: "sibforms\\.com|sendinblue|brevo\\.com" }),
  S("Kit (ConvertKit)", "email", { url: "convertkit|ck\\.page|kit\\.com/" }),
  S("Quentn", "email", { url: "quentn" }),
  S("CleverReach", "email", { url: "cleverreach" }),
  S("GetResponse", "email", { url: "getresponse" }),
  S("MailerLite", "email", { url: "mailerlite|mlcdn\\.com" }),
  S("HubSpot", "email", { url: "hs-scripts\\.com|hsforms|hubspot", global: ["_hsq"] }),
  S("Klaviyo", "email", { url: "klaviyo", global: ["klaviyo"] }),
  S("rapidmail", "email", { url: "rapidmail" }),
  // Sonstiges
  S("Calendly", "booking", { url: "calendly\\.com" }),
  S("WebinarJam/EverWebinar", "webinar", { url: "webinarjam|everwebinar" }),
  S("Zoom", "webinar", { url: "zoom\\.us" }),
  S("Typeform", "form", { url: "typeform\\.com" }),
  S("Tally", "form", { url: "tally\\.so" }),
  S("Intercom", "chat", { url: "intercom(cdn)?\\.(io|com)", global: ["Intercom"] }),
  S("Crisp", "chat", { url: "crisp\\.chat", global: ["$crisp"] }),
  S("Tawk.to", "chat", { url: "tawk\\.to", global: ["Tawk_API"] }),
  S("ManyChat", "chat", { url: "manychat" }),
  S("WhatsApp-Link", "chat", { dom: ['a[href*="wa.me"]', 'a[href*="api.whatsapp.com"]'] }),
  S("Google Fonts", "fonts", { url: "fonts\\.(googleapis|gstatic)\\.com" }),
  S("Adobe Fonts", "fonts", { url: "use\\.typekit\\.net|p\\.typekit\\.net" }),
  S("Bunny Fonts", "fonts", { url: "fonts\\.bunny\\.net" }),
];

export const CHECKOUT_HOSTS = /digistore24|copecart|ablefy|elopage|checkout\.stripe|buy\.stripe|paypal\.com|thrivecart|paddle\.com|lemonsqueezy|gumroad|samcart|chargebee|fastspring|checkout-ds24/i;
export const FUNNEL_HOSTS =
  /digistore24|copecart|ablefy|elopage|stripe\.com|paypal\.com|thrivecart|paddle|lemonsqueezy|gumroad|samcart|systeme\.io|clickfunnels|myclickfunnels|kajabi|mykajabi|leadconnectorhq|gohighlevel|funnelcockpit|webinarjam|everwebinar|calendly|leadpages|checkout-ds24/i;

/** Im Seitenkontext: HTML/Globals/DOM/Cookies prüfen + Performance messen. */
export function inPageTech(sigs) {
  // Zwei Textkörper, beide OHNE sichtbaren Seitentext (sonst würde eine Seite, die „ClickFunnels“ nur erwähnt,
  // als ClickFunnels-Seite erkannt): markup = URLs von Skripten/Links/iframes, Klassen, IDs, data-Attribute, Generator;
  // inline = Code aus Inline-Skripten (nur für Code-Muster wie fbq('init'), GTM-…, G-…, AW-…).
  const parts = [];
  for (const e of document.querySelectorAll("script[src], link[href], iframe[src], img[src], source[src]")) parts.push(e.getAttribute("src") || e.getAttribute("href") || "");
  const attrs = new Set();
  for (const e of document.querySelectorAll("*")) {
    if (attrs.size > 20000) break;
    if (typeof e.className === "string" && e.className) attrs.add(e.className);
    if (e.id) attrs.add("#" + e.id);
    for (const a of e.attributes) if (a.name.startsWith("data-")) attrs.add(a.name);
  }
  parts.push([...attrs].join(" "));
  for (const st of document.querySelectorAll("style")) parts.push((st.textContent || "").slice(0, 200000));
  const html = parts.join("\n").slice(0, 3000000);
  const inline = [...document.scripts].filter((x) => !x.src && !/json/i.test(x.type || "")).map((x) => (x.textContent || "").slice(0, 100000)).join("\n").slice(0, 2000000);
  const gen = document.querySelector('meta[name="generator"]')?.content || "";
  const cookies = document.cookie.split(";").map((c) => c.split("=")[0].trim()).filter(Boolean);
  const hits = {};
  for (const s of sigs) {
    const ev = [];
    if (s.html && new RegExp(s.html, "i").test(html)) ev.push("html");
    else if (s.inline && new RegExp(s.inline).test(inline)) ev.push("inline-script");
    if (s.meta && new RegExp(s.meta, "i").test(gen)) ev.push("generator");
    if (s.global) for (const g of s.global) {
      try {
        if (typeof window[g] !== "undefined" && window[g] !== null) {
          ev.push("global:" + g);
          break;
        }
      } catch {}
    }
    if (s.dom) for (const d of s.dom) {
      try {
        if (document.querySelector(d)) {
          ev.push("dom");
          break;
        }
      } catch {}
    }
    if (s.cookie) for (const c of s.cookie) if (cookies.some((k) => k.startsWith(c))) ev.push("cookie:" + c);
    if (ev.length) hits[s.name] = ev;
  }
  const scripts = [...document.scripts].map((s) => s.src).filter(Boolean).slice(0, 200);
  const styles = [...document.querySelectorAll('link[rel="stylesheet"]')].map((l) => l.href).slice(0, 80);
  return { hits, generator: gen || null, cookieNames: cookies.slice(0, 40), scripts, styles };
}

/** Performance früh messen (vor Scrollen/Klicks), LCP über gepufferte Einträge. */
export function inPagePerf() {
  return new Promise((resolve) => {
    const nav = performance.getEntriesByType("navigation")[0];
    const paint = performance.getEntriesByType("paint");
    let lcp = null;
    let lcpEl = null;
    const finish = () => {
      const res = performance.getEntriesByType("resource");
      resolve({
        ttfb: nav ? Math.round(nav.responseStart - nav.startTime) : null,
        domContentLoaded: nav ? Math.round(nav.domContentLoadedEventEnd - nav.startTime) : null,
        load: nav ? Math.round(nav.loadEventEnd - nav.startTime) : null,
        fcp: Math.round(paint.find((p) => p.name === "first-contentful-paint")?.startTime || 0) || null,
        lcp: lcp != null ? Math.round(lcp) : null,
        lcpElement: lcpEl,
        resourceCount: res.length,
        transferBytesPerfApi: res.reduce((a, r) => a + (r.transferSize || 0), 0) + (nav?.transferSize || 0),
        domElements: document.getElementsByTagName("*").length,
      });
    };
    try {
      const po = new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
          lcp = e.renderTime || e.loadTime || e.startTime;
          const el = e.element;
          lcpEl = el ? el.tagName.toLowerCase() + (el.id ? "#" + el.id : "") + (typeof el.className === "string" && el.className ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".") : "") : null;
        }
      });
      po.observe({ type: "largest-contentful-paint", buffered: true });
      setTimeout(() => {
        po.disconnect();
        finish();
      }, 300);
    } catch {
      finish();
    }
  });
}

const HOSTING = [
  ["Vercel", (h) => h["x-vercel-id"] || /vercel/i.test(h.server || "")],
  ["Netlify", (h) => h["x-nf-request-id"] || /netlify/i.test(h.server || "")],
  ["Cloudflare", (h) => h["cf-ray"] || /cloudflare/i.test(h.server || "")],
  ["GitHub Pages", (h) => h["x-github-request-id"]],
  ["AWS CloudFront", (h) => /cloudfront/i.test((h.via || "") + (h["x-cache"] || ""))],
  ["Fastly", (h) => h["x-fastly-request-id"] || /fastly/i.test(h["x-served-by"] || "")],
  ["WP Engine", (h) => h["wpe-backend"] || /wpe/i.test(h["x-powered-by"] || "")],
  ["nginx", (h) => /nginx/i.test(h.server || "")],
  ["Apache", (h) => /apache/i.test(h.server || "")],
  ["LiteSpeed", (h) => /litespeed/i.test(h.server || "")],
];

/** Netzwerk-Log + Seitensignale zu tech.json zusammenführen. */
export function buildTech({ pageUrl, network, inPage, perf, mainDocument, consent }) {
  const urls = network.map((r) => r.url).filter((u) => /^https?:/.test(u));
  const found = new Map();
  const add = (sig, ev) => {
    const e = found.get(sig.name) || { name: sig.name, category: sig.cat, evidence: [] };
    if (!e.evidence.includes(ev)) e.evidence.push(ev);
    found.set(sig.name, e);
  };
  for (const sig of SIGNATURES) {
    if (sig.url) {
      const re = new RegExp(sig.url, "i");
      const u = urls.find((x) => re.test(x)) || (re.test(pageUrl) ? pageUrl : null);
      if (u) add(sig, "url:" + hostOf(u));
    }
    for (const ev of inPage?.hits?.[sig.name] || []) add(sig, ev);
  }
  // "Segment" global "analytics" ist zu allgemein: nur mit URL-Beleg werten
  for (const [n, e] of found) if (n === "Segment" && !e.evidence.some((x) => x.startsWith("url:"))) found.delete(n);
  const by = (cat) => [...found.values()].filter((f) => f.category === cat);
  const pageHost = hostOf(pageUrl);
  const site = regDomain(pageHost);
  const byType = {};
  let bytes = 0;
  const thirdParty = new Map();
  for (const r of network) {
    const t = r.type || "Other";
    byType[t] = byType[t] || { count: 0, bytes: 0 };
    byType[t].count++;
    byType[t].bytes += r.bytes || 0;
    bytes += r.bytes || 0;
    const h = hostOf(r.url);
    if (h && regDomain(h) !== site) thirdParty.set(h, (thirdParty.get(h) || 0) + 1);
  }
  const h = mainDocument?.headers || {};
  const hosting = HOSTING.filter(([, f]) => f(h)).map(([n]) => n);
  const lcp = perf?.lcp ?? null;
  const consentTools = by("consent").map((x) => x.name);
  return {
    url: pageUrl,
    builder: by("builder"),
    frameworks: by("framework"),
    checkout: by("checkout"),
    tracking: by("tracking"),
    consent: {
      tools: consentTools,
      bannerSeen: !!consent?.dismissed || !!consent?.found,
      choice: consent?.choice || null,
      note: consent?.dismissed && !consentTools.length ? "eigener oder unbekannter Cookie-Banner" : null,
    },
    email: by("email"),
    other: [...found.values()].filter((f) => !["builder", "framework", "checkout", "tracking", "consent", "email"].includes(f.category)),
    hosting,
    server: { status: mainDocument?.status ?? null, server: h.server || null, poweredBy: h["x-powered-by"] || null, contentType: h["content-type"] || null },
    generator: inPage?.generator || null,
    performance: {
      ...perf,
      lcpRating: lcp == null ? null : lcp <= 2500 ? "gut" : lcp <= 4000 ? "mittel" : "langsam",
      note: "LCP grob gemessen in Chrome headless (Desktop 1440×900, ohne Drosselung)",
    },
    weight: {
      requests: network.length,
      bytes,
      megabytes: +(bytes / 1048576).toFixed(2),
      byType,
      failedRequests: network.filter((r) => r.failed).length,
    },
    thirdPartyHosts: [...thirdParty.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25).map(([host, count]) => ({ host, count })),
    cookieNames: inPage?.cookieNames || [],
  };
}

export function mergeTech(techs) {
  const names = (k) => {
    const m = new Map();
    for (const t of techs) for (const x of t?.[k] || []) m.set(x.name, x.name);
    return [...m.keys()];
  };
  return {
    builder: names("builder"),
    frameworks: names("frameworks"),
    checkout: names("checkout"),
    tracking: names("tracking"),
    consent: [...new Set(techs.flatMap((t) => t?.consent?.tools || []))],
    email: names("email"),
    other: names("other"),
    hosting: [...new Set(techs.flatMap((t) => t?.hosting || []))],
    lcpMedian: (() => {
      const v = techs.map((t) => t?.performance?.lcp).filter((x) => x != null).sort((a, b) => a - b);
      return v.length ? v[Math.floor(v.length / 2)] : null;
    })(),
    totalMegabytes: +techs.reduce((a, t) => a + (t?.weight?.megabytes || 0), 0).toFixed(2),
  };
}
