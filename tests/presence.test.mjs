import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const start = app.indexOf('function clean');
const end = app.indexOf('function fillForm');
assert.ok(start >= 0 && end > start, 'Parser section not found');

const { detectFieldPresence } = new Function(
  app.slice(start, end) + '\nreturn {detectFieldPresence};'
)();

const seen = detectFieldPresence(
  'MODEL: ???\nSERIAL NO: unreadable\nVoltage:\nHz 50\nCurrent:\nIP 55'
);

for (const field of ['model','serialNumber','voltage','frequency','current','ipRating']) {
  assert.ok(seen.has(field), 'Expected presence detector to see ' + field);
}

const absent = detectFieldPresence('BLOCH\nwww.bombasbloch.com\nMassalfassar Valencia Spain');
assert.ok(!absent.has('voltage'));
assert.ok(!absent.has('current'));

console.log('PlateLens field-presence regression passed');
