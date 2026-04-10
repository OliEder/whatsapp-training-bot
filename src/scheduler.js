const cron = require('node-cron');
const { getDb } = require('./db');
const { fetchIcs, parseEvents, filterEvents } = require('./ical');
const { sendTrainingPoll, sendSpielPoll } = require('./polls');
const { sendSpielEvent } = require('./events');
const { getTeilnehmer, saveCsv } = require('./csv');
const { sendMessage } = require('./whatsapp');

function shouldSendInDays(event, tage, jetzt = new Date()) {
  return Math.round((event.start - jetzt) / (1000 * 60 * 60 * 24)) === tage;
}

function shouldSendCsv(event, jetzt = new Date()) {
  return shouldSendInDays(event, 1, jetzt);
}

function alreadySent(db, teamId, gruppeId, typ, datum) {
  return !!db.prepare(
    'SELECT id FROM sent_polls WHERE team_id=? AND gruppe_whatsapp_id=? AND typ=? AND ereignis_datum=?'
  ).get(teamId, gruppeId, typ, datum);
}

async function runDailyCheck() {
  const db = getDb();
  const teams = db.prepare('SELECT * FROM teams').all();

  for (const team of teams) {
    const gruppen = db.prepare('SELECT * FROM gruppen WHERE team_id = ?').all(team.id)
      .map(g => ({ ...g, rollen: JSON.parse(g.rollen) }));

    if (team.training_feed_url) {
      try {
        let events = parseEvents(await fetchIcs(team.training_feed_url));
        if (team.training_feed_filter) events = filterEvents(events, team.training_feed_filter);
        for (const event of events) {
          if (!shouldSendInDays(event, team.tage_vor_training)) continue;
          const datum = event.start.toISOString().split('T')[0];
          for (const g of gruppen.filter(g => g.rollen.includes('training'))) {
            if (!alreadySent(db, team.id, g.whatsapp_id, 'training', datum)) {
              await sendTrainingPoll(team, g.whatsapp_id, event.start);
            }
          }
        }
      } catch (err) {
        console.error(`Training-Feed Fehler Team ${team.name}:`, err.message);
      }
    }

    if (team.spiele_feed_url) {
      try {
        let events = parseEvents(await fetchIcs(team.spiele_feed_url));
        if (team.spiele_feed_filter) events = filterEvents(events, team.spiele_feed_filter);
        for (const event of events) {
          const datum = event.start.toISOString().split('T')[0];

          if (shouldSendInDays(event, team.tage_vor_spiel_event)) {
            for (const g of gruppen.filter(g => g.rollen.includes('allgemein'))) {
              if (!alreadySent(db, team.id, g.whatsapp_id, 'event', datum)) {
                await sendSpielEvent(g.whatsapp_id, event);
                db.prepare("INSERT INTO sent_polls (team_id, gruppe_whatsapp_id, typ, ereignis_datum) VALUES (?,?,'event',?)").run(team.id, g.whatsapp_id, datum);
              }
            }
          }

          if (shouldSendInDays(event, team.tage_vor_spiel_poll)) {
            for (const g of gruppen.filter(g => g.rollen.includes('spiel-orga'))) {
              if (!alreadySent(db, team.id, g.whatsapp_id, 'spiel', datum)) {
                await sendSpielPoll(team, g.whatsapp_id, event);
              }
            }
          }

          if (shouldSendCsv(event)) {
            const teilnehmer = getTeilnehmer(db, team.id, datum);
            saveCsv(teilnehmer, datum, team.id);
            if (team.trainer_nummer && teilnehmer.length > 0) {
              const zielId = team.trainer_nummer.replace(/[^0-9]/g, '') + '@c.us';
              await sendMessage(zielId, `Teilnehmerliste Spiel ${datum}:\n${teilnehmer.join('\n')}`);
            }
          }
        }
      } catch (err) {
        console.error(`Spiele-Feed Fehler Team ${team.name}:`, err.message);
      }
    }
  }
}

function startScheduler() {
  cron.schedule('0 8 * * *', () => runDailyCheck().catch(console.error));
  console.log('Scheduler gestartet (täglich 08:00)');
}

module.exports = { startScheduler, runDailyCheck, shouldSendInDays, shouldSendCsv };
