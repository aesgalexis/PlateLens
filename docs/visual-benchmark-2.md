# Visual benchmark 2 - 20 additional real nameplates

This second visual corpus was built from 20 additional real industrial
nameplates found online. The images were visually transcribed into compact
fixtures and then used to exercise the generic parser.

The purpose is not to copy a particular manufacturer's plate. It is to expose
new layout and notation families that PlateLens must handle without regressing
earlier cases.

## Coverage

### Motors
1. Siemens 1LE1001-0EA42-2KB4 - ABF Store
   https://www.abf.store/s/en/electric-motors/1LE1001-0EA42-2KB4-SIEMENS/1322663
2. WEG W22 Premium 1.5 kW - Ackrutat
   https://www.ackrutat-shop.de/foerdertechnik/motoren-und-getriebe/elektromotoren/16362/weg-w22-premium-drehstrommotor-12868147-antriebstechnik-1-5kw-3-elektromotor
3. ABB M3AA 100 LB-2 - eBay
   https://www.ebay.com/itm/314334397058

### Variable-frequency drives
4. Schneider Altivar 320 ATV320U04N4B - inStock901
   https://instock901.com/schneider-altivar-320-atv3200u15n4b-machine
5. Danfoss VLT AutomationDrive FC 302 - Used Machines
   https://www.used-machines.com/danfoss-vlt+automationdrive+fc+302/gm-682-4563
6. ABB ACS355-03E-12A5-4 - Yolcu Endustriyel
   https://yolcuendustriyel.com/ABB-hiz-kontrol-on-siparis-ACS355-03E-12A5-4

### HVAC and refrigeration
7. Trane CGAX 017 HE LN - HOS BV
   https://www.hosbv.com/en/product/11331/waterchillers/Trane-CGAX-017-HE-LN.html
8. Bitzer 4EES-6Y-40S - HOS BV
   https://www.hosbv.com/en/product/12223/compressors/Bitzer-4EES-6Y-40S-Condensing-unit.html
9. Carrier 30GXR138-A-661KA - Genemco
   https://www.genemco.com/products/carrier-30gxr-air-cooled-chiller-138-tr-fsec02
10. Copeland LFP-20X-EWL - HOS BV
    https://www.hosbv.com/en/product/9816/compressors/Copeland-LFP-20X-EWL.html

### Gearmotors and gearboxes
11. NORD SK 1282AZG-90SP/4 CUS TW - eBay
    https://www.ebay.com/itm/394358468496
12. SEW-EURODRIVE WA20 DRN71M4 - Spares4Less
    https://www.spares4less.com/WA20DRN71M4-NOV
13. Bonfiglioli VF49 P1 N56C - Sigma Surplus
    https://sigmasurplus.com/bonfiglioli-vf49-p1-n56c-gearbox/
14. Flender H4RV 15 - Tengkai
    https://www.tengkai1.com/info/the-necessary-info-for-pricing-of-the-flender-27817535.html

### Pumps, vacuum and compressors
15. Danfoss MT100HS9AVE compressor - Cibrel
    https://www.cibrel.com.br/produto/compressor-hermetico-danfoss-tri-r22-380v-mt100-9vi.html
16. Lowara CEAM70/3-V - eBay UK
    https://www.ebay.co.uk/itm/127398506610
17. Calpeda NM 50/16B/B - Industrie24
    https://industrie24.com/en/products/calpeda-nm-50-16b-b-wasserpumpe-5-5kw-fur-industriellen-einsatz-wasserpumpe
18. Becker SV 5.90/1 - Riley Surface World
    https://www.rileysurfaceworld.co.uk/machines/31797.htm
19. Armstrong 5x4x10 commercial pump - eBay
    https://www.ebay.com/itm/266980528624
20. Quincy QGS5HPD - BidSpotter
    https://www.bidspotter.com/en-us/auction-catalogues/new-mill-capital/catalogue-id-bscnew10355/lot-a8dd7203-e1c1-4bf9-877b-b0c10149f45b

## New parser patterns exposed by this corpus

The first run scored 86 / 112 checks (76.8%). Repeated failures identified
generic gaps rather than one-brand exceptions:

- phase notation written as 1~ or 3~;
- motor tables where Hz, kW, rpm and A appear in different column orders;
- multiple rating rows sharing one header;
- ranges written as 48...63 Hz;
- V / Hz / Ph compact triplets;
- Power Supply Volts AC ... PH ... Hz ... lines;
- U(V) input voltage notation;
- model codes appearing as standalone uppercase lines;
- Model no: and Serial no: labels;
- decimal gearbox ratios such as 10.34:1;
- mass written as kg 9.884;
- refrigerant labels written as Refrigerant/System;
- additional manufacturer recognition such as Flender.

After implementing those generic rules, the same untouched corpus scores
112 / 112 checks.

The original visual benchmark remains 151 / 151, and the two real PHARMAGG
raw-OCR cases remain 46 / 46. This is the required regression condition:
new formats must improve without breaking prior plates.
