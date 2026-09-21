# OCR regression corpus

This corpus sits between the visual OCR engine and the structured parser.

Each case stores the real raw OCR text produced by PlateLens from an actual
nameplate image, plus the fields that can be recovered safely from that OCR.
The goal is to measure what PlateLens can extract from noisy OCR without
inventing values that were never recognized.

## Case format

Each entry in `tests/ocr-corpus.json` contains:

- `raw`: path to the captured raw OCR text.
- `expected`: exact structured fields the parser must recover.
- `mustRemainEmpty`: fields visible on the original plate but not reliably
  present in that OCR. These fields must stay empty rather than being guessed.

Run with:

```bash
node tests/ocr-corpus.test.mjs
```

## Current baseline

The first fixture is the PHARMAGG FU1400 / Kannegiesser plate used during
development. Its raw OCR is intentionally difficult: multiple OCR passes are
merged, labels are split across lines, characters are corrupted, and some
values disappear entirely.

The benchmark is deliberately conservative. A higher score is only useful if
false positives remain low.

## Next step

Add real image cases from motors, pumps, VFDs, compressors and industrial
machines. For each image:

1. Read the plate visually and record the ground truth.
2. Run the current PlateLens OCR pipeline once.
3. Save the raw OCR output unchanged.
4. Add only values actually supported by the raw text to `expected`.
5. Put visually known but OCR-missing values in `mustRemainEmpty`.
6. Improve preprocessing or OCR, rerun the same image, and compare scores.

This separates image-recognition failures from parser failures and prevents
optimizing one plate at the expense of the rest of the corpus.
