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
    name: 'Siemens 1LE1001 motor',
    source: 'ABF Store visible nameplate',
    text: 'SIEMENS\n3~MOT 1LE10011DA222AA4\nIEC/EN 60034\n160M IMB3\n67kg Th.Cl.155(F) IP55\nV Hz A kW cos rpm\n230 D 50 35.5 11.0 0.87 2955\n400 Y 50 20.5 11.0 0.87 2955\n460 Y 60 19.3 12.6 0.88 3555',
    expected: {manufacturer:'Siemens', model:'1LE10011DA222AA4', ipRating:'IP55', weight:'67 kg'}
  },
  {
    name: 'ABB M3AA motor',
    source: 'ABF Store visible nameplate',
    text: 'ABB\n3~ Motor M3AA 132 MC 4 IMB3/IM1001 2021\nNo.3G2C2123041582638 ins.cl. F IP 55\nV Hz kW rpm A cos phi Duty\n690Y 50 7.5 1464 8.5 0.81 S1\n400D 50 7.5 1464 14.7 0.81 S1\n460D 60 7.5 1766 13.0 0.79 S1\n68 kg',
    expected: {manufacturer:'ABB', model:'M3AA 132 MC 4', serialNumber:'3G2C2123041582638', power:'7.5 kW', ipRating:'IP 55', weight:'68 kg'}
  },
  {
    name: 'Leroy Somer LS80L motor',
    source: 'MT24 visible nameplate',
    text: 'LEROY SOMER\nMot 3~ LS80L T\nNo 039397DG013\nIP 55 I.cl F 40 C S1\nV Hz min-1 kW cos phi A\nD 220 50 1385 0.55 0.76 2.90\nY 380 50 1385 0.55 0.76 1.70\nD 230 50 1400 0.55 0.74 2.80\nY 400 50 1400 0.55 0.74 1.60',
    expected: {manufacturer:'Leroy-Somer', model:'LS80L T', serialNumber:'039397DG013', power:'0.55 kW', ipRating:'IP 55'}
  },
  {
    name: 'WEG W22 NEMA motor',
    source: 'WEG official manual visible nameplate',
    text: 'WEG W22 Premium Inverter Duty Motor Severe Duty\nMODEL 00518ET3E184T-W22\n11416668-1\n18APR19\nPH 3\nHP(kW) 5.0(3.7)\nHz 60\nV 230/460\nA 12.9/6.45\nRPM 1755\nINS. CL. F\nIP55\nAMB. 40 C\nDUTY CONT.\n5.0HP 3.7kW 50Hz 380V 7.74A 1440RPM',
    expected: {manufacturer:'WEG', model:'00518ET3E184T-W22', phases:'3', voltage:'230/460 V', frequency:'60 Hz', current:'12.9/6.45 A', speed:'1755 rpm', ipRating:'IP55'}
  },
  {
    name: 'Grundfos TP pump',
    source: 'The Pump Dealer visible nameplate',
    text: 'GRUNDFOS\nType TP 80-120/2 AI-F-A-BQQE\nModel A98843904P217010001\nQ 42.50 m3/h H 7.91 m n 2910 min-1\np/t 6/120 bar/C max\nMade in Hungary',
    expected: {manufacturer:'Grundfos', model:'TP 80-120/2 AI-F-A-BQQE', flow:'42.50 m3/h', head:'7.91 m', speed:'2910 rpm'}
  },
  {
    name: 'Grundfos NK pump',
    source: 'Grundfos official visible nameplate',
    text: 'GRUNDFOS\nType NK 80-160/164 A1-F-A-GQQE\nModel B 96623450 P2 0612 0005\nQ 150 m3/h\nH 30 m\nn 2957 min-1\np/t 16/90 bar/C MAX\nMade in Hungary',
    expected: {manufacturer:'Grundfos', model:'NK 80-160/164 A1-F-A-GQQE', flow:'150 m3/h', head:'30 m', speed:'2957 rpm'}
  },
  {
    name: 'KSB Etabloc pump',
    source: 'Klema visible nameplate',
    text: 'KSB Aktiengesellschaft\nETB 065-050-125 GG A\nETABLOC\n997303 429 000100 01\nQ 53.00 m3/h H 24.69 m\nn 2962 min-1 2015\nMEI >= 0.70',
    expected: {manufacturer:'KSB', model:'ETB 065-050-125 GG A', flow:'53.00 m3/h', head:'24.69 m', speed:'2962 rpm', year:'2015'}
  },
  {
    name: 'Ebara centrifugal pump',
    source: 'visible Ebara nameplate',
    text: 'EBARA PUMP\nNO. RW06107-01\nMODEL 65X50FS2H 67.5\nCAP m3/min 0.75\nHEAD m 31.5\n7.5 kW\n3550 rpm\nBEARINGS 6305UU\nEBARA CORPORATION',
    expected: {manufacturer:'EBARA', model:'65X50FS2H 67.5', serialNumber:'RW06107-01', flow:'0.75 m3/min', head:'31.5 m', power:'7.5 kW', speed:'3550 rpm'}
  },
  {
    name: 'Atlas Copco GA45 compressor',
    source: 'Machineseeker visible nameplate',
    text: 'Atlas Copco\nCOMPRESSOR\nGA45\nAPI541890\n7.5 bar 109 psi 0.75 MPa\n137.1 l/s 290.5 cfm 8.23 m3/min\n400 V Freq. 50 Hz 3 Ph\n45 kW 60 hp\n2956 r/min\n893.5 kg\n2015',
    expected: {manufacturer:'Atlas Copco', model:'GA45', serialNumber:'API541890', workingPressure:'7.5 bar', voltage:'400 V', frequency:'50 Hz', phases:'3', power:'45 kW', speed:'2956 rpm', weight:'893.5 kg', year:'2015'}
  },
  {
    name: 'Atlas Copco GA30VSD compressor',
    source: 'Exapro visible nameplate',
    text: 'COMPRESSOR\nType : GA30VSD\nno : API424963\np max : 12.8 bar 185 psi\nQv : 76.4 l/s 161.9 cfm\nP motor : 30 kW 40 hp\nn motor : 7200 r/min\nm : 584 kg\nManufacturing year : 2008\nATLAS COPCO AIRPOWER n.v.',
    expected: {manufacturer:'Atlas Copco', model:'GA30VSD', serialNumber:'API424963', workingPressure:'12.8 bar', power:'30 kW', speed:'7200 rpm', weight:'584 kg', year:'2008'}
  },
  {
    name: 'Ingersoll Rand R7.5I compressor',
    source: 'ACP Store visible nameplate',
    text: 'Ingersoll Rand\nMACHINE TYPE SCREW AIR COMPRESSOR\nMACHINE MODEL R4-11/R7.5I-AIR-500\nSERIAL NUMBER JCV1019776\nMAX ALLOWABLE WORKING PRESSURE (BAR) 10\nINPUT SHAFT POWER (kW) 7.5\nMOTOR SPEED (rev/min) 2945\nGROSS MASS (kg) 485\nVOLTS/PHASE/Hz 400/3/50\nYEAR OF MANUFACTURE 2023',
    expected: {manufacturer:'Ingersoll Rand', model:'R4-11/R7.5I-AIR-500', serialNumber:'JCV1019776', workingPressure:'10 bar', power:'7.5 kW', speed:'2945 rpm', weight:'485 kg', voltage:'400 V', phases:'3', frequency:'50 Hz', year:'2023'}
  },
  {
    name: 'Kaeser compressor',
    source: 'Höchsmann visible nameplate',
    text: 'KAESER KOMPRESSOREN\nSchraubenkompressor\nMaterial-Nr.: 101741.0\nBemessungsleistung 7,5 + 0,49 kW\nMax. Betriebsüberdruck PS 11,00 bar\nMotornenndrehzahl 2955 1/min\nPhasen: 3\nFrequenz: 50 Hz\nSpannung 400 V\nVolllaststrom 19 A\nMade in Germany',
    expected: {manufacturer:'KAESER', voltage:'400 V', phases:'3', frequency:'50 Hz', current:'19 A', overpressure:'11,00 bar', speed:'2955 rpm'}
  },
  {
    name: 'Schneider Altivar 630 drive',
    source: 'Schneider Electric visible nameplate',
    text: 'Schneider Electric\nATV630U40N4\n4 kW 5 HP\nU 380-480 V 3ph\nF 50/60 Hz\nI 7.6 max A\nOutput 0-500 Hz 9.3 A\nIP21\n6W0502001001\nMade in Indonesia',
    expected: {manufacturer:'Schneider Electric', model:'ATV630U40N4', power:'4 kW', voltage:'380-480 V', phases:'3', frequency:'50/60 Hz', current:'7.6 A', ipRating:'IP21'}
  },
  {
    name: 'ABB ACS580 drive',
    source: 'IndustryMall visible label',
    text: 'ABB ACS580-01-033A-4\nABB Oy Helsinki Finland\nFRAME R3\nInput U1 3~ 400/480 V AC\nI1 32/27 A\nf1 50/60 Hz\nOutput U2 3~ 0...U1\nI2 32/27 A\nf2 0...500 Hz\nIP21\nS/N 41815A0559',
    expected: {manufacturer:'ABB', model:'ACS580-01-033A-4', voltage:'400/480 V', frequency:'50/60 Hz', current:'32/27 A', ipRating:'IP21', serialNumber:'41815A0559'}
  },
  {
    name: 'Siemens SINAMICS G120C drive',
    source: 'CP Automação visible label',
    text: 'SIEMENS\nSINAMICS Power Module G120C\n1P 6SL3210-1KE24-4UF1\nS T-R214700161\nInput: 3AC 380V - 480V\n47-63Hz 41A-34A\nOutput: 3AC 0 - input V\n0-550Hz 43-35A\nMotor: IEC 22kW\n17.00 kg',
    expected: {manufacturer:'Siemens', model:'6SL3210-1KE24-4UF1', serialNumber:'T-R214700161', voltage:'380-480 V', power:'22 kW', weight:'17.00 kg'}
  },
  {
    name: 'Copeland compressor',
    source: 'Genemco visible nameplate',
    text: 'Copeland\nMODEL 9RS3-076A-TFC-800\nSERIAL 12F62608R\n208-230V 3PH 60HZ\n200-220V 3PH 50HZ\nRLA 29.4 / 29.4\nLRA 164.0',
    expected: {manufacturer:'Copeland', model:'9RS3-076A-TFC-800', serialNumber:'12F62608R', phases:'3'}
  },
  {
    name: 'Bitzer compressor',
    source: 'HOS BV visible nameplate',
    text: 'BITZER KÜHLMASCHINENBAU GMBH\nTyp 4FC-3.2Y-40S\nS.Nr. 1682801217\nNennspannung V D 3Ph~ / V Y 3Ph~\n220-240 / 380-420 50 Hz\n265-290 / 440-480 60 Hz\nMax.Betr.strom A(D) 15,9 A(Y) 9,2\nAnlaufstrom 76,6 A\nIP 65\nND/HD max 19 / 28 bar',
    expected: {manufacturer:'BITZER KÜHLMASCHINENBAU GMBH', model:'4FC-3.2Y-40S', serialNumber:'1682801217', frequency:'50/60 Hz', ipRating:'IP 65'}
  },
  {
    name: 'Trane RTAC chiller',
    source: 'CAE visible nameplate',
    text: 'TRANE SERIES R\nMODEL NUMBER RTAC 3504 UODN 10FHN M1W1N\nRATED VOLTAGE/HZ/PH 460/60/3\nVOLT UTILIZATION RANGE 414-506\nCOMPR MTR 1A VOLT-AC 460 HZ 60 PH 3 RLA 133 Y LRA 252 X-L LRA 774\nFAN MTRS VOLT-AC 460 HZ 60 PH 3 QTY 24 HP EA 1.25 FLA EA 3.0',
    expected: {manufacturer:'Trane', model:'RTAC 3504 UODN 10FHN M1W1N', voltage:'460 V', frequency:'60 Hz', phases:'3'}
  },
  {
    name: 'Trane TACA chiller',
    source: 'Trane official manual visible nameplate',
    text: 'TRANE\nCHILLER OUTDOOR\nMODEL TACA240CT3012F\nSERIAL# AC23012620\nRATED POWER SUPPLY VOLTS 460 HZ 60 PH 3\nTOTAL AMPS 456 MCA 509 MOCP\nCOMPRESSOR MAKE DANFOSS TURBOCOR\nCOMPR MODEL TTS300HGS1S010XXXS350\nFAN MOTOR POWER 3.1 kW AMPS 5 RPM 1195\nREFRIGERANT R-513a\nAPPROXIMATE SHIPPING WEIGHT IN LBS 18600',
    expected: {manufacturer:'Trane', model:'TACA240CT3012F', serialNumber:'AC23012620', voltage:'460 V', frequency:'60 Hz', phases:'3', refrigerant:'R-513a'}
  },
  {
    name: 'SEW Eurodrive gearmotor',
    source: 'Werktuigen visible nameplate',
    text: 'SEW-EURODRIVE\nDRE132S4BE5/TF\nInverter duty VPWM\n3~ IEC60034\nV 220-242D / 380-420Y\nA 14.30/8.20\nCos phi 0.82\nIP 54\nVbr 24 DC\nNm 55\nMade in Germany',
    expected: {manufacturer:'SEW-EURODRIVE', model:'DRE132S4BE5/TF', ipRating:'IP 54'}
  },
  {
    name: 'PHARMAGG Kannegiesser washer-extractor',
    source: 'user supplied visible nameplate',
    text: 'PHARMAGG\nSYSTEMTECHNIK GMBH\nKannegiesser-Gruppe\nD 27318 Hoya\nTyp FU1400\nFabr. Nr. 14200005027\nBaujahr 2000\nFüllraum 1402 ltr.\nzul. Trockenfüllmenge 140 kg\nNennspannung 3 x 400 V\nNennfrequenz 50 Hz\nSchleuderdrehzahl nmax 660 U/min\nStromart AC\nKinetische Energie 338850 Nm\nNennstrom 32 A\nDruckluft Netzanschluß 10 bar\nAnschlußwert 15,5 kW\nDruckluft Betriebsdruck 6-8 bar\nAbsicherung 35 A\nBeheizungsart Dampf\nSchutzart IP54\nzul. Betriebstemperatur 95 C\nzulässiger Betriebsdruck 4-8 bar\nzul. Betriebsüberdruck 10 bar',
    expected: {manufacturer:'PHARMAGG', brand:'Kannegiesser', model:'FU1400', serialNumber:'14200005027', year:'2000', phases:'3', voltage:'400 V', frequency:'50 Hz', current:'32 A', power:'15,5 kW', capacity:'140 kg', volume:'1402 L', speed:'660 rpm', fuseRating:'35 A', heatingType:'Dampf', ipRating:'IP54', electricalType:'AC', kineticEnergy:'338850 Nm', airSupplyPressure:'10 bar', airPressure:'6-8 bar', workingPressure:'4-8 bar', overpressure:'10 bar', operatingTemperature:'95 °C'}
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
  report.push({name:fixture.name, expected:Object.keys(fixture.expected).length, failed:missing.length, missing});
}

console.log(JSON.stringify({
  fixtures: fixtures.length,
  checks,
  failures,
  passed: checks - failures,
  accuracy: checks ? Math.round((checks - failures) * 1000 / checks) / 10 : 0,
  report
}, null, 2));

if (failures) process.exitCode = 1;
