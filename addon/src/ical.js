const ical = require('node-ical');
const https = require('https');
const http = require('http');

function fetchIcs(url) {
  const normalizedUrl = url.replace(/^webcal:\/\//i, 'https://');
  return new Promise((resolve, reject) => {
    const client = normalizedUrl.startsWith('https') ? https : http;
    client.get(normalizedUrl, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function parseEvents(icsString) {
  const parsed = ical.parseICS(icsString);
  const events = [];
  for (const key of Object.keys(parsed)) {
    const e = parsed[key];
    if (e.type !== 'VEVENT') continue;
    events.push({
      summary: e.summary || '',
      start: e.start instanceof Date ? e.start : new Date(e.start),
      end: e.end instanceof Date ? e.end : new Date(e.end),
      location: e.location || '',
    });
  }
  return events.sort((a, b) => a.start - b.start);
}

function filterEvents(events, filter) {
  if (!filter || filter.trim() === '') return events;
  const lowerFilter = filter.toLowerCase();
  return events.filter(e => e.summary.toLowerCase().includes(lowerFilter));
}

function getUpcomingEvents(events, tage, jetzt = new Date()) {
  const ziel = new Date(jetzt);
  ziel.setDate(ziel.getDate() + tage);
  return events.filter(e =>
    e.start.getFullYear() === ziel.getFullYear() &&
    e.start.getMonth() === ziel.getMonth() &&
    e.start.getDate() === ziel.getDate()
  );
}

module.exports = { fetchIcs, parseEvents, filterEvents, getUpcomingEvents };
