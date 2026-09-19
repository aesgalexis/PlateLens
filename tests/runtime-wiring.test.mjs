import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync(new URL('../app.js', import.meta.url), 'utf8');

const prepared = app.indexOf('const preparedImage = await prepareOcrImage(currentFile);');
const declared = app.indexOf('const orientationImage = makeGrayVariant(preparedImage);');
const used = app.indexOf('detectBestOrientation(worker, orientationImage');

assert.ok(prepared >= 0, 'preparedImage declaration missing');
assert.ok(declared > prepared, 'orientationImage must be declared after preparedImage');
assert.ok(used > declared, 'orientationImage must be declared before it is used');

assert.match(app, /function makeGrayVariant\(source\)/, 'makeGrayVariant helper missing');
assert.match(app, /function ocrTextQuality\(text\)/, 'OCR quality ranking helper missing');

console.log('PlateLens runtime wiring regression passed');
