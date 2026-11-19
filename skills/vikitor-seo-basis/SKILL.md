---
name: vikitor-seo-basis
description: Setzt die technischen SEO- und KI-Sichtbarkeits-Grundlagen einer Website sauber auf: Seitentitel, Meta-Beschreibungen, Überschriften-Struktur, Strukturdaten (JSON-LD), llms.txt, sitemap.xml, robots.txt, Alternativtexte und Vorschaubilder. Verwenden, wenn eine Seite für Google oder KI-Suchen vorbereitet oder SEO-Grundlagen geprüft werden sollen.
---

# SEO-Basis

Du sorgst dafür, dass Suchmaschinen und KI-Systeme die Website richtig verstehen. Es geht um saubere Grundlagen, nicht um Tricks. Du versprichst keine Rankings.

## Grundregeln

- Nutze nur echte Angaben aus dem Projekt oder vom Nutzer. Erfinde keine Bewertungen, Öffnungszeiten, Adressen, Preise oder Zahlen.
- Fehlen Angaben (zum Beispiel Adresse oder Telefonnummer für Strukturdaten), sammle sie als Fragen und frag gebündelt nach.
- Ändere keine sichtbaren Texte ohne Rückfrage, außer Titel, Beschreibungen und Alternativtexte.

## 1. Bestandsaufnahme

Liste für jede Seite auf: Adresse, `<title>`, Meta-Beschreibung, Anzahl der H1, Überschriften-Reihenfolge, Bilder ohne `alt`, vorhandene Strukturdaten, `lang`-Attribut, Canonical-Link und Open-Graph-Bild. Zeig diese Übersicht, bevor du etwas änderst.

## 2. Titel und Beschreibungen

- Jede Seite bekommt einen eindeutigen Titel mit etwa 30 bis 60 Zeichen: Thema oder Angebot zuerst, Marke am Ende.
- Jede Seite bekommt eine eigene Meta-Beschreibung mit etwa 70 bis 160 Zeichen, die den Nutzen für Besucher klar benennt.
- Keine Keyword-Listen, keine Übertreibungen.

## 3. Überschriften

- Genau eine H1 pro Seite, die das Hauptthema benennt.
- Darunter H2 und H3 in logischer Reihenfolge, ohne Ebenen zu überspringen.

## 4. Strukturdaten (JSON-LD)

- Ergänze passende Typen, zum Beispiel `Organization` oder `LocalBusiness` für die Startseite, `Person` für eine Über-mich-Seite und `FAQPage` nur dann, wenn die Fragen und Antworten auch sichtbar auf der Seite stehen.
- Nutze ausschließlich echte Daten. Prüfe die Syntax (gültiges JSON).

## 5. llms.txt

Lege im öffentlichen Wurzelverzeichnis eine Datei `llms.txt` an (Markdown). Inhalt: eine Überschrift mit dem Namen, ein kurzer Absatz, wer du bist und was du anbietest, danach eine Liste der wichtigsten Seiten mit Link und einem Satz Beschreibung. Das ist noch kein fester Standard, hilft KI-Systemen aber, die Seite einzuordnen.

## 6. Sitemap und robots.txt

- Prüfe, ob `sitemap.xml` existiert und alle öffentlichen Seiten enthält. Lege sie sonst an oder nutze die Funktion des Frameworks (bei Next.js zum Beispiel `app/sitemap.ts`).
- Prüfe `robots.txt`: Öffentliche Seiten dürfen nicht gesperrt sein, die Sitemap wird verlinkt.

## 7. Weitere Grundlagen

- `lang`-Attribut am `<html>`-Element (zum Beispiel `de`).
- Canonical-Link auf jeder Seite.
- Open-Graph-Titel, -Beschreibung und -Bild (etwa 1200 × 630 px) für Vorschauen in Messengern und sozialen Netzwerken.
- Beschreibende Alternativtexte für inhaltliche Bilder, `alt=""` für rein dekorative.

## 8. Bericht

Fasse zusammen, was vorher fehlte, was du ergänzt hast und welche Angaben du noch vom Nutzer brauchst. Empfiehl am Ende, die Seite nach dem Livegang in der Google Search Console anzumelden und die Sitemap dort einzureichen.
