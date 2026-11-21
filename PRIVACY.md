# Datenschutzhinweise: VIKITOR Vibecoding Assistent (Free)

Stand: November 2026 (Version 1.4.0)

Anbieter der Erweiterung ist die REVOLUTOS LTD. Kontaktdaten und die vollständige Datenschutzerklärung findest du unter https://vikitor.de/datenschutz/.

## Kurz gesagt

Der VIKITOR Vibecoding Assistent arbeitet vollständig in deinem Browser (Chrome, Edge oder Brave). Es gibt kein Benutzerkonto, keine Anmeldung, kein Tracking und keine Analyse-Werkzeuge. Deine Eingaben verlassen deinen Rechner nicht.

## Was lokal gespeichert wird

Die Erweiterung speichert mit `chrome.storage.local` ausschließlich auf deinem Gerät:

- deine Merkliste (Prompts, die du selbst mit „Merken“ ablegst),
- deine letzten Eingaben im Prompt-Generator und im Prompt-Check, damit du beim nächsten Öffnen weitermachen kannst,
- dein letztes Ergebnis im Funnel-Quiz,
- eine zwischengespeicherte Kopie der aktualisierten Inhalte und der Neuigkeiten (siehe unten), den Zeitpunkt des letzten Abrufs und welche Neuigkeiten du schon gesehen hast,
- nur bei Premium: die Lizenz, eine zwischengespeicherte Kopie der Funnel-Vorlagen und dein Briefing für Funnel-Vorlagen und Funnel-Hack (Angebot, Zielgruppe, Marke).

Diese Daten werden nicht übertragen (Ausnahme: die Lizenz, siehe „Premium“). Du kannst sie jederzeit löschen, indem du Einträge in der Merkliste entfernst oder die Erweiterung deinstallierst.

## Verbindungen zu Servern

Die Erweiterung verbindet sich ausschließlich mit `vikitor.de`, und zwar über höchstens vier Adressen:

1. **Inhalte (automatisch):** höchstens alle zwölf Stunden `https://vikitor.de/downloads/addons/content.json`, um Vorlagen, Anleitungen und Texte aktuell zu halten.
2. **Neuigkeiten (automatisch):** höchstens alle drei Stunden `https://vikitor.de/feed.json` für den Bereich „Neu von VIKITOR“ (News, Ratgeber, Updates, Events).
3. **Premium freischalten (nur auf Knopfdruck):** einmalig `https://vikitor.de/api/vsmacos/freischalten/`, wenn du einen Freischaltcode eingibst.
4. **Premium-Vorlagen (nur mit Premium):** höchstens alle zwölf Stunden `https://vikitor.de/api/vsmacos/premium/`, um die Funnel-Vorlagen zu laden.

Ohne Premium gibt es also nur die beiden automatischen Abrufe 1 und 2. Dabei werden keine personenbezogenen Daten und keine Eingaben mitgesendet. Wie bei jedem Abruf einer Webseite erhält der Server technisch bedingt deine IP-Adresse; Näheres dazu steht in der Datenschutzerklärung unter https://vikitor.de/datenschutz/. Die Inhalte und Neuigkeiten sind reine Texte (JSON) und niemals ausführbarer Code.

Die Schriften „Inter Tight“ und „JetBrains Mono“ sind in der Erweiterung enthalten. Es wird dafür keine Verbindung zu Google oder anderen Schriftanbietern aufgebaut.

Links wie „Zum Live-Call“, „Zur Masterclass“ oder „Herunterladen“ öffnen lediglich die entsprechende Seite in einem neuen Tab, wenn du sie anklickst. Links zu vikitor.de tragen dabei UTM-Parameter (`utm_source=vikitor-addon`), damit erkennbar ist, dass der Klick aus dem Addon kam. Sie enthalten keine personenbezogenen Daten.

## Claude, ChatGPT und Lovable

