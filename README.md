# PlateLens

Turn equipment nameplates into structured, editable data.

**Live:** https://aesgalexis.github.io/PlateLens/

PlateLens is a small browser-based tool for technicians, maintainers and anyone who needs to copy data from machine, motor, pump, drive or equipment nameplates into a useful record.

## Current V1

- Drop, choose or paste a nameplate photo.
- OCR runs in the browser with Tesseract.js.
- The image is not uploaded by PlateLens.
- Common fields are detected automatically: manufacturer, model, serial number, voltage, frequency, power, current, speed, IP rating and year.
- Detected data is presented as an editable form.
- Copy the result as plain text or JSON, or download a JSON record.
- Raw OCR text remains visible for verification.

The parser is deliberately conservative. PlateLens should help transcribe a plate, not silently invent missing values. Always verify critical machine data against the original nameplate.

## Run locally

No build step is required.

```bash
python -m http.server 8080
```

Then open <http://localhost:8080>.

## GitHub Pages

Live site: <https://aesgalexis.github.io/PlateLens/>\n\nThe site is intentionally static and can be published directly from the repository root with GitHub Pages.

## Roadmap

1. Improve OCR preprocessing for angled, dirty and low-contrast plates.
2. Add equipment-aware field sets for motors, pumps, VFDs and industrial machines.
3. Add optional vision-model extraction behind an explicit user action.
4. Export CSV and printable technical cards.
5. Allow integrations to receive the verified structured record.

## Privacy

The current V1 performs OCR locally in the browser. PlateLens itself has no analytics, account system or backend.

## License

MIT
