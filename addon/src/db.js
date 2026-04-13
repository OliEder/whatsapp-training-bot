const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../data');
let db;

function initDb() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  db = new Database(path.join(DATA_DIR, 'bot.db'));
  db.exec(`
    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      training_feed_url TEXT DEFAULT '',
      training_feed_filter TEXT DEFAULT '',
      spiele_feed_url TEXT DEFAULT '',
      spiele_feed_filter TEXT DEFAULT '',
      tage_vor_training INTEGER DEFAULT 3,
      tage_vor_spiel_poll INTEGER DEFAULT 5,
      tage_vor_spiel_event INTEGER DEFAULT 14,
      csv_uhrzeit TEXT DEFAULT '18:00',
      trainer_nummer TEXT DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS gruppen (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
      whatsapp_id TEXT NOT NULL,
      name TEXT NOT NULL,
      rollen TEXT NOT NULL DEFAULT '[]'
    );
    CREATE TABLE IF NOT EXISTS kinder (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
      name TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sent_polls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_id INTEGER NOT NULL,
      gruppe_whatsapp_id TEXT NOT NULL,
      typ TEXT NOT NULL,
      ereignis_datum TEXT NOT NULL,
      whatsapp_message_id TEXT,
      gesendet_am TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS poll_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sent_poll_id INTEGER NOT NULL REFERENCES sent_polls(id),
      option_name TEXT NOT NULL,
      voter_name TEXT,
      voter_id TEXT,
      erfasst_am TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

function getDb() {
  if (!db) throw new Error('DB nicht initialisiert — initDb() zuerst aufrufen');
  return db;
}

module.exports = { initDb, getDb };
