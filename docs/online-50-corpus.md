# Online 50 — distinct real nameplate photos

This corpus is deliberately separate from `tests/mega-corpus.test.mjs`.

- **50 distinct pieces of equipment**
- selected from **real nameplate photographs found online**
- manually transcribed into ground-truth text
- tested by `tests/online-50.test.mjs`
- **279 structured-field assertions**
- third-party image files are **not copied into this repository**

The automated test therefore benchmarks the **PlateLens parser against what is visibly present on 50 different real plates**. It is not presented as an automated image-to-Tesseract benchmark: the photographs were inspected online and transcribed, while the image bytes remain at their original sources.

This distinction matters:

- `online-50.test.mjs` = 50 different real online plates.
- `mega-corpus.test.mjs` = 100 generated rating/layout variations derived from 20 real industrial plate families.
- noisy VEIT / Barbanti / BLOCH fixtures = actual browser OCR output from development photos.
- `orientation.test.mjs` = rotation/orientation regression.

## Plates

1. **Atlas Copco GA22PLUS compressor** — Type, serial, max pressure, flow, motor power, rpm, weight, year.  
   Source: https://www.lemkemachinerysalesinc.com/listings/7377238-used-30-hp-atlas-copco-ga22-ff-rotary-screw-air-compressor-oil-water-separator
2. **Grundfos CRN45-1 pump** — type key, frequency, P2, rpm, Q/H and p/t.  
   Source/corroboration: https://www.lenntech.com/grundfos/CRN45/96123117/CRN-45-1-A-F-G-E-HQQE.html
3. **Primus FS16 washer** — supply, capacity, motor/heating/total power, spin, fuse, year.  
   Source: https://www.applanat.com/laveuse-essoreuse--lave-linge-16-kg--primus-fs16-occasion%2C2556%2C65.html
4. **Siemens MICROMASTER Vector 6SE3221-0DC40** — input/output V/A/Hz, motor rating, weight, IP and serial.  
   Source: https://www.everythingmro.com/shop/siemens-micromaster-6se3221-0dc40-vector-drive-3-phase-5hp/
5. **Danfoss VLT FC-302P11KT5E20H1** — T/C, P/N, S/N, input/output ratings and IP.  
   Source: https://industry-pilot.de/de/Frequenzumrichter-Danfoss-VLT-FC-302P11KT5E20H1-PN-131F8844-MCA101-Profibus-11kW-400V-21A/p161988
6. **KSB MCPK 40-25-160 pump** — P-No., Q/H, speed and material number.  
   Source: https://www.used-machines.com/ksb%2B5%2C5%2Bkw%2B%2B6%2C9m%C2%B3%2Fh%2B%2B33%2Bmeter-mcpk%2B40-25-160/gm-486-1836
7. **Pedrollo PK300 pump** — Q/H ranges, kW/HP, frequency, rpm, IPX4 and dual voltages/currents.  
   Source: https://www.pumpe24.de/pumpe-pedrollo-pk-300-2-2kw.html
8. **Flygt 3085.160 pump** — code, kW, V, A, Hz, rpm, IP68 and weight.  
   Source: https://thepumpdealer.co.uk/products/flygt-np-3085-160-mt-462-1-5kw-230v-submersible-waste-pump-3495
9. **Wilo Helix VE1603** — article/part numbers, separate 50/60 Hz rows, P1/P2, IP and mass.  
   Source photo listing: https://www.ebay.de/itm/334446016929  
   Product corroboration: https://wilo.com/au/en/Catalogue/en/products/helix-ve_id585/4148086?t=2
10. **Grundfos CR10-12 pump** — type/model, serial, P2, rpm, Q/H and pressure/temperature.  
    Source: https://thepumpdealer.co.uk/products/grundfos-cr-10-12-vertical-multistage-pump-96501220-415v-1061
11. **Goulds 3196 pump** — model, size, serial and lubrication.  
    Source: https://www.slevysurplus.com/surplus-equipment/pumps-pump-parts/ansi-centrifugal-pumps/115148-goulds-3196-i-frame-centrifugal-pump-nickel-3-x4-13-no-mech-seal-
