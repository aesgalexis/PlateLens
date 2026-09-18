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
  ,
  {
    name: 'VEIT real OCR',
    text: '[LRONIN\nType L444010010\nFabr. Nr. 1200176573\nBaujahr/year 1997\nGewicht/weight kg 52\nVeit GmbH & Co., Justus-v.-Liebig-Str. 15, 86899 Landsberg/L., Germany\nSQAUGBUGELTISCH\nUCTION TRONING TABLE\nType 1444010010 Hz 50\nFabr.Nr. 1200176573 kW 1.0\nBaujahr/year 1997 A 1.8\nGewicht/weight kg 52 Volt~ 400',
    expected: {
      manufacturer: 'VEIT',
      model: '1444010010',
      serialNumber: '1200176573',
      frequency: '50 Hz',
      power: '1.0 kW',
      current: '1.8 A',
      voltage: '400 V',
      year: '1997',
      weight: '52 kg'
    }
  },
  {
    name: 'Barbanti real OCR',
    text: 'CE\n©® barbanti\nBarbanti srl\nvia di Mezzo 78 - 41037 Mirandola (Mo) - ITALY\n(+39)053520023 barbanti@barbanti.it\nModello/Model G2 | Date:[ 02/24 ]\nMatricola/Serial number = 240059\nHe[SO] PH:[ 1] volt:[ 220\nTotal A: | - Total w:[ 4600 ]\nCaldaia/Bolier Lt: | 5 | w:[ 3000 ]\nRiscaldamento/Heating Elements: ae\nPressione aliment. aria/Air inlet pressure: BAR:[ 6,5 |\nPressione max vapore/Max steam pressure: BAR: . 4]\nMade in Italy',
    expected: {
      manufacturer: 'Barbanti',
      model: 'G2',
      serialNumber: '240059',
      date: '02/24',
      phases: '1',
      frequency: '50 Hz',
      power: '4600 W',
      voltage: '220 V',
      capacity: '5 L',
      heatingPower: '3000 W',
      airPressure: '6,5 bar',
      steamPressure: '4 bar'
    }
  },
  {
    name: 'Yaskawa P1000 drive',
    text: 'YASKAWA ELECTRIC CORPORATION\nMODEL: CIMR-PU2A0004FAA REV: A\nINPUT: AC3PH 200-240V 50/60Hz 3.9A\nOUTPUT: AC3PH 0-240V 0-400Hz 3.5A\nMASS: 3.3 kg PRG: 8500\nO/N: 6W3050-0-100 VAJ123456\nS/N: J0073D207410100\nFILE NO: E131457\nIP20',
    expected: {
      manufacturer: 'YASKAWA',
      model: 'CIMR-PU2A0004FAA',
      serialNumber: 'J0073D207410100',
      voltage: '200-240 V',
      frequency: '50/60 Hz',
      current: '3.9 A',
      weight: '3.3 kg',
      ipRating: 'IP20'
    }
  },
  {
    name: 'Schneider Lexium 62',
    text: 'Schneider Electric\nLXM62DU60C21000\nInput ac/dc 250-700 Vdc 20 A\nOutput ac/dc 0-600 Vac 6 A\nControl Voltage 24 Vdc\nIP20\nCode\n2528128802\n10.11.2015\nRS 01',
    expected: {
      manufacturer: 'Schneider Electric',
      model: 'LXM62DU60C21000',
      serialNumber: '2528128802',
      date: '10.11.2015',
      voltage: '250-700 V',
      ipRating: 'IP20'
    }
  },
  {
    name: 'Danfoss rotary compressor',
    text: 'Danfoss\nModel no VRN752WTTENA\nSerial no 0745U6705238\nRefrigerant R290\n215V\n900-7200r/min\nPS 25bar\nTS max 125°C\nTS min -25°C\nVolume 1.5L\nPOE\n2023.05.26',
    expected: {
      manufacturer: 'Danfoss',
      model: 'VRN752WTTENA',
      serialNumber: '0745U6705238',
      refrigerant: 'R290',
      voltage: '215 V',
      speed: '900-7200 rpm',
      workingPressure: '25 bar',
      date: '2023.05.26'
    }
  },
  {
    name: 'Danfoss MLM compressor',
    text: 'Danfoss Compressor\nModel MLM090T4LC9\nSerial number MH2500000001\n380-415 V 3~ 50 Hz\nStarting current 147 A\nMaximum running current 26 A\nPS 25 bar\nPS 31.1 bar\nTS 55°C 150°C -35°C\nVolume 13.6 L\nOil 0.7 L\nMineral oil 160P\nRefrigerant R22',
    expected: {
      manufacturer: 'Danfoss',
      model: 'MLM090T4LC9',
      serialNumber: 'MH2500000001',
      refrigerant: 'R22',
      voltage: '380-415 V',
      frequency: '50 Hz',
      current: '147 A',
      workingPressure: '25 bar'
    }
  },
  {
    name: 'KSB Movitec',
    text: 'KSB B.V.\nMovitec VCF 90/2-1 B\nFrame 160 (12,2kW) 50 Hz\nID 9972040368\nSeal SiC/Ca/EPDM\nQ 85 m3/h PN25 -20/+100 °C\nH 38.1m\nn fix. 2900 rpm\nPO 700041712\nProd. 45/2011\n979441-0123',
    expected: {
      manufacturer: 'KSB',
      model: 'Movitec VCF 90/2-1 B',
      partNumber: '9972040368',
      date: '45/2011',
      power: '12,2 kW',
      frequency: '50 Hz',
      flow: '85 m3/h',
      head: '38.1 m',
      speed: '2900 rpm'
    }
  },
  {
    name: 'KSB Omega',
    text: 'KSB SE & Co. KGaA\n2016\nOmega 250 - 600 A\nP-No. 9971423078 / 000100\nQ 1050 m3/h H 120 m\nn 1475 1/min\nSNr. 24 15 26\nGew. 1090 kg\nMat.-No. 01 111 383',
    expected: {
      manufacturer: 'KSB',
      model: 'Omega 250 - 600 A',
      year: '2016',
      partNumber: '9971423078 / 000100',
      flow: '1050 m3/h',
      head: '120 m',
      speed: '1475 rpm',
      weight: '1090 kg'
    }
  },
  {
    name: 'Sulzer VMS',
    text: 'SULZER\nVMS H 6-200\n15.0 kW (25.8 A) 50 Hz\nID 25065200\nQ 6.5 m3/h\nH 321.4 m\nn fix 2850 rpm\nHydr. PN40 +120°C\nPO 6000129185\nProd 26/2014/1126622-3476',
    expected: {
      manufacturer: 'Sulzer',
      model: 'VMS H 6-200',
      partNumber: '25065200',
      power: '15.0 kW',
      current: '25.8 A',
      frequency: '50 Hz',
      flow: '6.5 m3/h',
      head: '321.4 m',
      speed: '2850 rpm'
    }
  },
  {
    name: 'Leroy-Somer Dynect motor',
    text: 'Nidec Leroy-Somer\n3~ LSHRM 315 MP TC\n2019 686251 C19 001\nIP55 IK08\n711 kg\nTa 50°C\nIns. cl. F\nS9\nIE5',
    expected: {
      manufacturer: 'Leroy-Somer',
      model: 'LSHRM 315 MP TC',
      year: '2019',
      serialNumber: '686251',
      ipRating: 'IP55',
      weight: '711 kg'
    }
  },
  {
    name: 'Copeland compressor',
    text: 'Copeland\nModel 4RH1-2500-TMK-105\nSerial C69G19417\n380-420 V / 3 / 50 Hz\n460 V / 3 / 60 Hz\n25 HP',
    expected: {
      manufacturer: 'Copeland',
      model: '4RH1-2500-TMK-105',
      serialNumber: 'C69G19417',
      voltage: '380-420 V',
      frequency: '50 Hz'
    }
  },
  {
    name: 'EBARA EVM pump',
    text: 'EBARA\nMADE IN ITALY\nTYPE EVM32 1-0F6/4.0\nP/No 12345678\nQ 32 m3/h\nH 55 m\nHmax 80 m\nP2 4.0 kW\nHz 60\n3450 min-1',
    expected: {
      manufacturer: 'EBARA',
      model: 'EVM32 1-0F6/4.0',
      partNumber: '12345678',
      flow: '32 m3/h',
      head: '55 m',
      power: '4.0 kW',
      frequency: '60 Hz',
      speed: '3450 rpm'
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
