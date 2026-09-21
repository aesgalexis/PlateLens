import assert from 'node:assert/strict';
import fs from 'node:fs';

/*
  Visual benchmark built from 21 real industrial nameplate photos reviewed
  manually on 2026-09-21. The text below is a human transcription of what is
  visibly readable on each source photo. This test intentionally measures the
  parser against visual ground truth, independently from Tesseract OCR noise.

  Keep this corpus diverse. Do not change an expected value merely to make a
  parser change pass: update only when the source transcription was wrong.
*/

const app = fs.readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const start = app.indexOf('function clean');
const end = app.indexOf('function fillForm');
assert.ok(start >= 0 && end > start, 'Parser section not found');

const parseNameplate = new Function(
  app.slice(start, end) + '\nreturn parseNameplate;'
)();

const plates = [
  {
    name: 'Kaeser Aircenter SM15 compressor',
    category: 'compressor',
    text: 'KAESER COMPRESSORS\nModel Aircenter SM 15 Part No. 100794.1\nYear 2015 Serial No. 1565\npsig 125.0 cfm 53\nVoltage 208Y/120 V 230Y/133 V 460Y/266 V\nPhase 3 Package FLA 43|41|21\nHz 60 Drive Motor FLA 38|37|18\nRPM 3560 HP 15.0',
    expected: {manufacturer:'KAESER', model:'Aircenter SM 15', partNumber:'100794.1', year:'2015', serialNumber:'1565', speed:'3560 rpm', phases:'3'}
  },
  {
    name: 'Schneider ATV58 drive',
    category: 'drive',
    text: 'Telemecanique Schneider\nATV58HD12N4S304\nMotor Rating 7.5kW / 10 HP\nInput V 380/500 V 50/60 Hz\nInput phase 3\nInput I 20.5/21A\nOutput 3PH 380/500 V\nOutput I 17.6 A\nSerial N 0609000153',
    expected: {manufacturer:'Schneider Electric', model:'ATV58HD12N4S304', power:'7.5 kW', frequency:'50/60 Hz', phases:'3', serialNumber:'0609000153'}
  },
  {
    name: 'Siemens 37kW motor',
    category: 'motor',
    text: 'SIEMENS\n3~MOT 1AV4205A 1PC30042AA534MA1\nIP55\n400 D V 50 Hz 67 A 37.0 kW cos 0.84 2965 1/min IE4\n210 kg',
    expected: {manufacturer:'Siemens', voltage:'400 V', frequency:'50 Hz', current:'67 A', power:'37.0 kW', speed:'2965 rpm', ipRating:'IP55', weight:'210 kg'}
  },
  {
    name: 'KSB motor table',
    category: 'motor',
    text: 'KSB Aktiengesellschaft\n3~MOT 1AV3162A 1PC30381DA234GQ5\nIP55\n84kg\n400 D 50 19.6 11.0 0.89 91.2 2955\n690 Y 50 11.3 11.0 0.89 91.2 2955\n460 D 60 17.2 11.0 0.88 91.0 3550',
    expected: {manufacturer:'KSB', weight:'84 kg', frequency:'50 / 60 Hz'}
  },
  {
    name: 'ABB M3AA 132 MC4 motor',
    category: 'motor',
    text: 'ABB\n3~ Motor M3AA 132 MC 4 IMB3/IM1001 2021\nNo.3G2C2123041582638 Ins.cl F IP55\n690Y 50 7.5 1464 8.5 0.81 S1\n400D 50 7.5 1464 14.7 0.81 S1\n660Y 50 7.5 1456 8.8 0.83 S1\n380D 50 7.5 1456 15.3 0.83 S1\n415D 50 7.5 1465 14.4 0.79 S1\n460D 60 7.5 1766 13.0 0.79 S1\n68 kg',
    expected: {manufacturer:'ABB', model:'M3AA 132 MC 4', year:'2021', serialNumber:'3G2C2123041582638', ipRating:'IP55', weight:'68 kg'}
  },
  {
    name: 'SEW RF47 DRE100LC4 gearmotor',
    category: 'gearmotor',
    text: 'SEW-EURODRIVE\nRF47 DRE100LC4\nNo 323601.0001.15\nInverter duty VPWM\nrpm 1455/100\nV 220-242D/380-420Y\nA 11.00/6.30\neff% 86.3\nIP55',
    expected: {manufacturer:'SEW-EURODRIVE', model:'RF47 DRE100LC4', current:'11.00/6.30 A', ipRating:'IP55'}
  },
  {
    name: 'WEG 100L motor',
    category: 'motor',
    text: 'WEG\n3~ 100L\nHz 60\nkW(HP-cv) 1.5(2.0)\nRPM 1150\n220/380/440 V\n7.2/4.1/2.7 A\nIP55\ncos 0.70',
    expected: {manufacturer:'WEG', frequency:'60 Hz', power:'1.5 kW', speed:'1150 rpm', voltage:'220/380/440 V', current:'7.2/4.1/2.7 A', ipRating:'IP55'}
  },
  {
    name: 'Danfoss FC302 drive',
    category: 'drive',
    text: 'VLT AutomationDrive\nwww.danfoss.com\nT/C: FC-302P2K2T5E20H1XGXXXXSXXXXAXBXCXXXXDX\nP/N: 131B0038\nS/N: 065423G425\n2.2kW(400V) / 3.0HP(460V)\nIN: 3x380-500V 50/60Hz 5.0/4.3A\nOUT: 3x0-Vin 0-590Hz 5.6/4.8A\nCHASSIS/IP20',
    expected: {manufacturer:'Danfoss', partNumber:'131B0038', serialNumber:'065423G425', power:'2.2 kW', frequency:'50/60 Hz', current:'5.0/4.3 A', ipRating:'IP20'}
  },
  {
    name: 'Schneider ATV320 drive',
    category: 'drive',
    text: 'Altivar 320\nATV320U40N4C\n4kW - 5HP\nU(V) input 380-480 (UL) / 500 c3\noutput 0-380-480 (UL) / 500 c3\nF(Hz) input 50/60 output 0...599\nI(A) input 13.7 max output 9.5\nIP20',
    expected: {manufacturer:'Schneider Electric', model:'ATV320U40N4C', power:'4 kW', frequency:'50/60 Hz', current:'13.7 A', ipRating:'IP20'}
  },
  {
    name: 'EBARA GS65-250 pump',
    category: 'pump',
    text: 'EBARA PUMP\nITEM ASJ16A1RB0000021\nSER NO P221656-01\nMODEL GS65-250\nQ 2.0-4 m3/min\nDATE 2022.09',
    expected: {manufacturer:'EBARA', model:'GS65-250', serialNumber:'P221656-01', date:'2022.09'}
  },
  {
    name: 'KSB ETB cropped motor table',
    category: 'pump-motor',
    text: 'KSB Aktiengesellschaft\n1PC30381EB234DA5\n180M IMV5 IP55\nA kW cos NOM.EFF 1/min\n35.0 18.5 0.84 91.2 1465\n20.0 18.5 0.84 91.2 1465\n34.0 21.3 0.85 92.4 1765\n30.5 18.5 0.83 92.4 1770',
    expected: {manufacturer:'KSB', ipRating:'IP55', power:'18.5 kW', speed:'1465 rpm'}
  },
  {
    name: 'Wilo NL150/250 pump',
    category: 'pump',
    text: 'Made by Wilo\nWILO SE Dortmund\nNL150/250-30-4-12-EFF1\nQ 394 m3/h\nH 18 m\nPmax 16 bar\n244 mm\n128 kg',
    expected: {manufacturer:'Wilo', model:'NL150/250-30-4-12-EFF1', flow:'394 m3/h', head:'18 m', workingPressure:'16 bar', weight:'128 kg'}
  },
  {
    name: 'NORD SK32100 gearmotor',
    category: 'gearmotor',
    text: 'NORD DRIVESYSTEMS\nGetriebebau NORD GmbH\nType SK 32100AZSH-100LP/4 TF\nS1 2019\nNo.202671824-100\nM2 409 Nm i 34,32\nP1 2,20 kW n2 43 min-1\n110 kg',
    expected: {manufacturer:'NORD', model:'SK 32100AZSH-100LP/4 TF', year:'2019', serialNumber:'202671824-100', ratio:'34,32', power:'2,20 kW', weight:'110 kg'}
  },
  {
    name: 'ABB ACS580 drive',
    category: 'drive',
    text: 'ABB\nACS580-01-02A1-4\nInput U1 3ph 400/480 VAC\nI1 2.1 A\nF1 50/60 Hz\nOutput U2 3ph 0...U1\nI2 2.1 A\nf2 0...500 Hz\nPn 0.75 kW / 1 hp\nIP21',
    expected: {manufacturer:'ABB', model:'ACS580-01-02A1-4', frequency:'50/60 Hz', current:'2.1 A', power:'0.75 kW', ipRating:'IP21', phases:'3'}
  },
  {
    name: 'Trane ERTHA450 chiller',
    category: 'chiller',
    text: 'TRANE\nMODEL ERTHA450RS1P3A1AB1XXXTZB5D1YXXA1AXXX\nSERIAL EKTR 352\nYEAR 1995\nR134a C1 20.8 kg\nLP 17 bar HP 23 bar\nOIL C1 37.5 L\nCOMPRESSOR 380 V 50 Hz 3 PH 400 A.MAX 236 KW.MAX',
    expected: {manufacturer:'Trane', model:'ERTHA450RS1P3A1AB1XXXTZB5D1YXXA1AXXX', serialNumber:'EKTR 352', year:'1995', refrigerant:'R134a', voltage:'380 V', frequency:'50 Hz', phases:'3'}
  },
  {
    name: 'Primus T35 dryer',
    category: 'dryer',
    text: 'primus\nModel T35\nS/N 35T005264BZ\nEl.Supply 50Hz 1x220-240V\nFuse 16A\nMotor 0.55/0.25 kW\nTotal Power 1.2 kW\nGas heating 46KW\nType B22 Year 2014\nGas G20 p(mbar) 20 (m3/h) 4,86',
    expected: {manufacturer:'Primus', model:'T35', serialNumber:'35T005264BZ', frequency:'50 Hz', fuseRating:'16 A', power:'1.2 kW', year:'2014'}
  },
  {
    name: 'Alfa Laval P2 FH heat exchanger',
    category: 'heat-exchanger',
    text: 'ALFA-LAVAL\nTYPE P2 FH\nMANUF. NO. 98193510\nYEAR 1989\nVOLUME 7 L\nMAX. WORK PRESSURE 16 bar\nNO. OF PLATES 21\nPACK LENGTH 144 mm',
    expected: {manufacturer:'Alfa Laval', model:'P2 FH', serialNumber:'98193510', year:'1989', volume:'7 L', workingPressure:'16 bar'}
  },
  {
    name: 'Fuji VFC406A ring blower',
    category: 'blower',
    text: 'FUJI ELECTRIC\nRING BLOW TYPE VFC406A\nSTATIC PRESS 500 mmAq\nQUANTITY 1.45/1.95 m3/min\n3 PHASE MOTOR TYPE MLH6085Z\nOUTPUT 550/850W POLES 2\nHz 50/60\nVOLT 200/200 220\nAMP 3.1/3.7 3.6',
    expected: {manufacturer:'Fuji Electric', model:'VFC406A', phases:'3', frequency:'50/60 Hz', power:'550/850 W', current:'3.1/3.7 A'}
  },
  {
    name: 'Leroy-Somer LSMV100LR motor',
    category: 'motor',
    text: 'LEROY SOMER\n3~ LSMV100LR\nN D96011 B19 001\n2019 IP55 IK08\nTa40C Ins.cl.F S1 1000m 28kg IE2 85.9%\n230 D 50 1455 2.20 0.79 7.80\n400 Y 50 1455 2.20 0.79 4.50\n460 Y 60 1760 2.20 0.76 3.90',
    expected: {manufacturer:'Leroy-Somer', model:'LSMV100LR', year:'2019', ipRating:'IP55', weight:'28 kg', frequency:'50 / 60 Hz'}
  },
  {
    name: 'Baldor M2513T motor',
    category: 'motor',
    text: 'BALDOR RELIANCE INDUSTRIAL MOTOR\nCAT. NO. M2513T\nSPEC. 37F599T867H1\nHP 15\nVOLTS 208-230/460\nAMPS 41-38/19\nR.P.M. 1760\nFRAME 254T HZ 60 PH 3\nSER.F. 1.15 CLASS F\nNEMA NOM. EFF. 91\nP.F. 81',
    expected: {manufacturer:'Baldor-Reliance', partNumber:'M2513T', voltage:'208-230/460 V', current:'41-38/19 A', speed:'1760 rpm', frequency:'60 Hz', phases:'3'}
  },
  {
    name: 'Grundfos CR10-18 pump',
    category: 'pump',
    text: 'GRUNDFOS\nType CR10-18 A-FJ-A-E-HQQE\nModel A96501223P10737\nf 50 Hz\nP2 7,50 kW\nn 2919 min-1\nHmax 185\nQ 10 m3/h H 149.4\npmax/tmax 25/120 bar/C\nSerial No. 0008',
    expected: {manufacturer:'Grundfos', model:'CR10-18 A-FJ-A-E-HQQE', serialNumber:'0008', frequency:'50 Hz', power:'7,50 kW', speed:'2919 rpm', flow:'10 m3/h', head:'149.4 m'}
  }
];

assert.equal(plates.length, 21, 'Visual benchmark must contain 21 verified real plates');

let assertions = 0;
for (const plate of plates) {
  const result = parseNameplate(plate.text);
  for (const [key, expected] of Object.entries(plate.expected)) {
    const actual = String(result[key] || '');
    assert.ok(
      actual.toLowerCase().includes(String(expected).toLowerCase()),
      plate.name + ': expected ' + key + ' to include "' + expected + '", got "' + actual + '"'
    );
    assertions++;
  }
}

console.log('PlateLens visual benchmark: 21 real plates passed (' + assertions + ' assertions)');
