const express = require('express');
const { getDb } = require('../db');
const { getTeilnehmer, generateCsv } = require('../csv');
const router = express.Router();

router.get('/:id/teilnahme/:datum', (req, res) => {
  const teilnehmer = getTeilnehmer(getDb(), req.params.id, req.params.datum);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="spiel_${req.params.datum}.csv"`);
  res.send(generateCsv(teilnehmer, req.params.datum));
});

module.exports = router;
