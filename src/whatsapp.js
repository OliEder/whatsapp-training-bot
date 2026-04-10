const { Client, LocalAuth, Poll } = require('whatsapp-web.js');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../data');
let client, status = 'disconnected', currentQr = null;

async function initWhatsApp() {
  client = new Client({
    authStrategy: new LocalAuth({ dataPath: path.join(DATA_DIR, 'wwebjs_auth') }),
    puppeteer: {
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    },
  });
  client.on('qr', qr => { currentQr = qr; status = 'waiting_for_qr'; });
  client.on('ready', () => { status = 'connected'; currentQr = null; console.log('WhatsApp verbunden'); });
  client.on('disconnected', () => { status = 'disconnected'; });
  await client.initialize();
}

function getStatus() { return status; }
function getQr() { return currentQr; }
function getClient() {
  if (!client) throw new Error('WhatsApp-Client nicht initialisiert');
  return client;
}

async function getGruppen() {
  const chats = await getClient().getChats();
  return chats.filter(c => c.isGroup).map(c => ({ id: c.id._serialized, name: c.name }));
}

async function sendPoll(gruppeId, frage, optionen, allowMultipleAnswers = false) {
  const chat = await getClient().getChatById(gruppeId);
  const poll = new Poll(frage, optionen, { allowMultipleAnswers });
  return await chat.sendMessage(poll);
}

async function sendMessage(zielId, text) {
  return await getClient().sendMessage(zielId, text);
}

async function createEvent(gruppeId, titel, ort, startDatum, endDatum) {
  const chat = await getClient().getChatById(gruppeId);
  await chat.createGroupEvent(titel, startDatum.getTime(), endDatum.getTime(), ort);
}

async function getPollResults(messageId, gruppeId) {
  const chat = await getClient().getChatById(gruppeId);
  const messages = await chat.fetchMessages({ limit: 100 });
  const pollMsg = messages.find(m => m.id._serialized === messageId);
  if (!pollMsg || !pollMsg.poll) return [];
  return pollMsg.poll.options.map(opt => ({ option: opt.name, voters: opt.voters || [] }));
}

module.exports = { initWhatsApp, getStatus, getQr, getClient, getGruppen, sendPoll, sendMessage, createEvent, getPollResults };
