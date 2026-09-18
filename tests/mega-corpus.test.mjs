import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const start = app.indexOf('function clean');
const end = app.indexOf('function fillForm');
assert.ok(start >= 0 && end > start, 'Parser section not found');

const { parseNameplate } = new Function(
  app.slice(start, end) + '\nreturn {parseNameplate};'
)();

const cases = [];
const add = (family, text, expected) => cases.push({family, text, expected});

for (let i = 0; i < 5; i++) {
  const v1 = 400 + i * 10, v2 = 690 + i * 10, kw = (5.5 + i * 1.5).toFixed(1);
  const rpm = 1470 + i * 5, a1 = (11.4 + i).toFixed(1), a2 = (6.6 + i * .6).toFixed(1);
  add('WEG IEC motor', `WEG
W20
W3EA1324B3T00${i + 1}
IP55
V Hz kW r/min A cos φ
${v1}Y 50 ${kw} ${rpm} ${a1} 0.78
${v2}D 50 ${kw} ${rpm} ${a2} 0.78
${55 + i} kg`, {
    manufacturer: 'WEG',
    model: `W3EA1324B3T00${i + 1}`,
    frequency: '50 Hz',
    ipRating: 'IP55'
  });
}

for (let i = 0; i < 5; i++) {
  const kw = 11 + i * 4, rpm = 1475 + i * 3;
  add('ABB IEC motor', `ABB Motors
3~ Motor M3BP 160MLA ${4 + i} IMB3
Year 202${i + 1}
No. 3G1F23091090${20 + i}
Ins.cl. F IP 55
V Hz kW r/min A cos φ
690 Y 50 ${kw} ${rpm} ${12 + i}.2 0.82
400 D 50 ${kw} ${rpm} ${21 + i}.1 0.82
${188 + i * 5} kg`, {
    manufacturer: 'ABB',
    serialNumber: `3G1F23091090${20 + i}`,
    year: `202${i + 1}`,
    ipRating: 'IP 55'
  });
}

for (let i = 0; i < 5; i++) {
  add('Siemens servo', `SIEMENS
3 ~ Mot. 1FT710${i}-5AF71-1CH1-Z
Io ${26 + i} A nmax ${3500 + i * 100} /min
IN ${15 + i},0 A nN ${3000 + i * 100} /min
UIN ${375 + i * 10} V
IP 65`, {
    manufacturer: 'Siemens',
    model: `1FT710${i}-5AF71-1CH1-Z`,
    current: `${26 + i} A`,
    voltage: `${375 + i * 10} V`,
    ipRating: 'IP 65'
  });
}

for (let i = 0; i < 5; i++) {
  add('Baldor NEMA motor', `BALDOR RELIANCE
CAT. NO. XT31${50 + i}T
VOLTS 230/460
F.L. AMPS ${38 + i}.8/${19 + i}.4
R.P.M. ${1180 + i * 20}
HZ 60
H.P. ${15 + i * 5}
ENCL TEFC`, {
    manufacturer: 'Baldor-Reliance',
    partNumber: `XT31${50 + i}T`,
    voltage: '230/460 V',
    frequency: '60 Hz'
  });
}

for (let i = 0; i < 5; i++) {
  add('Leeson NEMA motor', `LEESON
CAT. NO./PART NO. 12008${6 + i}.00
MODEL C145T3${4 + i}FB2C
V. 208-230
R.P.M. ${3450 - i * 50}/${2850 - i * 40}
F.L.A. ${4 + i}.2/${4 + i}.8
HZ 60/50
PH. 3`, {
    manufacturer: 'Leeson',
    model: `C145T3${4 + i}FB2C`,
    partNumber: `12008${6 + i}.00`,
    frequency: '60/50 Hz'
  });
}

for (let i = 0; i < 5; i++) {
  add('SEW motor', `SEW-EURODRIVE
Typ V10${i}
3~ Motor
IP66
${2810 - i * 50} r/min 50 Hz
230/400 V ${2 + i},${9 + i} A ${1 + i}.5 kW`, {
    manufacturer: 'SEW-EURODRIVE',
    model: `V10${i}`,
    frequency: '50 Hz',
    ipRating: 'IP66'
  });
}

