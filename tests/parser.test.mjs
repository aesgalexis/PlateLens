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
    name: 'Grundfos pump',
    text: 'GRUNDFOS\nType TP 80-400/2 A-F-A-BAQE\nModel A96108703P213480003\nQ 114,8 m3/h H 34,7 m\np/t 16/120 bar/C\nn 2945 min-1',
    expected: {
      manufacturer: 'Grundfos',
      model: 'TP 80-400/2 A-F-A-BAQE',
      flow: '114,8 m3/h',
      head: '34,7 m'
    }
  },
  {
    name: 'Atlas Copco compressor',
    text: "Atlas Copco\nAIR COMPRESSOR\nType ZR 160 FF\nSerial N°. AIF.114999\nMax. working pressure bar(e) 7.50\nInput power kW 160\nRotational shaft speed r/min 1485\nYear of manufacture '06",
    expected: {
      manufacturer: 'Atlas Copco',
      model: 'ZR 160 FF',
      serialNumber: 'AIF.114999',
      workingPressure: '7.50 bar'
    }
  },
  {
    name: 'Danfoss drive',
    text: 'VLT AutomationDrive www.danfoss.com\nT/C: FC-302P11KT5E20H1XGXXXXSXXXXA0BXCXX\nP/N: 131F8844 S/N: 200406G143\n11kW(400V) / 15HP(460V)\nIN: 3x380-500V 50/60Hz 22/19A\nOUT: 3x0-Vin 0-590Hz 24/21A\nCHASSIS / IP20 Tamb. 50C',
    expected: {
      manufacturer: 'Danfoss',
      partNumber: '131F8844',
      serialNumber: '200406G143',
      frequency: '50/60 Hz',
      current: '22/19 A',
      ipRating: 'IP20'
    }
  },
  {
    name: 'SEW motor',
    text: 'SEW-EURODRIVE\n76646 Bruchsal / GERMANY\nTyp V100\n3~ Motor, S1-100% ED\nIP66\n2810 1/min 50 Hz\n220-277 V 0,29 A 62 W',
    expected: {
      manufacturer: 'SEW-EURODRIVE',
      model: 'V100',
      current: '0,29 A',
      ipRating: 'IP66'
    }
  },
  {
    name: 'Electrolux industrial washer',
    text: 'Electrolux\nModel: W3105H\nDate(YYMM): 0606\nCapacity: 10.0 kg 1:10\nType: W3... W3105H15\nVoltages: 400/230V 3N ~ 50Hz\nTotal Input: 9,7kW\n16/35A\nIP24D',
    expected: {
      manufacturer: 'Electrolux',
      model: 'W3105H',
      date: '0606',
      capacity: '10.0 kg',
      ratio: '1:10',
      ipRating: 'IP24D'
    }
  },
  {
    name: 'Bonfiglioli gearbox',
    text: 'TYPE VF49 P1 N56C\nCODE 200680150\nBATCH 03/00\nMOUNT POS. B3 i=18\nBONFIGLIOLI RIDUTTORI S.p.A.\nITALY',
    expected: {
      manufacturer: 'Bonfiglioli',
      model: 'VF49 P1 N56C',
      partNumber: '200680150',
      ratio: '18'
    }
  },
  {
    name: 'Kaeser compressor',
    text: 'KAESER COMPRESSORS\nModel Aircenter SM 15 Part No. 100794.1\nYear 2015 Serial No. 1565\npsig 125.0 cfm 53\nVoltage 208Y/120 V 230Y/133 V 460Y/266 V\nPhase 3 Package FLA 43|41|21\nHz 60 Drive Motor FLA 38|37|18\nRPM 3560 HP 15.0',
    expected: {
      manufacturer: 'KAESER',
      model: 'Aircenter SM 15',
      partNumber: '100794.1',
      year: '2015',
      serialNumber: '1565',
      workingPressure: '125.0 psig',
      speed: '3560 rpm'
    }
  },
  {
    name: 'ABB motor table',
    text: 'ABB Motors\n3~ motor M2QA200L4A B3\nIEC 200L55\nIns.cl. F IP 55\nV Hz kW r/min A cos φ\n690Y 50 30 1470 30.94 0.88\n400D 50 30 1470 53.37 0.88\n440D 60 34.5 1765 54.96 0.89\nCat.no 202501-ADA\n254 kg',
    expected: {
      manufacturer: 'ABB',
      model: 'M2QA200L4A',
      voltage: '690Y / 400D / 440D V',
      current: '30.94 / 53.37 / 54.96 A',
      ipRating: 'IP 55'
    }
  },
  {
    name: 'Siemens motor',
    text: 'SIEMENS\n3~ Mot 1LA7113-4AA61\nUD 0605/70201116-7\nIP55 112M IM B5 IEC/EN 60034 ThCl F\n50 Hz 400/690 V 4 kW 8,2/4,7 A cos φ 0,83 1440/min\n60 Hz 460 V 4,6 kW 7,9 A cos φ 0,84 1740/min',
    expected: {
      manufacturer: 'Siemens',
      model: '1LA7113-4AA61',
      power: '4 kW',
      current: '8,2/4,7 A',
      speed: '1440 rpm',
      ipRating: 'IP55'
    }
  },
  {
    name: 'WEG motor table',
    text: 'WEG\n3 ~ AL90S/L-04\nIP55 Ins. cl F S1\nV Hz kW min-1 A cos φ\n220D 50 1.5 1400 5.79 0.86\n380Y 50 1.5 1400 3.35 0.86\n460Y 60 1.8 1700 3.44 0.82\n18 kg',
    expected: {
      manufacturer: 'WEG',
      model: 'AL90S/L-04',
      current: '5.79 / 3.35 / 3.44 A',
      speed: '1400 / 1700 rpm',
      ipRating: 'IP55'
    }
  }
];

for (const fixture of fixtures) {
  const result = parseNameplate(fixture.text);
  for (const [key, expected] of Object.entries(fixture.expected)) {
    const actual = result[key] || '';
    assert.ok(
      actual.toLowerCase().includes(expected.toLowerCase()),
      fixture.name + ': expected ' + key + ' to include "' + expected + '", got "' + actual + '"'
    );
  }
}

console.log('PlateLens parser regression: ' + fixtures.length + ' fixtures passed');
