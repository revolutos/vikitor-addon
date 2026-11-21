// Kopiert die Analyse-Module der Scan-Engine (~/Developer/vs-funnel-scan/lib) nach src/js/engine/,
// damit die Funnel-Hack-Aufnahme dieselben Messungen und dasselbe Format (SCHEMA.md) liefert.
// Übernommen werden nur browserfähige Teile: design, page, tech, flow, report und eine util-Teilmenge ohne fs/path/process.
// Aufruf: node scripts/sync-engine.mjs [Pfad zur Engine]   (danach node test/logic.mjs und node test/recording.mjs)
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const engine = path.resolve(process.argv[2] || path.join(os.homedir(), "Developer", "vs-funnel-scan"));
const lib = path.join(engine, "lib");
const dst = path.join(root, "src", "js", "engine");
if (!fs.existsSync(path.join(lib, "page.mjs"))) { console.error("Engine nicht gefunden:", engine); process.exit(1); }
let rev = "unbekannt";
try { rev = execFileSync("git", ["-C", engine, "rev-parse", "--short", "HEAD"]).toString().trim(); } catch (_) {}
fs.mkdirSync(dst, { recursive: true });

const head = (f) => `// Kopie aus ~/Developer/vs-funnel-scan/lib/${f} (Stand ${rev}), unverändert bis auf Importpfade.\n// Nicht hier ändern, sondern in der Engine und neu kopieren (scripts/sync-engine.mjs).\n`;
for (const f of ["design.mjs", "page.mjs", "tech.mjs", "flow.mjs", "report.mjs"]) {
  const s = fs.readFileSync(path.join(lib, f), "utf8").replace(/from "\.\/(\w+)\.mjs"/g, 'from "./$1.js"');
  if (/from "node:/.test(s)) { console.error(`${f} nutzt Node-Module und ist nicht browserfähig.`); process.exit(1); }
  fs.writeFileSync(path.join(dst, f.replace(/\.mjs$/, ".js")), head(f) + s);
  console.log("kopiert:", f);
}

// util: nur die reinen Helfer übernehmen
let u = fs.readFileSync(path.join(lib, "util.mjs"), "utf8");
u = u.replace(/^import .* from "node:.*";\n/gm, "");
const dropBlock = (re) => { u = u.replace(re, ""); };
dropBlock(/(\/\*\*[^\n]*\*\/\n)?export class ScanError[\s\S]*?\n}\n/);
dropBlock(/(\/\*\*[^\n]*\*\/\n)?export const EXIT = \{[\s\S]*?\};\n/);
dropBlock(/(\/\*\*[^\n]*\*\/\n)?export function writeJson[\s\S]*?\n}\n/);
dropBlock(/(\/\*\*[^\n]*\*\/\n)?export function readJson[\s\S]*?\n}\n/);
dropBlock(/(\/\*\*[^\n]*\*\/\n)?export const rel = [^\n]*\n/);
dropBlock(/(\/\*\*[^\n]*\*\/\n)?export function createProgress[\s\S]*?\n}\n/);
dropBlock(/(\/\*\*[^\n]*\*\/\n)?export const callExpr[^\n]*\n/);
if (u.split("\n").some((l) => !l.trim().startsWith("//") && /\b(fs|path|process)\./.test(l))) { console.error("util.mjs enthält neue Node-Abhängigkeiten: bitte scripts/sync-engine.mjs anpassen."); process.exit(1); }
u = u.replace(/\n{3,}/g, "\n\n");
fs.writeFileSync(path.join(dst, "util.js"), `// Browserfähige Teilmenge von ~/Developer/vs-funnel-scan/lib/util.mjs (Stand ${rev}): ohne fs/path/process.\n` + u);
console.log("kopiert: util.mjs (Teilmenge)");
