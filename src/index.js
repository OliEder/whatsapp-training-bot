const express = require('express');
const path = require('path');
const { initDb } = require('./db');
const { initWhatsApp } = require('./whatsapp');
const { startScheduler } = require('./scheduler');
const teamsRouter = require('./api/teams');
const kinderRouter = require('./api/kinder');
const teilnahmeRouter = require('./api/teilnahme');

const app = express();
const PORT = process.env.PORT || 8099;

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));
app.use('/api/teams', teamsRouter);
app.use('/api/teams', kinderRouter);
app.use('/api/teams', teilnahmeRouter);

app.get('/api/whatsapp/status', (req, res) => {
  const { getStatus, getQr } = require('./whatsapp');
  res.json({ status: getStatus(), qr: getQr() });
});

app.get('/api/whatsapp/gruppen', async (req, res) => {
  const { getGruppen } = require('./whatsapp');
  try {
    const gruppen = await getGruppen();
    res.json(gruppen);
  } catch (e) {
    res.status(503).json({ error: 'WhatsApp nicht verbunden' });
  }
});

async function main() {
  initDb();
  await initWhatsApp();
  startScheduler();
  app.listen(PORT, () => console.log(`Training-Bot läuft auf Port ${PORT}`));
}

main().catch(console.error);
