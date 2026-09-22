import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const start = app.indexOf('function clean');
const end = app.indexOf('function fillForm');
assert.ok(start >= 0 && end > start, 'Parser/fusion section not found in app.js');

const {parseNameplate, fuseOcrPassCandidates} = new Function(
  app.slice(start, end) + '\nreturn {parseNameplate, fuseOcrPassCandidates};'
)();

{
  const fused = fuseOcrPassCandidates(
    'Example Industries\nRated voltage 400 V',
    [
      'Rated current 32 A\nExample Industries',
      'Nennstrom 32 A',
      '5 A'
    ]
  );
  assert.equal(fused.voltage, '400 V');
  assert.equal(fused.current, '32 A');
}

{
  const fused = fuseOcrPassCandidates(
    'Example Industries\nFuse 5 A',
    [
      'Fuse 35 A',
      'Absicherung 35 A',
      '5 A'
    ]
  );
  assert.equal(fused.fuseRating, '35 A');
}

{
  const fused = fuseOcrPassCandidates(
    'Example Industries\nVoltage label unreadable',
    [
      '5',
      'junk 999',
      'hello world'
    ]
  );
  assert.equal(fused.voltage || '', '');
}

{
  const fused = fuseOcrPassCandidates(
    'MODEL ABC100\nSERIAL REAL12345',
    [
      'MODEL XYZ900',
      'MODEL XYZ900',
      'SERIAL REAL12345'
    ]
  );
  assert.ok(String(fused.model || '').includes('ABC100'));
  assert.equal(fused.serialNumber, 'REAL12345');
}

console.log(JSON.stringify({suite:'candidate-fusion', status:'pass'}));
