# Nameplate test corpus

PlateLens keeps a small regression corpus based on real industrial nameplate formats found in public equipment listings. The repository stores only text fixtures and expected structured fields; it does not copy the source images.

Current coverage:

1. Grundfos TP pump — pump type/model, flow, head, pressure, speed.
   Source: https://www.machineseeker.rs/grundfos-tp80-400%2F2%2C%2B15%2C0%2Bkw%2C/i-10318811
2. Atlas Copco ZR 160 FF — compressor type, serial, pressure, power, speed, year.
   Source: https://www.dupcompressors.com/product/009423/
3. Danfoss VLT FC-302 — drive type code, part number, serial, input voltage/frequency/current, IP.
   Source: https://industry-pilot.de/de/Frequenzumrichter-Danfoss-VLT-FC-302P11KT5E20H1-PN-131F8844-MCA101-Profibus-11kW-400V-21A/p161988
4. SEW-EURODRIVE motor — type, IP, frequency, current and voltage.
   Source: https://www.hdautomatisme.com/2085-moteur-sew-drn100l4fltfv.html
5. Electrolux W3105H — industrial washer model, date code, capacity, voltage, power and IP.
   Source: https://www.applanat.com/lave-linge-professionnel-10kg--w105h-electrolux-occasion%2C4320%2C65.html
6. Bonfiglioli VF49 — gearbox type, code, batch and ratio.
   Source: https://sigmasurplus.com/bonfiglioli-vf49-p1-n56c-gearbox/
7. KAESER Aircenter SM 15 — compressor model, serial, year, multiple voltages, FLA, pressure and RPM.
   Source: https://www.ibidmachinery.com/products/2015-kaeser-aircenter-sm-15-compressor-california
8. ABB M2QA motor — multi-row motor rating table with voltage, Hz, kW, rpm, A and cos phi.
   Source: https://psauction.com/item/view/519571/hydraulaggregat-ca-verken-ab
9. Siemens 1LA7113 — dual 50/60 Hz motor ratings.
   Source: https://www.abf.store/s/en/electric-motors/1LA7113-4AA61-SIEMENS/793181
10. WEG AL90S/L-04 — multi-row motor rating table with several voltage/frequency combinations.
    Source: https://www.pisaniecommerce.com/en/motori/5271-weg-al90sl-04.html

The fixtures intentionally model OCR-like text rather than pristine database values. New real failures should become regression cases before changing the parser.


## Additional OCR regressions

The automated parser suite also includes two noisy OCR snapshots from real VEIT and Barbanti plates. These are deliberately kept as imperfect OCR text so fixes are tested against the kind of output the browser actually produces, not only clean transcriptions.
