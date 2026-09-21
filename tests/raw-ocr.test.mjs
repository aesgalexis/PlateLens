import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const raw = fs.readFileSync(new URL('./fixtures/pharmagg-fu1400-raw.txt', import.meta.url), 'utf8');

const start = app.indexOf('function clean');
const end = app.indexOf('function fillForm');
assert.ok(start >= 0 && end > start, 'Parser section not found in app.js');

const parseNameplate = new Function(
  app.slice(start, end) + '\nreturn parseNameplate;'
)();

const result = parseNameplate(raw);

const expected = {
  manufacturer: 'PHARMAGG',
  brand: 'Kannegiesser',
  model: 'FU1400',
  serialNumber: '14200005027',
  phases: '3',
  voltage: '400 V',
  power: '15,5 kW',
  electricalType: 'AC',
  current: '32 A',
  capacity: '140 kg',
  volume: '1402 L',
  workingPressure: '4-8 bar',
  overpressure: '10 bar',
  airPressure: '6-8 bar',
  heatingType: 'Dampf',
  fuseRating: '35 A',
  kineticEnergy: '338850 Nm',
  operatingTemperature: '95 °C',
  year: '2000'
};

for (const [key, value] of Object.entries(expected)) {
  assert.equal(result[key], value, `${key}: expected "${value}", got "${result[key] || ''}"`);
}

// These values are visible on the source plate but are not reliably present
// in this raw OCR fixture. The parser must not invent them.
for (const key of ['frequency', 'speed', 'ipRating', 'airSupplyPressure']) {
  assert.equal(result[key] || '', '', `${key}: should remain empty for this raw OCR fixture`);
}

console.log(JSON.stringify({fixture:'pharmagg-fu1400-raw', fields:Object.keys(expected).length, status:'pass'}));
