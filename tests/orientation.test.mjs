import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const start = app.indexOf('function clean');
const end = app.indexOf('function fillForm');

assert.ok(start >= 0 && end > start, 'Parser/orientation section not found in app.js');

const api = new Function(
  app.slice(start, end) + '\nreturn {parseNameplate, orientationScore};'
)();

const blochAngles = {
  0: '. | es Dl fee poe e . 3\n4 q \\ BA Ee = cam ims eu\n= | wy | |e|Clol a\n— ‘ oO] Pia eS Tee',
  90: '(uredg) - e1duayea - JeSseyjesse\nMOS" Yoo |qsequiog\n4d - 10 Islv AOSb/4UIg-Jopesuepuog',
  180: '= | eee\n9 » |O/2 (oie) ha\ne |2\\<|3|si=)\nao Sf a oe ~~',
  270: 'Monofasico 230 Volt 50 Hz 2850 rpm\n0.40 CV 0.30 Kw 2 amper IP 54\nCondensador 8mF/450V\nwww.bombasbloch.com\nMassalfassar Valencia Spain'
};

const scores = Object.fromEntries(
  Object.entries(blochAngles).map(([angle, text]) => [angle, api.orientationScore(text, 65)])
);

const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
assert.equal(best, '270', 'BLOCH sideways OCR should select the 270° orientation');
assert.ok(scores[270] > scores[0] + 60, 'Correct orientation should clearly outrank sideways garbage');

const bloch = api.parseNameplate(
  'BLOCH\nTipo - CPA 40M\nQ - 300/1800 lts/hora\nH - 35/5 metros\nasp.max.-7 metros\nroscas - 1"X1"\nMonofásico 230 Volt 50 Hz 2850 rpm\n0.40 CV 0.30 Kw 2 amper IP 54\nCondensador-8mF/450V\nAisl. CL - E\nwww.bombasbloch.com\nMassalfassar - Valencia - (Spain)'
);

assert.equal(bloch.manufacturer, 'BLOCH');
assert.equal(bloch.model, 'CPA 40M');
assert.equal(bloch.phases, '1');
assert.equal(bloch.voltage, '230 V');
assert.equal(bloch.frequency, '50 Hz');
assert.equal(bloch.power, '0.30 kW');
assert.equal(bloch.current, '2 A');
assert.equal(bloch.speed, '2850 rpm');
assert.equal(bloch.ipRating, 'IP 54');
assert.equal(bloch.flow, '300/1800 lts/hora');
assert.equal(bloch.head, '35/5 m');

console.log('PlateLens orientation regression: sideways BLOCH fixture passed');
