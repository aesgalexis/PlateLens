import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const manifest = JSON.parse(
  fs.readFileSync(new URL('./ocr-corpus.json', import.meta.url), 'utf8')
);

const start = app.indexOf('function clean');
const end = app.indexOf('function fillForm');
assert.ok(start >= 0 && end > start, 'Parser section not found in app.js');

const parseNameplate = new Function(
  app.slice(start, end) + '\nreturn parseNameplate;'
)();

let checks = 0;
let failures = 0;
const report = [];

for (const fixture of manifest.cases) {
  const raw = fs.readFileSync(new URL('./' + fixture.raw, import.meta.url), 'utf8');
  const result = parseNameplate(raw);
  const errors = [];

  for (const [key, expected] of Object.entries(fixture.expected || {})) {
    checks++;
    const actual = String(result[key] || '');
    if (actual !== String(expected)) {
      failures++;
      errors.push({key, expected, actual});
    }
  }

  for (const key of fixture.mustRemainEmpty || []) {
    checks++;
    const actual = String(result[key] || '');
    if (actual) {
      failures++;
      errors.push({key, expected:'', actual});
    }
  }

  report.push({
    id: fixture.id,
    checks: Object.keys(fixture.expected || {}).length + (fixture.mustRemainEmpty || []).length,
    failures: errors.length,
    errors
  });
}

const passed = checks - failures;
const accuracy = checks ? Math.round(passed * 1000 / checks) / 10 : 0;

console.log(JSON.stringify({
  cases: manifest.cases.length,
  checks,
  passed,
  failures,
  accuracy,
  report
}, null, 2));

if (failures) process.exitCode = 1;
