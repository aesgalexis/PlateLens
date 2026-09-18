# Mega regression corpus

PlateLens now includes a 100-case stress suite in `tests/mega-corpus.test.mjs`.

This is intentionally different from the hand-curated regression file. The 100 cases are generated as five value/layout variations across 20 real industrial nameplate families. The goal is to make parser changes survive normal variation in model numbers, serials, ratings and common label layouts instead of only matching one photographed plate.

## Families covered

1. WEG IEC motors
2. ABB IEC motors
3. Siemens servo motors
4. Baldor-Reliance NEMA motors
5. Leeson NEMA motors
6. SEW-EURODRIVE motors
7. ABB ACS drives
8. Schneider Altivar drives
9. Mitsubishi FR drives
10. Siemens SINAMICS G120 drives
11. Allen-Bradley PowerFlex drives
12. Danfoss VLT drives
13. Yaskawa drives
14. Grundfos pumps
15. KSB pumps
16. Sulzer pumps
17. Atlas Copco compressors
18. Kaeser compressors
19. Electrolux Professional washers
20. Trane chillers

Each family contributes five regression cases, for 100 stress fixtures total.

## Public format references

The stress templates are based on public manufacturer documentation and plate examples already represented in the hand-curated corpus, including:

- WEG W20 motor nameplates:
  https://static.weg.net/medias/downloadcenter/h1a/h1a/WEG-w20-three-phase-induction-motors-low-voltage-european-market-50100111-brochure-english-web.pdf
- ABB IEC/process-performance motor documentation:
  https://library.e.abb.com/
- Siemens 1FK7 rating-plate documentation:
  https://cache.industry.siemens.com/dl/files/753/48983753/att_109806/v1/1FK7_en-US.pdf
- Schneider Altivar 320 nameplate:
  https://download.schneider-electric.com/files?filename=User+guide&p_Doc_Ref=NVE41289
- Schneider Altivar 630 nameplate:
  https://download.schneider-electric.com/files?filename=User+guide&p_Doc_Ref=EAV64301
- ABB ACS580 documentation:
  https://library.e.abb.com/
- Siemens SINAMICS G120X rating plate:
  https://cache.industry.siemens.com/dl/files/512/109801512/att_1078791/v1/G120X_op_instr_0621_en-US.pdf
- Danfoss VLT AutomationDrive documentation:
  https://assets.danfoss.com/documents/latest/275726/AQ267037727118en-000101.pdf
- Grundfos CR/CRI/CRN identification documentation:
  https://api.grundfos.com/literature/Grundfosliterature-3403.pdf
- Electrolux Professional H-range washer installation documentation:
  https://tools.electroluxprofessional.com/Mirror/Doc/ELS/IN/IN_438905520EN_H-Range_EN.pdf
- Atlas Copco ZR/ZT product/manual resources:
  https://www.atlascopco.com/es-es/compressors/manuals/zr-zt-series

The exact hand-curated public examples and additional source links remain documented in `docs/test-corpus.md`.

## What this suite is — and is not

These are 100 regression cases derived from real public plate families. They are not presented as 100 independently downloaded photographs. The purpose is repeatable parser stress testing: alter values and common layouts while keeping the semantics of each manufacturer's plate format.

Photographic robustness is covered separately through real noisy OCR fixtures and the orientation corpus.

## Detected but unreadable fields

`tests/presence.test.mjs` checks a second concept independently from parsing a value: whether PlateLens can see that a field exists on a plate even when the value is unreadable.

For example:

```
MODEL: ???
SERIAL NO: unreadable
Voltage:
Hz 50
Current:
IP 55
```

The UI should show Model, Serial number, Voltage and Current as empty-but-detected fields rather than hiding them or inventing values.
