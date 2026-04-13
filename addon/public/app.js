let editingTeamId = null;
let statusPollInterval;

function showTab(name) {
  ['teams','kinder','ergebnisse','whatsapp'].forEach(t => {
    document.getElementById('tab-' + t).classList.toggle('hidden', t !== name);
    document.getElementById('btn-' + t).classList.toggle('active', t === name);
  });
  if (name === 'whatsapp') pollWhatsAppStatus();
  if (name === 'kinder') loadTeamSelect('kinder-team-select', loadKinder);
  if (name === 'ergebnisse') loadTeamSelect('ergebnisse-team-select', loadErgebnisse);
  if (name === 'teams') loadTeams();
}

async function loadTeams() {
  const teams = await fetch('/api/teams').then(r => r.json());
  const el = document.getElementById('teams-liste');
  if (!teams.length) { el.innerHTML = '<p>Noch keine Teams.</p>'; return; }
  el.innerHTML = teams.map(t => `
    <div style="padding:0.5rem;border-bottom:1px solid #eee">
      <strong>${t.name}</strong>
      ${t.gruppen.map(g => `<span class="tag">${g.name} (${g.rollen.join(', ')})</span>`).join('')}
      <br><small>Training: ${t.training_feed_url || '–'} | Spiele: ${t.spiele_feed_url || '–'}</small>
      <br><button class="secondary" onclick="editTeam(${t.id})">Bearbeiten</button>
      <button class="danger" onclick="deleteTeam(${t.id})">Löschen</button>
    </div>`).join('');
}

function showTeamForm(team = null) {
  editingTeamId = team ? team.id : null;
  document.getElementById('team-form-titel').textContent = team ? 'Team bearbeiten' : 'Neues Team';
  ['name','training-url','training-filter','spiele-url','spiele-filter','trainer-nummer'].forEach(f => {
    const key = f.replace(/-/g, '_');
    document.getElementById('f-' + f).value = team?.[key] || '';
  });
  document.getElementById('f-tage-training').value = team?.tage_vor_training || 3;
  document.getElementById('f-tage-spiel-poll').value = team?.tage_vor_spiel_poll || 5;
  document.getElementById('f-tage-spiel-event').value = team?.tage_vor_spiel_event || 14;
  document.getElementById('team-form-card').classList.remove('hidden');
}

function hideTeamForm() {
  document.getElementById('team-form-card').classList.add('hidden');
  editingTeamId = null;
}

async function editTeam(id) {
  const teams = await fetch('/api/teams').then(r => r.json());
  showTeamForm(teams.find(t => t.id === id));
}

async function saveTeam() {
  const body = {
    name: document.getElementById('f-name').value,
    training_feed_url: document.getElementById('f-training-url').value,
    training_feed_filter: document.getElementById('f-training-filter').value,
    spiele_feed_url: document.getElementById('f-spiele-url').value,
    spiele_feed_filter: document.getElementById('f-spiele-filter').value,
    tage_vor_training: parseInt(document.getElementById('f-tage-training').value) || 3,
    tage_vor_spiel_poll: parseInt(document.getElementById('f-tage-spiel-poll').value) || 5,
    tage_vor_spiel_event: parseInt(document.getElementById('f-tage-spiel-event').value) || 14,
    trainer_nummer: document.getElementById('f-trainer-nummer').value,
  };
  await fetch(editingTeamId ? `/api/teams/${editingTeamId}` : '/api/teams', {
    method: editingTeamId ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  hideTeamForm();
  loadTeams();
}

async function deleteTeam(id) {
  if (!confirm('Team wirklich löschen?')) return;
  await fetch(`/api/teams/${id}`, { method: 'DELETE' });
  loadTeams();
}

async function loadTeamSelect(selectId, callback) {
  const teams = await fetch('/api/teams').then(r => r.json());
  document.getElementById(selectId).innerHTML = teams.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
  if (teams.length) callback();
}

async function loadKinder() {
  const teamId = document.getElementById('kinder-team-select').value;
  const kinder = await fetch(`/api/teams/${teamId}/kinder`).then(r => r.json());
  const el = document.getElementById('kinder-liste');
  if (!kinder.length) { el.innerHTML = '<p>Keine Kinder.</p>'; return; }
  el.innerHTML = '<table><tr><th>Name</th><th></th></tr>' +
    kinder.map(k => `<tr><td>${k.name}</td><td><button class="danger" onclick="deleteKind(${k.id})">✕</button></td></tr>`).join('') +
    '</table>';
}

async function addKind() {
  const teamId = document.getElementById('kinder-team-select').value;
  const name = document.getElementById('neues-kind').value.trim();
  if (!name) return;
  await fetch(`/api/teams/${teamId}/kinder`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
  document.getElementById('neues-kind').value = '';
  loadKinder();
}

async function deleteKind(id) {
  const teamId = document.getElementById('kinder-team-select').value;
  await fetch(`/api/teams/${teamId}/kinder/${id}`, { method: 'DELETE' });
  loadKinder();
}

async function importCsv() {
  const teamId = document.getElementById('kinder-team-select').value;
  const text = await document.getElementById('csv-import').files[0]?.text();
  if (!text) return;
  for (const line of text.split('\n').slice(1)) {
    const name = line.split(',')[0].trim();
    if (name) await fetch(`/api/teams/${teamId}/kinder`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
  }
  loadKinder();
}

async function loadErgebnisse() {
  const teamId = document.getElementById('ergebnisse-team-select').value;
  const polls = await fetch(`/api/teams/${teamId}/sent-polls`).then(r => r.json()).catch(() => []);
  const el = document.getElementById('ergebnisse-liste');
  if (!polls.length) { el.innerHTML = '<p>Noch keine Polls gesendet.</p>'; return; }
  el.innerHTML = polls.map(p => `
    <div style="margin:0.5rem 0;padding:0.5rem;background:#f9f9f9;border-radius:4px">
      <strong>${p.typ}</strong> — ${p.ereignis_datum}
      ${p.typ === 'spiel' ? `<a href="/api/teams/${teamId}/teilnahme/${p.ereignis_datum}">CSV herunterladen</a>` : ''}
    </div>`).join('');
}

async function pollWhatsAppStatus() {
  clearInterval(statusPollInterval);
  const update = async () => {
    const data = await fetch('/api/whatsapp/status').then(r => r.json());
    const statusEl = document.getElementById('wa-status-text');
    const qrContainer = document.getElementById('qr-container');
    if (data.status === 'connected') {
      statusEl.innerHTML = '<span class="status-connected">✓ Verbunden</span>';
      qrContainer.classList.add('hidden');
    } else if (data.status === 'waiting_for_qr' && data.qr) {
      statusEl.innerHTML = '<span class="status-disconnected">Warte auf QR-Scan...</span>';
      qrContainer.classList.remove('hidden');
      QRCode.toCanvas(document.getElementById('qr-canvas'), data.qr, { width: 200 });
    } else {
      statusEl.innerHTML = '<span class="status-disconnected">Nicht verbunden</span>';
      qrContainer.classList.add('hidden');
    }
  };
  await update();
  statusPollInterval = setInterval(update, 3000);
}

loadTeams();
