// Prompt-Generator: baut aus Vorlage, Werkzeug und Eingaben einen fertigen Prompt.
// Platzhalter: {{feld}} oder {{feld|Ersatztext}}. Zeilen mit leeren Platzhaltern ohne Ersatz entfallen,
// optionale Satzteile in [[ … ]] entfallen einzeln.

const PH = /\{\{\s*([a-zA-Z0-9_]+)\s*(?:\|([^}]*))?\}\}/g;

const OPT = /\[\[([\s\S]*?)\]\]/g;

export function fill(line, values) {
  // Optionale Satzteile [[ … ]] entfallen, wenn ein Platzhalter darin leer ist
  line = line.replace(OPT, (_m, inner) => {
    const r = fill(inner, values);
    return r === null ? "" : r;
  });
  let dropped = false;
  const out = line.replace(PH, (_m, key, fallback) => {
    const v = (values[key] || "").trim();
    if (v) return v;
    if (fallback !== undefined && fallback.trim()) return fallback.trim();
    dropped = true;
    return "";
  });
  return dropped ? null : out;
}

function fieldLabel(content, id) {
  const f = content.fields[id] || {};
  return f.ctx || f.label || id;
}

export function buildPrompt(content, templateId, toolId, rawValues = {}) {
  const tpl = content.templates.find((t) => t.id === templateId) || content.templates[0];
  const tool = content.tools[toolId] || content.tools.claude;
  const values = {};
  for (const k of Object.keys(rawValues || {})) values[k] = String(rawValues[k] ?? "");

  const L = [];
  L.push(`# Auftrag: ${tpl.title}`);
  L.push("");
  L.push(tool.intro);
  L.push("");

  const goal = fill(tpl.goal, values);
  if (goal) { L.push("## Ziel"); L.push(goal); L.push(""); }

  const ctx = [];
  const missing = [];
  for (const id of tpl.fields) {
    const v = (values[id] || "").trim();
    if (!v) { missing.push(fieldLabel(content, id)); continue; }
    if (v.includes("\n")) {
      ctx.push(`- ${fieldLabel(content, id)}:`);
      for (const part of v.split("\n")) if (part.trim()) ctx.push(`  ${part.trim()}`);
    } else {
      ctx.push(`- ${fieldLabel(content, id)}: ${v}`);
    }
  }
  if (ctx.length) { L.push("## Ausgangslage"); L.push(...ctx); L.push(""); }

  const steps = tpl.steps.map((s) => fill(s, values)).filter(Boolean);
  L.push(`## ${tool.stepsTitle}`);
  steps.forEach((s, i) => L.push(`${i + 1}. ${s}`));
  L.push("");

  L.push("## Qualitätsregeln");
  for (const r of content.rules) L.push(`- ${r}`);
  L.push("");

  if (missing.length) {
    L.push("## Offene Fragen");
    L.push(`Folgende Angaben fehlen noch: ${missing.join(", ")}. Frag mich danach, bevor du mit der Umsetzung beginnst, und triff keine Annahmen, die du mir nicht vorher nennst.`);
    L.push("");
  }

  L.push("## Abschluss");
  L.push(tool.outro);
  return L.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}
