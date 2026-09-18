# PlateLens

Turn equipment nameplates into structured, editable data.

**Live:** https://aesgalexis.github.io/PlateLens/

PlateLens is a small browser-based tool for technicians, maintainers and anyone who needs to copy data from machine, motor, pump, drive or equipment nameplates into a useful record.

## Current V1

- Drop, choose or paste a nameplate photo.
- OCR runs in the browser with Tesseract.js.
- Images are locally rescaled and contrast-enhanced before OCR; weak reflective-plate reads can also trigger an adaptive black/white OCR pass.
- Auto-orientation checks 0°, 90°, 180° and 270° before the main read; weak results also probe small ±6°/±12° deskew offsets.
- Incomplete reads can trigger a second pass over the central technical region and an alternate page-segmentation pass.
- The image is not uploaded by PlateLens.
- Common fields are detected automatically: manufacturer, equipment, model, serial/part/order number, date/year, phases, voltage, frequency, real/apparent power, current, speed, IP rating, weight, capacity, refrigerant/medium, ratio, flow/head and pressure.
- Detected data is presented as an editable form; fields that are not present stay hidden, while labels detected with unreadable values remain visible as empty review fields. All empty fields can still be revealed manually.
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

Live site: <https://aesgalexis.github.io/PlateLens/>

The site is intentionally static and can be published directly from the repository root with GitHub Pages.

## Regression corpus

The parser is checked against 203 automated regression cases: 50 public hand-curated nameplate formats, three noisy OCR samples from real plates, a 100-case stress suite generated from 20 real industrial plate families, and a separate corpus transcribed from 50 distinct real nameplate photographs found online. Coverage includes pumps, compressors, VFDs, industrial motors, industrial laundry equipment, gearboxes and several multi-rating electrical table layouts.

Run the regression set with:

```bash
node tests/parser.test.mjs && node tests/mega-corpus.test.mjs && node tests/online-50.test.mjs && node tests/presence.test.mjs && node tests/orientation.test.mjs
```

See `docs/test-corpus.md` for the hand-curated corpus, `docs/online-50-corpus.md` for the 50 distinct real online plates, `docs/mega-corpus.md` for the 100-case stress suite, and `docs/orientation-corpus.md` for the orientation/pose reference set.

## Roadmap

1. Expand OCR preprocessing for angled, dirty and low-contrast plates.
2. Add equipment-aware field sets for motors, pumps, VFDs and industrial machines.
3. Add optional vision-model extraction behind an explicit user action.
4. Export CSV and printable technical cards.
5. Allow integrations to receive the verified structured record.

## Privacy

The current V1 performs OCR locally in the browser. PlateLens itself has no analytics, account system or backend.

## License

MIT
