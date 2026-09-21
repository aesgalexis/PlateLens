import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const start = app.indexOf('function clean');
const end = app.indexOf('function fillForm');
assert.ok(start >= 0 && end > start, 'Parser section not found in app.js');

const parseNameplate = new Function(
  app.slice(start, end) + '\nreturn parseNameplate;'
)();

const fixtures = [
  {
    name: 'Siemens 1LE1001-0EA42-2KB4 motor',
    source: 'ABF Store visible nameplate',
    text: 'SIEMENS\n3~ MOT 1LE10010EA422KB4\nTh.Cl.155(F)\nIEC/EN 60034\nIMB14 IP55 WT 15kg\nV Hz kW A PF RPM\n230 50 2.2 7.8 0.85 2890\n400 50 2.2 4.50 0.85 2890\n460 60 2.55 4.35 0.86 3485',
    expected: {manufacturer:'Siemens', phases:'3', ipRating:'IP55', weight:'15 kg'}
  },
  {
    name: 'WEG W22 Premium 1.5 kW motor',
    source: 'Ackrutat visible nameplate',
    text: 'WEG W22 Premium\n3~ 90L-04 IP55 INS. CL. F S1\nHz kW RPM A PF\n220 D 380 Y 50 1.5 1445 5.54/3.21 0.83\n230 D 400 Y 50 1.5 1450 5.51/3.17 0.80\n240 D 415 Y 50 1.5 1455 5.45/3.15 0.77\n460 Y 60 1.5 1755 2.79 0.78\nMOD.TE1BF0X',
    expected: {manufacturer:'WEG', phases:'3', frequency:'50/60 Hz', power:'1.5 kW', ipRating:'IP55'}
  },
  {
    name: 'ABB M3AA 100 LB-2 motor',
    source: 'eBay visible nameplate',
    text: 'ABB Motors\n3~Motor M3AA 100 LB-2 CL.F\n3GAA101312-BSE\nNo. 3GE095110P9510051\nV Hz r/min kW A\n380-420 Y 50 2920 3.00 6.0\n220-240 D 50 2920 3.00 10.3\n440-480 Y 60 3510 3.60 6.1\nIM3001',
    expected: {manufacturer:'ABB', model:'M3AA 100 LB-2', serialNumber:'3GE095110P9510051', frequency:'50/60 Hz'}
  },
  {
    name: 'Schneider Altivar 320 ATV320U04N4B',
    source: 'inStock901 visible label',
    text: 'Schneider Electric\nAltivar 320\nATV320U04N4B\n0.37kW - 1/2HP\nU(V) input 380-500 3ph\noutput 0..380-480 3ph\nF(Hz) input 50/60\noutput 0.599\nI(A) input 2.1 max\noutput 1.5\n75 C\nIP20\nHL2227700393',
    expected: {manufacturer:'Schneider Electric', model:'ATV320U04N4B', power:'0.37 kW', voltage:'380-500 V', phases:'3', frequency:'50/60 Hz', current:'2.1 A', ipRating:'IP20'}
  },
  {
    name: 'Danfoss VLT AutomationDrive FC302 2.2 kW',
    source: 'used-machines visible label',
    text: 'VLT AutomationDrive\nwww.danfoss.com\nT/C: FC-302P2K2T5E20H1XXXXXSXXXXA0BXCXXXXD0\nP/N: 131U8105 S/N: 010124G506\n2.2kW(4.0CV) / 3.0HP(4.0CV)\nIN: 3x380-500V 50/60Hz 5.9/4.3A\nOUT: 3x0-Vin 0-590Hz 5.6/4.8A\nCHASSIS/IP20 Tamb. 50C/122F\nDanfoss A/S',
    expected: {manufacturer:'Danfoss', voltage:'380-500 V', frequency:'50/60 Hz', current:'5.9/4.3 A', ipRating:'IP20', partNumber:'131U8105', serialNumber:'010124G506'}
  },
  {
    name: 'ABB ACS355-03E-12A5-4 drive',
    source: 'Yolcu Endustriyel visible label',
    text: 'ABB\nACS355-03E-12A5-4\nIP20 / UL Open type\nPN 5.5 kW / 7 1/2 hp\nU1 3~400 V / 480 V\nI1 19 A / 16 A\nf1 with ext. choke 11 A / 9.5 A\n48...63 Hz\nI2 12.5 A\nf2 0...600 Hz\nS/N J1246E0608',
    expected: {manufacturer:'ABB', model:'ACS355-03E-12A5-4', power:'5.5 kW', frequency:'48-63 Hz', ipRating:'IP20', serialNumber:'J1246E0608'}
  },
  {
    name: 'Trane CGAX 017 HE LN chiller',
    source: 'HOS BV visible nameplate',
    text: 'TRANE\nTYPE CGAX 017 HE LN\nN SERIE ELA3427\n2017\nV / Hz / Ph 400 / 50 / 3\nA max 39 A\nICC-LRA 12 kA\nFLUIDE R410A\nPS BP-LP 31.1 bar\nPS H2O 10 bar\nHP-HP 44.5 bar',
    expected: {manufacturer:'Trane', model:'CGAX 017 HE LN', serialNumber:'ELA3427', year:'2017', voltage:'400 V', frequency:'50 Hz', phases:'3', current:'39 A', refrigerant:'R410A'}
  },
  {
    name: 'Bitzer 4EES-6Y-40S compressor',
    source: 'HOS BV visible nameplate',
    text: 'BITZER\nTyp 4EES-6Y-40S\nS.Nr. 1688704681\n220-240 D / 380-420 Y 50 Hz\n265-290 D / 440-480 Y 60 Hz\nMax.Betr.strom A(D) 23.7 A(Y) 13.6\nAnlaufstrom 108 / 62.2\nFördervol. 22.7 m3/h\nDrehzahl 1450 / 1750 min-1',
    expected: {manufacturer:'Bitzer', model:'4EES-6Y-40S', serialNumber:'1688704681', frequency:'50/60 Hz'}
  },
  {
    name: 'Carrier 30GXR138-A-661KA chiller',
    source: 'Genemco visible nameplate',
    text: 'Carrier\nMODEL 30GXR138-A-661KA\nSERIAL 0204F10865\nFactory Charged Refrigerant/System R-134A\nPower Supply Volts AC 460 PH 3 Hz 60\nMax Volts 506 Min Volts 414\nMCA 285.3\nMOCP 400',
    expected: {manufacturer:'Carrier', model:'30GXR138-A-661KA', serialNumber:'0204F10865', voltage:'460 V', phases:'3', frequency:'60 Hz', refrigerant:'R-134A'}
  },
  {
    name: 'Copeland LFP-20X-EWL compressor',
    source: 'HOS BV visible nameplate',
    text: 'EMERSON Climate Technologies\nCopeland\nLFP-20X-EWL\nS NO 18H010915 M\nPS/PSS 32,5/22,5 BAR\nV 12,90 M3/H\n1450 RPM\n3~ 50 Hz\n50 220-240 D F-BLOCK 59-64 F-OPER.MAX 9,5 A\n50 380-420 Y F-BLOCK 34-37,6 F-OPER.MAX 5,5 A',
    expected: {manufacturer:'Emerson', model:'LFP-20X-EWL', speed:'1450 rpm', phases:'3', frequency:'50 Hz'}
  },
  {
    name: 'NORD SK 1282AZG gearmotor',
    source: 'eBay visible nameplate',
    text: 'NORD DRIVESYSTEMS\nType SK 1282AZG-90SP/4 CUS TW\nNo.202139707-100\n562 lb-in 10.34 :1 Pos M5\nP1 1.50 hp n2 168\n66 lbs\nSF 3.10',
    expected: {manufacturer:'NORD', model:'SK 1282AZG-90SP/4 CUS TW', ratio:'10.34'}
  },
  {
    name: 'SEW WA20 DRN71M4 gearmotor',
    source: 'Spares4Less visible nameplate',
    text: 'SEW-EURODRIVE\nWien/Austria\nWA20 DRN71M4\n50.8162294501.0002.22 Inverter duty VPWM 3~IEC60034\nHz 50 r/min 1415/215\nkW 0.37 S1\nV 230/400 D/Y\nA 1,78/1,02\nCos phi 0,66\nIP 54 IE3\ni 6,57 Nm 15\nkg 9.884\nJahr 2022',
    expected: {manufacturer:'SEW-EURODRIVE', model:'WA20 DRN71M4', frequency:'50 Hz', power:'0.37 kW', ipRating:'IP 54', ratio:'6,57', weight:'9.884 kg', year:'2022'}
  },
  {
    name: 'Bonfiglioli VF49 gearbox',
    source: 'Sigma Surplus visible nameplate',
    text: 'BONFIGLIOLI RIDUTTORI S.p.A.\nTYPE VF49 P1 N56C\nCODE 200680150\nBATCH 03/00\nMOUNT POS. B3 i=18\nITALY',
    expected: {manufacturer:'Bonfiglioli', model:'VF49 P1 N56C', partNumber:'200680150', ratio:'18'}
  },
  {
    name: 'Flender H4RV 15 gearbox',
    source: 'Tengkai visible nameplate',
    text: 'FLENDER\nNo 4360903\nH4RV 15\nP2 36.4\nn1 983.90 1/min n2 5.19\n(PAO-OIL) VG 320\nD-46393 Bocholt Germany',
    expected: {manufacturer:'Flender', model:'H4RV 15', serialNumber:'4360903'}
  },
  {
    name: 'Danfoss MT100HS9AVE compressor',
    source: 'Cibrel visible nameplate',
    text: 'Danfoss\nCompressor\nModel no: MT100HS9AVE\nSerial no: MA1008556853\n3 380V 3~ 60Hz\nLR 110A 26A MAX\nLP Side 18.40 bar HP Side 29.40 bar\nRefrigerant R22 / R417A\n2021\nMADE IN FRANCE',
    expected: {manufacturer:'Danfoss', model:'MT100HS9AVE', serialNumber:'MA1008556853', voltage:'380 V', phases:'3', frequency:'60 Hz', refrigerant:'R22', year:'2021'}
  },
  {
    name: 'Lowara CEAM70/3-V pump',
    source: 'eBay visible nameplate',
    text: 'LOWARA\nITT Industries\nPump CEAM70/3-V\nCod. 102614530\nQ 30 - 80 l/min\nH 20.5 - 14.5 m\nMotor 1~ 37M712\n220-240 V 2.6 A\n50 Hz\nP1 0.37 kW\nC 12.5 uF / 450 V\nCl F IP55',
    expected: {manufacturer:'Lowara', model:'CEAM70/3-V', phases:'1', voltage:'220-240 V', current:'2.6 A', frequency:'50 Hz', power:'0.37 kW', ipRating:'IP55'}
  },
  {
    name: 'Calpeda NM 50/16B/B pump',
    source: 'Industrie24 visible nameplate',
    text: 'calpeda\nNM 50/16B/B\n2900 1/min 5,5 kW (7,5HP)\nQ min/max 30/81 m3/h\nH max/min 31/9,5 m\n63 kg\nIP54\nIEC60034-1',
    expected: {manufacturer:'Calpeda', model:'NM 50/16B/B', power:'5,5 kW', speed:'2900 rpm', weight:'63 kg', ipRating:'IP54'}
  },
  {
    name: 'Becker SV 5.90/1 vacuum pump',
    source: 'Riley Surface World visible nameplate',
    text: 'BECKER\nType SV 5.90/1\nyear 2008\nfrequency 50/60 Hz\nspeed 2800/3300 min-1\npower required 0.37/0.44 kW\ninlet capacity 90/92 m3/h\npressure + 85/70 mbar\nvacuum - 105/80 mbar',
    expected: {manufacturer:'Becker', model:'SV 5.90/1', year:'2008', frequency:'50/60 Hz'}
  },
  {
    name: 'Armstrong 5x4x10 centrifugal pump',
    source: 'eBay visible nameplate',
    text: 'ARMSTRONG\nCOMMERCIAL PUMP\nMODEL 5x4x10\nSERIAL NO. 104493\nCONSTRUCTION BF-STD\nCAPACITY 500 USGPM\nHEAD 70 FT\nMOTOR 15 HP\nRPM 1800 DUTY 60 HZ\nMAX TEMP 250 F',
    expected: {manufacturer:'Armstrong', model:'5x4x10', serialNumber:'104493', frequency:'60 Hz', speed:'1800 rpm'}
  },
  {
    name: 'Quincy QGS5HPD compressor',
    source: 'BidSpotter visible nameplate',
    text: 'QUINCY COMPRESSOR\nType: QGS5HPD CSAUL\nYear: 2015 Weight: 425 lbs\nProduct Nr: 4152002717\nSerial Nr: ECA833560\nDryer / Secheur / Trockner 115 V 1 Ph 60 Hz 10.23\nCompressor 230 V 3 Ph 60 Hz 4\nWorking Pressure 145 PSIG\nMax Pressure 145 PSIG\nRefrigerant Type R134A\nMax Inlet Temp. 104\nMax Ambient Temp. 104',
    expected: {manufacturer:'Quincy', model:'QGS5HPD CSAUL', year:'2015', refrigerant:'R134A'}
  }
];

let checks = 0;
let failures = 0;
const report = [];

for (const fixture of fixtures) {
  const result = parseNameplate(fixture.text);
  const missing = [];
  for (const [key, expected] of Object.entries(fixture.expected)) {
    checks++;
    const actual = String(result[key] || '');
    if (!actual.toLowerCase().includes(String(expected).toLowerCase())) {
      failures++;
      missing.push({key, expected, actual});
    }
  }
  report.push({name:fixture.name, failed:missing.length, missing});
}

console.log(JSON.stringify({
  fixtures:fixtures.length,
  checks,
  failures,
  passed:checks-failures,
  accuracy: checks ? Math.round((checks-failures)*1000/checks)/10 : 0,
  report
}, null, 2));

if (failures) process.exitCode = 1;
