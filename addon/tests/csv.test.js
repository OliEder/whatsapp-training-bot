const assert = require('node:assert');
const { test } = require('node:test');

process.env.DATA_DIR = '/tmp/test-csv-' + Date.now();
require('fs').mkdirSync(process.env.DATA_DIR, { recursive: true });
require('../src/db').initDb();

const { generateCsv, saveCsv } = require('../src/csv');

test('generateCsv erstellt korrekten CSV-String', () => {
  const csv = generateCsv(['Franz', 'Mona'], '2026-04-18');
  assert(csv.includes('Name'));
  assert(csv.includes('Franz'));
  assert(csv.includes('2026-04-18'));
});

test('saveCsv schreibt Datei ins DATA_DIR', () => {
  const filePath = saveCsv(['Franz', 'Levin'], '2026-04-18', 1);
  const fs = require('fs');
  assert(fs.existsSync(filePath));
  assert(fs.readFileSync(filePath, 'utf8').includes('Franz'));
});
