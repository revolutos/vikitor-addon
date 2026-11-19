// Packt die Erweiterung (Inhalt von src/ mit manifest.json im ZIP-Wurzelverzeichnis)
// nach dist/vikitor-addon-v<version>.zip und jeden Skill nach dist/skills/<name>.zip.
// Benötigt nur Node und das unter macOS vorhandene Programm „zip“.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "src");
const dist = path.join(root, "dist");
const manifest = JSON.parse(fs.readFileSync(path.join(src, "manifest.json"), "utf8"));

// Vorab prüfen: alle im Manifest genannten Dateien existieren, JSON ist gültig
const must = [
  manifest.background.service_worker,
  ...Object.values(manifest.icons),
  ...manifest.content_scripts.flatMap((c) => c.js),
  manifest.side_panel.default_path.split("?")[0],
  manifest.options_page.split("?")[0]
];
for (const f of must) if (!fs.existsSync(path.join(src, f))) { console.error("Fehlt:", f); process.exit(1); }
for (const f of ["data/content.json", "data/links.json", "_locales/de/messages.json"]) JSON.parse(fs.readFileSync(path.join(src, f), "utf8"));

fs.mkdirSync(path.join(dist, "skills"), { recursive: true });
const zipName = `vikitor-addon-v${manifest.version}.zip`;
const zipPath = path.join(dist, zipName);
fs.rmSync(zipPath, { force: true });
execFileSync("zip", ["-r", "-X", "-q", zipPath, ".", "-x", "*.DS_Store", "-x", "__MACOSX/*"], { cwd: src, stdio: "inherit" });
console.log("Erweiterung:", path.relative(root, zipPath), `(${(fs.statSync(zipPath).size / 1024).toFixed(1)} KB)`);

const skillsDir = path.join(root, "skills");
for (const name of fs.readdirSync(skillsDir)) {
  const dir = path.join(skillsDir, name);
  if (!fs.statSync(dir).isDirectory() || !fs.existsSync(path.join(dir, "SKILL.md"))) continue;
  const out = path.join(dist, "skills", `${name}.zip`);
  fs.rmSync(out, { force: true });
  execFileSync("zip", ["-r", "-X", "-q", out, name, "-x", "*.DS_Store"], { cwd: skillsDir, stdio: "inherit" });
  console.log("Skill:", path.relative(root, out));
}

// Upload-Paket für vikitor.de: genau die Dateien, die die Erweiterung dort erwartet
// (https://vikitor.de/addon/content.json und https://vikitor.de/addon/skills/<name>.zip).
const web = path.join(dist, "web", "addon");
fs.rmSync(path.join(dist, "web"), { recursive: true, force: true });
fs.mkdirSync(path.join(web, "skills"), { recursive: true });
fs.copyFileSync(path.join(src, "data", "content.json"), path.join(web, "content.json"));
for (const f of fs.readdirSync(path.join(dist, "skills"))) if (f.endsWith(".zip")) fs.copyFileSync(path.join(dist, "skills", f), path.join(web, "skills", f));
console.log("Upload-Paket für vikitor.de:", path.relative(root, web));
