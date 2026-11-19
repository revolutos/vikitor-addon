// Prompt-Check: regelbasierte Prüfung ohne KI-Server.
export function checkPrompt(content, text) {
  const t = String(text || "");
  const lower = t.toLowerCase();
  const words = t.trim() ? t.trim().split(/\s+/).length : 0;
  const results = content.promptChecks.map((c) => {
    let ok = false;
    try { ok = new RegExp(c.pattern, "i").test(lower); } catch (_) { ok = false; }
    return { id: c.id, label: c.label, ok, hint: c.hint, add: c.add, status: ok ? "ok" : "bad" };
  });
  let lenStatus = "ok", lenHint = `Gute Länge (${words} Wörter).`;
  if (words < 15) { lenStatus = "bad"; lenHint = `Sehr kurz (${words} Wörter). Ein guter Auftrag hat meist mindestens 40 Wörter.`; }
  else if (words < 40) { lenStatus = "warn"; lenHint = `Eher knapp (${words} Wörter). Ergänze Ziel, Zielgruppe und Reihenfolge.`; }
  else if (words > 1500) { lenStatus = "warn"; lenHint = `Sehr lang (${words} Wörter). Teile den Auftrag besser in mehrere Schritte.`; }
  results.push({ id: "laenge", label: "Länge", ok: lenStatus === "ok", status: lenStatus, hint: lenHint, add: "" });
  const hits = results.filter((r) => r.status === "ok").length;
  return { results, hits, total: results.length, words };
}

export function completePrompt(content, text) {
  const { results } = checkPrompt(content, text);
  const adds = results.filter((r) => r.status !== "ok" && r.add).map((r) => `- ${r.add}`);
  if (!adds.length) return text;
  const base = String(text || "").replace(/\s+$/, "");
  return `${base}${base ? "\n\n" : ""}Zusätzliche Vorgaben:\n${adds.join("\n")}\n`;
}