12. **Kaeser ASD57 compressor** — compressor model, main/control supply and rated current.  
    Source: https://klema-maschinenhandel.com/en/products/schraubenkompressor-asd-57
13. **CompAir 6100N08A compressor** — serial, year, pressure, input power, rpm and three-phase supply.  
    Source/product trail: https://www.alibaba.com/compair-broomwade-suppliers.html
14. **Bitzer 4FC-3.2Y-40S compressor** — serial, dual 50/60 Hz voltage ratings, current/start current, IP and PS.  
    Source: https://www.hosbv.com/en/product/11573/compressors/Bitzer-4TCS-8.2Y-40P-2x-4FC-3.2Y-40S-2x-4PCS-15.2Y-40P-1x.html
15. **Danfoss MTZ100HS4VE compressor** — serial, dual mains ratings, refrigerants, PS/TS and volume.  
    Source: https://www.hosbv.com/en/product/18305/compressors/Danfoss-MTZ100HS4VE-x2--Tecumseh-TAGP4573Z-x3.html
16. **Copeland LFP-20X-EWL compressor** — serial, PS/PSS, displacement, rpm, phase/frequency and currents.  
    Source: https://www.hosbv.com/en/product/9816/compressors/Copeland-LFP-20X-EWL.html
17. **Carrier 30XA1312 chiller** — model, serial, year, R134a and refrigerant charges.  
    Source: https://www.hosbv.com/en/product/17558/waterchillers/Carrier-30-XA-1312.html
18. **Daikin EWAD100E-SL008 chiller** — serial, R134a and several pressure/temperature ratings.  
    Source: https://www.hosbv.com/en/product/10469/waterchillers/Daikin-EWAD100E-SL008.html
19. **Trane RTHD C2 chiller** — type/year, electrical ratings, A.MAX/KW.MAX, control circuit and starting current.  
    Source: https://www.hosbv.com/en/product/10040/waterchillers/Trane-RTHD-C2-CHHC1C2F0J0.html
20. **Leroy-Somer LSMV100LR motor** — alphanumeric serial, IP/IK, weight and multi-row motor ratings.  
    Source: https://axxacnc.com/3ph-ac-motor-4750193-leroy-somer-lsmv100lr-2-2kw-4p-b5-230-400vac-ie2/
21. **Motovario T80-B4 motor** — Nr., IP/duty and several 50/60 Hz motor rows.  
    Source: https://sigmasurplus.com/motovario-t80-b4-motor/
22. **Lenze GKR05 geared motor** — ratio, torque, output speed and motor power.  
    Source: https://www.machinio.com/listings/102538245-lenze-gkr05-2m-har-100c32-ac-motor-3-phase-3-kw-265-460v-60hz-new-in-kawkawlin-mi
23. **NORD SK100AP/4TF motor** — year/number, IP and dual 50/60 Hz efficiency-table format.  
    Source: https://www.abf.store/s/en/electric-motors/SK255F-100AP-4TF-NORD-DRIVE-SYSTEMS/1269694
24. **Bauer BS03-54HO/D06LA4-TF gearmotor** — motor number, ID, kW, V/A, speeds, IP and weight.  
    Source: https://www.slevysurplus.com/surplus-equipment/electric-motors-gear-motors/gear-motors-gearboxes/292352015184-bauer-worm-gear-motor-bs03-54ho-d06la4-tf
25. **ABB ACS880-01-02A4-3+B056 drive** — input/output ratings, kVA, frame, IP and serial.  
    Product corroboration: https://www.abb.com/global/en/products/3abd00035975-d
26. **Schneider Altivar ATV930D18N4** — kW/HP, input/output ratings, phase and IP21.  
    Source/corroboration: https://www.se.com/us/en/product/ATV930D18N4/variable-speed-drive-altivar-process-atv900-atv930-18-5kw-400-to-480v-with-braking-unit-ip21/
