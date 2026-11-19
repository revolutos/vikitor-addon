---
name: vikitor-mobil-check
description: Prüft eine Webseite systematisch auf 390 px Handy-Breite und repariert Darstellungs- und Bedienprobleme (waagerechtes Scrollen, abgeschnittene Texte, zu kleine Schrift oder Knöpfe, Überlappungen), ohne das Desktop-Layout zu beschädigen. Verwenden, wenn eine Seite mobil geprüft, für Handys optimiert oder „responsive gemacht“ werden soll.
---

# Mobil-Check (390 px)

Du prüfst die Seite so, wie die meisten Besucher sie sehen: auf dem Handy. Arbeite ruhig und gründlich, erst prüfen, dann reparieren, dann erneut prüfen.

## 1. Vorbereitung

- Finde heraus, wie das Projekt lokal gestartet wird (zum Beispiel `npm run dev`, oder die HTML-Datei direkt öffnen), und starte es.
- Kläre, welche Seiten geprüft werden sollen. Ohne Angabe prüfst du die Startseite und alle Seiten, die von dort direkt verlinkt sind.
- Wenn ein Browser-Werkzeug verfügbar ist (zum Beispiel Playwright, Puppeteer oder ein Browser-MCP), nutze es für echte Screenshots. Sonst prüfst du den Code und die CSS-Regeln besonders sorgfältig.

## 2. Prüfen auf 390 px Breite

Gehe jede Seite von oben bis unten durch und notiere jedes Problem mit Seite, Abschnitt und vermuteter Ursache:

1. **Waagerechtes Scrollen:** Ist irgendein Element breiter als der Bildschirm? Typische Ursachen sind feste Breiten in px, `100vw` mit Innenabstand, breite Tabellen, lange Wörter oder Adressen sowie negative Ränder.
2. **Viewport:** Gibt es `<meta name="viewport" content="width=device-width, initial-scale=1">`?
3. **Schrift:** Fließtext mindestens 16 px, Zeilenhöhe etwa 1,5. Überschriften dürfen nicht über den Rand laufen und brechen nicht mitten in einem kurzen Satz unschön um.
4. **Knöpfe und Links:** Tippflächen mindestens 44 × 44 px, mit genug Abstand zueinander.
5. **Überlappungen:** Feste Kopfzeilen, Cookie-Hinweise oder Chat-Knöpfe dürfen keine Inhalte oder Formularfelder verdecken.
6. **Bilder und Videos:** `max-width: 100%`, passende Seitenverhältnisse, nichts verzerrt oder abgeschnitten.
7. **Navigation:** Das Menü lässt sich öffnen, schließen und bedienen.
8. **Formulare:** Felder sind groß genug, haben passende Eingabetypen (`type="email"`, `type="tel"`) und die Tastatur verdeckt nicht den Absendeknopf.
9. **Seitliche Reihen:** Inhalte, die nebeneinander stehen, werden auf dem Handy sauber untereinander angeordnet oder lassen sich bewusst und ruhig wischen.

## 3. Reparieren

- Behebe die Probleme einzeln und mit der kleinstmöglichen Änderung.
- Arbeite „mobil zuerst“: Grundregeln für schmale Bildschirme, Erweiterungen per `@media (min-width: …)`.
- Ändere keine Texte und keine Inhalte, nur Darstellung und Bedienbarkeit.
- Erfinde keine neuen Inhalte, um Lücken zu füllen.

## 4. Gegenprüfen

- Prüfe danach erneut auf 390 px, zusätzlich auf 360 px, 768 px und in Desktop-Breite.
- Stelle sicher, dass das Desktop-Layout unverändert gut aussieht.

## 5. Bericht

Fasse zum Schluss kurz zusammen:

- welche Probleme du gefunden hast (Seite, Abschnitt, Ursache),
- was du geändert hast (Datei und Art der Änderung),
- was offen bleibt oder eine Entscheidung braucht.
