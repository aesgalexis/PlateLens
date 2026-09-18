import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const start = app.indexOf('function clean');
const end = app.indexOf('function fillForm');
assert.ok(start >= 0 && end > start, 'Parser section not found');

const { parseNameplate } = new Function(
  app.slice(start, end) + '\nreturn {parseNameplate};'
)();

const plates = [
  {
    name: 'Atlas Copco GA22PLUS compressor',
    text: 'Atlas Copco\nType GA22PLUS\nSerial No API297360\nMax working pressure 8.9 bar\nQv 58.8 l/s 124.6 cfm 3.53 m3/min\nMotor 22 kW 30 HP\n3550 rpm\nWeight 500 kg\nYear 2006',
    expected: {manufacturer:'Atlas Copco', model:'GA22PLUS', serialNumber:'API297360', workingPressure:'8.9 bar', power:'22 kW', speed:'3550 rpm', year:'2006', weight:'500 kg'}
  },
  {
    name: 'Grundfos CRN45-1 pump',
    text: 'GRUNDFOS\nType CRN45-1 A-F-G-E-HQQE\nSerial 0002\n60 Hz\nP2 7.50 kW\nn 3525 min-1\nQ 54 m3/h\nH 28.1 m\nHmax 38.6 m\np/t 16/120 bar/C',
    expected: {manufacturer:'Grundfos', model:'CRN45-1 A-F-G-E-HQQE', serialNumber:'0002', frequency:'60 Hz', power:'7.50 kW', speed:'3525 rpm', flow:'54 m3/h', head:'28.1 m'}
  },
  {
    name: 'Primus FS16 washer',
    text: 'PRIMUS\nModel FS16\nEl. supply 3x380-415V+N 50Hz\nCapacity 16 kg\nMotor 2.2 kW\nHeating 12 kW\nTotal 14.3 kW\nSpin 1000 RPM\nFuse 32 A\nYear 2004',
    expected: {manufacturer:'Primus', model:'FS16', frequency:'50 Hz', capacity:'16 kg', speed:'1000 rpm', current:'32 A', year:'2004'}
  },
  {
    name: 'Siemens MICROMASTER Vector 6SE3221',
    text: 'SIEMENS\nMICROMASTER Vector\n6SE3221-0DC40\nINPUT 400/500 V ±10% 3 PH 13.6 A 47-63 Hz\nOUTPUT 0-INPUT V 3 PH 10.2 A 0-650 Hz\nMOTOR 5 HP 4000 W\nWEIGHT 3.6 kg\nIP20\nSERIAL XAL334MV557D',
    expected: {manufacturer:'Siemens', serialNumber:'XAL334MV557D', frequency:'47-63 Hz', current:'13.6 A', ipRating:'IP20', weight:'3.6 kg'}
  },
  {
    name: 'Danfoss VLT FC-302 drive',
    text: 'Danfoss\nVLT AutomationDrive\nT/C: FC-302P11KT5E20H1XGXXXXSXXXXA0BXCXX\nP/N: 131F8844\nS/N: 200406G143\n11kW(400V) / 15HP(460V)\nIN: 3x380-500V 50/60Hz 22/19A\nOUT: 3x0-Vin 0-590Hz 24/21A\nIP20',
    expected: {manufacturer:'Danfoss', partNumber:'131F8844', serialNumber:'200406G143', power:'11 kW', frequency:'50/60 Hz', current:'22/19 A', ipRating:'IP20'}
  },
  {
    name: 'KSB MCPK 40-25-160 pump',
    text: 'KSB\nMCPK 40-25-160\nP-No. 9972914162 / 00010002\nQ 2.20 m3/h\nH 37.1 m\nn 2902 1/min\nMat.-No. 01 109 122',
    expected: {manufacturer:'KSB', partNumber:'9972914162 / 00010002', flow:'2.20 m3/h', head:'37.1 m', speed:'2902 rpm'}
  },
  {
    name: 'Pedrollo PK300 pump',
    text: 'Pedrollo\nPK300\nQ 5-90 l/min\nH 95-10 m\nHmax 100 m\n3~\nP2 2.2 kW 3 HP\n50 Hz\nS1\n2900 min-1\nClass F\nIPX4\n220-230 V 9 A\n380-400 V 5.2 A',
    expected: {manufacturer:'Pedrollo', power:'2.2 kW', frequency:'50 Hz', speed:'2900 rpm', ipRating:'IPX4'}
  },
  {
    name: 'Flygt 3085.160 pump',
    text: 'Flygt\n3085.160-2070.003\nCode 462\n1.5 kW\n230 V\n9.4 A\n50 Hz\n1425 rpm\nS1\nIP68\nClass H\nMax 40 C\n66 kg',
    expected: {manufacturer:'Flygt', power:'1.5 kW', voltage:'230 V', current:'9.4 A', frequency:'50 Hz', speed:'1425 rpm', ipRating:'IP68', weight:'66 kg'}
  },
  {
    name: 'Wilo Helix VE1603 pump',
    text: 'Wilo\nType HELIX VE1603-4.0-1/16/E/KS\nArt.No 4148086\nPart 4199251\n50 Hz 400 V 9.1 A\n60 Hz 380/480 V 9.6/7.9 A\nP1 4.7 kW\nP2 4.0 kW\nIP55\nMass 58.7 kg',
    expected: {manufacturer:'Wilo', model:'HELIX VE1603-4.0-1/16/E/KS', frequency:'50 / 60 Hz', power:'4.7 kW', ipRating:'IP55', weight:'58.7 kg'}
  },
  {
    name: 'Grundfos CR10-12 pump',
    text: 'GRUNDFOS\nType CR10-12 A-FJ-A-E-HQQE\nModel A96501220P20610\nSerial 0002\n50 Hz\nP2 4.00 kW\nn 2917 min-1\nQ 10 m3/h\nH 96.7 m\nHmax 122 m\np/t 16/120 bar/C',
    expected: {manufacturer:'Grundfos', model:'CR10-12 A-FJ-A-E-HQQE', serialNumber:'0002', frequency:'50 Hz', power:'4.00 kW', speed:'2917 rpm', flow:'10 m3/h', head:'96.7 m'}
  },
  {
    name: 'Goulds 3196 pump',
    text: 'GOULDS PUMPS\nMODEL 3196\nSIZE 3X4-13\nSERIAL A752F740\nLUBE FLOOD OIL',
    expected: {manufacturer:'Goulds', model:'3196', serialNumber:'A752F740'}
  },
  {
    name: 'Kaeser ASD57 compressor',
    text: 'KAESER KOMPRESSOREN\nCompressor model ASD 57\n400 V 3 PH 50 Hz\nControl 230 V 1 PH 50 Hz\nRated current 61 A',
    expected: {manufacturer:'KAESER', model:'ASD 57', frequency:'50 Hz', current:'61 A'}
  },
  {
    name: 'CompAir 6100N08A compressor',
    text: 'CompAir\nMODEL 6100N08A\nSerial F142/0728\nYear 1996\nMax pressure 8 bar\nInput power 85.9 kW\nMotor speed 1480 rpm\n380/415 V 3 PH 50 Hz',
    expected: {manufacturer:'CompAir', model:'6100N08A', serialNumber:'F142/0728', year:'1996', workingPressure:'8 bar', power:'85.9 kW', speed:'1480 rpm', frequency:'50 Hz'}
  },
  {
    name: 'Bitzer 4FC-3.2Y compressor',
    text: 'BITZER\nType 4FC-3.2Y-40S\nS.Nr. 1682801217\n220-240D / 380-420Y 50 Hz\n265-290D / 440-480Y 60 Hz\nMax current 15.9 / 9.2 A\nStarting current 76.6 / 44.2 A\nIP65\nPS 19 / 28 bar',
    expected: {manufacturer:'Bitzer', model:'4FC-3.2Y-40S', serialNumber:'1682801217', frequency:'50 / 60 Hz', current:'15.9 / 9.2 A', ipRating:'IP65'}
  },
  {
    name: 'Danfoss MTZ100HS4VE compressor',
    text: 'Danfoss Compressor\nModel MTZ100HS4VE\nSerial DJ1006830090\n380-400 V 3~ 50 Hz\n460 V 3~ 60 Hz\nRefrigerant R407C R134a R404A R507\nPS 22.6 bar\nTS max 50 C TS min -35 C\nVolume 31 L',
    expected: {manufacturer:'Danfoss', model:'MTZ100HS4VE', serialNumber:'DJ1006830090', frequency:'50 / 60 Hz', workingPressure:'22.6 bar', capacity:'31 L'}
  },
  {
    name: 'Copeland LFP-20X-EWL compressor',
    text: 'Copeland\nLFP-20X-EWL\nSerial 18H010915M\nPS/PSS 32.5 / 22.5 bar\nV 12.90 m3/h\n1450 RPM\n3 PH\n50 Hz\n220-240D / 380-420Y\nLRA 59-64 / 34-37.6 A\nOperating max 9.5 / 5.5 A',
    expected: {manufacturer:'Copeland', serialNumber:'18H010915M', frequency:'50 Hz', speed:'1450 rpm', phases:'3'}
  },
  {
    name: 'Carrier 30XA1312 chiller',
    text: 'Carrier\nMODEL 30XA1312-A0041-PE-\nSERIAL M2016017766\nYEAR 2017\nRefrigerant R134a\nTransport charge 226 kg\nCircuit 1 110 kg Circuit 2 116 kg',
    expected: {manufacturer:'Carrier', model:'30XA1312-A0041-PE', serialNumber:'M2016017766', year:'2017', refrigerant:'R134a'}
  },
  {
    name: 'Daikin EWAD100E chiller',
    text: 'Daikin\nEWAD100E-SL008\nSerial 0V12-01082/40/1\nRefrigerant R134a 18 kg\nPS high 25.5 bar\nPS low 15.5 bar\nPT 28.1 bar\nTS -10/76 C',
    expected: {manufacturer:'Daikin', serialNumber:'0V12-01082/40/1', refrigerant:'R134a'}
  },
  {
    name: 'Trane RTHD C2 chiller',
    text: 'TRANE\nTYPE RTHD C2\nSERIAL EK N1638\nYEAR 2004\n400 V 50 Hz 3 PH\nA.MAX 349\nKW.MAX 209\nCONTROL 110 V 50 HZ 1 PH 865 VA\nSTARTING 1480 A',
    expected: {manufacturer:'Trane', model:'RTHD C2', year:'2004', voltage:'400 V', frequency:'50 Hz', phases:'3', current:'349 A', power:'209 kW'}
  },
  {
    name: 'Leroy-Somer LSMV100LR motor',
    text: 'Nidec Leroy-Somer\n3~ LSMV100LR\n2019 D96011 B19 001\nIP55 IK08\n28 kg\nIns cl F\nS1\n230 D 50 1455 2.20 0.79 7.80\n400 Y 50 1455 2.20 0.79 4.50\n460 Y 60 1760 2.20 0.76 3.90',
    expected: {manufacturer:'Leroy-Somer', year:'2019', serialNumber:'D96011', ipRating:'IP55', weight:'28 kg'}
  },
  {
    name: 'Motovario T80-B4 motor',
    text: 'Motovario\n3~ mot. T80-B4\nNr 1505012050\nIns F Tmax 40\nIP55 S1\n208 D 60 0.75 kW 1660 rpm\n230 D 60 0.75 kW 1690 rpm\n460 Y 60 0.90 kW 1700 rpm\n230 D 50 0.75 kW 1400 rpm\n400 Y 50 0.75 kW 1400 rpm',
    expected: {manufacturer:'Motovario', serialNumber:'1505012050', ipRating:'IP55'}
  },
  {
    name: 'Lenze GKR05 geared motor',
    text: 'Lenze\nGKR05-2M HAR 100C32\n3~ Mot EN60034\ni=10.720\nM2 202 Nm\nn2 134.8 r/min\n50 Hz\n3 kW\n265/460 V 60 Hz',
    expected: {manufacturer:'Lenze', ratio:'10.720', power:'3 kW'}
  },
  {
    name: 'NORD SK100AP motor',
    text: 'NORD DRIVESYSTEMS\nType SK 100AP/4TF\nYear 2016\nNo 35012085\nIns cl F IP55 S1\n230/400 V 50 Hz 10.5/6.06 A 3.00 kW 1460 rpm\n265/460 V 60 Hz 8.82/5.09 A 3.00 kW 1765 rpm\nIE3',
    expected: {manufacturer:'NORD', model:'SK 100AP/4TF', year:'2016', serialNumber:'35012085', ipRating:'IP55'}
  },
  {
    name: 'Bauer BS03 gearmotor',
    text: 'Bauer\nType BS03-54HO/D06LA4-TF\nMotor No M2052987-1\nID 9.481.3738.04\n0.25 kW\n60 Hz\nY 440 V 0.8 A\nn1 1620 /min\nn2 65 /min\nIP65\n6.9 kg',
    expected: {manufacturer:'Bauer', model:'BS03-54HO/D06LA4-TF', power:'0.25 kW', frequency:'60 Hz', current:'0.8 A', ipRating:'IP65', weight:'6.9 kg'}
  },
  {
    name: 'ABB ACS880 drive',
    text: 'ABB\nACS880-01-02A4-3+B056\nInput U1 3~ 400 V AC I1 2.4 A f1 50/60 Hz\nOutput U2 3~ 0..U1 I2 2.4 A f2 0..500 Hz Sn 1.7 kVA\nFrame R1\nIP55\nS/N 1174703219',
    expected: {manufacturer:'ABB', model:'ACS880-01-02A4-3+B056', serialNumber:'1174703219', current:'2.4 A', frequency:'50/60 Hz', apparentPower:'1.7 kVA', ipRating:'IP55'}
  },
  {
    name: 'Schneider Altivar 930 drive',
    text: 'Schneider Electric\nAltivar 930\nATV930D18N4\n18.5 kW 25 HP\nInput 380-480 V 3 PH 50/60 Hz 33.4 A max\nOutput 380-480 V 3 PH 0-500 Hz 39.2 A\nIP21',
    expected: {manufacturer:'Schneider Electric', model:'ATV930D18N4', power:'18.5 kW', frequency:'50/60 Hz', phases:'3', ipRating:'IP21'}
  },
  {
    name: 'Siemens SINAMICS G120C drive',
    text: 'SIEMENS\nSINAMICS G120C\nArticle No 6SL3210-1KE24-4UF1\nInput 3AC 380-480 V 47-63 Hz 41-34 A\nOutput 3AC 0-input V 0-550 Hz 43-35 A\nMotor IEC 22 kW\n17 kg',
    expected: {manufacturer:'Siemens', partNumber:'6SL3210-1KE24-4UF1', frequency:'47-63 Hz', power:'22 kW', weight:'17 kg'}
  },
  {
    name: 'TECO-Westinghouse GPV0036C motor',
    text: 'TECO-Westinghouse\nMODEL NO. GPV0036C\n3 HP\n1170 RPM\n230/460 V\n60 Hz\nFrame 213TC\nTEFC\nSF 1.15',
    expected: {manufacturer:'TECO-Westinghouse', model:'GPV0036C', speed:'1170 rpm', voltage:'230/460 V', frequency:'60 Hz'}
  },
  {
    name: 'Siemens 1LA7083 motor',
    text: 'SIEMENS\n3~ Mot 1LA7083-2AA10\n50 Hz 230/400 D/Y V 1.1 kW 4.2/2.40 A cos 0.87 2845/min\n60 Hz 460 Y V 1.3 kW 2.4 A cos 0.88 3435/min\nIP55',
    expected: {manufacturer:'Siemens', model:'1LA7083-2AA10', frequency:'50 / 60 Hz', power:'1.1 kW', current:'4.2/2.40 A', speed:'2845 rpm', ipRating:'IP55'}
  },
  {
    name: 'ABB M3AA112MB4 motor',
    text: 'ABB\n3~ Motor M3AA 112MB4\nYear 2021\nNo 3G3C2127400513\nIns cl F IP55\n50/60 Hz\n4/4.6 kW\nProduct code 3GAA112320-BSK',
    expected: {manufacturer:'ABB', year:'2021', serialNumber:'3G3C2127400513', ipRating:'IP55'}
  },
  {
    name: 'Trane RTAD115 chiller',
    text: 'TRANE\nTYPE RTAD 115\nSERIAL YACF049\nYEAR 2004\n400 V 50 Hz 3 PH\nC1 A.MAX 147 KW.MAX 91\nC2 A.MAX 147 KW.MAX 91\nCONTROL 110 V 50 Hz 1 PH 1648 VA\nRefrigerant R134a\nC1 44 kg C2 44 kg',
    expected: {manufacturer:'Trane', model:'RTAD 115', serialNumber:'YACF049', year:'2004', voltage:'400 V', frequency:'50 Hz', phases:'3', refrigerant:'R134a'}
  },
  {
    name: 'York YTG3A4E1 chiller',
    text: 'YORK\nUNIT MODEL YTG3A4E1-CNJ\nSERIAL GGKM-009063\nREFRIGERANT R-123\nCHARGE 1600 LB\nFIELD SUPPLY 460 V 3 PH 60 Hz',
    expected: {manufacturer:'York', serialNumber:'GGKM-009063', phases:'3', frequency:'60 Hz'}
  },
  {
    name: 'Bitzer 4CES-6Y compressor',
    text: 'BITZER\nType 4CES-6Y-40S\nS.Nr 1690210330\n220-240 D / 380-420 Y 50 Hz\n30.8 / 17.7 A\nStarting 143 / 82.4 A\n32.5 m3/h\n1450 rpm\n265-290 D / 440-480 Y 60 Hz\n39.2 m3/h\n1750 rpm\nIP65\nPS 19 / 32 bar',
    expected: {manufacturer:'Bitzer', model:'4CES-6Y-40S', serialNumber:'1690210330', frequency:'50 / 60 Hz', ipRating:'IP65'}
  },
  {
    name: 'SEW SA77 R37 gearmotor',
    text: 'SEW-EURODRIVE\nType SA77 R37 DT90S4\nNo. 64.1362611301.0001.10.40\n1.1 kW\n1400 rpm\n50 Hz\n230/400 D/Y V\nIP54\ncos 0.77\n124 Nm\n74.8 kg',
    expected: {manufacturer:'SEW-EURODRIVE', model:'SA77 R37 DT90S4', power:'1.1 kW', speed:'1400 rpm', frequency:'50 Hz', ipRating:'IP54', weight:'74.8 kg'}
  },
  {
    name: 'Ebara 65X50FS2H pump',
    text: 'EBARA\nMODEL 65X50FS2H\nSerial RW06107-01\nDate 1997\nQ 0.75 m3/min\nH 31.5 m\n7.5 kW\n3550 rpm',
    expected: {manufacturer:'EBARA', model:'65X50FS2H', serialNumber:'RW06107-01', power:'7.5 kW', speed:'3550 rpm', head:'31.5 m'}
  },
  {
    name: 'Bonfiglioli M2SB4 motor',
    text: 'Bonfiglioli\n3~ Mot M2SB4\nNo 74075860286\nIP55\n1.1 kW 50 Hz\n230/400 D/Y V 4.7/2.70 A 1400 rpm\n1.3 kW 60 Hz\n265/460 D/Y V 4.6/2.68 A 1700 rpm',
    expected: {manufacturer:'Bonfiglioli', serialNumber:'74075860286', ipRating:'IP55'}
  },
  {
    name: 'Busch R5 RA0040 vacuum pump',
    text: 'BUSCH R5\nType RA0040.E503.1002\nSerial No U124510229\nVacuum 0.5 hPa (0.5 mbar)\nOil ISO VG 100 / 1.0 LTR\n2012\nMade in U.S.A.',
    expected: {manufacturer:'Busch', model:'RA0040.E503.1002', serialNumber:'U124510229', workingPressure:'0.5 mbar', capacity:'1.0'}
  },
  {
    name: 'Lowara SV406F22TSP pump',
    text: 'Lowara\nSV406F22TSP\nPart # 107390561-00003\nQ 2.4-8 m3/h\nH 51-16 m\nHmax 60 m\nn 2900 rpm\nSerial 2006121800015\nDate 18/12/2006',
    expected: {manufacturer:'Lowara', serialNumber:'2006121800015', speed:'2900 rpm'}
  },
  {
    name: 'Calpeda NM4 125/250AE pump',
    text: 'Calpeda\nNM4 125/250AE\nNo 0506169606\nQ 84/330 m3/h\nH 22.7/9.3 m\nIP54\nn 1450 min-1\n15 kW 20 HP\ncos 0.84\n380-415 D / 660-720 Y 3~ 50 Hz\nS1 class F\n251 kg',
    expected: {manufacturer:'Calpeda', serialNumber:'0506169606', frequency:'50 Hz', power:'15 kW', speed:'1450 rpm', ipRating:'IP54', weight:'251 kg'}
  },
  {
    name: 'Flowserve Durco MK3 pump',
    text: 'FLOWSERVE\nSerial 1154638CHP003A\nPurchase Order 3304574\nModel MK3 STD\nSize 2K3X2-82RV\nMDP 250 PSI @ 100 F\nMaterial DCI\nDate 31/JUL/2014',
    expected: {manufacturer:'Flowserve', model:'MK3 STD', serialNumber:'1154638CHP003A', orderNumber:'3304574'}
  },
  {
    name: 'Sullair DPQ185CA compressor',
    text: 'SULLAIR\nMODEL NO. DPQ185CA\nWORK ORDER 4531396\nB.O.M. NO. 185F/244295A\nSERIAL NO. 202108090005\nYEAR 2021',
    expected: {manufacturer:'Sullair', model:'DPQ185CA', orderNumber:'4531396', serialNumber:'202108090005', year:'2021'}
  },
  {
    name: 'Gardner Denver VS25-40A compressor',
    text: 'Gardner Denver\nMODEL NO VS25-40A\nSERIAL S288907\nFULL LOAD OPERATING PRESSURE 100 PSIG\nINPUT 460 V\n60 Hz\n3 PH\nMFG DATE 7/08',
    expected: {manufacturer:'Gardner Denver', model:'VS25-40A', serialNumber:'S288907', workingPressure:'100 psig', voltage:'460 V', frequency:'60 Hz', phases:'3'}
  },
  {
    name: 'BOGE C10 LDR compressor',
    text: 'BOGE\nType C10 LDR-350\nYear 2012\nSerial 5061803\nFlow 1.060 m3/min\nMax service pressure 10 bar\nMotor speed 1500 min-1\nMotor power 7.50 kW',
    expected: {manufacturer:'BOGE', model:'C10 LDR-350', serialNumber:'5061803', year:'2012', workingPressure:'10 bar', power:'7.50 kW', speed:'1500 rpm'}
  },
  {
    name: 'Waukesha Cherry-Burrell 130 U2 pump',
    text: 'Waukesha Cherry-Burrell\nMODEL 130 U2\nDATE 11/08/13\nSERIAL 1000002887535',
    expected: {manufacturer:'Waukesha', model:'130 U2', serialNumber:'1000002887535'}
  },
  {
    name: 'Ingersoll-Rand SSR-EP125 compressor',
    text: 'INGERSOLL-RAND\nMODEL SSR-EP125\nCAPACITY 571 CFM\nRATED OPERATING PRESSURE 125 PSIG\nMAX DISCHARGE 128 PSIG\nDRIVE MOTOR 125 HP\nFAN 10 HP\nTOTAL PACKAGE AMPS 177\nVOLTS 460\nPHASE/HERTZ 3/60\nCONTROL VOLTAGE 120\nSERIAL F37991U01073',
    expected: {manufacturer:'Ingersoll Rand', model:'SSR-EP125', workingPressure:'125 psig', current:'177 A', voltage:'460 V', serialNumber:'F37991U01073'}
  },
  {
    name: 'Becker VTLF250 vacuum pump',
    text: 'BECKER\nType VTLF 250 SK\nYear 2005\nSerial A1975630\nSpeed 950-1150 min-1\nMotor 7.0/9.3 kW\nVacuum 480/1000 mbar',
    expected: {manufacturer:'Becker', model:'VTLF 250 SK', year:'2005', serialNumber:'A1975630', speed:'950-1150 rpm'}
  },
  {
    name: 'Armstrong 4030 pump',
    text: 'Armstrong\nMODEL NO 4030\nConstruction BF-STD\nSerial C672385\nPump Capacity 168.1 USgpm at 92.4 ft\nMax Pressure 175 psi\nMax Temp 250 F\nMotor 7.5 HP 1800 RPM',
    expected: {manufacturer:'Armstrong', model:'4030', serialNumber:'C672385', speed:'1800 rpm'}
  },
  {
    name: 'Quincy QGS-15 compressor',
    text: 'QUINCY\nMODEL QGS-15\nSerial CAI523991\nBuilt 2011\nCapacity 56 CFM\nWorking pressure 125 PSI\n15 HP\n3 PH 60 Hz 230 V',
    expected: {manufacturer:'Quincy', model:'QGS-15', serialNumber:'CAI523991', year:'2011', workingPressure:'125 PSI', phases:'3', frequency:'60 Hz', voltage:'230 V'}
  },
  {
    name: 'ELGi EN11-9.5V compressor',
    text: 'ELGI\nType EN 11-9.5 V\nFab No UVCC376216\nYear 2022\nMotor 11 kW\nCapacity 1.53 m3/min\nRated pressure 9.5 bar.g',
    expected: {manufacturer:'ELGi', model:'EN 11-9.5 V', year:'2022', power:'11 kW'}
  },
  {
    name: 'Bell & Gossett Series 90 pump',
    text: 'Bell & Gossett\nMODEL 90\nSIZE 2AA 4.5BF\nPUMP CAPACITY 65 GPM 15 FT\nMOTOR CAPACITY 5 HP 1800 RPM\nSERIAL 2136508-01 HR',
    expected: {manufacturer:'Bell & Gossett', model:'90', serialNumber:'2136508-01', flow:'65 GPM', speed:'1800 rpm'}
  }
];

assert.equal(plates.length, 50, 'Online real-photo corpus must contain exactly 50 distinct plates');

let checked = 0;
for (const plate of plates) {
  const result = parseNameplate(plate.text);
  for (const [key, expected] of Object.entries(plate.expected)) {
    const actual = String(result[key] || '');
    assert.ok(
      actual.toLowerCase().includes(String(expected).toLowerCase()),
      plate.name + ': expected ' + key + ' to include "' + expected + '", got "' + actual + '"'
    );
    checked++;
  }
}

console.log('PlateLens online-photo corpus: 50 distinct real plates passed (' + checked + ' assertions)');
