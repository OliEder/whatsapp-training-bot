const assert = require('node:assert');
const { test } = require('node:test');
const { shouldSendInDays, shouldSendCsv } = require('../src/scheduler');

test('shouldSendInDays gibt true wenn Event in exakt X Tagen', () => {
  const now = new Date('2026-04-13T08:00:00Z');
  const event = { start: new Date('2026-04-16T16:00:00Z') };
  assert.strictEqual(shouldSendInDays(event, 3, now), true);
});

test('shouldSendInDays gibt false bei falscher Differenz', () => {
  const now = new Date('2026-04-13T08:00:00Z');
  const event = { start: new Date('2026-04-17T16:00:00Z') };
  assert.strictEqual(shouldSendInDays(event, 3, now), false);
});

test('shouldSendCsv gibt true wenn Spiel morgen', () => {
  const now = new Date('2026-04-17T08:00:00Z');
  const event = { start: new Date('2026-04-18T10:00:00Z') };
  assert.strictEqual(shouldSendCsv(event, now), true);
});

test('shouldSendCsv gibt false wenn Spiel übermorgen', () => {
  const now = new Date('2026-04-16T08:00:00Z');
  const event = { start: new Date('2026-04-18T10:00:00Z') };
  assert.strictEqual(shouldSendCsv(event, now), false);
});