for (let i = 0; i < 5; i++) {
  add('ABB ACS drive', `ABB
ACS580-01-0${87 + i}A-4
IP21
Input U1 3~ 400/480 V AC I1 ${87 + i}/${77 + i} A f1 50/60 Hz
Output U2 3~ 0...U1 I2 ${87 + i}/${77 + i} A
S/N: 11411049${10 + i}`, {
    manufacturer: 'ABB',
    model: `ACS580-01-0${87 + i}A-4`,
    serialNumber: `11411049${10 + i}`,
    frequency: '50/60 Hz',
    ipRating: 'IP21'
  });
}

for (let i = 0; i < 5; i++) {
  add('Schneider ATV drive', `Schneider Electric
Altivar 320
ATV320U0${4 + i}N4C
${(0.37 + i * .18).toFixed(2)}kW - 1/2Hp
U(V) 380-500
F(Hz) 50/60
I(A) ${(1.5 + i * .4).toFixed(1)}
IP20
S/N 8B20${48 + i}101001`, {
    manufacturer: 'Schneider Electric',
    model: `ATV320U0${4 + i}N4C`,
    frequency: '50/60 Hz',
    ipRating: 'IP20'
  });
}

for (let i = 0; i < 5; i++) {
  add('Mitsubishi FR drive', `MITSUBISHI ELECTRIC
INVERTER
MODEL: FR-A820-0004${6 + i}-1-N6
INPUT: 3PH 200-240V 50/60Hz
OUTPUT: 3PH 0-240V 0.2-590Hz ${4.6 + i}.0A
SERIAL: A2${6 + i}X12345${i}`, {
    manufacturer: 'Mitsubishi Electric',
    model: `FR-A820-0004${6 + i}-1-N6`,
    frequency: '50/60 Hz'
  });
}

for (let i = 0; i < 5; i++) {
  add('Siemens G120 drive', `SIEMENS
SINAMICS G120
POWER MODULE PM240-2
Article No. 6SL3210-1PE2${4 + i}-5UL0
3AC380-480V 47-63Hz
OUTPUT HIGH OVERLOAD ${18.5 + i * 3}kW
IP20`, {
    manufacturer: 'Siemens',
    model: 'PM240-2',
    partNumber: `6SL3210-1PE2${4 + i}-5UL0`,
    frequency: '47-63 Hz',
    ipRating: 'IP20'
  });
}

for (let i = 0; i < 5; i++) {
  add('Rockwell PowerFlex', `Allen-Bradley
PowerFlex 525
Cat. No. 25B-D0${10 + i}N104
380...480V AC
3 Phase
${10.5 + i} Amps
${4 + i} kW
IP20`, {
    manufacturer: 'Allen-Bradley',
    model: 'PowerFlex 525',
    partNumber: `25B-D0${10 + i}N104`,
    phases: '3',
    ipRating: 'IP20'
  });
}

for (let i = 0; i < 5; i++) {
  add('Danfoss VLT', `Danfoss
VLT AutomationDrive
T/C: FC-302P${11 + i}KT5E20H1XGXXXXSXXXXA0BXCXX
P/N: 131F88${44 + i}
S/N: 20040${6 + i}G143
IN: 3x380-500V 50/60Hz ${22 + i}/${19 + i}A
IP20`, {
    manufacturer: 'Danfoss',
    partNumber: `131F88${44 + i}`,
    serialNumber: `20040${6 + i}G143`,
    frequency: '50/60 Hz',
    ipRating: 'IP20'
  });
}

for (let i = 0; i < 5; i++) {
  add('Yaskawa drive', `YASKAWA ELECTRIC CORPORATION
MODEL: CIMR-PU2A000${4 + i}FAA REV: A
INPUT: AC3PH 200-240V 50/60Hz ${3.9 + i}.0A
OUTPUT: AC3PH 0-240V 0-400Hz ${3.5 + i}.0A
S/N: J0073D20741010${i}
IP20`, {
    manufacturer: 'YASKAWA',
    model: `CIMR-PU2A000${4 + i}FAA`,
    serialNumber: `J0073D20741010${i}`,
    frequency: '50/60 Hz',
    ipRating: 'IP20'
  });
}

