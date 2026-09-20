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
      frequency: '50 / 60 Hz'
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
  },
  {
    name: 'Trane ERTHA 450 chiller',
    text: 'TRANE\nN° DE MODELE - MODELL - MODEL - MODELLO - MODELO\nERTHA450RS1P3A1AB1XXXTZB5D1YXXA1AXXX\nN° DE SERIE - WORKS N° - SERIAL N° EKTR 352\nANNEE - BAUJAHR - YEAR 1995\nREFRIGERANT R134a\nC1 20.8 Kg\nLP 17 bar HP 23 bar\nC1 37.5 L\nCOMPRESSOR C1 U/VOLT 380 HZ 50 PH 3 A.MAX 400 KW.MAX 236\nCONTROL 110 V 50 HZ 1 PH 1500 VA\nTRANE 88190 GOLBEY FRANCE',
    expected: {
      manufacturer: 'Trane',
      model: 'ERTHA450RS1P3A1AB1XXXTZB5D1YXXA1AXXX',
      serialNumber: 'EKTR 352',
      year: '1995',
      refrigerant: 'R134a',
      voltage: '380 V',
      frequency: '50 Hz',
      phases: '3',
      current: '400 A',
      power: '236 kW'
    }
  },
  {
    name: 'Alfa Laval M3-FG exchanger',
    text: 'ALFA LAVAL\nCertified by Alfa Laval - Richmond, VA\nMAWP 150 PSI AT 150 F\nMDMT -20 F AT 150 PSI\nS/N 30117-59880 Year 2018\nModel M3-FG\nArea 52 SQ FT\nA-Dim 51 MM W/17 0.6 MM PLTS\nOrder 8111829\nP.O. 139017-00\nTAG 9633858',
    expected: {
      manufacturer: 'Alfa Laval',
      model: 'M3-FG',
      serialNumber: '30117-59880',
      year: '2018',
      workingPressure: '150 PSI',
      orderNumber: '8111829'
    }
  },
  {
    name: 'Schneider 2000 kVA transformer',
    text: 'Schneider Electric\nTYPE DCU 4331 YEAR 2020 NR 123456\nMODEL DISTRIBUTION TRANSFORMER PHASE 3 FREQUENCY 50 Hz\nRATED POWER 2000 kVA\nRATED VOLTAGE 11550 V 433 V\nRATED CURRENT 100.47 A 2666.7 A\nVECTOR GROUP Dyn11\nCOOLING METHOD KNAN\nTOTAL WEIGHT 5491 kg\nFLUID TYPE MIDEL 7131',
    expected: {
      manufacturer: 'Schneider Electric',
      model: 'DCU 4331',
      year: '2020',
      phases: '3',
      frequency: '50 Hz',
      apparentPower: '2000 kVA',
      weight: '5491 kg'
    }
  },
  {
    name: 'Cleaver-Brooks CB200-400 boiler',
    text: 'Cleaver Brooks\nCB Packaged\nMODEL CB200-400\nSERIAL NO L-57764\nPRESSURE 150 PSI\nDATE 12 31 1973\nINPUT 1 673 800 BTU/HR\nNAT GAS\nCleaver-Brooks Company',
    expected: {
      manufacturer: 'Cleaver-Brooks',
      model: 'CB200-400',
      serialNumber: 'L-57764',
      workingPressure: '150 PSI',
      year: '1973'
    }
  },
  {
    name: 'Parker PV Plus hydraulic pump',
    text: 'Parker\nPMDE - Chemnitz\nMade in Germany\nTyp PV092R1K4T1NFDV\n35296681/001\ncm3/U\nCode LI Serie 4545\nnmax 2300 U/min\npmax 420 bar',
    expected: {
      manufacturer: 'Parker',
      model: 'PV092R1K4T1NFDV',
      serialNumber: '35296681/001',
      speed: '2300 rpm',
      workingPressure: '420 bar'
    }
  },
  {
    name: 'Riello 40 G10 LC burner',
    text: 'RIELLO 40 G10 LC\nTIPO/TYPE 464T1 COD. 20013617\nN. 18221165963\nDZUU 4,5 ÷ 10 kg/h\n230V ~ 50Hz 0,17kW\n54 ÷ 120 kW\nCombust. Heizöl/Fuel\nRIELLO HEATING EQUIPMENT',
    expected: {
      manufacturer: 'Riello',
      model: '40 G10 LC',
      serialNumber: '18221165963',
      partNumber: '20013617',
      voltage: '230 V',
      frequency: '50 Hz',
      power: '0,17 kW'
    }
  },
  {
    name: 'Busch R5 vacuum pump',
    text: 'BUSCH R5\nType RA0040.E503.1002\nSerial No. U124510229\nVacuum 0.5 hPa (0.5 mbar)\nOil ISO VG 100 / 1.0 LTR.\n2012\nMade in U.S.A.',
    expected: {
      manufacturer: 'Busch',
      model: 'RA0040.E503.1002',
      serialNumber: 'U124510229',
      year: '2012',
      workingPressure: '0.5 mbar',
      capacity: '1.0'
    }
  },
  {
    name: 'Ingersoll Rand D144IN dryer',
    text: 'INGERSOLL RAND\nREFRIGERATED COMPRESSED AIR DRYER\nMODEL D144IN\n85 cfm\nPOWER 0,75 kW\nSUPPLY 115/1/60\n8 A\nCOOLING FLUID REFRIGERANT R134a\nMAX INLET AIR TEMP 140 F\nAMBIENT MAX TEMP 122 F\nMAX IN AIR PRESSURE 203 psig\nAIR WORKING PRESS. 101 psig\nLOW SIDE 116 psig HIGH SIDE 261 psig\nDate 1107',
    expected: {
      manufacturer: 'Ingersoll Rand',
      model: 'D144IN',
      power: '0,75 kW',
      current: '8 A',
      refrigerant: 'R134a',
      workingPressure: '101 psig'
    }
  },
  {
    name: 'Falk RK1070F3A gearbox',
    text: 'FALK\nENCLOSED GEAR DRIVE\nMODEL RK1070F3A\nRATIO 151:1\nINPUT RPM 1750\nOUTPUT RPM 11\nSERVICE RATING HP 5\nAPPROX. U.S. GALS. 7.0\nDATE 1/96\nTHE FALK CORPORATION',
    expected: {
      manufacturer: 'Falk',
      model: 'RK1070F3A',
      ratio: '151:1',
      speed: '1750 rpm',
      capacity: '7.0'
    }
  },
  {
    name: 'Sullair 1509EV AC compressor',
    text: 'SULLAIR\nYEAR 2020\nWORK ORDER 4495022 B.O.M. NO. P8/230518A\nMODEL NO. 1509EV AC\n125 PSI 80.9 CFM 8.6 Bar 2.3 m3/min\nMax. Opr. Pres. 135 PSI 9.3 Bar\nMin. Opr. Pres. 125 PSI 8.6 Bar\nRelief Pres. 160 PSI 11 Bar\n1765 RPM 460 VOLTS 60 Hz 3 PH 22.6 BHP 19.3 KW\nSERIAL NO. 202002120055',
    expected: {
      manufacturer: 'Sullair',
      model: '1509EV AC',
      serialNumber: '202002120055',
      orderNumber: '4495022',
      year: '2020',
      voltage: '460 V',
      frequency: '60 Hz',
      phases: '3',
      power: '19.3 kW',
      speed: '1765 rpm'
    }
  },
  {
    name: 'Baldor-Reliance Severe Duty XT motor',
    text: 'BALDOR RELIANCE\nSEVERE DUTY XT\nCAT. NO. XT3156T\nSPEC. 10-0001432\nFRAME 284T\nVOLTS 230/460\nF.L. AMPS 38.8/19.4\nR.P.M. 1180\nHZ 60\nSER. F. 1.15\nNEMA NOM. EFF. 91.7\nH.P. 15\nP.F. 77%\nCLASS F\nENCL TEFC',
    expected: {
      manufacturer: 'Baldor-Reliance',
      partNumber: 'XT3156T',
      voltage: '230/460 V',
      current: '38.8/19.4 A',
      speed: '1180 rpm',
      frequency: '60 Hz'
    }
  },
  {
    name: 'Leeson C145 motor',
    text: 'LEESON\nCAT. NO./PART NO. 120086.00\nMODEL C145T34FB2C\nV. 208-230\nV. 460\nR.P.M. 3450/2850\nH.P. 1 1/2\nF.L.A. 4.2/4.8\nF.L.A. 2.1/2.4\nHZ 60/50\nFR. F45\nP.F. 86\nEFF. 80\nTYPE TF\nSER. FACT. 1.15\nDUTY CONT.\nMAX. AMB. 40 C\nINSUL. CLASS B2\nPH. 3',
    expected: {
      manufacturer: 'Leeson',
      model: 'C145T34FB2C',
      partNumber: '120086.00',
      frequency: '60/50 Hz',
      phases: '3',
      speed: '3450/2850 rpm'
    }
  },
  {
    name: 'Brook Crompton Series 30 motor',
    text: 'BROOK CROMPTON HUDDERSFIELD UK\n3~ AC MOTOR IEC 60034\nSeries 30\nTYPE JP-DH18BLH\nP/No 168249283\nNo 162688093545\nYR 21\nV Hz kW r/min A cosφ\nΔ 230 50 2.2 1445 8.70 0.73\nY 400 50 2.2 1445 5.00 0.73\nY 460 60 2.2 1725 4.20 0.73\nIP 55\n22 kg',
    expected: {
      manufacturer: 'Brook Crompton',
      model: 'JP-DH18BLH',
      partNumber: '168249283',
      voltage: '230 / 400 / 460 V',
      frequency: '50 / 60 Hz',
      power: '2.2 kW',
      current: '8.70 / 5.00 / 4.20 A',
      speed: '1445 / 1725 rpm',
      ipRating: 'IP 55',
      weight: '22 kg'
    }
  },
  {
    name: 'Marathon R508A motor',
    text: 'MARATHON ELECTRIC\nMODEL R508A\nFRAME 315S\nPH 3\nHP 100 / 75\nKW 75.0 / 55.0\nVOLTS 230/460 / 200/400\nHZ 60 / 50\nRPM 1190 / 995\nAMPS 246/123 / 220/110\nSF 1.15\nIP55\nPF 81\nDUTY CONTINUOUS\nINS CLASS F',
    expected: {
      manufacturer: 'Marathon',
      model: 'R508A',
      phases: '3',
      voltage: '230/460 / 200/400 V',
      frequency: '60 / 50 Hz',
      power: '75.0 / 55.0 kW',
      current: '246/123 / 220/110 A',
      speed: '1190 / 995 rpm',
      ipRating: 'IP55'
    }
  },
  {
    name: 'Toshiba EQP Global 840 motor',
    text: 'TOSHIBA\nEQP GLOBAL 840\nMODEL 0104XSSB41A-P\nHP 10\nkW 7.5\nFRAME 215T\nVOLTS 460\nFLAMPS 13\nFREQUENCY 60 Hz\nPHASE 3\nFLRPM 1760\nIP55\nINSUL CLASS F\nDUTY CONT\nNOM. EFF. 91.7\nPF 80.2',
    expected: {
      manufacturer: 'Toshiba',
      model: '0104XSSB41A-P',
      voltage: '460 V',
      current: '13 A',
      frequency: '60 Hz',
      phases: '3',
      power: '7.5 kW',
      speed: '1760 rpm',
      ipRating: 'IP55'
    }
  },
  {
    name: 'ABB ACS580 drive',
    text: 'ABB\nACS580-01-087A-4\nFRAME R5\nIP21 UL type 1\nInput U1 3~ 400/480 V AC I1 87/77 A f1 50/60 Hz\nOutput U2 3~ 0...U1 I2 87/77 A f2 0...500 Hz\nS/N: 1141104909\nMADE IN FINLAND',
    expected: {
      manufacturer: 'ABB',
      model: 'ACS580-01-087A-4',
      serialNumber: '1141104909',
      voltage: '400/480 V',
      current: '87/77 A',
      frequency: '50/60 Hz',
      ipRating: 'IP21'
    }
  },
  {
    name: 'Schneider Altivar ATV320 drive',
    text: 'Schneider Electric\nAltivar 320\nATV320U04N4C\n0.37kW - 1/2Hp\nU(V) 380-500\nF(Hz) 50/60\nI(A) 1.5\nIP20\nS/N 8B2048101001\nMade in Indonesia',
    expected: {
      manufacturer: 'Schneider Electric',
      model: 'ATV320U04N4C',
      serialNumber: '8B2048101001',
      voltage: '380-500 V',
      frequency: '50/60 Hz',
      power: '0.37 kW',
      current: '1.5 A',
      ipRating: 'IP20'
    }
  },
  {
    name: 'Mitsubishi FR-A800 drive',
    text: 'MITSUBISHI ELECTRIC\nINVERTER\nMODEL: FR-A820-00046-1-N6\nINPUT: 3PH 200-240V 50/60Hz\nOUTPUT: 3PH 0-240V 0.2-590Hz 4.6A\nSERIAL: A26X123456\nDATE: 2026-06\nMADE IN JAPAN',
    expected: {
      manufacturer: 'Mitsubishi Electric',
      model: 'FR-A820-00046-1-N6',
      serialNumber: 'A26X123456',
      voltage: '200-240 V',
      frequency: '50/60 Hz',
      current: '4.6 A',
      date: '2026-06'
    }
  },
  {
    name: 'Siemens SINAMICS G120 PM240-2 drive',
    text: 'SIEMENS\nSINAMICS G120\nPOWER MODULE PM240-2\nArticle No. 6SL3210-1PE24-5UL0\n3AC380-480V +10/-20% 47-63Hz\nOUTPUT HIGH OVERLOAD 18.5kW\nOUTPUT LOW OVERLOAD 22kW\nFSD\nIP20',
    expected: {
      manufacturer: 'Siemens',
      model: 'PM240-2',
      partNumber: '6SL3210-1PE24-5UL0',
      voltage: '380-480 V',
      frequency: '47-63 Hz',
      power: '18.5 kW',
      ipRating: 'IP20'
    }
  },
  {
    name: 'Allen-Bradley PowerFlex 525 drive',
    text: 'Allen-Bradley\nPowerFlex 525\nCat. No. 25B-D010N104\n380...480V AC\n3 Phase\n10.5 Amps\n5 Hp\n4 kW\nFrame B\nIP20 NEMA / Open Type\nSERIES A',
    expected: {
      manufacturer: 'Allen-Bradley',
      model: 'PowerFlex 525',
      partNumber: '25B-D010N104',
      voltage: '380...480 V',
      phases: '3',
      current: '10.5 A',
      power: '4 kW',
      ipRating: 'IP20'
    }
  },
  {
    name: 'WEG W20 General Purpose motor',
    text: 'WEG W20 General Purpose\nW3EA1324B3T003\n3~ 132S-4 DUTY S1 IP55 DES N IEC 60034-1\n55.7KG 1000m.a.s.l. INS cl. F DT 80K AMB 40°C SF 1.00\nV Hz kW RPM A PF IE\n400Y 50 5.5 1470 11.4 0.78 IE3\n690D 50 5.5 1470 6.6 0.78 IE3\nMP05988379 01012025',
    expected: {
      manufacturer: 'WEG',
      model: 'W3EA1324B3T003',
      voltage: '400Y / 690D V',
      frequency: '50 Hz',
      power: '5.5 kW',
      current: '11.4 / 6.6 A',
      speed: '1470 rpm',
      weight: '55.7 kg',
      ipRating: 'IP55'
    }
  },
  {
    name: 'WEG W51 HD motor',
    text: 'WEG\nW51 HD\n01MAR22\n0000000000\n355H/G-04\nDUTY S1 INS CL F AMB 40°C IP55\n321kg\nV Hz kW RPM A PF\n400D 50 250 1492 560 0.82',
    expected: {
      manufacturer: 'WEG',
      model: '355H/G-04',
      serialNumber: '0000000000',
      year: '22',
      voltage: '400D V',
      frequency: '50 Hz',
      power: '250 kW',
      current: '560 A',
      speed: '1492 rpm',
      weight: '321 kg',
      ipRating: 'IP55'
    }
  },
  {
    name: 'ABB M3BP 160MLA motor',
    text: 'ABB Oy\nIEC LV Motors\n3~ Motor\nM3BP 160MLA 4 IMB3/IM1001\nyear 2023\nNo. 3G1F2309109029\nIns. cl. F IP 55\nV Hz kW r/min A cos φ Duty\n690 Y 50 11 1477 12.2 0.82 S1\n400 D 50 11 1477 21.1 0.82 S1\n460 D 60 11 1780 18.9 0.80 S1\n3GBP162410-ADK +VC\n188 kg',
    expected: {
      manufacturer: 'ABB',
      model: 'M3BP 160MLA 4',
      serialNumber: '3G1F2309109029',
      year: '2023',
      voltage: '690 Y / 400 D / 460 D V',
      frequency: '50 / 60 Hz',
      power: '11 kW',
      current: '12.2 / 21.1 / 18.9 A',
      speed: '1477 / 1780 rpm',
      weight: '188 kg',
      ipRating: 'IP 55'
    }
  },
  {
    name: 'ABB M3BP 280SMA motor',
    text: 'ABB Oy\nIEC LV Motors\n3~ Motor M3BP 280SMA 4 IMB3/IM1001\nyear 2023 No. 3GIF2309911730\nIns. cl. F IP 55\nV Hz kW r/min A cos φ Duty\n690 Y 50 75 1484 78 0.85 S1\n400 D 50 75 1484 134 0.85 S1\n415 D 50 75 1485 131 0.84 S1\nProduct code 3GBP282210-ADG +VC\nNmax 2600 r/min\n635 kg',
    expected: {
      manufacturer: 'ABB',
      model: 'M3BP 280SMA 4',
      serialNumber: '3GIF2309911730',
      partNumber: '3GBP282210-ADG',
      year: '2023',
      power: '75 kW',
      speed: '1484 / 1485 rpm',
      weight: '635 kg',
      ipRating: 'IP 55'
    }
  },
  {
    name: 'Schneider Altivar ATV630 nameplate',
    text: 'Schneider Electric\nAltivar 630\nATV630U40N4\n4kW - 5HP\nV1.0 IE00\nInput 3 phases 380...480 V 50/60 Hz\nOutput 3 phases 0...480 V\nIP21\nS/N 4009008A213682012',
    expected: {
      manufacturer: 'Schneider Electric',
      model: 'ATV630U40N4',
      serialNumber: '4009008A213682012',
      voltage: '380...480 V',
      frequency: '50/60 Hz',
      power: '4 kW',
      ipRating: 'IP21'
    }
  },
  {
    name: 'Mitsubishi FR-E800 nameplate',
    text: 'MITSUBISHI ELECTRIC\nINVERTER\nMODEL: FR-E820-0008EPA\nINPUT: 3PH 200-240V 50/60Hz\nOUTPUT: 3PH 0-240V 0.2-590Hz\nSERIAL: A24X123456\nMADE IN JAPAN',
    expected: {
      manufacturer: 'Mitsubishi Electric',
      model: 'FR-E820-0008EPA',
      serialNumber: 'A24X123456',
      voltage: '200-240 V',
      frequency: '50/60 Hz',
      phases: '3'
    }
  },
  {
    name: 'Allen-Bradley PowerFlex 755TM nameplate',
    text: 'Allen-Bradley\nPowerFlex 755TM\nCat No: 20JEH3D740LNANNNNN-C1-P18 Series A\nInput: 3-Phase 60Hz AC Voltage 480 Amps LD/ND/HD 100/90/80\nOutput: 3-Phase 47-63Hz AC Voltage Range 0-460\nPower LD/ND/HD 75/60/50 kW\nControl Power: 240V AC 50/60 Hz 3.34 A 0.8kVA\nDATE 2019/03/20\nSerial Number: 1234567890',
    expected: {
      manufacturer: 'Allen-Bradley',
      model: 'PowerFlex 755TM',
      partNumber: '20JEH3D740LNANNNNN-C1-P18',
      serialNumber: '1234567890',
      date: '2019/03/20',
      phases: '3',
      voltage: '480 V',
      frequency: '60 Hz',
      power: '75/60/50 kW',
      current: '100/90/80 A'
    }
  },
  {
    name: 'Siemens 1FT7 motor',
    text: 'SIEMENS\n3 ~ Mot. 1FT7105-5AF71-1CH1-Z\nNo.YF: F9621 1798 01 001\nMo 50 Nm Io 26 A nmax 3500 /min\nMN 28,0 Nm IN 15,0 A nN 3000 /min\nTh.Cl. 155(F) UIN 375 V\nBrake 24 VDC 36.5W 85 Nm\nIP 65',
    expected: {
      manufacturer: 'Siemens',
      model: '1FT7105-5AF71-1CH1-Z',
      current: '26 A',
      voltage: '375 V',
      speed: '3500 rpm',
      ipRating: 'IP 65'
    }
  },
  {
    name: 'Siemens 1FG geared motor',
    text: 'SIEMENS\n1FG 1508-1UG53-2FE1-Z\nYF J4635 6012 01 001\nSIMOTICS 1P\n3 ~ Mot S\nK79\ni = 10,51 [1209/115]\nM2max 445 Nm\nn2max 428 /min\nI0,M 29,0 A\nn1max 4500 /min\nIP 65\nmges 86 kg\nBRAKE 24VDC 38W 19Nm',
    expected: {
      manufacturer: 'Siemens',
      model: '1FG 1508-1UG53-2FE1-Z',
      ratio: '10,51',
      current: '29,0 A',
      speed: '4500 rpm',
      ipRating: 'IP 65',
      weight: '86 kg'
    }
  },
  {
    name: 'Danfoss FC302 enclosed drive',
    text: 'VLT AutomationDrive\nwww.danfoss.com\nT/C: PLV302T7I710C1XMXXXXXXAXL21XXXXXXXX2 XXXX\nSN: 123456H128\nMains voltage 525-690 V\nModel N160\nBuild date 232\nDanfoss A/S',
    expected: {
      manufacturer: 'Danfoss',
      model: 'PLV302T7I710C1XMXXXXXXAXL21XXXXXXXX2',
      serialNumber: '123456H128',
      voltage: '525-690 V'
    }
  },
  {
    name: 'PHARMAGG Kannegiesser fallback',
    text: 'Kannegiesser-Gruppe\nD 27318 Hoya\nTyp 133\nFabr. Nr. 14200005027\nBaujahr 2000\nNennspannung 3 x 400 V\nNennfrequenz 50 Hz\nAnschlußwert 15,5 kW\n6 A\nBeheizungsart zul\nE.14.2000\nFU1400',
    expected: {
      manufacturer: 'PHARMAGG',
      model: 'FU1400',
      serialNumber: '14200005027',
      year: '2000',
      phases: '3',
      voltage: '400 V',
      frequency: '50 Hz',
      power: '15,5 kW'
    },
    absent: ['current','ratio','heatingType','equipment']
  },
  {
    name: 'PHARMAGG two-digit Baujahr recovery',
    text: 'PHARMAGG\nKannegiesser-Gruppe\nTyp FU1400\nFabr. Nr. 14200005027\nBaujahr 14\nE.14.2000\nNennspannung 3 x 400 V\nBeheizungsart Dampf',
    expected: {
      manufacturer: 'PHARMAGG',
      model: 'FU1400',
      serialNumber: '14200005027',
      year: '2000',
      voltage: '400 V',
      heatingType: 'Dampf'
    }
  },
  {
    name: 'PHARMAGG false-positive rejection',
    text: 'PHARMAGG\nTEMTECHNIK-GMBH\nKannegiesser-Gruppe\nTyp o\nTEMTECHNIK-GMBH\nBaujahr 2000\nNennfrequenz 50 Hz\nAnschlußwert 15,5 kW\n5 A\ni=3\nFU1400\nFabr. Nr. 14200005027\nNennstrom 32 A\nNennspannung 3 x 400 V\nSchutzart IP54',
    expected: {
      manufacturer: 'PHARMAGG',
      model: 'FU1400',
      serialNumber: '14200005027',
      year: '2000',
      voltage: '400 V',
      current: '32 A',
      power: '15,5 kW',
      ipRating: 'IP54'
    },
    absent: ['ratio']
  },
  {
    name: 'PHARMAGG FU1400 noisy real OCR',
    text: 'PHARMAGG\nSYSTEMTECHNIK-CMBH\nKannegiesser’- Gruppe\nD 27318 Hoya\nTyp FU1400\nFabr.Nr. 14200005027\nBaujahr 2000\nSchaltplan.Nr. 05.027\nFüllraum 1402 ltr.\nzul.Trocken- füllmenge 140 kg\nNennspannung 3 X 400 V\nNennfrequenz 50 Hz\nSchleuderdreh -zahl nmax 660 U/min\nStromart AC\nKinetische Energie 338850 Nm\nNennstrom 32 A\nDruckluft Netzanschluß 10 bar\nAnschlußWert 15,5 kW\nDruckluft Betriebsdruck 6-8 bar\nAbsicherung 35 A\nBeheizungsart Dampf\nSchutzart IP54\nzul. Betriebstemperatur 95 C\nzulässiger Betriebsdruck 4-8 bar\nzul. Betriebsüberdruck 10 bar',
    expected: {
      manufacturer: 'PHARMAGG',
      brand: 'Kannegiesser',
      model: 'FU1400',
      serialNumber: '14200005027',
      year: '2000',
      phases: '3',
      voltage: '400 V',
      frequency: '50 Hz',
      current: '32 A',
      electricalType: 'AC',
      power: '15,5 kW',
      fuseRating: '35 A',
      ipRating: 'IP54',
      kineticEnergy: '338850 Nm',
      capacity: '140 kg',
      volume: '1402 L',
      speed: '660 rpm',
      airSupplyPressure: '10 bar',
      airPressure: '6-8 bar',
      heatingType: 'Dampf',
      operatingTemperature: '95 °C',
      workingPressure: '4-8 bar',
      overpressure: '10 bar'
    }
  },
  {
    name: 'BLOCH damaged real OCR',
    text: 'se dE\nC€\nfay\n35/5 metros\nscas -1”X1"\nonofasico\n2850 om\n0.40 CV\n0.30 Kw\nIP 54\nndensador-8mF/450V\nAis. CL - E\nwww.bombashbloch.com\nMassaifassar - Valencia - (Spain)\nwww.bombasbloch.com\n40M\n35/5 m tros\n50 Hz\nMonofasico\n2850 rpm\n2 ampe\nCondensador-8mF/450V\nAisl. CL - E',
    expected: {
      manufacturer: 'BLOCH',
      model: '40M',
      phases: '1',
      frequency: '50 Hz',
      power: '0.30 kW',
      current: '2 A',
      speed: '2850 rpm',
      ipRating: 'IP 54',
      head: '35/5 m'
    },
    absent: ['voltage']
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
  for (const key of fixture.absent || []) {
    assert.equal(
      result[key] || '',
      '',
      fixture.name + ': expected ' + key + ' to remain empty, got "' + (result[key] || '') + '"'
    );
  }
}

console.log('PlateLens parser regression: ' + fixtures.length + ' fixtures passed');
