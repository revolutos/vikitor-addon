<p align="center"><img src=".github/assets/banner.png" alt="VIKITOR Browser-Addon – dein KI-Werkzeugkasten" width="100%"></p>

# VIKITOR Vibecoding Assistent – dein KI-Werkzeugkasten im Browser

**Kostenloses Browser-Addon von Viktor Siemens (VIKITOR)** für Chrome, Edge und Brave. Saubere Prompts, der passende Funnel, geprüfte Seiten und Anleitungen, immer griffbereit neben Claude, ChatGPT und Lovable.

**➜ [Kostenlos herunterladen](https://vikitor.de/downloads/addons/)** · [Updates](https://vikitor.de/updates/) · [Premium-Code kaufen](https://vikitor.de/shop/)

## Funktionen

| Werkzeuge | Premium | Lernen | Mehr |
|---|---|---|---|
| Prompt-Generator, Funnel-Quiz, Prompt-Check, Seiten-Check | Funnel-Vorlagen, Funnel-Hack | Gratis-Skills, Anleitungen, Merkliste | Neu von VIKITOR (News, Ratgeber, Updates, Events), Downloads, Shop |

**Premium** (gleicher Freischaltcode wie VS MAC OS): fertige Funnel-Baupläne als Auftrag an die KI und der **Funnel-Hack**, der die Struktur einer erfolgreichen Seite erfasst und das Muster mit eigenen Texten auf dein Angebot überträgt.

---

## Entwicklung

Kostenlose Chrome-Erweiterung von Viktor Siemens (Marke VIKITOR, https://vikitor.de) für Leads und Webinar-Teilnehmer. Der Assistent öffnet sich als Seitenleiste neben jeder Webseite und zusätzlich als große Ansicht in einem eigenen Tab.

**Funktionen:** Start mit Webinar-Hinweis, Prompt-Generator (10 Vorlagen × Claude Code, ChatGPT/Codex, Lovable), Funnel-Quiz (7 Fragen, 6 Funnel-Typen), Prompt-Check (regelbasiert, ohne Server), Seiten-Check (Schnellcheck auf Knopfdruck), drei Gratis-Skills für Claude Code, Anleitungen, Merkliste und „Über Viktor“.

Technik: Manifest V3, reines HTML, CSS und JavaScript (ES-Module) ohne Build-Schritt.

### Ordnerstruktur

```
vikitor-addon/
├── src/                    ← die Erweiterung (dieser Ordner wird geladen bzw. gepackt)
│   ├── manifest.json
│   ├── background.js       ← Service Worker: Seitenleiste, Kontextmenü, Willkommens-Tab
│   ├── content.js          ← nur claude.ai, chatgpt.com, lovable.dev: fügt Prompts ein
│   ├── app.html            ← eine App für Seitenleiste (?view=panel) und Tab (?view=tab)
│   ├── css/app.css         ← Theme nach vikitor.de
│   ├── js/                 ← App, Logik (generator, quiz, promptcheck, pagecheck), Ansichten
│   ├── data/content.json   ← alle Inhalte (Vorlagen, Quiz, Prüfregeln, Anleitungen, Skills)
│   ├── data/links.json     ← alle Links an einer Stelle
│   ├── img/                ← Icons, Foto (s/w), Signatur
│   └── _locales/de/
├── skills/                 ← drei Claude-Code-Skills (je Ordner mit SKILL.md)
├── scripts/
│   ├── pack.mjs            ← erzeugt die ZIP-Dateien in dist/
│   └── icons.mjs           ← erzeugt die Icons neu (Puppeteer)
├── test/                   ← logic.mjs (Node), browser.mjs (Chrome), screens/ (Screenshots)
├── dist/                   ← Ergebnis von pack.mjs
├── PRIVACY.md
└── README.md
```

### Installation zum Testen (entpackte Erweiterung)

1. Öffne in Chrome die Adresse `chrome://extensions`.
2. Schalte oben rechts den **Entwicklermodus** ein.
3. Klicke auf **Entpackte Erweiterung laden** und wähle den Ordner `dist/VIKITOR-Addon-v<version>` aus (entsteht mit `node scripts/pack.mjs`). Zum Entwickeln geht auch `src/`. Leads bekommen die ZIP von vikitor.de/downloads/addons/, darin liegt genau dieser eine Ordner `VIKITOR-Addon-v<version>`.

**Gleiche Kennung bei jeder Version:** `src/manifest.json` enthält einen festen Schlüssel (`key`). Dadurch hat das Addon immer die ID `ikpkjjkcgofnlehojjehhmobdgkdpknb`, egal wie der Ordner heißt. Eine neue Version lädt man einfach als neuen Ordner, Chrome ersetzt die alte, und die Merkliste bleibt. Der private Schlüssel liegt in `keys/` (nicht im Git, nicht in den ZIPs) und wird nur gebraucht, wenn man später selbst signierte Pakete erstellen will. Die Store-ZIP enthält den Schlüssel nicht, weil der Chrome Web Store ihn nicht erlaubt.
4. Nach der Installation öffnet sich automatisch die Willkommensansicht in einem neuen Tab.
5. Klicke auf das Puzzle-Symbol in der Chrome-Leiste und hefte „VIKITOR Vibecoding Assistent (Free)“ an. Ein Klick auf das Symbol öffnet ab jetzt die Seitenleiste. Mit einem Rechtsklick auf das Symbol öffnest du den Assistenten über „Assistent im großen Fenster öffnen“ als Tab.

Nach Änderungen am Code klickst du in `chrome://extensions` beim Assistenten auf das Neu-laden-Symbol.

### Paket bauen

```bash
node scripts/pack.mjs
```

Das Skript prüft vorab, ob alle im Manifest genannten Dateien vorhanden und die JSON-Dateien gültig sind, und erzeugt dann:

- `dist/VIKITOR-Addon-v<version>/` – fertiger Ordner zum Laden in Chrome,
- `dist/vikitor-addon-v1.0.0.zip` – für Leads (vikitor.de/downloads/addons/): enthält genau den Ordner `VIKITOR-Addon-v<version>`,
- `dist/store/vikitor-addon-v1.0.0-store.zip` – für den Chrome Web Store, `manifest.json` liegt im Wurzelverzeichnis der ZIP,
- `dist/skills/<name>.zip` – je ein Skill-Ordner,
- `dist/web/downloads/addons/` – das Upload-Paket für vikitor.de (siehe „Inhalte aktualisieren“).

Die Versionsnummer kommt aus `src/manifest.json`. Für jede neue Store-Version musst du sie erhöhen.

### Tests

```bash
node test/logic.mjs     # Generator (10 Vorlagen × 3 Werkzeuge), alle Quiz-Pfade, Prompt-Check, Bewertung, Inhaltsregeln
PREMIUM_CODE=<Code> node test/browser.mjs   # ohne PREMIUM_CODE werden die Premium-Tests übersprungen; lädt die Erweiterung in Chrome, klickt alle Ansichten durch, Screenshots nach test/screens/
```

Der Browser-Test nutzt `puppeteer-core` (Pfad per Umgebungsvariable `PUPPETEER_CORE` änderbar) und Google Chrome (`CHROME_PATH`). Mit `HEADFUL=1` läuft er sichtbar.

### Inhalte aktualisieren

Alle Texte, Vorlagen, Quizfragen, Prüfregeln, Anleitungen und Skill-Beschreibungen stehen in `src/data/content.json`, alle Links in `src/data/links.json`.

Es gibt zwei Wege:

1. **Mit neuer Version im Store:** `content.json` bzw. `links.json` ändern, Version im Manifest erhöhen, `node scripts/pack.mjs`, die Store-ZIP aus `dist/store/` hochladen.
2. **Ohne neue Store-Version:** Die Erweiterung ruft höchstens alle zwölf Stunden `https://vikitor.de/downloads/addons/content.json` ab. Ist die Datei vorhanden und gültig, gilt sie ab dem nächsten Öffnen des Assistenten. Dafür lädst du den Inhalt von `dist/web/downloads/addons/` so auf die Webseite, dass folgende Adressen erreichbar sind:
   - `https://vikitor.de/downloads/addons/content.json`
   - `https://vikitor.de/downloads/addons/skills/vikitor-mobil-check.zip`
   - `https://vikitor.de/downloads/addons/skills/vikitor-seo-basis.zip`
   - `https://vikitor.de/downloads/addons/skills/vikitor-launch-check.zip`

   Bei der Next.js-Webseite von vikitor.de genügt es, den Ordner `downloads/addons` nach `public/downloads/addons` zu kopieren und neu zu veröffentlichen.

Wichtig für die Online-Datei: Sie muss dasselbe Schema haben wie die gebündelte `content.json`. Jeder Bereich (zum Beispiel `templates`, `quiz`, `guides`) wird einzeln geprüft; ungültige Bereiche werden still verworfen und durch die gebündelten Inhalte ersetzt. Es wird nur JSON geladen, niemals Code. Links werden nicht online aktualisiert, sondern nur über eine neue Version (`links.json`).

Platzhalter in Vorlagen: `{{feld}}` (Zeile entfällt, wenn leer), `{{feld|Ersatztext}}` und optionale Satzteile `[[ … ]]`, die einzeln entfallen, wenn ein Platzhalter darin leer ist.

Leere Felder in `links.json` (Facebook, LinkedIn, YouTube, TikTok) werden nicht angezeigt. Sobald du dort eine Adresse einträgst, erscheint der Link automatisch im Footer und in „Über Viktor“.

### Einreichung im Chrome Web Store (Schritt für Schritt)

1. **Entwicklerkonto:** Unter https://chrome.google.com/webstore/devconsole mit dem Google-Konto anmelden, das die Erweiterung verwalten soll, und die einmalige Registrierung abschließen (inklusive Registrierungsgebühr und Bestätigung der Kontaktdaten). Für ein Unternehmen empfiehlt sich ein eigenes Konto oder eine Gruppe.
2. **Paket bauen:** `node scripts/pack.mjs` ausführen.
3. **Neues Element:** Im Dashboard auf „Neues Element“ klicken und `dist/store/vikitor-addon-v1.0.0-store.zip` hochladen.
4. **Store-Eintrag:** Beschreibung (Deutsch), Kategorie (zum Beispiel „Tools“ oder „Developer Tools“), Sprache Deutsch, Store-Icon 128 × 128 px (`src/img/icon-128.png`), mindestens ein Screenshot in 1280 × 800 oder 640 × 400 px und eine kleine Werbekachel in 440 × 280 px. Die Screenshots aus `test/screens/` sind Arbeitsstände; für den Store solltest du sie im passenden Format neu aufnehmen.
5. **Datenschutz-Tab:**
   - Alleiniger Zweck: „Werkzeugkasten für Vibecoding: Prompts erstellen und prüfen, passenden Funnel finden, Seiten auf technische Grundlagen prüfen.“
   - Begründung jeder Berechtigung: siehe Tabelle in `PRIVACY.md`.
   - Remote-Code: „Nein“. Die Erweiterung lädt nur eine JSON-Datei mit Texten, keinen ausführbaren Code.
   - Datennutzung: Es werden keine Nutzerdaten erhoben; die entsprechenden Erklärungen bestätigen.
   - URL der Datenschutzerklärung: https://vikitor.de/datenschutz/ (den Inhalt von `PRIVACY.md` dort ergänzen oder als eigene Seite veröffentlichen).
6. **Vertrieb:** Öffentlich oder „Nicht gelistet“ (nur per Link auffindbar, praktisch für Webinar-Teilnehmer), Regionen auswählen.
7. **Zur Überprüfung einreichen.** Die Prüfung dauert in der Regel einige Tage, bei Host-Berechtigungen manchmal länger. Nach der Freigabe bekommst du den Store-Link.
8. **Updates:** Version in `src/manifest.json` erhöhen, neu packen, im Dashboard unter „Paket“ die neue ZIP hochladen und erneut einreichen.

### Inhaltsregeln

- Keine erfundenen Zahlen, Kundenstimmen, Garantien oder Einkommensversprechen.
- Über Viktor nur die freigegebenen Fakten aus der Ansicht „Über Viktor“.
- Der Pitch steht immer dezent am Ende eines Ergebnisses; alles funktioniert vollständig ohne Kauf.
- Anrede „du“, vollständige Sätze.

Anbieter: REVOLUTOS LTD. Datenschutzkontakt: https://vikitor.de/datenschutz/

---

## Über den Macher

<img src=".github/assets/viktor-siemens.jpg" width="88" align="left" alt="Viktor Siemens" style="border-radius:50%;margin-right:16px">

**Viktor Siemens** · Nr. 1 Vibecoder Deutschlands · KI-Experte für Premium-Webseiten & Funnels
Gründer von REVOLUTOS · 250+ Kunden · Top 100 Unternehmer 2024 (ERFOLG Magazin)
**100 % KI. 0 % KI-Slop.**

<br clear="left">

| | |
|---|---|
| 🌐 Webseite | [vikitor.de](https://vikitor.de) |
| 🎓 Kostenloses Live-Webinar „Vibecoding 3.0“ | [Platz sichern](https://vikitor.de/#platz) |
| ⬇️ Downloads (VS MAC OS, Browser-Addon, Skills) | [vikitor.de/downloads](https://vikitor.de/downloads/) |
| 🛒 Premium-Freischaltcode, Framework, Shop | [vikitor.de/shop](https://vikitor.de/shop/) |
| 📰 News, Ratgeber, Updates, Events (RSS) | [vikitor.de/news](https://vikitor.de/news/) · [RSS](https://vikitor.de/feed.xml) |
| 📸 Instagram | [@viktorsiemens.business](https://www.instagram.com/viktorsiemens.business/) |
| 💼 LinkedIn | [Viktor Siemens](https://www.linkedin.com/in/viktor-siemens/) |
| 👍 Facebook | [Offizieller Kanal](https://www.facebook.com/viktorsiemens) · [Privat](https://www.facebook.com/viktorsiemens90/) |

© REVOLUTOS LTD · VIKITOR ist ein Projekt der REVOLUTOS LTD. Alle Rechte vorbehalten. Der Quellcode ist zum Ansehen und Lernen öffentlich; Weiterverbreitung, Wiederverkauf oder Veröffentlichung als eigenes Addon nur mit schriftlicher Genehmigung.
