# Einreichen im Chrome Web Store als „Nicht gelistet“

Kurzanleitung für Viktor. Alle Texte und Bilder liegen in diesem Ordner (`LISTING.md`, `screenshots/`, `kachel-440x280.png`, `icon-128.png`).

## Vorher wissen

- **Einmalige Entwicklergebühr:** Für das Entwicklerkonto verlangt Google eine einmalige Registrierungsgebühr (den aktuellen Betrag zeigt das Dashboard bei der Anmeldung). Danach kannst du beliebig viele Erweiterungen einreichen.
- **Prüfung dauert einige Tage:** Nach dem Einreichen prüft Google die Erweiterung. Das dauert meist einige Tage, wegen der Zugriffe auf claude.ai, chatgpt.com, lovable.dev und vikitor.de manchmal länger.
- **Zwei Varianten, zwei IDs:**
  - Die **Entwicklermodus-Variante** (ZIP von vikitor.de, „Entpackte Erweiterung laden“) enthält im Manifest den festen `key`. Dadurch hat sie immer die ID `ikpkjjkcgofnlehojjehhmobdgkdpknb`, auch bei neuen Versionen, und die Merkliste bleibt erhalten.
  - Die **Store-Variante** (`vikitor-addon-v1.5.0-store.zip`) enthält keinen `key`, weil der Store ihn nicht erlaubt. Google vergibt beim ersten Hochladen eine eigene, neue ID. Diese bleibt dann für alle Store-Updates gleich und Updates kommen automatisch. Beide Varianten sind für den Browser unterschiedliche Erweiterungen; wer wechselt, nimmt seine Merkliste nicht mit.

## Schritte

1. **Konto:** https://chrome.google.com/webstore/devconsole öffnen, mit dem Google-Konto anmelden, das die Erweiterung dauerhaft verwalten soll, Entwicklervereinbarung akzeptieren, Gebühr bezahlen und die Kontakt-E-Mail bestätigen.
2. **Hochladen:** „Neues Element“ → `vikitor-addon-v1.5.0-store.zip` aus diesem Ordner hochladen.
3. **Store-Eintrag:** Beschreibung, Kategorie und Sprache aus `LISTING.md` übernehmen. Store-Symbol `icon-128.png`, die fünf Screenshots aus `screenshots/` und die Kachel `kachel-440x280.png` hochladen.
4. **Datenschutz:** Alleiniger Zweck, Begründungen der Berechtigungen, „Remote-Code: Nein“, Datennutzung und die URL https://vikitor.de/addon/datenschutz/ aus `LISTING.md` eintragen.
5. **Vertrieb:** Sichtbarkeit **Nicht gelistet** wählen, kostenlos, Regionen auswählen.
6. **Zur Überprüfung einreichen.** Optional „Nach Freigabe automatisch veröffentlichen“ anhaken.
7. **Nach der Freigabe:** Den Store-Link aus dem Dashboard kopieren und zum Beispiel auf vikitor.de/addon oder in den Webinar-Unterlagen verlinken. Nur wer den Link hat, findet die Erweiterung.

## Updates

Version in `src/manifest.json` erhöhen (die Tests prüfen, dass package.json, content.json, app.js und README mitziehen), `node scripts/pack.mjs` ausführen, im Dashboard unter „Paket“ die neue Store-ZIP hochladen und erneut einreichen. Neue Screenshots bei Bedarf mit `node scripts/store-assets.mjs`.
