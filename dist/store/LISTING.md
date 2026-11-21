# Chrome Web Store: Angaben für den Eintrag (Version 1.5.0)

Alle Texte zum Kopieren in das Developer Dashboard. Paket: `vikitor-addon-v1.5.0-store.zip` (ohne `key`).

## Store-Eintrag

**Name** (kommt aus dem Manifest, nicht änderbar im Dashboard)
VIKITOR Vibecoding Assistent (Free)

**Kurzbeschreibung** (kommt aus dem Manifest, 129 von 132 Zeichen)
Gratis Vibecoding-Werkzeugkasten von Viktor Siemens: Prompts für Claude Code, Codex, ChatGPT und Lovable, Funnel-Quiz und Checks.

**Kategorie:** Tools (alternativ: Entwicklertools)

**Sprache:** Deutsch

**Ausführliche Beschreibung**

```
Der VIKITOR Vibecoding Assistent ist dein kostenloser Werkzeugkasten für Vibecoding: Webseiten und Funnels mit KI bauen, ohne selbst Code zu schreiben. Er öffnet sich als Seitenleiste neben jeder Webseite oder als große Ansicht in einem eigenen Tab und funktioniert in Chrome, Edge und Brave.

Das steckt drin:

• Prompt-Generator: zehn Vorlagen (zum Beispiel Webseite neu bauen, Relaunch, Leadpage, SEO und KI-Sichtbarkeit, Fehlersuche) für vier Werkzeuge. Für Claude Code und Codex entsteht ein Arbeitsauftrag direkt im Projektordner, für ChatGPT ein Plan mit fertigen Texten, für Lovable kurze Schritte mit Pause nach jedem Schritt. Mit eingebauten Qualitätsregeln: mobil zuerst, nichts erfinden, offene Fragen sammeln, am Ende prüfen.
• Funnel-Quiz: sieben Fragen, und du weißt, welcher Funnel zu deinem Angebot passt, mit Aufbau und Start-Prompt.
• Prompt-Check: prüft deinen eigenen Prompt und ergänzt fehlende Vorgaben mit einem Klick.
• Seiten-Check: Schnellcheck der technischen Grundlagen der offenen Seite (Handy-Darstellung, Titel, Beschreibung, Überschriften, Bilder, Strukturdaten, Sprache, Vorschaubild, Canonical, llms.txt).
• Einfügen mit einem Klick: Prompts landen direkt im Eingabefeld von claude.ai, chatgpt.com oder lovable.dev. Abschicken tust du selbst.
• Drei Gratis-Skills für Claude Code und Codex: Mobil-Check, SEO-Basis und Launch-Check, mit Anleitung zur Installation.
• Anleitungen: Claude Code auf Mac und Windows, Terminal, CLAUDE.md und AGENTS.md, ChatGPT und Codex, Git, GitHub, Vercel, eigene Domain und die häufigsten Fehler.
• Merkliste und „Neu von VIKITOR“ mit News, Ratgebern, Updates und Live-Terminen.

Premium (mit Freischaltcode, enthalten in der Vibecoding 3.0 Masterclass): fertige Funnel-Vorlagen als Auftrag an die KI und der Funnel-Hack, der die Struktur einer erfolgreichen Seite erfasst und das Muster mit eigenen Texten auf dein Angebot überträgt. Neu: Funnel mitschneiden – du klickst selbst durch einen Funnel, der Assistent erfasst jede Seite als Ganzseiten-Screenshot mit Struktur und gibt dir alles als ZIP. Nur nach Klick, mit sichtbarem Aufnahme-Hinweis, alles bleibt lokal.

Datenschutz: kein Konto, keine Anmeldung, kein Tracking. Deine Eingaben bleiben auf deinem Rechner. Details: https://vikitor.de/addon/datenschutz/

Von Viktor Siemens, VIKITOR (https://vikitor.de). Anbieter: REVOLUTOS LTD.
```

**Grafiken** (alle in diesem Ordner)

| Feld im Dashboard | Datei | Format |
| --- | --- | --- |
| Store-Symbol | `icon-128.png` | 128 × 128 px |
| Screenshots (bis zu 5) | `screenshots/01-start.png` bis `screenshots/05-gratis-skills.png` | 1280 × 800 px |
| Kleine Werbekachel | `kachel-440x280.png` | 440 × 280 px |

Offizielle Webseite: https://vikitor.de/addon (leitet auf die Addon-Seite weiter)
Support-URL: https://vikitor.de/addon

## Datenschutz-Tab

**Alleiniger Zweck**

