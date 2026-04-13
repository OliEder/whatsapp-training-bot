const { createEvent } = require('./whatsapp');

async function sendSpielEvent(gruppeId, ereignis) {
  await createEvent(gruppeId, ereignis.summary, ereignis.location || '', ereignis.start, ereignis.end);
}

module.exports = { sendSpielEvent };
