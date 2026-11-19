---
name: vikitor-launch-check
description: Geht vor dem Livegang einer Website eine vollständige Prüfliste durch: Links, Formulare, Hinweise zu Rechtstexten (Impressum, Datenschutz) und Cookie-Banner, Bilder, Ladezeit, Handy-Darstellung, Titel und Weiterleitungen. Verwenden, wenn eine Seite veröffentlicht, gelauncht oder „live geschaltet“ werden soll.
---

# Launch-Check

Du gehst vor dem Livegang systematisch alle Punkte durch, die nach dem Start unangenehm auffallen würden. Du prüfst, berichtest und reparierst nur nach Rücksprache, wenn eine Änderung über einen offensichtlichen technischen Fehler hinausgeht.

Wichtig: Du gibst keine Rechtsberatung. Bei Impressum, Datenschutz und Cookies prüfst du nur, ob etwas vorhanden und erreichbar ist, und weist darauf hin, dass der Inhalt von einer fachkundigen Stelle oder einem seriösen Generator stammen sollte.

## Prüfliste

Arbeite die Punkte der Reihe nach ab und markiere jeden als **erledigt**, **Problem** oder **Rückfrage**.

### 1. Links
- Alle internen Links führen zu existierenden Seiten (keine 404-Fehler).
- Externe Links öffnen das richtige Ziel; Links auf eigene Seiten öffnen im selben Tab.
- Telefon- und E-Mail-Links (`tel:`, `mailto:`) sind korrekt geschrieben.
- Nach einem Relaunch: Alte Adressen werden per Weiterleitung (301) auf die passenden neuen Seiten geführt.

### 2. Formulare
- Jedes Formular lässt sich auf dem Handy ausfüllen und absenden.
- Pflichtfelder sind markiert, Fehlermeldungen sind verständlich.
- Nach dem Absenden erscheint eine Bestätigung, und die Nachricht kommt tatsächlich an (Testeintrag senden und Empfang prüfen).
- In der Nähe des Formulars steht ein Hinweis zum Datenschutz mit Link.

### 3. Rechtstexte (Hinweis)
- Impressum und Datenschutzerklärung sind von jeder Seite aus mit einem Klick erreichbar, meist im Footer.
- Die Inhalte sind keine Platzhalter mehr. Weise den Nutzer darauf hin, die Texte fachkundig prüfen zu lassen.

### 4. Cookie-Banner (Hinweis)
- Prüfe, ob Dienste eingebunden sind, die Cookies setzen oder Daten an Dritte senden (zum Beispiel Analyse-Werkzeuge, eingebettete Videos, Karten, externe Schriften).
- Falls ja: Weise darauf hin, dass dafür in der Regel eine Einwilligung nötig ist, und prüfe, ob ein Banner vorhanden ist, das diese Dienste erst nach Zustimmung lädt.

### 5. Bilder
- Keine riesigen Originaldateien: Bilder sind passend skaliert und in modernen Formaten (zum Beispiel WebP oder AVIF).
- Bilder unterhalb des sichtbaren Bereichs werden verzögert geladen (`loading="lazy"`).
- Inhaltliche Bilder haben Alternativtexte, und es gibt keine kaputten Bildverweise.
- Favicon und Vorschaubild für das Teilen (Open Graph) sind gesetzt.

### 6. Ladezeit
- Wenn möglich, eine Lighthouse-Messung (Chrome DevTools) für Handy durchführen und die wichtigsten Hinweise nennen.
- Keine unnötigen großen Skripte oder Schriften; Schriften mit `font-display: swap`.

### 7. Handy
- Startseite und wichtigste Seiten auf 390 px prüfen: kein waagerechtes Scrollen, lesbare Schrift, ausreichend große Knöpfe, Menü bedienbar.

### 8. Grundlagen für Suchmaschinen
- Jede Seite hat einen eigenen Titel und eine Beschreibung.
- Keine Seite ist versehentlich auf `noindex` gestellt, und die `robots.txt` sperrt nichts Wichtiges.
- Eine `sitemap.xml` ist vorhanden.

### 9. Letzter Blick
- Keine Platzhaltertexte wie „Lorem ipsum“, keine Test-Inhalte, keine erfundenen Kundenstimmen oder Zahlen.
- Rechtschreibung der Überschriften und Knöpfe geprüft.
- Die echte Domain ist mit `https` erreichbar, mit und ohne `www`.

## Bericht

Gib am Ende eine kurze Tabelle mit allen Punkten und ihrem Status aus. Nenne darunter die Probleme nach Wichtigkeit sortiert und schlage für jedes eine konkrete Lösung vor.