```
Werkzeugkasten für Vibecoding: Prompts für KI-Werkzeuge erstellen, prüfen und einfügen, den passenden Funnel finden und Webseiten auf technische Grundlagen prüfen.
```

**Begründung der Berechtigungen**

| Berechtigung | Begründung (zum Kopieren) |
| --- | --- |
| `sidePanel` | Der Assistent wird als Seitenleiste neben der geöffneten Webseite angezeigt. |
| `storage` | Speichert lokal auf dem Gerät die Merkliste, die letzten Eingaben, das Quiz-Ergebnis, einen Zwischenspeicher für Inhalte und Neuigkeiten, bei Premium die Lizenz und den Status einer Funnel-Hack-Aufnahme. Nichts davon wird übertragen. |
| `activeTab` | Seiten-Check und Funnel-Hack lesen die Seite im aktiven Tab nur, wenn der Nutzer ausdrücklich auf den Knopf klickt bzw. eine Aufnahme gestartet hat. |
| `scripting` | Führt den Seiten-Check bzw. die Struktur-Erfassung des Funnel-Hacks auf Knopfdruck im aktiven Tab aus und fügt einen erzeugten Prompt in das Eingabefeld von claude.ai, chatgpt.com oder lovable.dev ein. |
| `contextMenus` | Menüpunkt „Assistent im großen Fenster öffnen“ am Symbol der Erweiterung. |
| Host: `claude.ai`, `chatgpt.com`, `lovable.dev` | Ein kleines Inhaltsskript setzt den vom Nutzer erzeugten Prompt auf Knopfdruck in das Eingabefeld. Es liest keine Inhalte dieser Seiten und sendet nichts. |
| Host: `vikitor.de` | Abruf aktualisierter Texte (content.json) und der Neuigkeiten (feed.json) des Anbieters; bei Premium zusätzlich Freischalten mit Code und Laden der Funnel-Vorlagen. |
| Optional: `<all_urls>` | Zwei Fälle, beide nur nach Klick und mit Zustimmung: (1) Seiten-Check bzw. „Aktuelle Seite erfassen“ fragen nur für genau die geöffnete Webseite nach, falls der Browser es verlangt. (2) Die Funnel-Hack-Aufnahme braucht für `chrome.tabs.captureVisibleTab` den Zugriff `<all_urls>`, weil ein Funnel über mehrere Seiten und Domains (z. B. Checkout) läuft und `activeTab` beim Weiterklicken verfällt. Der Zugriff wird bei „Aufnahme starten“ erbeten und beim Stoppen mit `chrome.permissions.remove` wieder abgegeben. Screenshots und Struktur bleiben lokal (IndexedDB) und werden nur als ZIP vom Nutzer heruntergeladen, nie übertragen. |

**Remote-Code:** Nein. Die Erweiterung lädt nur JSON-Dateien mit Texten, keinen ausführbaren Code. Alle Skripte sind im Paket enthalten.

**Datennutzung** (Häkchen im Formular)

- Erhobene Daten: **keine** der aufgeführten Kategorien ankreuzen. Begründung: Eingaben, Merkliste und Briefings bleiben lokal; Seiten-Check und Funnel-Hack (auch die Aufnahme mit Screenshots) werten nur lokal aus und übertragen nichts; „Website-Inhalte“ werden also nicht erhoben im Sinne der Richtlinie (nichts verlässt das Gerät, außer als ZIP, das der Nutzer selbst herunterlädt). Der Premium-Freischaltcode bzw. die Lizenz ist kein personenbezogenes Datum und dient nur der Prüfung der Berechtigung.
- Alle drei Erklärungen bestätigen:
  - Ich verkaufe oder übertrage Nutzerdaten nicht an Dritte, außer in den zulässigen Anwendungsfällen.
  - Ich verwende oder übertrage Nutzerdaten nicht für Zwecke, die nicht mit dem alleinigen Zweck meines Artikels zusammenhängen.
  - Ich verwende oder übertrage Nutzerdaten nicht zur Bestimmung der Kreditwürdigkeit oder für Kreditvergabezwecke.

**URL der Datenschutzerklärung:** https://vikitor.de/addon/datenschutz/

Hinweis: Der Inhalt dieser Seite sollte `PRIVACY.md` (Stand 1.5.0) entsprechen, insbesondere die vier Verbindungen zu vikitor.de (zwei automatisch, zwei nur bei Premium) und den Abschnitt „Funnel-Hack-Aufnahme“.

## Vertrieb

- Sichtbarkeit: **Nicht gelistet** (nur über den direkten Link auffindbar)
- Regionen: alle Regionen oder gezielt Deutschland, Österreich, Schweiz
- Preis: kostenlos
