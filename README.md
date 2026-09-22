# PlateLens

Turn equipment nameplates into structured, editable data.

**Live:** https://aesgalexis.github.io/PlateLens/

PlateLens is a small browser-based tool for technicians, maintainers and anyone who needs to copy data from machine, motor, pump, drive or equipment nameplates into a useful record.

## Current V1

- Drop, choose or paste a nameplate photo.
- OCR runs in the browser with Tesseract.js using English, German, Italian and Spanish language data.
- Images are locally rescaled and contrast-enhanced before OCR; weak reflective-plate reads can also trigger an adaptive black/white OCR pass.
- Auto-orientation checks 0°, 90°, 180° and 270° before the main read; weak results also probe small ±6°/±12° deskew offsets.
- Incomplete reads can trigger additional passes over the plate frame, columns, technical regions, overlapping rows, high-contrast variants and alternate page-segmentation modes.
- Each OCR pass is also parsed independently. PlateLens fuses field candidates conservatively: repeated labelled technical values can rescue or correct a merged read, while identity fields such as model and serial remain deliberately harder to override.
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

The parser and OCR-fusion layer are checked against more than 240 regression cases and scenarios: public hand-curated nameplate formats, noisy OCR samples from real plates, a 100-case stress suite, a 50-plate online corpus, two additional visual benchmarks covering 41 real plates, real raw-OCR captures, and dedicated candidate-fusion conflicts. Coverage includes pumps, compressors, VFDs, industrial motors, industrial laundry equipment, HVAC/refrigeration, gearboxes and several multi-rating electrical table layouts.

GitHub Actions runs the full regression suite automatically on every push to `main` and on pull requests. Run the same set locally with:

```bash
node tests/parser.test.mjs && node tests/mega-corpus.test.mjs && node tests/online-50.test.mjs && node tests/visual-benchmark.test.mjs && node tests/visual-benchmark-2.test.mjs && node tests/raw-ocr.test.mjs && node tests/ocr-corpus.test.mjs && node tests/candidate-fusion.test.mjs && node tests/presence.test.mjs && node tests/orientation.test.mjs && node tests/runtime-wiring.test.mjs
```

See `docs/test-corpus.md` for the hand-curated corpus, `docs/online-50-corpus.md` for the 50 distinct real online plates, `docs/mega-corpus.md` for the 100-case stress suite, `docs/visual-benchmark-2.md` for the second 20-plate visual corpus, `docs/ocr-benchmark.md` for real raw-OCR regression cases, and `docs/orientation-corpus.md` for the orientation/pose reference set.

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
