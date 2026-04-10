const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../data');

function generateCsv(teilnehmer, datum) {
  return ['Name,Datum', ...teilnehmer.map(n => `${n},${datum}`)].join('\n');
}

function saveCsv(teilnehmer, datum, teamId) {
  const dir = path.join(DATA_DIR, 'exports');
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, `team${teamId}_spiel_${datum}.csv`);
  fs.writeFileSync(filePath, generateCsv(teilnehmer, datum), 'utf8');
  return filePath;
}

function getTeilnehmer(db, teamId, datum) {
  const sentPoll = db.prepare(
    "SELECT id FROM sent_polls WHERE team_id = ? AND typ = 'spiel' AND ereignis_datum = ? ORDER BY gesendet_am DESC LIMIT 1"
  ).get(teamId, datum);
  if (!sentPoll) return [];
  return db.prepare(
    "SELECT DISTINCT option_name FROM poll_results WHERE sent_poll_id = ? AND option_name != 'Mein Kind ist nicht in der Liste'"
  ).all(sentPoll.id).map(r => r.option_name);
}

module.exports = { generateCsv, saveCsv, getTeilnehmer };
