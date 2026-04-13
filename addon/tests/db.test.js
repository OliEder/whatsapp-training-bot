const assert = require('node:assert');
const { test } = require('node:test');

process.env.DATA_DIR = '/tmp/test-db-' + Date.now();
require('fs').mkdirSync(process.env.DATA_DIR, { recursive: true });

const { initDb, getDb } = require('../src/db');

test('initDb erstellt Schema ohne Fehler', () => {
  assert.doesNotThrow(() => initDb());
});

test('teams Tabelle existiert', () => {
  const db = getDb();
  const row = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='teams'").get();
  assert.strictEqual(row.name, 'teams');
});

test('kinder Tabelle existiert', () => {
  const db = getDb();
  const row = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='kinder'").get();
  assert.strictEqual(row.name, 'kinder');
});

test('sent_polls Tabelle existiert', () => {
  const db = getDb();
  const row = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='sent_polls'").get();
  assert.strictEqual(row.name, 'sent_polls');
});

test('poll_results Tabelle existiert', () => {
  const db = getDb();
  const row = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='poll_results'").get();
  assert.strictEqual(row.name, 'poll_results');
});
