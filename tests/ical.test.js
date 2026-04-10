const assert = require('node:assert');
const { test } = require('node:test');
const { parseEvents, filterEvents, getUpcomingEvents } = require('../src/ical');

const SAMPLE_ICS = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:U10 Training
DTSTART:20260415T160000Z
DTEND:20260415T174500Z
LOCATION:Mariahilfstraße 28, Neumarkt
END:VEVENT
BEGIN:VEVENT
SUMMARY:U8 Training
DTSTART:20260416T150000Z
DTEND:20260416T160000Z
LOCATION:Halle Nord
END:VEVENT
BEGIN:VEVENT
SUMMARY:U10 Spiel vs. München
DTSTART:20260418T100000Z
DTEND:20260418T120000Z
LOCATION:Regensburg Arena
END:VEVENT
END:VCALENDAR`;

test('parseEvents gibt Array von Events zurück', () => {
  const events = parseEvents(SAMPLE_ICS);
  assert.strictEqual(events.length, 3);
});

test('parseEvents gibt korrekte Felder zurück', () => {
  const events = parseEvents(SAMPLE_ICS);
  assert.strictEqual(events[0].summary, 'U10 Training');
  assert(events[0].start instanceof Date);
  assert.strictEqual(events[0].location, 'Mariahilfstraße 28, Neumarkt');
});

test('filterEvents filtert nach Titel-Substring', () => {
  const events = parseEvents(SAMPLE_ICS);
  const filtered = filterEvents(events, 'U10');
  assert.strictEqual(filtered.length, 2);
  assert(filtered.every(e => e.summary.includes('U10')));
});

test('filterEvents ohne Filter gibt alle Events zurück', () => {
  const events = parseEvents(SAMPLE_ICS);
  assert.strictEqual(filterEvents(events, '').length, 3);
});

test('getUpcomingEvents findet Events in exakt X Tagen', () => {
  const now = new Date('2026-04-13T00:00:00Z');
  const events = parseEvents(SAMPLE_ICS);
  const upcoming = getUpcomingEvents(events, 2, now);
  assert.strictEqual(upcoming.length, 1);
  assert.strictEqual(upcoming[0].summary, 'U10 Training');
});