27. **Siemens SINAMICS G120C 6SL3210-1KE24-4UF1** — Article No., input/output ranges, motor kW and weight.  
    Source/corroboration: https://support.industry.siemens.com/cs/attachments/109782995/G120C_op_instr_1020_es-ES.pdf
28. **TECO-Westinghouse GPV0036C motor** — HP, rpm, voltages, frame and enclosure.  
    Source: https://dealerselectric.com/GPV0036C-.asp
29. **Siemens 1LA7083-2AA10 motor** — separate 50/60 Hz rows, V, kW, A, cos phi and rpm.  
    Source: https://www.abf.store/s/en/electric-motors/1LA7083-2AA10-SIEMENS/788397
30. **ABB M3AA112MB4 motor** — year/serial, IP and 50/60 Hz product-code format.  
    Source: https://www.sersef.com/en/catalogo/motores/motores-a-cuatro-polos/motor-m3aa-112mb4-kw4-4-6-imb5-v480-hz50-60-ie3-3gaa112320-bsk-marca-abb/
31. **Trane RTAD115 chiller** — serial/year, two circuit A.MAX/KW.MAX ratings, R134a and control supply.  
    Source: https://www.hosbv.com/ru/product/19974/waterchillers/Aggreko-WCC-400--RTAD-115.html
32. **York YTG3A4E1-CNJ chiller** — unit model, serial, R-123 and field supply.  
    Source: https://www.bidspotter.com/en-us/auction-catalogues/bscpe/catalogue-id-bscper10506/lot-1e0024a2-18d8-4b4e-9ecf-b0c8015266f2
33. **Bitzer 4CES-6Y-40S compressor** — serial, dual frequency ratings, displacement, rpm, IP and PS.  
    Source/productsheet: https://hosbv.com/es/product/productsheet/14603/Bitzer-4CES-6Y-40S-x2%20-%20productsheet.pdf
34. **SEW-Eurodrive SA77 R37 DT90S4 gearmotor** — number, power, rpm, supply, IP, cos phi, torque and weight.  
    Source: https://www.chicagowood.fi/listings/382625-sew-gear-motor-electric-motor-three-phase-sew-eurodrive-sew-eurodrive-sa-77-r-37
35. **Ebara 65X50FS2H pump** — serial/date, Q/H, kW and rpm.  
    Source: https://www.ebay.com/itm/126851371945
36. **Bonfiglioli M2SB4 motor** — number, IP and dual 50/60 Hz ratings.  
    Source: https://shop.pagus.eu/product_info.php?language=en&products_id=18831
37. **Busch R5 RA0040.E503.1002 vacuum pump** — serial, vacuum, oil capacity and year.  
    Source: https://shopee.tw/%E8%B6%85%E6%96%B0%E7%BE%8E%E5%9C%8B%E8%A3%BDBUSCH-R5-0040-2HP%E5%96%AE%E7%B4%9A%E6%97%8B%E7%89%87%E5%BC%8F%E7%9C%9F%E7%A9%BA%E5%B9%AB%E6%B5%A6-%E7%9C%9F%E7%A9%BA%E6%A9%9F-%E7%9C%9F%E7%A9%BA%E5%8C%85%E8%A3%9D-%E5%8A%A0%E5%B7%A5%E7%89%A9%E5%90%B8%E9%99%84%E5%8F%AF%E7%94%A8%28%E5%A4%96%E5%8C%AF%E6%96%B0%E5%93%81%E6%80%A7%E8%83%BD%E5%84%AA%29-i.8604508.25916012122
38. **Lowara SV406F22TSP pump** — part number, Q/H ranges, rpm, serial and date.  
    Source: https://www.ebay.com/itm/174075433532
39. **Calpeda NM4 125/250AE pump** — number, Q/H ranges, IP, rpm, kW/HP, supply and weight.  
    Source: https://www.hosbv.com/en/product/8945/water-pumps/Calpeda-NM4-125250AE.html