Auf `claude.ai`, `chatgpt.com` und `lovable.dev` läuft ein kleines Skript, das nur eine Aufgabe hat: Wenn du im Prompt-Generator auf „Einfügen“ klickst, setzt es deinen Prompt in das Eingabefeld der Seite. Es liest keine Inhalte dieser Seiten aus, speichert nichts und sendet nichts. Abschicken musst du den Prompt selbst.

## Seiten-Check

Der Seiten-Check läuft nur, wenn du ausdrücklich auf „Aktuelle Seite prüfen“ klickst, und nur auf der Seite im aktiven Tab. Dabei werden ausschließlich technische Angaben gelesen: Viewport-Angabe, Seitentitel, Meta-Beschreibung, Anzahl der H1-Überschriften, Bilder ohne Alternativtext, Strukturdaten (JSON-LD), Sprachangabe, Vorschaubild, Canonical-Link und ob unter derselben Adresse eine Datei `/llms.txt` erreichbar ist. Die Auswertung geschieht lokal in deinem Browser; das Ergebnis wird nicht gespeichert und nicht übertragen.

Falls dein Browser (Chrome, Edge oder Brave) für eine Webseite eine zusätzliche Erlaubnis verlangt, fragt die Erweiterung dich vorher. Die Erlaubnis gilt nur für diese eine Webseite und lässt sich in den Einstellungen der Erweiterung jederzeit wieder entziehen.

## Berechtigungen und wofür sie gebraucht werden

| Berechtigung | Zweck |
| --- | --- |
| `sidePanel` | Anzeige des Assistenten als Seitenleiste |
| `storage` | lokale Speicherung von Merkliste, letzten Eingaben, Quiz-Ergebnis, Zwischenspeicher und (bei Premium) Lizenz |
| `activeTab`, `scripting` | Seiten-Check und Funnel-Hack auf Knopfdruck, Einfügen von Prompts |
| `contextMenus` | Menüpunkt „Assistent im großen Fenster öffnen“ am Symbol |
| Zugriff auf claude.ai, chatgpt.com, lovable.dev | Einfügen von Prompts in das Eingabefeld |
| Zugriff auf vikitor.de | Abruf der aktualisierten Inhalte (content.json) und der Neuigkeiten (feed.json); nur bei Premium: Freischalten und Laden der Funnel-Vorlagen |
| optional: Zugriff auf eine einzelne Webseite | nur falls der Browser ihn für Seiten-Check oder Funnel-Hack verlangt, mit deiner Zustimmung |

## Keine Weitergabe und kein Verkauf

Es werden keine Daten an Dritte weitergegeben oder verkauft. Die Erweiterung verwendet keine Daten für Werbung, Bonitätsprüfungen oder andere Zwecke, die nichts mit ihrer Funktion zu tun haben.

## Premium (Funnel-Vorlagen und Funnel-Hack)

Wer Premium freischaltet, sendet den Freischaltcode einmalig an `https://vikitor.de/api/vsmacos/freischalten/`. Zurück kommt eine Lizenz, die lokal in der Erweiterung gespeichert wird. Mit dieser Lizenz lädt die Erweiterung höchstens alle zwölf Stunden die Vorlagen von `https://vikitor.de/api/vsmacos/premium/`; die Lizenz wird dabei zur Prüfung mitgesendet. Weitere personenbezogene Daten, Eingaben oder dein Briefing werden nicht übertragen. Den Freischaltcode bekommen Teilnehmer der Vibecoding Masterclass persönlich per WhatsApp; dieser Austausch findet außerhalb der Erweiterung statt.

Der Funnel-Hack liest die Struktur der gerade geöffneten Seite (Überschriften, Texte, Buttons, Formularfelder, Preise, Links) nur auf Knopfdruck und nur lokal. Daraus entsteht ein Text, den du selbst kopierst oder in Claude, ChatGPT oder Lovable einfügst bzw. an Claude Code oder Codex gibst. Die Erweiterung sendet diese Inhalte an keinen Server. Dein Briefing (Angebot, Zielgruppe, Marke) bleibt lokal in der Erweiterung gespeichert.
