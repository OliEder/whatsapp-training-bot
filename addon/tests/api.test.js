const assert = require('node:assert');
const { test } = require('node:test');

process.env.DATA_DIR = '/tmp/test-api-' + Date.now();
require('fs').mkdirSync(process.env.DATA_DIR, { recursive: true });
const { initDb } = require('../src/db');
initDb();

const express = require('express');
const http = require('http');
const teamsRouter = require('../src/api/teams');
const kinderRouter = require('../src/api/kinder');

function request(server, method, path, body) {
  return new Promise((resolve, reject) => {
    const { port } = server.address();
    const opts = { hostname: '127.0.0.1', port, path, method, headers: { 'Content-Type': 'application/json' } };
    const req = http.request(opts, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(data || 'null') }));
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

let server;
test.before(() => {
  const app = express();
  app.use(express.json());
  app.use('/api/teams', teamsRouter);
  app.use('/api/teams', kinderRouter);
  server = http.createServer(app).listen(0);
});
test.after(() => server.close());

test('POST /api/teams erstellt Team', async () => {
  const res = await request(server, 'POST', '/api/teams', { name: 'U10' });
  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.name, 'U10');
  assert.ok(res.body.id);
});

test('GET /api/teams gibt Teams zurück', async () => {
  const res = await request(server, 'GET', '/api/teams', null);
  assert.strictEqual(res.status, 200);
  assert(Array.isArray(res.body));
  assert(res.body.length >= 1);
});

test('POST /api/teams/:id/kinder fügt Kind hinzu', async () => {
  const teamRes = await request(server, 'POST', '/api/teams', { name: 'U8' });
  const res = await request(server, 'POST', `/api/teams/${teamRes.body.id}/kinder`, { name: 'Franz' });
  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.name, 'Franz');
});

test('GET /api/teams/:id/kinder gibt Kinderliste zurück', async () => {
  const teamRes = await request(server, 'POST', '/api/teams', { name: 'U10b' });
  const id = teamRes.body.id;
  await request(server, 'POST', `/api/teams/${id}/kinder`, { name: 'Simon' });
  await request(server, 'POST', `/api/teams/${id}/kinder`, { name: 'Mona' });
  const res = await request(server, 'GET', `/api/teams/${id}/kinder`, null);
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.length, 2);
});

test('DELETE /api/teams/:teamId/kinder/:kindId entfernt Kind', async () => {
  const teamRes = await request(server, 'POST', '/api/teams', { name: 'U12' });
  const id = teamRes.body.id;
  const kindRes = await request(server, 'POST', `/api/teams/${id}/kinder`, { name: 'Levin' });
  await request(server, 'DELETE', `/api/teams/${id}/kinder/${kindRes.body.id}`, null);
  const list = await request(server, 'GET', `/api/teams/${id}/kinder`, null);
  assert.strictEqual(list.body.length, 0);
});
