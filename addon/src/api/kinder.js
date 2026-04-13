const express = require('express');
const { getDb } = require('../db');
const router = express.Router();

router.get('/:id/kinder', (req, res) => {
  res.json(getDb().prepare('SELECT * FROM kinder WHERE team_id = ? ORDER BY name').all(req.params.id));
});

router.post('/:id/kinder', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name ist pflicht' });
  const db = getDb();
  const r = db.prepare('INSERT INTO kinder (team_id, name) VALUES (?, ?)').run(req.params.id, name);
  res.status(201).json(db.prepare('SELECT * FROM kinder WHERE id = ?').get(r.lastInsertRowid));
});

router.put('/:teamId/kinder/:kindId', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name ist pflicht' });
  const db = getDb();
  db.prepare('UPDATE kinder SET name = ? WHERE id = ? AND team_id = ?').run(name, req.params.kindId, req.params.teamId);
  const kind = db.prepare('SELECT * FROM kinder WHERE id = ?').get(req.params.kindId);
  if (!kind) return res.status(404).json({ error: 'Kind nicht gefunden' });
  res.json(kind);
});

router.delete('/:teamId/kinder/:kindId', (req, res) => {
  getDb().prepare('DELETE FROM kinder WHERE id = ? AND team_id = ?').run(req.params.kindId, req.params.teamId);
  res.status(204).send();
});

module.exports = router;
