# Datenschutzhinweise: VIKITOR Vibecoding Assistent (Free)

Stand: November 2026

Anbieter der Erweiterung ist die REVOLUTOS LTD. Kontaktdaten und die vollständige Datenschutzerklärung findest du unter https://vikitor.de/datenschutz/.

## Kurz gesagt

Der VIKITOR Vibecoding Assistent arbeitet vollständig in deinem Browser. Es gibt kein Benutzerkonto, keine Anmeldung, kein Tracking und keine Analyse-Werkzeuge. Deine Eingaben verlassen deinen Rechner nicht.

## Was lokal gespeichert wird

Die Erweiterung speichert mit `chrome.storage.local` ausschließlich auf deinem Gerät:

- deine Merkliste (Prompts, die du selbst mit „Merken“ ablegst),
- deine letzten Eingaben im Prompt-Generator und im Prompt-Check, damit du beim nächsten Öffnen weitermachen kannst,
- dein letztes Ergebnis im Funnel-Quiz,
- eine zwischengespeicherte Kopie der aktualisierten Inhalte (siehe unten) und den Zeitpunkt des letzten Abrufs.

Diese Daten werden nicht übertragen. Du kannst sie jederzeit löschen, indem du Einträge in der Merkliste entfernst oder die Erweiterung deinstallierst.

## Verbindungen zu Servern

Die Erweiterung baut genau eine eigene Verbindung auf: Sie ruft höchstens alle zwölf Stunden die Datei `https://vikitor.de/addon/content.json` ab, um Vorlagen, Anleitungen und Texte aktuell zu halten. Dabei werden keine personenbezogenen Daten und keine Eingaben mitgesendet. Wie bei jedem Abruf einer Website erhält der Server technisch bedingt deine IP-Adresse; Näheres dazu steht in der Datenschutzerklärung unter https://vikitor.de/datenschutz/. Die Datei enthält nur Texte (JSON) und niemals ausführbaren Code.

Die Schriften „Inter Tight“ und „JetBrains Mono“ sind in der Erweiterung enthalten. Es wird dafür keine Verbindung zu Google oder anderen Schriftanbietern aufgebaut.

Links wie „Zum Live-Webinar“ oder „Herunterladen“ öffnen lediglich die entsprechende Seite in einem neuen Tab, wenn du sie anklickst.

## Claude, ChatGPT und Lovable

Auf `claude.ai`, `chatgpt.com` und `lovable.dev` läuft ein kleines Skript, das nur eine Aufgabe hat: Wenn du im Prompt-Generator auf „Einfügen“ klickst, setzt es deinen Prompt in das Eingabefeld der Seite. Es liest keine Inhalte dieser Seiten aus, speichert nichts und sendet nichts. Abschicken musst du den Prompt selbst.

## Seiten-Check

Der Seiten-Check läuft nur, wenn du ausdrücklich auf „Aktuelle Seite prüfen“ klickst, und nur auf der Seite im aktiven Tab. Dabei werden ausschließlich technische Angaben gelesen: Viewport-Angabe, Seitentitel, Meta-Beschreibung, Anzahl der H1-Überschriften, Bilder ohne Alternativtext, Strukturdaten (JSON-LD), Sprachangabe, Vorschaubild, Canonical-Link und ob unter derselben Adresse eine Datei `/llms.txt` erreichbar ist. Die Auswertung geschieht lokal in deinem Browser; das Ergebnis wird nicht gespeichert und nicht übertragen.

Falls Chrome für eine Website eine zusätzliche Erlaubnis verlangt, fragt die Erweiterung dich vorher. Die Erlaubnis gilt nur für diese eine Website und lässt sich in den Chrome-Einstellungen der Erweiterung jederzeit wieder entziehen.

## Berechtigungen und wofür sie gebraucht werden

| Berechtigung | Zweck |
| --- | --- |
| `sidePanel` | Anzeige des Assistenten als Seitenleiste |
| `storage` | lokale Speicherung von Merkliste, letzten Eingaben und Quiz-Ergebnis |
| `activeTab`, `scripting` | Seiten-Check auf Knopfdruck und Einfügen von Prompts |
| `contextMenus` | Menüpunkt „Assistent im großen Fenster öffnen“ am Symbol |
| Zugriff auf claude.ai, chatgpt.com, lovable.dev | Einfügen von Prompts in das Eingabefeld |
| Zugriff auf vikitor.de | Abruf der aktualisierten Inhalte (content.json) |
| optional: Zugriff auf eine einzelne Website | nur falls Chrome ihn für den Seiten-Check verlangt, mit deiner Zustimmung |

## Keine Weitergabe und kein Verkauf

Es werden keine Daten an Dritte weitergegeben oder verkauft. Die Erweiterung verwendet keine Daten für Werbung, Bonitätsprüfungen oder andere Zwecke, die nichts mit ihrer Funktion zu tun haben.
