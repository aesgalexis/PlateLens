# Orientation / pose corpus

PlateLens now treats orientation as part of OCR preprocessing rather than assuming
the plate is already upright.

The browser checks 0°, 90°, 180° and 270° using a lightweight OCR pass, scores
the resulting text for nameplate-like structure, and then performs the full OCR
on the best orientation. If all four cardinal orientations score weakly, it also
probes small deskew offsets around the best result (-12°, -6°, +6°, +12°).

The repository does not copy third-party plate images. The following public
examples were used as visual references for sideways, upside-down, angled,
cropped and ordinary field photos:

1. Delta VFD nameplate photographed sideways.
   https://electronics.stackexchange.com/questions/302889/connecting-a-1-5-kw-vfd-to-a-2-2-kw-motor
2. Robbins & Myers / SEW plate photographed upside down.
   https://www.jmindustrial.com/product/14441-used-robbins-myers-moyno-1-hp-ssb-progressive-cavity-stainless-steel-pump/
3. Grundfos CRN pump plate photographed at an angle.
   https://www.bidspotter.com/en-us/auction-catalogues/new-mill-capital/catalogue-id-bscnew10480/lot-d6a9e09a-8186-43ff-908a-b37b00bdce98
4. Hitachi screw compressor identification plate in a field photo.
   https://www.kkmt.co.jp/tools/6745
5. NORD gearmotor nameplate mounted on a motor housing.
   https://www.100outlets.com/nord-sk01f-71l-4-bre5-motor.html
6. Trane Helirotor compressor nameplate.
   https://www.hosbv.com/en/product/16638/waterchillers/Trane-RTHD-E3.html
7. SEW-EURODRIVE gearmotor nameplate in an installed-equipment photo.
   https://www.chicagowood.fi/listings/382625-sew-gear-motor-electric-motor-three-phase-sew-eurodrive-sew-eurodrive-sa-77-r-37
8. Siemens 1LE1002 motor nameplate.
   https://www.abf.store/s/en/electric-motors/1LE1002-1CB03-4FA0-SIEMENS/905621
9. ABB M3AA motor nameplate.
   https://www.abf.store/s/en/electric-motors/3GAA132330-ADK122-ABB/1370558
10. Atlas Copco ZT90VSD compressor nameplate photographed in place.
    https://mbglick.com/shop/air-compressors-access/atlas-copco-zt90vsd-rotary-screw-oil-free-air-compressor-126hp-151psig/

## Real sideways regression

A real BLOCH CPA 40M pump photo supplied during development is intentionally not
stored in the repository. Its OCR outputs at 0°, 90°, 180° and 270° are reduced
to text fixtures in `tests/orientation.test.mjs`.

In that sample, the sideways orientations produce mostly garbage, while the
correct orientation exposes values such as 230 Volt, 50 Hz, 2850 rpm, 0.30 kW,
2 amper and IP54. The regression verifies that PlateLens gives the correct
orientation a substantially higher score.
