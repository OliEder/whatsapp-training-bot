const { sendPoll } = require('./whatsapp');
const { getDb } = require('./db');

function formatDatum(date) {
  const tage = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  return `${tage[date.getDay()]} ${date.getDate()}.${date.getMonth() + 1}.`;
}

async function sendTrainingPoll(team, gruppeId, ereignisStart) {
  const frage = `Mein(e) Kind(er) kommen am ${formatDatum(ereignisStart)} ins Training`;
  const msg = await sendPoll(gruppeId, frage, ['Ja', 'Nein', '+ Geschwisterkind'], true);
  getDb().prepare(
    "INSERT INTO sent_polls (team_id, gruppe_whatsapp_id, typ, ereignis_datum, whatsapp_message_id) VALUES (?,?,'training',?,?)"
  ).run(team.id, gruppeId, ereignisStart.toISOString().split('T')[0], msg.id._serialized);
}

async function sendSpielPoll(team, gruppeId, ereignis) {
  const db = getDb();
  const kinder = db.prepare('SELECT name FROM kinder WHERE team_id = ? ORDER BY name').all(team.id);
  const frage = `Wer spielt am ${formatDatum(ereignis.start)} in ${ereignis.location || 'unbekannt'}?`;
  const optionen = [...kinder.map(k => k.name), 'Mein Kind ist nicht in der Liste'];
  const msg = await sendPoll(gruppeId, frage, optionen, false);
  db.prepare(
    "INSERT INTO sent_polls (team_id, gruppe_whatsapp_id, typ, ereignis_datum, whatsapp_message_id) VALUES (?,?,'spiel',?,?)"
  ).run(team.id, gruppeId, ereignis.start.toISOString().split('T')[0], msg.id._serialized);
}

module.exports = { sendTrainingPoll, sendSpielPoll, formatDatum };
