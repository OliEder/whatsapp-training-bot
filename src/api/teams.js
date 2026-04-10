const express = require('express');
const { getDb } = require('../db');
const router = express.Router();

router.get('/', (req, res) => {
  const db = getDb();
  const teams = db.prepare('SELECT * FROM teams').all();
  const gruppen = db.prepare('SELECT * FROM gruppen').all();
  res.json(teams.map(t => ({
    ...t,
    gruppen: gruppen.filter(g => g.team_id === t.id).map(g => ({ ...g, rollen: JSON.parse(g.rollen) })),
  })));
});

router.post('/', (req, res) => {
  const { name, training_feed_url = '', training_feed_filter = '', spiele_feed_url = '',
    spiele_feed_filter = '', tage_vor_training = 3, tage_vor_spiel_poll = 5,
    tage_vor_spiel_event = 14, csv_uhrzeit = '18:00', trainer_nummer = '' } = req.body;
  if (!name) return res.status(400).json({ error: 'name ist pflicht' });
  const db = getDb();
  const r = db.prepare(`INSERT INTO teams (name, training_feed_url, training_feed_filter,
    spiele_feed_url, spiele_feed_filter, tage_vor_training, tage_vor_spiel_poll,
    tage_vor_spiel_event, csv_uhrzeit, trainer_nummer) VALUES (?,?,?,?,?,?,?,?,?,?)`)
    .run(name, training_feed_url, training_feed_filter, spiele_feed_url, spiele_feed_filter,
      tage_vor_training, tage_vor_spiel_poll, tage_vor_spiel_event, csv_uhrzeit, trainer_nummer);
  const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(r.lastInsertRowid);
  res.status(201).json({ ...team, gruppen: [] });
});

router.put('/:id', (req, res) => {
  const { name, training_feed_url, training_feed_filter, spiele_feed_url, spiele_feed_filter,
    tage_vor_training, tage_vor_spiel_poll, tage_vor_spiel_event, csv_uhrzeit, trainer_nummer } = req.body;
  const db = getDb();
  db.prepare(`UPDATE teams SET name=?, training_feed_url=?, training_feed_filter=?,
    spiele_feed_url=?, spiele_feed_filter=?, tage_vor_training=?, tage_vor_spiel_poll=?,
    tage_vor_spiel_event=?, csv_uhrzeit=?, trainer_nummer=? WHERE id=?`)
    .run(name, training_feed_url, training_feed_filter, spiele_feed_url, spiele_feed_filter,
      tage_vor_training, tage_vor_spiel_poll, tage_vor_spiel_event, csv_uhrzeit, trainer_nummer, req.params.id);
  const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(req.params.id);
  if (!team) return res.status(404).json({ error: 'Team nicht gefunden' });
  res.json(team);
});

router.delete('/:id', (req, res) => {
  getDb().prepare('DELETE FROM teams WHERE id = ?').run(req.params.id);
  res.status(204).send();
});

router.post('/:id/gruppen', (req, res) => {
  const { whatsapp_id, name, rollen = [] } = req.body;
  if (!whatsapp_id || !name) return res.status(400).json({ error: 'whatsapp_id und name sind pflicht' });
  const db = getDb();
  const r = db.prepare('INSERT INTO gruppen (team_id, whatsapp_id, name, rollen) VALUES (?,?,?,?)')
    .run(req.params.id, whatsapp_id, name, JSON.stringify(rollen));
  const g = db.prepare('SELECT * FROM gruppen WHERE id = ?').get(r.lastInsertRowid);
  res.status(201).json({ ...g, rollen: JSON.parse(g.rollen) });
});

router.delete('/:teamId/gruppen/:gruppeId', (req, res) => {
  getDb().prepare('DELETE FROM gruppen WHERE id = ? AND team_id = ?').run(req.params.gruppeId, req.params.teamId);
  res.status(204).send();
});

router.get('/:id/sent-polls', (req, res) => {
  const polls = getDb().prepare('SELECT * FROM sent_polls WHERE team_id = ? ORDER BY gesendet_am DESC LIMIT 50').all(req.params.id);
  res.json(polls);
});

module.exports = router;