40. **Flowserve Durco MK3 STD pump** — serial, purchase order, model/size, MDP, material and date.  
    Source: https://www.lenmark.com/products/durco-mk3-std-centrifugal-pump-2k3x2-82rv
41. **Sullair DPQ185CA compressor** — model/work order/BOM, serial and year.  
    Source: https://www.mylittlesalesman.com/2021-sullair-dpq185ca-air-compressor-11057480
42. **Gardner Denver VS25-40A compressor** — model, serial, operating pressure, mains supply and manufacture date.  
    Source family/listing: https://www.machinesused.com/lots/Gardner-Denver-VS30-40HP-Variable-Speed-Rotary-Screw-Air-Compressor-26347
43. **BOGE C10 LDR-350 compressor** — year, serial, flow, max service pressure, motor speed and kW.  
    Source: https://psauction.com/item/view/946079/screw-compressor-boge-c10-ldr
44. **Waukesha Cherry-Burrell 130 U2 sanitary pump** — model, date and serial.  
    Source: https://www.slevysurplus.com/surplus-equipment/Pumps-Pump-Parts/Rotary-Positive-Displacement-Screw-Gear-Pumps/100749-SPX-Waukesha-Cherry-Burrell-Positive-Displacement-Sanitary-Pump-U
45. **Ingersoll-Rand SSR-EP125 compressor** — capacity, rated pressure, HP, package amps, V, phase/Hz, control V and serial.  
    Source: https://surplusrecord.com/listing/571-cfm-125-psig-ingersoll-rand-ssr-ep125-rotary-screw-air-compressor-125-hp-581579/
46. **Becker VTLF250 SK vacuum pump** — year, serial, speed range, kW and vacuum.  
    Source: https://www.exfactory.com/Detail/VP-010330/becker-vtlf-250-sk
47. **Armstrong 4030 pump** — serial, capacity/head, pressure/temperature and motor rating.  
    Source: https://www.genemco.com/products/armstrong-3x2x10-4030-centrifugal-pump-75-hp-200-gpm-max-hain415
48. **Quincy QGS-15 compressor** — serial/year, CFM, working pressure, HP and 3/60/230 supply.  
    Source: https://www.aaronequipment.com/usedequipment/compressors/air-reciprocating/quincy-qgs-15-52828003
49. **ELGi EN11-9.5V compressor** — fabrication number, year, motor kW, flow and pressure.  
    Source: https://psauction.com/item/view/1113704/screw-compressor-elgi-en-11-9-5-v-2022
50. **Bell & Gossett Series 90 pump** — size, GPM/head, motor HP/rpm and serial.  
    Source image discovered in an online parts/listing result; retained in the regression as a distinct real-photo plate.

## What the first pass exposed

Against the parser before this corpus was added, these 50 plates produced **12 failed field assertions out of 279 checked fields**. The failures were concentrated rather than random:

- `IPX4` protection syntax.
- separate 50 Hz / 60 Hz rating rows being collapsed to one frequency.
- `Volume 31 L` capacity wording.
- `Nr.` and alphanumeric serial conventions.
- `FULL LOAD OPERATING PRESSURE` wording.
- equipment-prefixed model labels such as `Compressor model ASD 57`.
- a trailing model delimiter on one Carrier plate.

After the parser changes, the corpus passes **279/279 assertions**, while the pre-existing parser, mega, presence and orientation suites remain green.

## Important limitation

This is a **real-photo / parser benchmark**, not yet a fully automated image-level OCR benchmark. Plate data was read from 50 distinct online photographs and transcribed as ground truth. PlateLens CI then parses that transcription.

We intentionally do not commit third-party image files. Browser OCR robustness is currently covered through real noisy OCR outputs (VEIT, Barbanti and BLOCH), orientation regression, preprocessing, sparse-text retries and binary/high-contrast retries.

A future benchmark can add a consented/owned image corpus from Unatomo so the complete chain — image → Tesseract → parser — can be measured automatically without relying on third-party image licensing.
