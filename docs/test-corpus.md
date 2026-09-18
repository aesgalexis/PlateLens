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


## Second public corpus

11. Yaskawa P1000 drive — MODEL/REV layout, INPUT/OUTPUT electrical rows, mass, order number, serial number and IP rating.
    Source: https://www.yaskawa.com/delegate/getAttachment?cmd=documents&documentId=SIEPYAIP1B01&documentName=SIEPYAIP1B01.pdf
12. Schneider Electric Lexium 62 — unlabeled commercial reference, technical input/output rows, logistic serial number and dotted manufacture date.
    Source: https://product-help.schneider-electric.com/Machine%20Expert/V2.0/en/lxm62hw/LXM62HW/D-SE-0049326.html
13. Danfoss VRN rotary compressor — model/serial, refrigerant, speed range, service pressure and dotted production date.
    Source: https://assets.danfoss.com/documents/latest/550078/AN464543903088en-000301.pdf
14. Danfoss MLM compressor — voltage/phase/frequency, starting and running currents, refrigerant and pressure data.
    Source: https://assets.danfoss.com/documents/latest/396901/AB243586442698en-000702.pdf
15. KSB Movitec — product line without a Model label, ID, Q/H duty point, speed and production week/year.
    Source: https://www.scribd.com/document/542577926/9750-Ksb-Rot-Man-0001-b-installation-and-Operating-Manual
16. KSB Omega — product line without a Model label, P-No. with slash item suffix, Q/H on one line, speed and weight.
    Source: https://www.scribd.com/document/542577926/9750-Ksb-Rot-Man-0001-b-installation-and-Operating-Manual
17. Sulzer VMS H — product line, ID, motor rating in parentheses, Q/H, fixed speed and production code.
    Source: https://www.sulzer.com/finland/-/media/files/products/pumps/vertical-pumps/product-information/manuals/vms_vertical_multi_stage_pumps_iom.pdf
18. Nidec Leroy-Somer Dynect — motor family/frame/type sequence, production year, serial number, IP/IK and weight.
    Source: https://www.leroy-somer.com/documentation_pdf/5728_en.pdf
19. Copeland compressor — long compressor model/serial strings and dual 50/60 Hz voltage ratings.
    Source: https://media.copeland.com/ff6556eb-dbad-4757-8ef4-b16d00377e59/AE105-Installation%20and%20Service.pdf
20. EBARA EVM — TYPE and P/No labels plus pump Q/H, P2, frequency and rotational speed.
    Source: https://www.ebara.es/wp-content/uploads/2016/01/EVMS/Databook60Hz_EVMS.pdf


## Third public corpus

21. Trane ERTHA 450 water chiller — multilingual model/serial/year labels, R134a charge, LP/HP pressure rows, compressor electrical ratings and control circuit.
    Source: https://www.hosbv.com/en/product/19883/waterchillers/Trane-ERTHA-450.html
22. Alfa Laval M3-FG plate heat exchanger — S/N, year, MAWP/MDMT, model, area, A-dimension, order and tag numbers.
    Source: https://www.ebay.com/itm/305575565008
23. Schneider Electric 2000 kVA distribution transformer — type, year, phases, frequency, kVA, multiple voltages/currents, vector group, cooling method, total weight and MIDEL fluid.
    Source: https://b2bmap.com/products/schneider-2000kva-copper-dyn11-midel-transformer
24. Cleaver-Brooks CB200-400 packaged boiler — model, serial, pressure in PSI, date and BTU/hr input.
    Source: https://www.c3surplus.com/listings/5133477-used-400-hp-cleaver-brooks-150-psi-steam-boiler-model-1973-model-cb200-400
25. Parker PV Plus hydraulic pump — Typ, standalone serial line, nmax in U/min and pmax in bar.
    Source: https://www.ebay.com/itm/383178426366
26. Riello 40 G10 LC burner — multilingual Tipo/Type, COD. product code, serial, fuel-flow range, 230 V / 50 Hz motor power and burner output range.
    Source: https://www.ebay.com/itm/266181986796
27. Busch R5 vacuum pump — type, serial, vacuum in hPa/mbar, oil grade/capacity and manufacturing year.
    Source: https://shopee.tw/%E8%B6%85%E6%96%B0%E7%BE%8E%E5%9C%8B%E8%A3%BDBUSCH-R5-0040-2HP%E5%96%AE%E7%B4%9A%E6%97%8B%E7%89%87%E5%BC%8F%E7%9C%9F%E7%A9%BA%E5%B9%AB%E6%B5%A6-%E7%9C%9F%E7%A9%BA%E6%A9%9F-%E7%9C%9F%E7%A9%BA%E5%8C%85%E8%A3%9D-%E5%8A%A0%E5%B7%A5%E7%89%A9%E5%90%B8%E9%99%84%E5%8F%AF%E7%94%A8%28%E5%A4%96%E5%8C%AF%E6%96%B0%E5%93%81%E6%80%A7%E8%83%BD%E5%84%AA%29-i.8604508.25916012122
28. Ingersoll Rand D144IN refrigerated air dryer — CFM, kW, supply notation, current, R134a and several PSIG pressure fields.
    Source: https://www.exfactory.com/Detail/AC-011542/ingersoll-rand-d144in
29. Falk RK1070F3A enclosed gear drive — ratio, input/output RPM, service HP, oil capacity in U.S. gallons and month/year date.
    Source: https://www.slevysurplus.com/surplus-equipment/gearboxes-speed-reducers/gearboxes-speed-reducers-power-transmission/107859-falk-enclosed-gear-drive-1511-ratio-rk1070f3a
30. Sullair 1509EV AC compressor — work order/BOM, model, serial, PSI/bar, CFM/m³/min, RPM, VOLTS, Hz, PH and BHP/kW on a dense mixed-units plate.
    Source: https://www.bidspotter.com/en-us/auction-catalogues/new-mill-capital/catalogue-id-bscnew10491/lot-fdbc3ecf-18bc-4b93-848f-b3d20111960c
