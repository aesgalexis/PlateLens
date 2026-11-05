# PlateLens

**Industrial nameplates, converted into structured data - directly in your browser.**

PlateLens is an open-source OCR tool for reading equipment nameplates and turning their technical information into editable, reusable records. It is designed for maintenance technicians, engineers, and anyone documenting industrial equipment in the field.

[**Launch PlateLens**](https://aesgalexis.github.io/PlateLens/) · [View source](https://github.com/aesgalexis/PlateLens) · [Report an issue](https://github.com/aesgalexis/PlateLens/issues)

[![Regression suite](https://github.com/aesgalexis/PlateLens/actions/workflows/regression.yml/badge.svg)](https://github.com/aesgalexis/PlateLens/actions/workflows/regression.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> [!NOTE]
> PlateLens is a transcription and data-entry aid, **not a certified equipment identification or safety-verification system**. Always compare critical values with the original nameplate.

## Why PlateLens?

Reading a machine plate should not require typing every model number, serial number, voltage, or rating by hand. PlateLens takes a photograph, attempts to recover the printed information, and presents the results in a form you can review and correct before reusing them.

- **Browser-based:** no account, installation, or application backend required.
- **Local image processing:** the selected photograph is processed on your device, not uploaded by PlateLens.
- **Multi-language OCR:** uses Tesseract.js with English, German, Italian, and Spanish recognition data.
- **Orientation-aware:** evaluates 0°, 90°, 180°, and 270°; weak reads can also trigger small-angle correction.
- **Adaptive reading:** may retry with enhanced contrast, alternative page layouts, and smaller image regions.
- **Conservative extraction:** combines evidence from multiple OCR passes and avoids filling uncertain fields by guesswork.
- **Editable results:** inspect the source text, correct the fields, and export the verified record as text or JSON.

## Try it

**[Open the live application](https://aesgalexis.github.io/PlateLens/)**

1. **Add a photo.** Choose an image, drag and drop one, or paste it from your clipboard.
2. **Analyze.** PlateLens detects orientation, runs OCR, and extracts technical fields.
3. **Verify.** Compare the results with the plate. Detected but unreadable fields can remain visible and empty; you can also reveal other empty fields.
4. **Export.** Copy the verified data as text or JSON, or download a JSON file.

The interface supports common image formats such as JPG, PNG, and WebP. For better results, fill the frame with the plate, keep it in focus, and avoid glare across engraved or stamped text.

## What can it extract?

PlateLens recognizes common labels and formats from motors, drives, pumps, compressors, refrigeration systems, industrial laundry machines, and other equipment.

| Category | Examples |
| --- | --- |
| Identification | Manufacturer, brand, equipment description, model/type, serial number, part/product code, year |
| Electrical | Voltage, current, phases, frequency, power, apparent power, fuse rating, power factor |
| Mechanical | Speed (RPM), weight, gear ratio, IP rating |
| Process and equipment | Capacity/load, volume, pressure, temperature, flow, head, heating, refrigerant/medium |

Coverage depends on the plate's layout, language, legibility, and the available OCR evidence. Not every field or equipment family is recognized reliably.

### Example output

After review, a JSON export has the following shape (**illustrative values**, not a benchmark result):

```json
{
  "source": "PlateLens",
  "capturedAt": "2026-01-01T12:00:00.000Z",
  "fields": {
    "manufacturer": "ABB",
    "model": "M3BP 160 MLA 4",
    "voltage": "400 / 690 V",
    "power": "15 kW",
    "speed": "1475 rpm"
  },
  "unreadableFields": [],
  "rawOcr": "ABB ... 400 / 690 V ... 15 kW ..."
}
```

The actual export contains the non-empty fields currently in the editable form, any detected-but-unreadable field names, and the raw OCR text.

## How it works

```text
Photograph
    |
    v
Image preparation and orientation detection
    |
    v
Tesseract.js OCR (with conditional refinement passes)
    |
    v
Text parsing and conservative candidate fusion
    |
    v
Editable record -> manual verification -> export
```

PlateLens uses rule-based extraction rather than a hosted vision-model API. The current application is a static HTML/CSS/JavaScript project; the OCR pipeline, parsing logic, and user interface run in the browser.

**Privacy and connectivity:** PlateLens does not upload the selected photograph to its own server and has no application account system, analytics, or backend. The page loads Tesseract.js from a CDN and may retrieve OCR engine and language resources over the network. Do not assume the application works fully offline on first use.

## Run locally

No build system, package installation, or API key is required to serve the application.

```bash
git clone https://github.com/aesgalexis/PlateLens.git
cd PlateLens
python -m http.server 8080
```

Open **http://localhost:8080** in your browser. Python 3 is sufficient to serve the static files; an internet connection may still be needed for the external OCR resources.

## Tests and validation

PlateLens includes regression tests covering parsed technical fields, noisy OCR text, orientation scoring, detected-but-unreadable fields, and candidate fusion.

| Test material | What it verifies |
| --- | --- |
| **100-case stress corpus** | Generated variations across 20 real industrial nameplate families |
| **50-plate online corpus** | Parser results against manually transcribed text from 50 distinct public plate examples |
| **Visual reference corpora (21 + 20 plates)** | Parser behavior across additional real-world layouts and rating tables |
| **Raw OCR fixtures and focused tests** | Recovery from captured OCR noise, field presence, orientation, and conflicting candidates |

**Important distinction:** the online and visual corpora primarily test *text-to-fields parsing*. They are **not** an end-to-end accuracy measurement of OCR on the original photographs. There is not yet a published, representative image-to-record accuracy benchmark.

Run a quick parser check (Node.js 22 is used in CI):

```bash
node tests/parser.test.mjs
```

To reproduce the full regression suite, follow [the commands in the GitHub Actions workflow](.github/workflows/regression.yml). It runs automatically on pushes to `main` and on pull requests.

Further details:
- [Curated test cases](docs/test-corpus.md)
- [Online 50-plate corpus](docs/online-50-corpus.md)
- [100-case stress corpus](docs/mega-corpus.md)
- [OCR benchmark methodology](docs/ocr-benchmark.md)
- [Orientation reference corpus](docs/orientation-corpus.md)
- [Second visual benchmark](docs/visual-benchmark-2.md)

## Project structure

```text
index.html             Application interface
styles.css             Styling and responsive layout
app.js                 Browser OCR, parsing, form and export logic
tests/                 Regression cases and OCR text fixtures
docs/                  Corpus notes and benchmark documentation
.github/workflows/     Automated tests and GitHub Pages deployment
```

## Current limitations

- Difficult photographs, glare, corrosion, engraving, tiny text, and unusual layouts may cause incomplete or incorrect reads.
- OCR retries can take longer on complex or low-quality images, especially on slower devices.
- A detected label does not guarantee that its value can be read. Missing values should remain unverified rather than inferred.
- Ratings from multiple operating conditions can require manual interpretation.
- CSV export, printable technical cards, direct integrations, and optional vision-model extraction are **not implemented** in the current browser app.

## Roadmap

Priorities for future development include:

1. **Image-level validation:** build a repeatable benchmark using actual photographs and verified ground truth.
2. **Better field recognition:** improve difficult layouts and equipment-aware extraction without sacrificing conservative behavior.
3. **More export options:** CSV and printable technical records.
4. **Integration support:** make verified data easier to pass into maintenance and asset-management systems.
5. **Optional advanced recognition:** evaluate vision-model assistance only as an explicit, opt-in feature.

These are planned directions, not available features or delivery commitments.

## Contributing

Contributions, reproducible bug reports, and new nameplate formats are welcome.

- [Open an issue](https://github.com/aesgalexis/PlateLens/issues) to report an incorrect field, missed value, broken interaction, or improvement idea.
- For extraction bugs, include the expected field, the actual output, and relevant OCR text. Share photos only when you have permission, and remove sensitive information if necessary.
- For code changes, add or update regression cases where appropriate and check that existing cases continue to pass.
- Submit a [pull request](https://github.com/aesgalexis/PlateLens/pulls) with a concise explanation of the change and how you validated it.

## License

PlateLens is open source under the [MIT License](LICENSE).

---

**[Try PlateLens](https://aesgalexis.github.io/PlateLens/)** · [GitHub](https://github.com/aesgalexis/PlateLens) · [Issues and feedback](https://github.com/aesgalexis/PlateLens/issues)