for (let i = 0; i < 5; i++) {
  add('Grundfos pump', `GRUNDFOS
Type TP 80-${400 + i * 10}/2 A-F-A-BAQE
Model A96108703P21348000${i}
Q ${114.8 + i * 5} m3/h
H ${34.7 + i} m
p/t 16/120 bar/C
n ${2945 - i * 20} min-1`, {
    manufacturer: 'Grundfos',
    model: `TP 80-${400 + i * 10}/2 A-F-A-BAQE`,
    flow: `${114.8 + i * 5} m3/h`
  });
}

for (let i = 0; i < 5; i++) {
  add('KSB pump', `KSB B.V.
Movitec VCF ${90 + i * 5}/2-1 B
Frame 160 (${12.2 + i},2kW) 50 Hz
ID 99720403${68 + i}
Q ${85 + i * 5} m3/h
H ${38.1 + i}m
n fix. ${2900 - i * 10} rpm`, {
    manufacturer: 'KSB',
    model: `Movitec VCF ${90 + i * 5}/2-1 B`,
    frequency: '50 Hz'
  });
}

for (let i = 0; i < 5; i++) {
  add('Sulzer pump', `SULZER
VMS H ${6 + i}-${200 + i * 10}
${15 + i}.0 kW (${25.8 + i} A) 50 Hz
ID 2506520${i}
Q ${6.5 + i} m3/h
H ${321.4 - i * 10} m
n fix ${2850 - i * 15} rpm`, {
    manufacturer: 'Sulzer',
    model: `VMS H ${6 + i}-${200 + i * 10}`,
    frequency: '50 Hz'
  });
}

for (let i = 0; i < 5; i++) {
  add('Atlas Copco compressor', `Atlas Copco
AIR COMPRESSOR
Type ZR ${160 + i * 10} FF
Serial N°. AIF.11${4999 + i}
Max. working pressure bar(e) ${7.5 + i * .5}
Input power kW ${160 + i * 20}
Rotational shaft speed r/min ${1485 - i * 10}
Year of manufacture '0${6 + i}`, {
    manufacturer: 'Atlas Copco',
    model: `ZR ${160 + i * 10} FF`,
    serialNumber: `AIF.11${4999 + i}`
  });
}

for (let i = 0; i < 5; i++) {
  add('Kaeser compressor', `KAESER COMPRESSORS
Model Aircenter SM ${15 + i * 2} Part No. 10079${4 + i}.1
Year 201${5 + i} Serial No. ${1565 + i}
psig ${125 + i * 5}.0 cfm ${53 + i * 3}
Voltage 208Y/120 V 230Y/133 V 460Y/266 V
Phase 3
Hz 60
RPM ${3560 - i * 20} HP ${15 + i}`, {
    manufacturer: 'KAESER',
    year: `201${5 + i}`,
    serialNumber: `${1565 + i}`,
    phases: '3'
  });
}

for (let i = 0; i < 5; i++) {
  add('Electrolux washer', `Electrolux
Model: W31${5 + i}H
Date(YYMM): 0${6 + i}06
Capacity: ${10 + i}.0 kg 1:10
Voltages: 400/230V 3N ~ 50Hz
Total Input: ${9.7 + i},0kW
IP24D`, {
    manufacturer: 'Electrolux',
    model: `W31${5 + i}H`,
    capacity: `${10 + i}.0 kg`,
    ipRating: 'IP24D'
  });
}

for (let i = 0; i < 5; i++) {
  add('Trane chiller', `TRANE
MODEL ERTHA45${i}RS1P3A1
SERIAL N° EKTR 35${i}
YEAR 199${5 + i}
REFRIGERANT R134a
COMPRESSOR U/VOLT 380 HZ 50 PH 3 A.MAX ${400 + i * 10} KW.MAX ${236 + i * 10}`, {
    manufacturer: 'Trane',
    model: `ERTHA45${i}RS1P3A1`,
    serialNumber: `EKTR 35${i}`,
    refrigerant: 'R134a',
    frequency: '50 Hz'
  });
}

assert.equal(cases.length, 100);

for (const fixture of cases) {
  const result = parseNameplate(fixture.text);
  for (const [key, expected] of Object.entries(fixture.expected)) {
    const actual = String(result[key] || '');
    assert.ok(
      actual.toLowerCase().includes(String(expected).toLowerCase()),
      fixture.family + ': expected ' + key + ' to include "' + expected + '", got "' + actual + '"'
    );
  }
}

console.log('PlateLens mega corpus: 100 stress fixtures passed across 20 families');
